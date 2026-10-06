import { describe, expect, it, vi } from 'vitest';
import { fetchNetdeckDeck, MAX_DECK_RESPONSE_CHARS, NetdeckFetchError, NETDECK_DECK_URL } from './fetchNetdeckDeck';
import type { NetdeckFetchErrorKind } from './fetchNetdeckDeck';

const UUID = '40502c1f-1111-4222-8333-444455556666';
const body = { name: 'Pakka', zones: [{ zone_code: 'deck', cards: [{ quantity: 2, card: { id: 'a' } }] }] };
const json = (value: unknown, init?: ResponseInit) => new Response(JSON.stringify(value), init);

async function kindOf(promise: Promise<unknown>): Promise<NetdeckFetchErrorKind | 'other'> {
  const error = await promise.then(() => null, (reason: unknown) => reason);
  return error instanceof NetdeckFetchError ? error.kind : 'other';
}

describe('fetchNetdeckDeck', () => {
  it('requests the deck without credentials or referrer, once', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => json(body));
    const deck = await fetchNetdeckDeck(UUID, { fetchFn });
    expect(deck.rows).toHaveLength(1);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0] ?? [];
    expect(url).toBe(NETDECK_DECK_URL + UUID);
    expect(init).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer', method: 'GET' });
  });

  it('maps failures to plain error kinds without retrying', async () => {
    const notFound = vi.fn<typeof fetch>(async () => json({}, { status: 404 }));
    expect(await kindOf(fetchNetdeckDeck(UUID, { fetchFn: notFound }))).toBe('not-found');
    expect(notFound).toHaveBeenCalledTimes(1);
    expect(await kindOf(fetchNetdeckDeck(UUID, { fetchFn: async () => json({}, { status: 500 }) }))).toBe('network');
    expect(await kindOf(fetchNetdeckDeck(UUID, { fetchFn: () => Promise.reject(new TypeError('x')) }))).toBe('network');
    expect(await kindOf(fetchNetdeckDeck(UUID, { fetchFn: async () => new Response('not json') }))).toBe('invalid-response');
    expect(await kindOf(fetchNetdeckDeck(UUID, { fetchFn: async () => json({ name: 'x', zones: 5 }) }))).toBe('invalid-response');
  });

  it('rejects an oversized response by Content-Length and by read length', async () => {
    const byHeader = async () => new Response('{}', { headers: { 'Content-Length': String(MAX_DECK_RESPONSE_CHARS + 1) } });
    expect(await kindOf(fetchNetdeckDeck(UUID, { fetchFn: byHeader }))).toBe('too-large');
    const byText = async () => new Response(' '.repeat(MAX_DECK_RESPONSE_CHARS + 1));
    expect(await kindOf(fetchNetdeckDeck(UUID, { fetchFn: byText }))).toBe('too-large');
  });

  // SEC-023 (T-047): a body without Content-Length is read in pieces and cancelled at the limit, not read to the end.
  it('stops reading an endless body at the limit and cancels it', async () => {
    const chunk = new TextEncoder().encode(' '.repeat(64 * 1024));
    let pulls = 0;
    let cancelled = false;
    const endless = async () =>
      new Response(
        new ReadableStream<Uint8Array>({
          pull(controller) {
            pulls += 1;
            controller.enqueue(chunk);
          },
          cancel() {
            cancelled = true;
          },
        }),
      );
    expect(await kindOf(fetchNetdeckDeck(UUID, { fetchFn: endless }))).toBe('too-large');
    expect(cancelled).toBe(true);
    // 512 kt / 64 kt = 8 pieces; the ninth passes the limit. A few more may be buffered ahead, never hundreds.
    expect(pulls).toBeLessThan(20);
  });

  it('times out', async () => {
    const hanging = vi.fn<typeof fetch>(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        }),
    );
    expect(await kindOf(fetchNetdeckDeck(UUID, { fetchFn: hanging, timeoutMs: 10 }))).toBe('timeout');
  });

  it('passes caller cancellation through unchanged', async () => {
    const controller = new AbortController();
    const reason = new Error('cancelled');
    controller.abort(reason);
    const fetchFn = vi.fn<typeof fetch>((_input, init) => Promise.reject(init?.signal?.reason));
    const error = await fetchNetdeckDeck(UUID, { fetchFn, signal: controller.signal }).catch((e: unknown) => e);
    expect(error).toBe(reason);
  });
});
