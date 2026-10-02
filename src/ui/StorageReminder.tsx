import { createPortal } from 'react-dom';
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
 * Persistent storage request as a small icon button in the header (`slot`), plus the result text
 * in the page after a request (UX.md 6.7). The parent owns the state so the result stays over a card list retry.
 */
export function StorageReminder({
  state,
  resultRef,
  slot,
  onRequest,
}: {
  state: PersistenceState;
  /** The result paragraph; the parent focuses it after the user's request (UX.md 6.7). */
  resultRef: Ref<HTMLParagraphElement>;
  /** Header element the button is rendered into; null until the header has mounted. */
  slot: HTMLElement | null;
  onRequest: () => void;
}) {
  const result = persistenceResultText(state);
  const done = result !== null;
  const label = done ? result : texts.requestPersistent;
  const explanation = `${texts.browserOnly} ${texts.persistentHint}`;
  const tip = done ? result : explanation;

  const button = (
    <button
      type="button"
      className="storage-button"
      title={tip}
      aria-label={label}
      aria-describedby={done ? undefined : 'persistent-storage-hint'}
      aria-disabled={state === 'busy' || done ? 'true' : undefined}
      aria-busy={state === 'busy' ? 'true' : undefined}
      onClick={() => {
        if (state === 'idle') onRequest();
      }}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <path
          d="M4 3h13l3 3v15H4z M7 3v6h9V3 M7 21v-7h10v7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {done && <path d="M8.5 17.5l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2" />}
      </svg>
      <span className="storage-tooltip" role="presentation" aria-hidden="true">
        {tip}
      </span>
    </button>
  );

  return (
    <>
      {slot && createPortal(button, slot)}
      {!done && (
        <p id="persistent-storage-hint" className="visually-hidden">
          {explanation}
        </p>
      )}
      {(state === 'granted' || state === 'denied') && (
        <p ref={resultRef} tabIndex={-1} className="storage-reminder storage-result">
          {result}
        </p>
      )}
    </>
  );
}
