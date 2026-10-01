import type { Ref } from 'react';
import { texts } from './texts';

/** idle = button shown; busy = request running; the rest are results (UX.md 6.7). */
export type PersistenceState = 'idle' | 'busy' | 'granted' | 'denied' | 'already';

export function persistenceResultText(state: PersistenceState): string | null {
  if (state === 'granted') return texts.persistentGranted;
  if (state === 'denied') return texts.persistentDenied;
  if (state === 'already') return texts.persistentAlready;
  return null;
}

/**
 * "Kokoelma tallentuu vain tähän selaimeen…" and the persistent storage request (UX.md 6.7).
 * The parent owns the state so the result stays over a card list retry.
 */
export function StorageReminder({
  state,
  resultRef,
  onRequest,
}: {
  state: PersistenceState;
  /** The result paragraph; the parent focuses it after the user's request (UX.md 6.7). */
  resultRef: Ref<HTMLParagraphElement>;
  onRequest: () => void;
}) {
  const result = persistenceResultText(state);

  return (
    <div className="storage-reminder">
      <p>{texts.browserOnly}</p>
      {result === null ? (
        <>
          <button
            type="button"
            className="button-secondary"
            aria-describedby="persistent-storage-hint"
            aria-disabled={state === 'busy' ? 'true' : undefined}
            aria-busy={state === 'busy' ? 'true' : undefined}
            onClick={() => {
              if (state === 'idle') onRequest();
            }}
          >
            {texts.requestPersistent}
          </button>
          <p id="persistent-storage-hint">{texts.persistentHint}</p>
        </>
      ) : (
        <p ref={resultRef} tabIndex={-1} className="storage-result">
          {result}
        </p>
      )}
    </div>
  );
}
