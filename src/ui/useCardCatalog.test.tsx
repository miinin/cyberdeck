import { act, renderHook, waitFor } from '@testing-library/react';
import { CardApiError } from '../api';
import type { CardCatalog } from '../api';
import { useCardCatalog } from './useCardCatalog';

const catalog: CardCatalog = { cards: [], reportedTotal: 0, skipped: 0 };

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('useCardCatalog', () => {
  it('starts loading and becomes ready with the catalog', async () => {
    const load = vi.fn(async () => catalog);

    const { result } = renderHook(() => useCardCatalog(load));

    expect(result.current.state).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ready', catalog }));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('reports the error kind of a CardApiError and logs details to the console only', async () => {
    const load = vi.fn(async () => {
      throw new CardApiError('timeout', 'Request timed out');
    });

    const { result } = renderHook(() => useCardCatalog(load));

    await waitFor(() => expect(result.current.state).toEqual({ status: 'error', kind: 'timeout' }));
    expect(console.error).toHaveBeenCalled();
  });

  it('treats an unexpected error as a network error', async () => {
    const load = vi.fn(async () => {
      throw new Error('boom');
    });

    const { result } = renderHook(() => useCardCatalog(load));

    await waitFor(() => expect(result.current.state).toEqual({ status: 'error', kind: 'network' }));
  });

  it('retry goes back to loading and loads again', async () => {
    const load = vi
      .fn<(signal: AbortSignal) => Promise<CardCatalog>>()
      .mockRejectedValueOnce(new CardApiError('network', 'offline'))
      .mockResolvedValueOnce(catalog);

    const { result } = renderHook(() => useCardCatalog(load));
    await waitFor(() => expect(result.current.state.status).toBe('error'));

    act(() => result.current.retry());
    expect(result.current.state).toEqual({ status: 'loading' });

    await waitFor(() => expect(result.current.state).toEqual({ status: 'ready', catalog }));
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('aborts the request on unmount and ignores the resulting rejection', async () => {
    let receivedSignal: AbortSignal | undefined;
    const load = vi.fn(
      (signal: AbortSignal) =>
        new Promise<CardCatalog>((_resolve, reject) => {
          receivedSignal = signal;
          signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        }),
    );

    const { unmount } = renderHook(() => useCardCatalog(load));
    unmount();

    expect(receivedSignal?.aborted).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(console.error).not.toHaveBeenCalled();
  });
});
