import { useState } from 'react';
import { exportFileName, missingToText } from '../domain/deckExport';
import type { MissingCard } from '../domain/deckExport';
import { addMissingToWants } from '../domain/wants';
import { deckTexts } from './deckTexts';
import { downloadTextFile } from './downloadFile';
import type { useWants } from './useWants';

/** The want list as `useWants` returns it (T-064b). */
export type WantsHandle = ReturnType<typeof useWants>;

/**
 * The deck's missing cards as a list, a .txt download (T-061) and, when the want list is given, a button that
 * adds them to it (T-061b). Names are React text, never HTML.
 */
export function MissingCards({
  rows,
  deckName,
  wants,
}: {
  rows: readonly MissingCard[];
  deckName: string;
  wants?: WantsHandle;
}) {
  const [result, setResult] = useState('');
  if (rows.length === 0) return null;

  const addToWants = () => {
    if (wants === undefined) return;
    // Counts on screen: saved counts with the newest unsaved targets over them.
    const shown = new Map(wants.snapshot.saved.entries.map((entry) => [entry.card, entry.count]));
    for (const [card, count] of wants.snapshot.targets) shown.set(card, count);
    const entries = [...shown].filter(([, count]) => count > 0).map(([card, count]) => ({ card, count }));
    const next = addMissingToWants({ entries }, rows.map(({ card, missing }) => ({ card: card.key, missing })));
    let added = 0;
    for (const { card, count } of next.entries) {
      if (shown.get(card) !== count) {
        wants.store.setCount(card, count);
        added += 1;
      }
    }
    setResult(added === 0 ? deckTexts.allAlreadyWanted : deckTexts.addedToWants(added));
  };

  return (
    <details className="missing-cards">
      <summary>{deckTexts.missingListHeading}</summary>
      <ul>
        {rows.map(({ card, missing }) => (
          <li key={card.key}>
            {deckTexts.missingRow(card.displayName, missing)}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="button-secondary"
        onClick={() =>
          downloadTextFile(
            exportFileName(`${deckName} ${deckTexts.missingFileSuffix}`, 'txt'),
            missingToText(rows),
            'text/plain;charset=utf-8',
          )
        }
      >
        {deckTexts.missingDownload}
      </button>
      {wants !== undefined && (
        <button
          type="button"
          className="button-secondary"
          disabled={wants.snapshot.phase !== 'ready'}
          onClick={addToWants}
        >
          {deckTexts.addMissingToWants}
        </button>
      )}
      <p role="status" aria-live="polite" className="missing-result">
        {result}
      </p>
    </details>
  );
}
