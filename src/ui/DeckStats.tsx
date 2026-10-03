import type { ColorShare, DeckGroups } from '../domain/deckRules';
import { typeColorClass } from './CardColor';
import { CostCurve } from './CostCurve';
import { deckTexts } from './deckTexts';
import { colorNames } from './texts';

/**
 * Deck statistics (T-050c): Cost curve, colours as bars with the numbers in text, types, RAM limits and
 * what is missing from the collection. The bars are decorative; the text says everything.
 */
export function DeckStats({
  curve,
  colors,
  groups,
  mainCount,
  ramLimitsText,
  missingText,
}: {
  curve: readonly number[];
  colors: readonly ColorShare[];
  groups: DeckGroups['groups'];
  mainCount: number;
  ramLimitsText: string;
  missingText: string;
}) {
  const max = Math.max(1, ...colors.map((share) => share.count));
  return (
    <section className="deck-stats" aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="deck-section-title">
        {deckTexts.statsHeading}
      </h2>
      <CostCurve curve={curve} />
      {colors.length > 0 && (
        <div className="stat-block">
          <h3 className="cost-curve-title">{deckTexts.colorsLabel}</h3>
          <ul className="color-bars">
            {colors.map(({ color, count }) => (
              <li key={color} className={`color-bar-row ${typeColorClass(color)}`}>
                <span className="color-bar-text" lang="en">
                  {deckTexts.colorShare(colorNames.get(color) ?? color, count, Math.round((count / Math.max(1, mainCount)) * 100))}
                </span>
                <span className="color-bar" aria-hidden="true">
                  <span className="color-bar-fill" style={{ inlineSize: `${(count / max) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {groups.length > 0 && (
        <div className="stat-block">
          <h3 className="cost-curve-title">{deckTexts.typesLabel}</h3>
          <p lang="en">
            {groups
              .map((group) => deckTexts.typeShare(group.type, group.rows.reduce((sum, row) => sum + row.count, 0)))
              .join(' · ')}
          </p>
        </div>
      )}
      <p>{ramLimitsText}</p>
      {missingText !== '' && <p>{missingText}</p>}
      <p className="hint">{deckTexts.rulesNote}</p>
    </section>
  );
}
