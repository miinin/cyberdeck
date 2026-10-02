import { parseNetdeckDeck } from '../domain/netdeckDeck';
import type { NetdeckDeck } from '../domain/netdeckDeck';

/**
 * Fetches one public deck from Netdeck.gg on the player's request (T-046, D-015).
 * This is separate from src/api (the card API, D-013), which the app must not import.
 */
export const NETDECK_DECK_URL = 'https://api.netdeck.gg/api/cyberpunk/decks/';
export const DECK_TIMEOUT_MS = 10_000;
export const MAX_DECK_RESPONSE_CHARS = 512 * 1024;

export type NetdeckFetchErrorKind = 'network' | 'timeout' | 'not-found' | 'invalid-response' | 'too-large';

export class NetdeckFetchError extends Error {
  readonly kind: NetdeckFetchErrorKind;
  constructor(kind: NetdeckFetchErrorKind) {
    super(`Netdeck deck fetch failed: ${kind}`);
    this.name = 'NetdeckFetchError';
    this.kind = kind;
  }
}

export interface FetchNetdeckDeckOptions {
  /** Defaults to globalThis.fetch; tests inject a fake. */
  fetchFn?: typeof fetch;
  signal?: AbortSignal;
  timeoutMs?: number;
}

/** `uuid` must come from parseNetdeckUrl: it is put into the address as is. No retries. */
export async function fetchNetdeckDeck(uuid: string, options: FetchNetdeckDeckOptions = {}): Promise<NetdeckDeck> {
  const fetchFn = options.fetchFn ?? ((input, init) => globalThis.fetch(input, init));
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? DECK_TIMEOUT_MS);
  const onCallerAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener('abort', onCallerAbort, { once: true });

  try {
    let text: string;
    try {
      const response = await fetchFn(NETDECK_DECK_URL + encodeURIComponent(uuid), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      });
      if (response.status === 404) throw new NetdeckFetchError('not-found');
      if (!response.ok) throw new NetdeckFetchError('network');
      const length = Number(response.headers.get('Content-Length'));
      if (Number.isFinite(length) && length > MAX_DECK_RESPONSE_CHARS) throw new NetdeckFetchError('too-large');
      text = await response.text();
    } catch (error) {
      if (error instanceof NetdeckFetchError) throw error;
      if (options.signal?.aborted) throw options.signal.reason ?? error;
      throw new NetdeckFetchError(timedOut ? 'timeout' : 'network');
    }
    if (text.length > MAX_DECK_RESPONSE_CHARS) throw new NetdeckFetchError('too-large');

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new NetdeckFetchError('invalid-response');
    }
    const deck = parseNetdeckDeck(json);
    if (deck === null) throw new NetdeckFetchError('invalid-response');
    return deck;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onCallerAbort);
  }
}
