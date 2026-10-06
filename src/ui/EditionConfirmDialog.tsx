import { useEffect, useRef } from 'react';
import type { Card } from '../domain/card';
import type { Edition } from '../domain/edition';
import { getCardImage } from '../data/cardImages';
import { texts } from './texts';

// SR-12 keeps browser storage inside the storage layer, so "this session" is the time the page stays open:
// a plain module variable, never saved.
let confirmedThisSession = false;

/** True once the edition has been confirmed since the page was opened (T-101). */
export function editionConfirmed(): boolean {
  return confirmedThisSession;
}

export function markEditionConfirmed(): void {
  confirmedThisSession = true;
}

/** For tests: forget the confirmation. */
export function resetEditionConfirmed(): void {
  confirmedThisSession = false;
}

/**
 * Native modal dialog (T-101): asks Beta or Retail before a card with both editions is added for the first time in
 * a session. The picture marks where the collector number is. Esc, "Peru" and the backdrop cancel (close event).
 * `card` null = closed.
 */
export function EditionConfirmDialog({
  card,
  onChoose,
  onCancel,
}: {
  card: Card | null;
  onChoose: (edition: Edition) => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (card !== null && !dialog.open) dialog.showModal();
    else if (card === null && dialog.open) dialog.close();
  }, [card]);

  const image = card === null ? null : getCardImage(card.key);

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog edition-confirm"
      aria-labelledby="edition-confirm-title"
      onClose={onCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
    >
      {card !== null && (
        <div className="confirm-dialog-body">
          <h2 id="edition-confirm-title">{texts.editionConfirmTitle}</h2>
          <p>{texts.editionConfirmBody(card.displayName)}</p>
          <p className="edition-confirm-hint">
            <strong>{texts.editionConfirmHint}</strong>
          </p>
          {image !== null && (
            <figure className="edition-confirm-figure">
              <div className="edition-confirm-picture">
                <img src={image.medium} alt="" />
                <span className="edition-confirm-mark" aria-hidden="true" />
              </div>
              <figcaption>{texts.editionConfirmImageNote}</figcaption>
            </figure>
          )}
          <div className="row-actions">
            <button type="button" className="button-secondary" onClick={() => dialogRef.current?.close()}>
              {texts.editionConfirmCancel}
            </button>
            <button type="button" className="button-primary" onClick={() => onChoose('beta')}>
              {texts.editionConfirmAdd(texts.editionBeta)}
            </button>
            <button type="button" className="button-primary" onClick={() => onChoose('retail')}>
              {texts.editionConfirmAdd(texts.editionRetail)}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
