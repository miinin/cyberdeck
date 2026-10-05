import { useMemo, useRef, useState } from 'react';
import type { DeckContent } from '../domain/deck';
import type { MissingCard } from '../domain/deckExport';
import { MissingCards } from './MissingCards';
import { COST_CURVE_LAST } from '../domain/deckRules';
import type { CardsByKey, ColorShare, DeckGroups } from '../domain/deckRules';
import {
  CHEAP_COST,
  DRAWS_PER_TURN,
  DRAW_TURNS,
  OPENING_HAND,
  POWER_CURVE_LAST,
  averageCost,
  averagePower,
  cardsSeen,
  cheapOpeningProbability,
  drawProbabilities,
  powerCurve,
  ramDistribution,
  rarityDistribution,
} from '../domain/deckStats';
import type { Rng } from '../domain/testHand';
import { typeColorClass } from './CardColor';
import { CardName } from './CardName';
import { TestHandDialog } from './TestHandDialog';
import { ValueCurve } from './ValueCurve';
import { deckTexts, formatDecimal, formatPercent } from './deckTexts';
import { colorNames } from './texts';

/** "3,2", or a dash that screen readers hear as "ei tietoa" (T-053). */
function Average({ value }: { value: number | null }) {
  if (value !== null) return <>{formatDecimal(value)}</>;
  return (
    <>
      <span aria-hidden="true">–</span>
      <span className="visually-hidden">{deckTexts.noValue}</span>
    </>
  );
}

const DRAW_COUNTS = [OPENING_HAND, ...DRAW_TURNS.map(cardsSeen)];

/**
 * Deck statistics (T-050c, T-053): summary, Cost and Power curves, colours as bars with the numbers in
 * text, types, RAM, rarities, draw odds, RAM limits, what is missing from the collection and the test
 * hand. The bars are decorative; the text says everything. Legends are never part of the main deck numbers.
 */
