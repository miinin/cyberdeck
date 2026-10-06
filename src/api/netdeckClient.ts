import type { Card } from '../domain/card';
import { CardApiError } from './errors';
import { mapCard } from './mapCard';
import type { NetdeckPage } from './netdeckTypes';

/** The only place that knows the Netdeck.gg address (SR-4). */
export const NETDECK_CARDS_URL = 'https://api.netdeck.gg/api/cards/cyberpunk';
export const PAGE_SIZE = 60;
export const DEFAULT_TIMEOUT_MS = 15_000;
/** Hard cap on pages so a broken `total` cannot cause an endless loop of requests (SR-5). */
export const MAX_PAGES = 20;
/** At most this many page requests are in flight at once (SR-5). */
export const MAX_CONCURRENT_REQUESTS = 3;

export interface CardCatalog {
  /** In API order, duplicates (same id) removed. */
  cards: Card[];
  /** The `total` field reported by the first page. */
  reportedTotal: number;
  /** Raw cards that mapCard rejected. */
  skipped: number;
}

export interface FetchAllCardsOptions {
  /** Defaults to globalThis.fetch; tests inject a fake. */
  fetchFn?: typeof fetch;
  /** Caller cancellation (e.g. component unmount). */
  signal?: AbortSignal;
  /** Timeout per request, defaults to DEFAULT_TIMEOUT_MS. */
  timeoutMs?: number;
}

interface PageRequestOptions {
  fetchFn: typeof fetch;
  timeoutMs: number;
  signal?: AbortSignal;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function parsePage(json: unknown): NetdeckPage {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    throw new CardApiError('invalid-response', 'Response is not a JSON object');
  }
  const { items, total, limit, offset } = json as Record<string, unknown>;
  if (!Array.isArray(items)) {
    throw new CardApiError('invalid-response', 'Response field "items" is not an array');
  }
  if (!isNonNegativeInteger(total) || !isNonNegativeInteger(limit) || !isNonNegativeInteger(offset)) {
    throw new CardApiError('invalid-response', 'Response fields "total", "limit" or "offset" are invalid');
  }
  return { items, total, limit, offset };
}

function buildPageUrl(offset: number): string {
  const url = new URL(NETDECK_CARDS_URL);
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('offset', String(offset));
  return url.toString();
}

/**
 * Fetches and validates one page. The timeout is implemented with our own controller
 * (not AbortSignal.any/timeout) so it also works in older Safari versions and so a
 * timeout can be told apart from a caller cancellation without relying on error names.
 */
async function fetchPage(offset: number, options: PageRequestOptions): Promise<NetdeckPage> {
  const { fetchFn, timeoutMs, signal: callerSignal } = options;
  callerSignal?.throwIfAborted();

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onCallerAbort = () => controller.abort(callerSignal?.reason);
  callerSignal?.addEventListener('abort', onCallerAbort, { once: true });

  try {
    let response: Response;
    try {
      response = await fetchFn(buildPageUrl(offset), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      });
    } catch (error) {
      throw classifyRequestError(error, timedOut, callerSignal);
    }

    if (!response.ok) {
      throw new CardApiError('http', `HTTP ${response.status} for offset ${offset}`, {
        status: response.status,
      });
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch (error) {
      if (timedOut || callerSignal?.aborted) {
        throw classifyRequestError(error, timedOut, callerSignal);
      }
      throw new CardApiError('invalid-response', 'Response body is not valid JSON', { cause: error });
    }

    const page = parsePage(json);
    if (page.offset !== offset) {
      throw new CardApiError('invalid-response', `Requested offset ${offset}, got ${page.offset}`);
    }
    return page;
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener('abort', onCallerAbort);
  }
}

/** Caller cancellation is passed through unchanged; everything else becomes a CardApiError. */
function classifyRequestError(error: unknown, timedOut: boolean, callerSignal?: AbortSignal): unknown {
  if (callerSignal?.aborted) return callerSignal.reason ?? error;
  if (timedOut) return new CardApiError('timeout', 'Request timed out', { cause: error });
  return new CardApiError('network', 'Network request failed', { cause: error });
}

/** Offsets of the pages after the first one, validated against MAX_PAGES. */
function remainingOffsets(total: number, pageLimit: number): number[] {
  if (pageLimit <= 0) {
    throw new CardApiError('invalid-response', `Invalid page limit ${pageLimit}`);
  }
  const pageCount = Math.ceil(total / pageLimit);
  if (pageCount > MAX_PAGES) {
    throw new CardApiError('invalid-response', `Total ${total} would need ${pageCount} pages (max ${MAX_PAGES})`);
  }
  const offsets: number[] = [];
  for (let offset = pageLimit; offset < total; offset += pageLimit) {
    offsets.push(offset);
  }
  return offsets;
}

/**
 * Fetches the remaining pages with bounded concurrency. Stops starting new requests once
 * an empty page is seen (the API has less data than `total` claims). Any failed page
 * fails the whole load.
 */
async function fetchRemainingPages(offsets: number[], options: PageRequestOptions): Promise<NetdeckPage[]> {
  const pages: (NetdeckPage | undefined)[] = new Array(offsets.length);
  let next = 0;
  let stop = false;

  async function worker(): Promise<void> {
    while (!stop && next < offsets.length) {
      const index = next++;
      try {
        const page = await fetchPage(offsets[index] as number, options);
        pages[index] = page;
        if (page.items.length === 0) stop = true;
      } catch (error) {
        // The whole load has failed: the other workers must not start new requests.
        stop = true;
        throw error;
      }
    }
  }

  const workerCount = Math.min(MAX_CONCURRENT_REQUESTS, offsets.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return pages.filter((page): page is NetdeckPage => page !== undefined);
}

function toCatalog(pages: NetdeckPage[], reportedTotal: number): CardCatalog {
  const cards: Card[] = [];
  const seenIds = new Set<string>();
  let skipped = 0;

  for (const page of pages) {
    for (const raw of page.items) {
      const card = mapCard(raw);
      if (card === null) {
        skipped += 1;
      } else if (seenIds.has(card.id)) {
        // A second card with the same id is dropped; it counts as skipped so the log number is right (B-003, T-008).
        skipped += 1;
      } else {
        seenIds.add(card.id);
        cards.push(card);
      }
    }
  }
  return { cards, reportedTotal, skipped };
}

/** Fetches every card from Netdeck.gg, all pages, and maps them into the internal model. */
export async function fetchAllCards(options: FetchAllCardsOptions = {}): Promise<CardCatalog> {
  const requestOptions: PageRequestOptions = {
    fetchFn: options.fetchFn ?? ((input, init) => globalThis.fetch(input, init)),
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    signal: options.signal,
  };

  const firstPage = await fetchPage(0, requestOptions);
  const pages = [firstPage];
  // An empty first page means there is nothing more to fetch, whatever `total` claims.
  if (firstPage.items.length > 0 && firstPage.total > firstPage.items.length) {
    const offsets = remainingOffsets(firstPage.total, firstPage.limit);
    pages.push(...(await fetchRemainingPages(offsets, requestOptions)));
  }

  const catalog = toCatalog(pages, firstPage.total);
  if (catalog.cards.length !== catalog.reportedTotal) {
    console.warn(
      `Card count mismatch: received ${catalog.cards.length}, API reported ${catalog.reportedTotal}, skipped ${catalog.skipped}`,
    );
  }
  return catalog;
}
