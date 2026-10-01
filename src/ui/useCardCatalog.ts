import { useCallback, useEffect, useState } from 'react';
import { CardApiError, fetchAllCards } from '../api';
import type { CardApiErrorKind, CardCatalog } from '../api';

export type CatalogState =
  | { status: 'loading' }
  | { status: 'error'; kind: CardApiErrorKind }
  /** An empty catalog is `ready` with no cards; the view decides how to show it. */
  | { status: 'ready'; catalog: CardCatalog };

export type LoadCatalog = (signal: AbortSignal) => Promise<CardCatalog>;

const defaultLoad: LoadCatalog = (signal) => fetchAllCards({ signal });

/** Loads the card catalog once on mount and again on retry. Unmount cancels the request. */
export function useCardCatalog(load: LoadCatalog = defaultLoad): { state: CatalogState; retry: () => void } {
  const [state, setState] = useState<CatalogState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(
      (catalog) => {
        if (!controller.signal.aborted) setState({ status: 'ready', catalog });
      },
      (error: unknown) => {
        // Our own cancellation (unmount, StrictMode re-run, retry): not an error for the user.
        if (controller.signal.aborted) return;
        // Technical details go to the developer console only, never to the page (SR-5).
        console.error('Loading cards failed', error);
        setState({ status: 'error', kind: error instanceof CardApiError ? error.kind : 'network' });
      },
    );
    return () => controller.abort();
  }, [load, attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((current) => current + 1);
  }, []);

  return { state, retry };
}