export function DeckStats({
  deck,
  cardsByKey,
  curve,
  colors,
  groups,
  mainCount,
  ramLimitsText,
  missingText,
  missingCards = [],
  rng = Math.random,
}: {
  deck: DeckContent;
  cardsByKey: CardsByKey;
  curve: readonly number[];
  colors: readonly ColorShare[];
  groups: DeckGroups['groups'];
  mainCount: number;
  ramLimitsText: string;
  missingText: string;
  /** Cards the collection lacks, listed under missingText (T-061). */
  missingCards?: readonly MissingCard[];
  /** Random source of the test hand; tests pass a seeded one. */
  rng?: Rng;
}) {
  const max = Math.max(1, ...colors.map((share) => share.count));
  const stats = useMemo(
    () => ({
      avgCost: averageCost(deck, cardsByKey),
      avgPower: averagePower(deck, cardsByKey),
      power: powerCurve(deck, cardsByKey),
      ram: ramDistribution(deck, cardsByKey),
      rarities: rarityDistribution(deck, cardsByKey),
      cheap: cheapOpeningProbability(deck, cardsByKey),
      odds: drawProbabilities(deck, cardsByKey, DRAW_COUNTS),
    }),
    [deck, cardsByKey],
  );
  const [handOpen, setHandOpen] = useState(false);
  // The odds table is built only while it is open: closed it is long, hidden content.
  const [oddsOpen, setOddsOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const hasPower = stats.power.some((count) => count > 0);

  return (
    <section className="deck-stats" aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="deck-section-title">
        {deckTexts.statsHeading}
      </h2>
      <dl className="stat-summary">
        <div>
          <dt>{deckTexts.avgCost}</dt>
          <dd>
            <Average value={stats.avgCost} />
          </dd>
        </div>
        <div>
          <dt>{deckTexts.avgPower}</dt>
          <dd>
            <Average value={stats.avgPower} />
          </dd>
        </div>
        <div>
          <dt>{deckTexts.mainCards}</dt>
          <dd>{mainCount}</dd>
        </div>
      </dl>

      <div className="test-hand-open">
        <button
          ref={openerRef}
          type="button"
          className="button-secondary"
          aria-haspopup="dialog"
          disabled={mainCount === 0}
          aria-describedby={mainCount === 0 ? 'test-hand-empty' : undefined}
          onClick={() => setHandOpen(true)}
        >
          {deckTexts.testHandOpen}
        </button>
        {mainCount === 0 && (
          <p id="test-hand-empty" className="hint">
            {deckTexts.testHandEmpty}
          </p>
        )}
      </div>
      {mainCount > 0 && (
        <p className="stat-odds-line">
          {deckTexts.cheapOpening(CHEAP_COST)}: <strong className="stat-number">{formatPercent(stats.cheap)}</strong>
        </p>
      )}

      <ValueCurve
        title={deckTexts.curveHeading}
        caption={deckTexts.curveCaption}
        valueHeading={deckTexts.curveCost}
        values={curve}
        last={COST_CURVE_LAST}
      />
      {hasPower && (
        <ValueCurve
          title={deckTexts.powerHeading}
          caption={deckTexts.powerCaption}
          valueHeading={deckTexts.powerValue}
          values={stats.power}
          last={POWER_CURVE_LAST}
        />
      )}
      {colors.length > 0 && (
        <div className="stat-block">
          <h3 className="cost-curve-title">{deckTexts.colorsLabel}</h3>
          <ul className="color-bars">
            {colors.map(({ color, count }) => (
              <li key={color} className={`color-bar-row ${typeColorClass(color)}`}>
                <span className="color-bar-text" lang="en">
                  {deckTexts.colorShare(
                    colorNames.get(color) ?? color,
                    count,
                    Math.round((count / Math.max(1, mainCount)) * 100),
                  )}
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
              .map((group) =>
                deckTexts.typeShare(
                  group.type,
                  group.rows.reduce((sum, row) => sum + row.count, 0),
                ),
              )
              .join(' · ')}
          </p>
        </div>
      )}
      {stats.ram.length > 0 && (
        <div className="stat-block">
          <h3 className="cost-curve-title">{deckTexts.ramDistLabel}</h3>
          <p>{stats.ram.map(({ value, count }) => deckTexts.ramShare(value, count)).join(' · ')}</p>
        </div>
      )}
      {stats.rarities.length > 0 && (
        <div className="stat-block">
          <h3 className="cost-curve-title">{deckTexts.raritiesLabel}</h3>
          <p>
            {stats.rarities.map(({ rarity, count }, index) => (
              <span key={rarity ?? ''}>
                {index > 0 && ' · '}
                {rarity === null ? (
                  deckTexts.raritiesShare(deckTexts.rarityUnknown, count)
                ) : (
                  <>
                    <span lang="en">{rarity}</span> {count}
                  </>
                )}
              </span>
            ))}
          </p>
        </div>
      )}
      <p>{ramLimitsText}</p>
      {missingText !== '' && <p>{missingText}</p>}
      <MissingCards rows={missingCards} deckName={deck.name} />

      {stats.odds.length > 0 && (
        <details className="stat-odds" onToggle={(event) => setOddsOpen(event.currentTarget.open)}>
          <summary>{deckTexts.oddsHeading}</summary>
          {oddsOpen && (
            <>
              <div className="table-scroll" tabIndex={0} role="region" aria-label={deckTexts.oddsHeading}>
                <table className="card-table odds-table">
                  <caption className="visually-hidden">{deckTexts.oddsCaption}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{deckTexts.oddsCard}</th>
                      <th scope="col" className="cell-number">
                        {deckTexts.oddsCopies}
                      </th>
                      <th scope="col" className="cell-number">
                        {deckTexts.oddsOpening}
                      </th>
                      {DRAW_TURNS.map((turn) => (
                        <th key={turn} scope="col" className="cell-number">
                          {deckTexts.oddsTurn(turn)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.odds.map(({ card, count, odds }) => (
                      <tr key={card.key}>
                        <th scope="row" className="cell-name">
                          <CardName card={card} muteSubname />
                        </th>
                        <td className="cell-number">{count}</td>
                        {odds.map((odd, index) => (
                          <td key={index} className="cell-number">
                            {formatPercent(odd)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="hint">{deckTexts.oddsNote(OPENING_HAND, DRAWS_PER_TURN)}</p>
            </>
          )}
        </details>
      )}
      <p className="hint">{deckTexts.rulesNote}</p>
      <TestHandDialog
        open={handOpen}
        deck={deck}
        cardsByKey={cardsByKey}
        rng={rng}
        onClose={() => {
          setHandOpen(false);
          openerRef.current?.focus();
        }}
      />
    </section>
  );
}
