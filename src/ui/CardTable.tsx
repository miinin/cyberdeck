import type { ReactNode } from 'react';
import type { Card } from '../domain/card';
import { CardColor, typeBadgeClass } from './CardColor';
import { CardImage } from './CardImage';
import { CardDecks } from './CardDecks';
import { collectionState } from './CardList';
import type { OwnedColumn } from './CardList';
import { CountControl } from './CountControl';
import { texts } from './texts';

/** A missing value shows a dash and a hidden spoken equivalent, as in the grid. */
function Value({ value, missing }: { value: number | string | null; missing: string }): ReactNode {
  if (value !== null) return value;
  return (
    <>
      <span aria-hidden="true">{texts.missingValue}</span>
      <span className="visually-hidden">{missing}</span>
    </>
  );
}

/**
 * Compact table view (T-040). The scroll container is a named, focusable region so a narrow screen
 * scrolls the table sideways, not the page. All values are React text nodes, never HTML (SR-1).
 */
export function CardTable({
  cards,
  caption = texts.tableCaption,
  owned,
  decksOf,
  onOpenImage,
}: {
  cards: readonly Card[];
  caption?: string;
  owned?: OwnedColumn;
  decksOf?: (card: Card) => readonly string[];
  onOpenImage: (card: Card, opener: HTMLButtonElement) => void;
}) {
  return (
    <div className="table-scroll" role="region" aria-label={texts.tableRegionLabel(caption)} tabIndex={0}>
      <table className="card-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="visually-hidden">{texts.columnImage}</span>
            </th>
            <th scope="col">{texts.columnName}</th>
            <th scope="col">{texts.columnType}</th>
            <th scope="col">{texts.columnRarity}</th>
            <th scope="col">{texts.columnCost}</th>
            <th scope="col">{texts.columnPower}</th>
            <th scope="col">{texts.columnRam}</th>
            {owned !== undefined && <th scope="col">{texts.columnCollection}</th>}
          </tr>
        </thead>
        <tbody>
          {cards.map((card) => (
            <tr key={card.id} className={collectionState(card, owned)}>
              <td className="cell-image">
                <CardImage card={card} onOpen={onOpenImage} />
              </td>
              <th scope="row" className="cell-name">
                <button
                  type="button"
                  className="link-button"
                  aria-haspopup="dialog"
                  onClick={(event) => onOpenImage(card, event.currentTarget)}
                >
                  <span lang="en">{card.name}</span>
                  {card.subname !== null && (
                    <>
                      <span className="visually-hidden">, </span>
                      <span className="card-subname" lang="en">
                        {card.subname}
                      </span>
                    </>
                  )}
                </button>
                {decksOf !== undefined && <CardDecks names={decksOf(card)} />}
              </th>
              <td>
                <span className={typeBadgeClass(card.color)} lang="en" title={card.color ?? undefined}>
                  {card.type}
                </span>
                <span className="visually-hidden">
                  , <CardColor color={card.color} />
                </span>
              </td>
              <td>
                <Value value={card.rarity} missing={texts.noRarity} />
              </td>
              <td className="cell-number">
                <Value value={card.cost} missing={texts.noCost} />
              </td>
              <td className="cell-number">
                <Value value={card.power} missing={texts.noPower} />
              </td>
              <td className="cell-number">
                <Value value={card.ram} missing={texts.noRam} />
              </td>
              {owned !== undefined && (
                <td className="cell-collection">
                  <CountControl
                    card={card}
                    count={owned.countOf(card)}
                    mode={owned.mode}
                    onChange={owned.onChange}
                    onLimit={owned.onLimit}
                    editable={owned.editable}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
