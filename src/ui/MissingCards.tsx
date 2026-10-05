import { exportFileName, missingToText } from '../domain/deckExport';
import type { MissingCard } from '../domain/deckExport';
import { deckTexts } from './deckTexts';
import { downloadTextFile } from './downloadFile';

/** The deck's missing cards as a list and a .txt download (T-061). Names are React text, never HTML. */
export function MissingCards({ rows, deckName }: { rows: readonly MissingCard[]; deckName: string }) {
  if (rows.length === 0) return null;
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
    </details>
  );
}
