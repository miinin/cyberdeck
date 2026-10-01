import { fivePages, page, rawCard, realShapeCard } from './__fixtures__/netdeckPages';
import { CardApiError, fetchAllCards } from './index';
import { MAX_CONCURRENT_REQUESTS, MAX_PAGES, NETDECK_CARDS_URL, PAGE_SIZE } from './netdeckClient';

type PageMap = Record<number, unknown>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function offsetOf(input: RequestInfo | URL): number {
  return Number(new URL(String(input)).searchParams.get('offset'));
}

/** Fake fetch that answers each request from a map of offset → response body. */
function fakeFetch(pages: PageMap) {
  return vi.fn<typeof fetch>(async (input) => {
    const body = pages[offsetOf(input)];
    return body === undefined ? jsonResponse({ error: 'not found' }, 404) : jsonResponse(body);
  });
}

/** Fake fetch that never answers but rejects when its signal aborts, like the real fetch. */
function hangingFetch() {
  return vi.fn<typeof fetch>(
    (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        signal?.addEventListener('abort', () => reject(signal.reason ?? new DOMException('Aborted', 'AbortError')));
      }),
  );
}

async function expectApiError(promise: Promise<unknown>): Promise<CardApiError> {
  const error = await promise.then(
    () => {
      throw new Error('Expected fetchAllCards to reject');
    },
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(CardApiError);
  return error as CardApiError;
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('fetchAllCards: paging', () => {
  it('fetches every page and returns as many cards as the API total', async () => {
    const fetchFn = fakeFetch(fivePages);

    const catalog = await fetchAllCards({ fetchFn });

    expect(catalog.cards).toHaveLength(5);
    expect(catalog.reportedTotal).toBe(5);
    expect(catalog.cards.length).toBe(catalog.reportedTotal);
    expect(catalog.skipped).toBe(0);
    expect(catalog.cards.map((card) => card.id)).toEqual(['id-1', 'id-2', 'id-3', 'id-4', 'id-5']);
  });

  it('requests the right offsets, using the limit the API returned', async () => {
    const fetchFn = fakeFetch(fivePages);

    await fetchAllCards({ fetchFn });

    const offsets = fetchFn.mock.calls.map(([input]) => offsetOf(input)).sort((a, b) => a - b);
    expect(offsets).toEqual([0, 2, 4]);
  });

  it('uses the fixed API address with limit=60 in every request', async () => {
    const fetchFn = fakeFetch(fivePages);

    await fetchAllCards({ fetchFn });

    for (const [input] of fetchFn.mock.calls) {
      const url = new URL(String(input));
      expect(`${url.origin}${url.pathname}`).toBe(NETDECK_CARDS_URL);
      expect(url.searchParams.get('limit')).toBe(String(PAGE_SIZE));
    }
  });

  it('makes a single request when everything fits on one page', async () => {
    const fetchFn = fakeFetch({ 0: page([rawCard(1), rawCard(2)], 2, 60, 0) });

    const catalog = await fetchAllCards({ fetchFn });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(catalog.cards).toHaveLength(2);
  });

  it('returns an empty list when the API has no cards', async () => {
    const fetchFn = fakeFetch({ 0: page([], 0, 60, 0) });

    const catalog = await fetchAllCards({ fetchFn });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(catalog).toEqual({ cards: [], reportedTotal: 0, skipped: 0 });
  });

  it('removes duplicate cards (same id) across pages', async () => {
    const fetchFn = fakeFetch({
      0: page([rawCard(1), rawCard(2)], 4, 2, 0),
      2: page([rawCard(2), rawCard(3)], 4, 2, 2),
    });

    const catalog = await fetchAllCards({ fetchFn });

    expect(catalog.cards.map((card) => card.id)).toEqual(['id-1', 'id-2', 'id-3']);
  });

  it('skips invalid cards and counts them', async () => {
    const fetchFn = fakeFetch({ 0: page([rawCard(1), { name: 'broken' }, 'nonsense', realShapeCard], 4, 60, 0) });

    const catalog = await fetchAllCards({ fetchFn });

    expect(catalog.cards.map((card) => card.slug)).toEqual(['card-1', 'v-streetkid']);
    expect(catalog.skipped).toBe(2);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('stops at an empty page when total is larger than the real amount of data', async () => {
    const pages: PageMap = { 0: page([rawCard(1), rawCard(2)], 20, 2, 0), 2: page([rawCard(3)], 20, 2, 2) };
    for (let offset = 4; offset < 20; offset += 2) pages[offset] = page([], 20, 2, offset);
    const fetchFn = fakeFetch(pages);

    const catalog = await fetchAllCards({ fetchFn });

    expect(catalog.cards).toHaveLength(3);
    expect(catalog.reportedTotal).toBe(20);
    // Stops soon after the first empty page instead of requesting all 10 pages.
    expect(fetchFn.mock.calls.length).toBeLessThan(10);
  });

  it('rejects a total that would need more than MAX_PAGES pages without fetching them', async () => {
    const fetchFn = fakeFetch({ 0: page([rawCard(1)], 1_000_000, 60, 0) });

    const error = await expectApiError(fetchAllCards({ fetchFn }));

    expect(error.kind).toBe('invalid-response');
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(MAX_PAGES).toBeLessThan(1_000_000 / 60);
  });

  it('rejects limit 0 instead of looping forever', async () => {
    const fetchFn = fakeFetch({ 0: page([rawCard(1)], 5, 0, 0) });

    const error = await expectApiError(fetchAllCards({ fetchFn }));

    expect(error.kind).toBe('invalid-response');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('rejects a page whose offset does not match the request', async () => {
    const fetchFn = fakeFetch({
      0: page([rawCard(1), rawCard(2)], 4, 2, 0),
      2: page([rawCard(1), rawCard(2)], 4, 2, 0),
    });

    const error = await expectApiError(fetchAllCards({ fetchFn }));

    expect(error.kind).toBe('invalid-response');
  });

  it('never has more than MAX_CONCURRENT_REQUESTS requests in flight', async () => {
    const pages: PageMap = {};
    for (let offset = 0; offset < 10; offset += 1) pages[offset] = page([rawCard(offset)], 10, 1, offset);
    let inFlight = 0;
    let maxInFlight = 0;
    const fetchFn = vi.fn<typeof fetch>(async (input) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
      return jsonResponse(pages[offsetOf(input)]);
    });

    const catalog = await fetchAllCards({ fetchFn });

    expect(catalog.cards).toHaveLength(10);
    expect(maxInFlight).toBeLessThanOrEqual(MAX_CONCURRENT_REQUESTS);
  });
});

describe('fetchAllCards: request options (SR-4)', () => {
  it('sends no credentials and no referrer', async () => {
    const fetchFn = fakeFetch(fivePages);

    await fetchAllCards({ fetchFn });

    for (const [, init] of fetchFn.mock.calls) {
      expect(init).toMatchObject({ method: 'GET', credentials: 'omit', referrerPolicy: 'no-referrer' });
    }
  });
});

describe('fetchAllCards: errors (SR-5)', () => {
  it('maps HTTP 500 to kind "http" with the status', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => new Response('Internal error', { status: 500 }));

    const error = await expectApiError(fetchAllCards({ fetchFn }));

    expect(error.kind).toBe('http');
    expect(error.status).toBe(500);
  });

  it('fails the whole load when a later page fails', async () => {
    const fetchFn = fakeFetch({ 0: fivePages[0], 2: fivePages[2] });

    const error = await expectApiError(fetchAllCards({ fetchFn }));

    expect(error.kind).toBe('http');
    expect(error.status).toBe(404);
  });

  it('starts no new page requests after a page has failed', async () => {
    const pages: PageMap = {};
    for (let offset = 0; offset < 20; offset += 1) pages[offset] = page([rawCard(offset)], 20, 1, offset);
    const fetchFn = vi.fn<typeof fetch>(async (input) => {
      const offset = offsetOf(input);
      if (offset === 1) return new Response('fail', { status: 500 });
      await new Promise((resolve) => setTimeout(resolve, 5));
      return jsonResponse(pages[offset]);
    });

    const error = await expectApiError(fetchAllCards({ fetchFn }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(error.status).toBe(500);
    // First page + the requests already in flight when offset 1 failed.
    expect(fetchFn.mock.calls.length).toBeLessThanOrEqual(1 + MAX_CONCURRENT_REQUESTS);
  });

  it('maps a fetch TypeError to kind "network"', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => {
      throw new TypeError('Failed to fetch');
    });

    const error = await expectApiError(fetchAllCards({ fetchFn }));

    expect(error.kind).toBe('network');
  });

  it('maps a request that takes too long to kind "timeout"', async () => {
    const fetchFn = hangingFetch();

    const error = await expectApiError(fetchAllCards({ fetchFn, timeoutMs: 10 }));

    expect(error.kind).toBe('timeout');
  });

  it('passes a caller cancellation through as AbortError, not CardApiError', async () => {
    const fetchFn = hangingFetch();
    const controller = new AbortController();

    const promise = fetchAllCards({ fetchFn, signal: controller.signal });
    controller.abort();

    const error = await promise.then(
      () => null,
      (reason: unknown) => reason,
    );
    expect(error).not.toBeInstanceOf(CardApiError);
    expect(error).toMatchObject({ name: 'AbortError' });
  });

  it('maps a body that is not JSON to kind "invalid-response"', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => new Response('<html>oops</html>', { status: 200 }));

    const error = await expectApiError(fetchAllCards({ fetchFn }));

    expect(error.kind).toBe('invalid-response');
  });

  it.each([
    ['not an object', [1, 2, 3]],
    ['items missing', { total: 1, limit: 60, offset: 0 }],
    ['items not an array', { items: 'x', total: 1, limit: 60, offset: 0 }],
    ['total negative', { items: [], total: -1, limit: 60, offset: 0 }],
    ['total not an integer', { items: [], total: 1.5, limit: 60, offset: 0 }],
    ['limit a string', { items: [], total: 1, limit: '60', offset: 0 }],
  ])('maps a wrong response shape (%s) to kind "invalid-response"', async (_label, body) => {
    const fetchFn = vi.fn<typeof fetch>(async () => jsonResponse(body));

    const error = await expectApiError(fetchAllCards({ fetchFn }));

    expect(error.kind).toBe('invalid-response');
  });

  it('never puts the URL or response body into the error kind shown to users', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => new Response('secret body', { status: 503 }));

    const error = await expectApiError(fetchAllCards({ fetchFn }));

    expect(error.message).not.toContain('secret body');
    expect(error.kind).toBe('http');
  });
});
