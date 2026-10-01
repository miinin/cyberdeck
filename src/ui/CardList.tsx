import type { Card } from '../domain/card';
import { texts } from './texts';

/** Card table (UX.md 4.4). All values are rendered as React text nodes, never as HTML (SR-1). */
export function CardList({ cards }: { cards: Card[] }) {
  return (
    <table className="card-table">
      <caption className="visually-hidden">{texts.tableCaption}</caption>
      <thead>
        <tr>
          <th scope="col">{texts.columnName}</th>
          <th scope="col" className="col-fit">
            {texts.columnType}
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
            <td lang="en" className="col-fit">
              {card.type}
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
