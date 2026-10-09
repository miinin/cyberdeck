import { useMemo, useRef, useState } from 'react';
import { RaritySymbol } from './RaritySymbol';
import type { DeckContent } from '../domain/deck';
import { SIDEBOARD_SIZE } from '../domain/deck';
import type { MissingCard } from '../domain/deckExport';
import { GroupOdds } from './GroupOdds';
import { MissingCards } from './MissingCards';
import type { CardKey } from '../domain/cardKey';
import type { Substitute } from '../domain/substitutes';
import type { WantsHandle } from './MissingCards';
import {
  COST_CURVE_LAST,
  LEGEND_COUNT,
  MAX_MAIN_DECK,
  MIN_MAIN_DECK,
  allDeckCounts,
  deckTotals,
  ramLimits,
  sideboardSize,
} from '../domain/deckRules';
import type { CardsByKey, ColorShare, DeckGroups } from '../domain/deckRules';
import {
  CHART_TYPES,
  CHEAP_COST,
  DRAWS_PER_TURN,
  DRAW_TURNS,
  OPENING_HAND,
  POWER_CURVE_LAST,
  averageCost,
  averagePower,
  cardsSeen,
  cheapOpeningProbability,
  costCurveByType,
  drawProbabilities,
  powerCurve,
  ramDistribution,
  ramFit,
  rarityDistribution,
} from '../domain/deckStats';
import type { ChartType } from '../domain/deckStats';
import type { Rng } from '../domain/testHand';
import { ColorRam, CostChart, DrawOdds, EddiesPanel, Ring, TypeBar } from './DeckCharts';
import { eddieSummary } from '../domain/eddies';
import type { Tone } from './DeckCharts';
import { TestHandDialog } from './TestHandDialog';
import { ValueCurve } from './ValueCurve';
import { deckTexts, formatDecimal, formatPercent } from './deckTexts';

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
const TYPE_KEYS: readonly ChartType[] = [...CHART_TYPES, 'other'];
const typeKeyOf = (type: string): ChartType => ((CHART_TYPES as readonly string[]).includes(type) ? (type as ChartType) : 'other');

/**
 * Deck statistics (T-050c, T-053, redesigned in T-093 as cards with charts): an overview with rings for the
 * deck size, Legends, sideboard and collection, key numbers and the test hand; the Cost curve by type (tap a
 * bar for its cards); colours with the RAM of each; types and Power; draw odds as bars per moment; the group
 * calculator; missing cards; RAM values and rarities. Charts are decoration: the text says everything.
 */
