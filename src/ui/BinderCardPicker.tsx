import { useEffect, useId, useRef, useState } from 'react';
import type { Card } from '../domain/card';
import { cardNameText } from './CardName';
import { collectionTexts } from './collectionTexts';

export interface PickerCandidate {
  card: Card;
  /** Copies the user owns (that can go in the binder). */
  copies: number;
  /** Pockets that already hold the card. */
  placed: number;
}

/** Results shown at most: the list is cut by the search, never scrolled inside the dialog. */
export const PICKER_LIMIT = 8;

/**
 * Native modal dialog (T-120): picks one of the user's owned cards for a binder pocket. A search by name narrows the
 * list; cards whose every copy is already in the binder are dimmed and disabled. `open` false = closed.
 */
export function BinderCardPicker({
  open,
  candidates,
  onPick,
  onClose,
}: {
  open: boolean;
  candidates: readonly PickerCandidate[];
  onPick: (card: Card) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const titleId = useId();
  const searchId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (open && !dialog.open) {
      setQuery('');
      dialog.showModal();
    } else if (!open && dialog.open) dialog.close();
  }, [open]);

  const needle = query.trim().toLowerCase();
  const matches = candidates
    .filter((item) => needle === '' || cardNameText(item.card).toLowerCase().includes(needle))
    .sort((a, b) => cardNameText(a.card).localeCompare(cardNameText(b.card)));
  const shown = matches.slice(0, PICKER_LIMIT);

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog binder-picker"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
    >
      {open && (
        <div className="confirm-dialog-body">
          <h2 id={titleId}>{collectionTexts.binderPickTitle}</h2>
          <div className="field">
            <label htmlFor={searchId}>{collectionTexts.binderPickSearch}</label>
            <input id={searchId} type="search" value={query} autoComplete="off" maxLength={80} onChange={(event) => setQuery(event.target.value)} />
          </div>
          {shown.length === 0 ? (
            <p className="hint">{collectionTexts.binderPickNone}</p>
          ) : (
            <ul className="binder-picker-list">
              {shown.map(({ card, copies, placed }) => {
                const full = placed >= copies;
                return (
                  <li key={card.key}>
                    <button type="button" className="binder-picker-item" disabled={full} onClick={() => onPick(card)}>
                      <span className="binder-picker-name">{cardNameText(card)}</span>
                      <span className="binder-picker-meta">{full ? collectionTexts.binderPickFull : collectionTexts.binderPickPlaced(placed, copies)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {matches.length > shown.length && <p className="hint">{collectionTexts.binderPickMore(matches.length - shown.length)}</p>}
          <div className="row-actions">
            <button type="button" className="button-secondary" onClick={() => dialogRef.current?.close()}>
              {collectionTexts.binderPickCancel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
