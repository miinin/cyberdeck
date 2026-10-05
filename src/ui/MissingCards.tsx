import { exportFileName, missingToText } from '../domain/deckExport';
import type { MissingCard } from '../domain/deckExport';
import { AddMissingToWantsButton } from './AddMissingToWants';
import { deckTexts } from './deckTexts';
import { downloadTextFile } from './downloadFile';
import type { WantsHandle } from './useWants';

export type { WantsHandle };

/**
 * The deck's missing cards: a visible "add to wants" button when the want list is given (T-061b, T-066), and
 * the list and a .txt download (T-061) in a details element. Names are React text, never HTML.
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
  if (rows.length === 0) return null;

  return (
    <div className="missing-cards">
      {wants !== undefined && (
        <div className="missing-add">
          <AddMissingToWantsButton rows={rows.map(({ card, missing }) => ({ card: card.key, missing }))} wants={wants} />
        </div>
      )}
      <details>
        <summary>{deckTexts.missingListHeading}</summary>
        <ul>
          {rows.map(({ card, missing }) => (
            <li key={card.key}>{deckTexts.missingRow(card.displayName, missing)}</li>
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
      </details>
    </div>
  );
}