export function DeckStats({
  deck,
  cardsByKey,
  colors,
  groups,
  mainCount,
  missingText,
  missingCards,
  wants,
  substitutes,
  rng = Math.random,
}: {
  deck: DeckContent;
  cardsByKey: CardsByKey;
  /** Kept for the callers; the chart computes its own curve by type. */
  curve?: readonly number[];
  colors: readonly ColorShare[];
  groups: DeckGroups['groups'];
  mainCount: number;
  /** Kept for the callers; the colours and RAM card shows the limits. */
  ramLimitsText?: string;
  missingText: string;
  /** Cards the collection lacks (T-061); undefined while the collection cannot be compared. */
  missingCards?: readonly MissingCard[];
  /** The want list: adds an "add missing to wants" button to the missing list (T-061b). */
  wants?: WantsHandle;
  /** Owned stand-ins for the missing cards (T-075). */
  substitutes?: ReadonlyMap<CardKey, Substitute>;
  /** Random source of the test hand; tests pass a seeded one. */
  rng?: Rng;
}) {
  const stats = useMemo(
    () => ({
      avgCost: averageCost(deck, cardsByKey),
      avgPower: averagePower(deck, cardsByKey),
      power: powerCurve(deck, cardsByKey),
      ram: ramDistribution(deck, cardsByKey),
      rarities: rarityDistribution(deck, cardsByKey),
      cheap: cheapOpeningProbability(deck, cardsByKey),
      odds: drawProbabilities(deck, cardsByKey, DRAW_COUNTS),
      buckets: costCurveByType(deck, cardsByKey, COST_CURVE_LAST),
      fits: ramFit(deck, cardsByKey, ramLimits(deck, cardsByKey)),
      legends: deckTotals(deck, cardsByKey).legends,
      sideboard: sideboardSize(deck),
      copies: [...allDeckCounts(deck).values()].reduce((sum, n) => sum + n, 0),
      eddies: eddieSummary(deck, cardsByKey),
    }),
    [deck, cardsByKey],
  );
  const [handOpen, setHandOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const hasPower = stats.power.some((count) => count > 0);
  const mainTone: Tone =
    mainCount === 0 ? 'neutral' : mainCount < MIN_MAIN_DECK ? 'warn' : mainCount > MAX_MAIN_DECK ? 'bad' : 'ok';
  const missingCopies = missingCards?.reduce((sum, row) => sum + row.missing, 0) ?? 0;
  const owned = missingCards === undefined || stats.copies === 0 ? null : 1 - missingCopies / stats.copies;
  const typeCounts = TYPE_KEYS.map((type) => ({
    type,
    count: groups
      .filter((group) => typeKeyOf(group.type) === type)
      .reduce((sum, group) => sum + group.rows.reduce((n, row) => n + row.count, 0), 0),
  })).filter(({ count }) => count > 0);

  return (
    <section className="deck-stats" aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="deck-section-title">
        {deckTexts.statsHeading}
      </h2>

      <div className="panel stats-overview">
        <h3 className="visually-hidden">{deckTexts.statsOverview}</h3>
        <div className="overview-gauges">
          <div className="gauge-main">
            <Ring value={mainCount} max={MAX_MAIN_DECK} tone={mainTone} size="big">
              <strong aria-hidden="true">{mainCount}</strong>
              <small aria-hidden="true">
                /{MIN_MAIN_DECK}–{MAX_MAIN_DECK}
              </small>
            </Ring>
            <span className="gauge-label" aria-hidden="true">
              {deckTexts.gaugeMain}
            </span>
            <span className="visually-hidden">{deckTexts.gaugeMainSpoken(mainCount, MIN_MAIN_DECK, MAX_MAIN_DECK)}</span>
          </div>
          <ul className="gauge-minis">
            <li>
              <Ring value={stats.legends} max={LEGEND_COUNT} tone={stats.legends === LEGEND_COUNT ? 'ok' : 'warn'}>
                {stats.legends}/{LEGEND_COUNT}
              </Ring>
              <span className="gauge-label">{deckTexts.gaugeLegends}</span>
            </li>
            <li>
              <Ring
                value={stats.sideboard}
                max={SIDEBOARD_SIZE}
                tone={stats.sideboard === 0 ? 'neutral' : stats.sideboard === SIDEBOARD_SIZE ? 'ok' : 'warn'}
              >
                {stats.sideboard}/{SIDEBOARD_SIZE}
              </Ring>
              <span className="gauge-label">{deckTexts.gaugeSideboard}</span>
            </li>
            {owned !== null && (
              <li>
                <Ring value={owned} max={1} tone={owned >= 1 ? 'ok' : 'warn'}>
                  <span aria-hidden="true">{formatPercent(owned)}</span>
                </Ring>
                <span className="gauge-label" aria-hidden="true">
                  {deckTexts.gaugeOwned}
                </span>
                <span className="visually-hidden">{deckTexts.gaugeOwnedSpoken(formatPercent(owned))}</span>
              </li>
            )}
          </ul>
        </div>
        <dl className="kpi-tiles">
          <div>
            <dt>{deckTexts.avgCost}</dt>
            <dd>
              <Average value={stats.avgCost} />
            </dd>
            <dd className="kpi-hint">{deckTexts.avgCostHint}</dd>
          </div>
          <div>
            <dt>{deckTexts.avgPower}</dt>
            <dd>
              <Average value={stats.avgPower} />
            </dd>
            <dd className="kpi-hint">{deckTexts.avgPowerHint}</dd>
          </div>
          <div>
            <dt>{deckTexts.cheapShort}</dt>
            <dd>{mainCount > 0 ? formatPercent(stats.cheap) : <Average value={null} />}</dd>
            <dd className="kpi-hint">{deckTexts.cheapHint(CHEAP_COST)}</dd>
          </div>
        </dl>
        <div className="test-hand-open">
          <button
            ref={openerRef}
            type="button"
            className="button-primary"
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
      </div>

      {mainCount > 0 && (
        <div className="panel">
          <h3 className="panel-title">{deckTexts.curveHeading}</h3>
          <CostChart buckets={stats.buckets} average={stats.avgCost} last={COST_CURVE_LAST} />
        </div>
      )}

      {mainCount > 0 && (
        <div className="panel">
          <h3 className="panel-title">{deckTexts.eddiesHeading}</h3>
          <EddiesPanel summary={stats.eddies} />
        </div>
      )}

      {(colors.length > 0 || stats.fits.length > 0) && (
        <div className="panel">
          <h3 className="panel-title">{deckTexts.colorsRamHeading}</h3>
          <ColorRam colors={colors} mainCount={mainCount} fits={stats.fits} />
        </div>
      )}

      {typeCounts.length > 0 && (
        <div className="panel">
          <h3 className="panel-title">{deckTexts.typesHeading}</h3>
          <TypeBar counts={typeCounts} />
          {hasPower && (
            <ValueCurve
              title={deckTexts.powerHeading}
              caption={deckTexts.powerCaption}
              valueHeading={deckTexts.powerValue}
              values={stats.power}
              last={POWER_CURVE_LAST}
            />
          )}
        </div>
      )}

      {stats.odds.length > 0 && (
        <div className="panel">
          <h3 className="panel-title">{deckTexts.oddsHeading}</h3>
          <DrawOdds rows={stats.odds} moments={[deckTexts.drawOpening, ...DRAW_TURNS.map(deckTexts.drawTurnShort)]} />
          <p className="hint">{deckTexts.oddsNote(OPENING_HAND, DRAWS_PER_TURN)}</p>
        </div>
      )}

      {mainCount > 0 && (
        <div className="panel">
          <GroupOdds deck={deck} cardsByKey={cardsByKey} />
        </div>
      )}

      {(missingText !== '' || (missingCards?.length ?? 0) > 0) && (
        <div className="panel">
          {missingText !== '' && <p>{missingText}</p>}
          <MissingCards rows={missingCards ?? []} deckName={deck.name} wants={wants} substitutes={substitutes} />
        </div>
      )}

      {(stats.ram.length > 0 || stats.rarities.length > 0) && (
        <div className="panel stats-small">
          {stats.ram.length > 0 && (
            <div className="stat-block">
              <h3 className="panel-title">{deckTexts.ramDistLabel}</h3>
              <p>{stats.ram.map(({ value, count }) => deckTexts.ramShare(value, count)).join(' · ')}</p>
            </div>
          )}
          {stats.rarities.length > 0 && (
            <div className="stat-block">
              <h3 className="panel-title">{deckTexts.raritiesLabel}</h3>
              <p>
                {stats.rarities.map(({ rarity, count }, index) => (
                  <span key={rarity ?? ''}>
                    {index > 0 && ' · '}
                    {rarity === null ? (
                      deckTexts.raritiesShare(deckTexts.rarityUnknown, count)
                    ) : (
                      <>
                        <RaritySymbol rarity={rarity} showName /> {count}
                      </>
                    )}
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>
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
