import { useState } from 'react';
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

/**
 * "Lisää puuttuvat wantiin" button with its own polite live result. `name` is an accessible name that
 * includes the deck, when several of these buttons are on one page.
 */
export function AddMissingToWantsButton({
  rows,
  wants,
  label = deckTexts.addMissingToWants,
  name,
  className = 'button-secondary',
}: {
  rows: readonly MissingRow[];
  wants: WantsHandle;
  label?: string;
  name?: string;
  className?: string;
}) {
  const [result, setResult] = useState('');
  const add = useAddMissingToWants(wants);
  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={name}
        disabled={wants.snapshot.phase !== 'ready'}
        onClick={() => {
          const added = add(rows);
          setResult(added === 0 ? deckTexts.allAlreadyWanted : deckTexts.addedToWants(added));
        }}
      >
        {label}
      </button>
      <span aria-live="polite" className="missing-result">
        {result}
      </span>
    </>
  );
}
