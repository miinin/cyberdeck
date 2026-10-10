import { exportFileName, missingToText } from '../domain/deckExport';
import type { MissingCard } from '../domain/deckExport';
import type { CardKey } from '../domain/cardKey';
import type { Playability, Substitute } from '../domain/substitutes';
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
  substitutes,
  playability,
  onCopyWithOwn,
}: {
  rows: readonly MissingCard[];
  deckName: string;
  wants?: WantsHandle;
  /** Owned stand-ins by missing card key (T-075). */
  substitutes?: ReadonlyMap<CardKey, readonly Substitute[]>;
  /** How playable the main deck is with the collection and with stand-ins (T-121). */
  playability?: Playability;
  /** Makes a copy of the deck with the stand-ins in place; the button shows only when this is given (T-121). */
  onCopyWithOwn?: () => void;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="missing-cards">
      {wants !== undefined && (
        <div className="missing-add">
          <AddMissingToWantsButton rows={rows.map(({ card, missing }) => ({ card: card.key, missing }))} wants={wants} />
        </div>
      )}
      {playability !== undefined && playability.total > 0 && (
        <p className="hint">{deckTexts.playability(playability.own, playability.total, playability.withSubstitutes)}</p>
      )}
      {onCopyWithOwn !== undefined && (
        <div className="missing-add">
          <button type="button" className="button-secondary" onClick={onCopyWithOwn}>
            {deckTexts.copyWithOwnCards}
          </button>
        </div>
      )}
      <details className="disclosure">
        <summary>{deckTexts.missingListHeading}</summary>
        <ul>
          {rows.map(({ card, missing }) => (
            <li key={card.key}>
              {deckTexts.missingRow(card.displayName, missing)}
              {(substitutes?.get(card.key)?.length ?? 0) > 0 && (
                <span className="hint">
                  {' '}
                  {deckTexts.substituteRow(
                    (substitutes?.get(card.key) ?? []).map((s) => ({ name: s.card.displayName, copies: s.copies, owned: s.owned })),
                  )}
                </span>
              )}
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
    </div>
  );
}
