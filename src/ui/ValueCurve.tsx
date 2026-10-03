import type { CSSProperties } from 'react';
import { deckTexts } from './deckTexts';

/**
 * Small bar chart of copies per value (T-049 Cost curve, generalised in T-053 for Power). The bars are
 * decorative (aria-hidden): a visually hidden table says the same to screen readers. The last bar holds
 * `last` and everything above it ("6+", "8+").
 */
export function ValueCurve({
  title,
  caption,
  valueHeading,
  values,
  last,
}: {
  title: string;
  caption: string;
  /** Column heading of the hidden table, e.g. "Cost". */
  valueHeading: string;
  values: readonly number[];
  last: number;
}) {
  const max = Math.max(1, ...values);
  return (
    <div className="cost-curve">
      <h3 className="cost-curve-title">{title}</h3>
      <div className="cost-curve-bars" aria-hidden="true" style={{ '--bars': values.length } as CSSProperties}>
        {values.map((count, value) => (
          <div key={value} className={'cost-curve-col' + (count === 0 ? ' is-empty' : '')}>
            <span className="cost-curve-count">{count}</span>
            <span className="cost-curve-bar" style={{ blockSize: `${(count / max) * 100}%` }} />
            <span className="cost-curve-label">{deckTexts.curveBucket(value, last)}</span>
          </div>
        ))}
      </div>
      <table className="visually-hidden">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{valueHeading}</th>
            <th scope="col">{deckTexts.curveCopies}</th>
          </tr>
        </thead>
        <tbody>
          {values.map((count, value) => (
            <tr key={value}>
              <th scope="row">{deckTexts.curveBucket(value, last)}</th>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
