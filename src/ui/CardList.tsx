import type { Card } from '../domain/card';
import { CardColor } from './CardColor';
import { texts } from './texts';

/**
 * Card table (UX.md 4.4, 5.5). All values are rendered as React text nodes, never as HTML (SR-1).
 * `caption` names the table for screen readers ("Kaikki kortit" / "Hakua vastaavat kortit").
 */
export function CardList({ cards, caption = texts.tableCaption }: { cards: readonly Card[]; caption?: string }) {
  return (
    <table className="card-table">
      <caption className="visually-hidden">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{texts.columnName}</th>
          <th scope="col" className="col-fit col-wrap-header">
            {texts.columnTypeAndColor}
          </th>
          <th scope="col" className="col-fit col-number">
            {texts.columnCost}
          </th>
        </tr>
      </thead>
      <tbody>
        {cards.map((card) => (
          <tr key={card.id}>
            <th scope="row" className="card-name">
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
            <td className="col-fit">
              <span lang="en">{card.type}</span>
              <span className="visually-hidden">, </span>
              <span className="card-color">
                <CardColor color={card.color} />
              </span>
            </td>
            <td className="col-fit col-number">
              {card.cost === null ? (
                <>
                  <span aria-hidden="true">{texts.missingValue}</span>
                  <span className="visually-hidden">{texts.noCost}</span>
                </>
              ) : (
                card.cost
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
