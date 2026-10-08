import { useId, useState } from 'react';
import type { DeckContent } from '../domain/deck';
import type { CardsByKey } from '../domain/deckRules';
import { groupOdds } from '../domain/deckStats';
import type { CardGroup } from '../domain/deckStats';
import { deckTexts, formatPercent } from './deckTexts';
import { colorNames } from './texts';

const TYPES = ['Unit', 'Gear', 'Program'] as const;
const COSTS = [1, 2, 3, 4, 5] as const;

/** "type:Unit", "color:Red", "cost:2" -> group. */
function parseGroup(value: string): CardGroup {
  const [kind, rest = ''] = value.split(':');
  if (kind === 'color') return { kind: 'color', value: rest };
  if (kind === 'cost') return { kind: 'maxCost', value: Number(rest) };
  return { kind: 'type', value: rest };
}

/** Small calculator (T-075): the chance to see 1+ and 2+ cards of a group by each turn. */
export function GroupOdds({ deck, cardsByKey }: { deck: DeckContent; cardsByKey: CardsByKey }) {
  const [choice, setChoice] = useState('type:Unit');
  const id = useId();
  const { copies, rows } = groupOdds(deck, cardsByKey, parseGroup(choice));
  return (
    <div className="group-odds">
      <h3 className="panel-title">{deckTexts.groupOddsHeading}</h3>
      <div className="field">
        <label htmlFor={id}>{deckTexts.groupOddsLabel}</label>
        <select id={id} value={choice} onChange={(event) => setChoice(event.target.value)}>
          <optgroup label={deckTexts.groupOddsTypes}>
            {TYPES.map((type) => (
              <option key={type} value={`type:${type}`} lang="en">
                {type}
              </option>
            ))}
          </optgroup>
          <optgroup label={deckTexts.groupOddsColors}>
            {[...colorNames].map(([color, name]) => (
              <option key={color} value={`color:${color}`}>
                {name}
              </option>
            ))}
          </optgroup>
          <optgroup label={deckTexts.groupOddsCosts}>
            {COSTS.map((cost) => (
              <option key={cost} value={`cost:${cost}`}>
                {deckTexts.groupOddsCost(cost)}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      <p role="status">{deckTexts.groupOddsCopies(copies)}</p>
      <table className="odds-table group-odds-table">
        <caption className="visually-hidden">{deckTexts.groupOddsCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{deckTexts.groupOddsTurn}</th>
            <th scope="col" className="cell-number">
              {deckTexts.groupOddsAtLeast(1)}
            </th>
            <th scope="col" className="cell-number">
              {deckTexts.groupOddsAtLeast(2)}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ turn, atLeast1, atLeast2 }) => (
            <tr key={turn}>
              <th scope="row">{deckTexts.oddsTurn(turn)}</th>
              <OddsCell value={atLeast1} />
              <OddsCell value={atLeast2} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A percentage with a bar behind it (T-093); the bar is decoration, the number is the content. */
function OddsCell({ value }: { value: number }) {
  return (
    <td className="odds-cell">
      <span className="odds-bar" aria-hidden="true">
        <span className="odds-bar-fill" style={{ inlineSize: `${value * 100}%` }} />
      </span>
      <span className="odds-cell-pct">{formatPercent(value)}</span>
    </td>
  );
}
