import { useEffect, useId, useRef, useState } from 'react';
import { MAX_COLLECTION_COUNT } from '../domain/collection';
import { addMissingToWants } from '../domain/wants';
import type { MissingRow } from '../domain/wants';
import { deckTexts } from './deckTexts';
import type { WantsHandle } from './useWants';

/**
 * Returns a function that adds missing cards to the want list with the max rule (D-018) and returns how many
 * wants changed. Counts on screen are the saved counts with the newest unsaved targets over them.
 */
export function useAddMissingToWants(wants: WantsHandle): (rows: readonly MissingRow[]) => number {
  return (rows) => {
    const shown = new Map(wants.snapshot.saved.entries.map((entry) => [entry.card, entry.count]));
    for (const [card, count] of wants.snapshot.targets) shown.set(card, count);
    const entries = [...shown].filter(([, count]) => count > 0).map(([card, count]) => ({ card, count }));
    const next = addMissingToWants({ entries }, rows);
    let added = 0;
    for (const { card, count } of next.entries) {
      if (shown.get(card) !== count) {
        wants.store.setCount(card, count);
        added += 1;
      }
    }
    return added;
  };
}

/** Asks before the wants change: what is added and that existing wants do not shrink. `open` false = closed. */
function ConfirmAddDialog({ open, cards, copies, onConfirm, onCancel }: { open: boolean; cards: number; copies: number; onConfirm: () => void; onCancel: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby={titleId}
      onClose={onCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
    >
      {open && (
        <div className="confirm-dialog-body">
          <h2 id={titleId}>{deckTexts.addMissingTitle(cards)}</h2>
          <p>{deckTexts.addMissingBody(cards, copies)}</p>
          <div className="row-actions">
            <button type="button" className="button-secondary" onClick={() => dialogRef.current?.close()}>
              {deckTexts.cancel}
            </button>
            <button type="button" className="button-primary" onClick={onConfirm}>
              {deckTexts.addMissingConfirm}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

/**
 * "Lisää puuttuvat wantiin" button with its own polite live result. `name` is an accessible name that
 * includes the deck, when several of these buttons are on one page. `confirm` asks first (what is added, how many).
 */
export function AddMissingToWantsButton({
  rows,
  wants,
  label = deckTexts.addMissingToWants,
  name,
  className = 'button-secondary',
  confirm = false,
}: {
  rows: readonly MissingRow[];
  wants: WantsHandle;
  label?: string;
  name?: string;
  className?: string;
  confirm?: boolean;
}) {
  const [result, setResult] = useState('');
  const [asking, setAsking] = useState(false);
  const add = useAddMissingToWants(wants);
  const run = () => {
    const added = add(rows);
    setResult(added === 0 ? deckTexts.allAlreadyWanted : deckTexts.addedToWants(added));
  };
  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={name}
        disabled={wants.snapshot.phase !== 'ready'}
        onClick={() => (confirm && rows.length > 0 ? setAsking(true) : run())}
      >
        {label}
      </button>
      {confirm && (
        <ConfirmAddDialog
          open={asking}
          cards={rows.length}
          copies={rows.reduce((sum, row) => sum + Math.min(row.missing, MAX_COLLECTION_COUNT), 0)}
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false);
            run();
          }}
        />
      )}
      <span aria-live="polite" className="missing-result">
        {result}
      </span>
    </>
  );
}
