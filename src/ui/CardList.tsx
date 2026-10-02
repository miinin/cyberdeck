import type { Card } from '../domain/card';
import { CardColor } from './CardColor';
import { CountControl } from './CountControl';
import type { CountControlMode } from './CountControl';
import { texts } from './texts';

/** The "Omistan" column (UX.md 6.4). Left out when the collection could not be read. */
export interface OwnedColumn {
  mode: CountControlMode;
  countOf: (card: Card) => number;
  onChange: (card: Card, count: number) => void;
  onLimit: (card: Card) => void;
}

/** Owned-row highlight (UX.md 7.5): only when the collection is ready and the count is above zero. */
function isOwned(card: Card, owned: OwnedColumn | undefined): boolean {
  return owned?.mode === 'ready' && owned.countOf(card) > 0;
}

/**
 * Card table (UX.md 4.4, 5.5, 6.4). All values are rendered as React text nodes, never as HTML (SR-1).
 * `caption` names the table for screen readers ("Kaikki kortit" / "Hakua vastaavat kortit").
 * The explicit ARIA roles keep the table semantics when narrow screens lay rows out as a grid
 * (UX.md 6.4.4: `display: grid` removes them in Chrome and Safari).
 */
export function CardList({
  cards,
  caption = texts.tableCaption,
  owned,
}: {
  cards: readonly Card[];
  caption?: string;
  owned?: OwnedColumn;
}) {
  return (
    <table className="card-table" role="table">
      <caption className="visually-hidden">{caption}</caption>
      <thead role="rowgroup">
        <tr role="row">
          <th scope="col" role="columnheader">
            {texts.columnName}
          </th>
          <th scope="col" role="columnheader" className="col-fit col-wrap-header">
            {texts.columnTypeAndColor}
          </th>
          <th scope="col" role="columnheader" className="col-fit col-number">
            {texts.columnCost}
          </th>
          {owned !== undefined && (
            <th scope="col" role="columnheader" className="col-fit col-control">
              {texts.columnOwned}
            </th>
          )}
        </tr>
      </thead>
      <tbody role="rowgroup">
        {cards.map((card) => (
          <tr key={card.id} role="row" className={isOwned(card, owned) ? 'is-owned' : undefined}>
            <th scope="row" role="rowheader" className="card-name">
              <span lang="en">{card.name}</span>
              {card.subname !== null && (
                <>
                  <span className="visually-hidden">, </span>
                  <span className="card-subname" lang="en">
                    {card.subname}
                  </span>
                </>
              )}
            </th>
            <td role="cell" className="col-fit col-type">
              <span lang="en">{card.type}</span>
              <span className="visually-hidden">, </span>
              <span className="separator" aria-hidden="true">
                {' · '}
              </span>
              <span className="card-color">
                <CardColor color={card.color} />
              </span>
            </td>
            <td role="cell" className="col-fit col-number col-cost" data-label={texts.columnCost}>
              {card.cost === null ? (
                <>
                  <span aria-hidden="true">{texts.missingValue}</span>
                  <span className="visually-hidden">{texts.noCost}</span>
                </>
              ) : (
                card.cost
              )}
            </td>
            {owned !== undefined && (
              <td role="cell" className="col-fit col-control">
                <CountControl
                  card={card}
                  count={owned.countOf(card)}
                  mode={owned.mode}
                  onChange={owned.onChange}
                  onLimit={owned.onLimit}
                />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
