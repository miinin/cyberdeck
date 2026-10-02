import { COST_CURVE_LAST } from '../domain/deckRules';
import { deckTexts } from './deckTexts';

/**
 * Small bar chart of the main deck's Cost curve (T-049). The bars are decorative (aria-hidden):
 * a visually hidden table says the same to screen readers.
 */
export function CostCurve({ curve }: { curve: readonly number[] }) {
  const max = Math.max(1, ...curve);
  return (
    <div className="cost-curve">
      <h3 className="cost-curve-title">{deckTexts.curveHeading}</h3>
      <div className="cost-curve-bars" aria-hidden="true">
        {curve.map((count, cost) => (
          <div key={cost} className={'cost-curve-col' + (count === 0 ? ' is-empty' : '')}>
            <span className="cost-curve-count">{count}</span>
            <span className="cost-curve-bar" style={{ blockSize: `${(count / max) * 100}%` }} />
            <span className="cost-curve-label">{deckTexts.curveBucket(cost, COST_CURVE_LAST)}</span>
          </div>
        ))}
      </div>
      <table className="visually-hidden">
        <caption>{deckTexts.curveCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{deckTexts.curveCost}</th>
            <th scope="col">{deckTexts.curveCopies}</th>
          </tr>
        </thead>
        <tbody>
          {curve.map((count, cost) => (
            <tr key={cost}>
              <th scope="row">{deckTexts.curveBucket(cost, COST_CURVE_LAST)}</th>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
