import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Card } from '../domain/card';
import type { ColorShare } from '../domain/deckRules';
import { CHART_TYPES, chartType } from '../domain/deckStats';
import type { ChartType, CostBucket, DrawOddsRow, RamFit } from '../domain/deckStats';
import type { EddieSummary } from '../domain/eddies';
import { typeColorClass } from './CardColor';
import { CardName } from './CardName';
import { deckTexts, formatDecimal, formatPercent } from './deckTexts';
import { colorNames } from './texts';
import { SegmentedChoice } from './SegmentedChoice';

/*
 * The charts of the deck statistics (T-093). Every chart is decoration over text that says the same: the
 * numbers are visible, and screen readers get them from the labels and lists, never from the shapes.
 */

const CHART_TYPE_ORDER: readonly ChartType[] = [...CHART_TYPES, 'other'];

export function chartTypeLabel(type: ChartType): string {
  return type === 'other' ? deckTexts.chartTypeOther : type;
}

export type Tone = 'ok' | 'warn' | 'bad' | 'neutral';

/** A progress ring. `value / max` of the circle is filled; the text in the middle is the caller's. */
export function Ring({ value, max, tone, size = 'small', children }: { value: number; max: number; tone: Tone; size?: 'big' | 'small'; children: React.ReactNode }) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const share = max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));
  return (
    <span className={`ring ring--${size} ring--${tone}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <circle className="ring-track" cx="50" cy="50" r={r} />
        <circle
          className="ring-fill"
          cx="50"
          cy="50"
          r={r}
          strokeDasharray={`${share * circumference} ${circumference}`}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span className="ring-center">{children}</span>
    </span>
  );
}

/**
 * Cost curve by type (T-093). Each bar is a button: it shows the cards of that Cost below the chart.
 * The average Cost is a marker on the axis.
 */
export function CostChart({ buckets, average, last }: { buckets: readonly CostBucket[]; average: number | null; last: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const listId = useId();
  const max = Math.max(1, ...buckets.map((bucket) => bucket.total));
  const typeTotals = CHART_TYPE_ORDER.map((type) => ({ type, count: buckets.reduce((sum, bucket) => sum + bucket.byType[type], 0) })).filter(
    ({ count }) => count > 0,
  );
  const open = selected === null ? undefined : buckets[selected];
  const label = (cost: number) => deckTexts.curveBucket(cost, last);
  return (
    <div className="cost-chart">
      <div className="cost-chart-plot" style={{ '--bars': buckets.length } as CSSProperties}>
        {buckets.map((bucket) => (
          <button
            key={bucket.cost}
            type="button"
            className={'cost-col' + (bucket.total === 0 ? ' is-empty' : '') + (selected === bucket.cost ? ' is-selected' : '')}
            aria-pressed={selected === bucket.cost}
            aria-controls={listId}
            aria-label={deckTexts.curveBucketButton(label(bucket.cost), bucket.total)}
            disabled={bucket.total === 0}
            onClick={() => setSelected(selected === bucket.cost ? null : bucket.cost)}
          >
            <span className="cost-col-count" aria-hidden="true">
              {bucket.total}
            </span>
            <span className="cost-col-stack" aria-hidden="true" style={{ blockSize: `${(bucket.total / max) * 100}%` }}>
              {CHART_TYPE_ORDER.map((type) =>
                bucket.byType[type] > 0 ? (
                  <span key={type} className={`cost-seg seg-${type.toLowerCase()}`} style={{ flexGrow: bucket.byType[type] }} />
                ) : null,
              )}
            </span>
            <span className="cost-col-label" aria-hidden="true">
              {label(bucket.cost)}
            </span>
          </button>
        ))}
        {average !== null && (
          <span
            className="cost-avg"
            aria-hidden="true"
            style={{ insetInlineStart: `${((Math.min(average, last) + 0.5) / buckets.length) * 100}%` }}
          >
            <span className="cost-avg-label">Ø {formatDecimal(average)}</span>
          </span>
        )}
      </div>
      {average !== null && <p className="visually-hidden">{deckTexts.curveAverage(formatDecimal(average))}</p>}
      <ul className="chart-legend">
        {typeTotals.map(({ type, count }) => (
          <li key={type}>
            <span className={`legend-swatch seg-${type.toLowerCase()}`} aria-hidden="true" />
            <span lang="en">{chartTypeLabel(type)}</span> <strong>{count}</strong>
          </li>
        ))}
      </ul>
      <div id={listId} className="cost-cards" role="region" aria-live="polite" aria-label={deckTexts.curveHeading}>
        {open === undefined ? (
          <p className="hint">{deckTexts.curveTapHint}</p>
        ) : (
          <>
            <p className="cost-cards-title">{deckTexts.curveBucketCards(label(open.cost), open.total)}</p>
            <ul className="cost-cards-list">
              {open.cards.map(({ card, count }) => (
                <CardLine key={card.key} card={card} count={count} />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function CardLine({ card, count }: { card: Card; count: number }) {
  return (
    <li className="card-line">
      <span className={`legend-swatch seg-${chartType(card).toLowerCase()}`} aria-hidden="true" />
      <span className="card-line-name">
        <CardName card={card} muteSubname />
      </span>
      <span className="card-line-count">{deckTexts.copies(count)}</span>
    </li>
  );
}

/** Colours as a donut with the RAM of each colour beside it (T-093): Legends' RAM against the priciest card. */
export function ColorRam({ colors, mainCount, fits }: { colors: readonly ColorShare[]; mainCount: number; fits: readonly RamFit[] }) {
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const total = Math.max(1, colors.reduce((sum, share) => sum + share.count, 0));
  const shown = [...new Set([...colors.map((share) => share.color), ...fits.map((fit) => fit.color)])];
  // Where each segment starts on the circle: the lengths of the ones before it.
  const lengths = colors.map(({ count }) => (count / total) * circumference);
  const starts = lengths.map((_, index) => lengths.slice(0, index).reduce((sum, length) => sum + length, 0));
  return (
    <div className="color-ram">
      <span className="donut">
        <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <circle className="ring-track" cx="50" cy="50" r={r} />
          {colors.map(({ color }, index) => (
            <circle
              key={color}
              className={`donut-seg ${typeColorClass(color)}`}
              cx="50"
              cy="50"
              r={r}
              strokeDasharray={`${Math.max(0, (lengths[index] ?? 0) - 1.5)} ${circumference}`}
              strokeDashoffset={-(starts[index] ?? 0)}
              transform="rotate(-90 50 50)"
            />
          ))}
        </svg>
        <span className="ring-center">
          <strong>{mainCount}</strong>
          <small>{deckTexts.mainCards.toLowerCase()}</small>
        </span>
      </span>
      <ul className="color-ram-list">
        {shown.map((color) => {
          const share = colors.find((entry) => entry.color === color);
          const fit = fits.find((entry) => entry.color === color);
          const count = share?.count ?? 0;
          const over = fit !== undefined && fit.overCopies > 0;
          return (
            <li key={color} className={`color-ram-row ${typeColorClass(color)}` + (over ? ' is-over' : '')}>
              <span className="legend-swatch donut-swatch" aria-hidden="true" />
              <span className="color-ram-name">
                {colorNames.get(color) ?? color} <strong>{count}</strong>
                <span className="color-ram-pct"> · {formatPercent(count / total)}</span>
              </span>
              {fit !== undefined && (
                <span className="color-ram-fit">
                  {fit.available > 0 ? deckTexts.ramGiven(fit.available) : deckTexts.ramNoLegend}
                  {fit.needed !== null && <> · {deckTexts.ramNeeded(fit.needed)}</>}
                  {' · '}
                  {over ? (
                    <strong className="ram-over">⚠ {deckTexts.ramOverCopies(fit.overCopies)}</strong>
                  ) : (
                    <span className="ram-ok">✓ {deckTexts.ramFine}</span>
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Unit / Program / Gear as one bar split by share, the numbers under it. */
export function TypeBar({ counts }: { counts: readonly { type: ChartType; count: number }[] }) {
  const total = Math.max(1, counts.reduce((sum, entry) => sum + entry.count, 0));
  return (
    <div className="type-bar-wrap">
      <span className="type-bar" aria-hidden="true">
        {counts.map(({ type, count }) => (
          <span key={type} className={`type-bar-seg seg-${type.toLowerCase()}`} style={{ flexGrow: count }}>
            {count / total >= 0.12 ? count : ''}
          </span>
        ))}
      </span>
      <ul className="chart-legend">
        {counts.map(({ type, count }) => (
          <li key={type}>
            <span className={`legend-swatch seg-${type.toLowerCase()}`} aria-hidden="true" />
            <span lang="en">{chartTypeLabel(type)}</span> <strong>{count}</strong>
            <span className="chart-legend-pct"> · {formatPercent(count / total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Draw odds per card as bars, for one moment at a time (opening hand, turn 1, 3, 5). */
export function DrawOdds({ rows, moments }: { rows: readonly DrawOddsRow[]; moments: readonly string[] }) {
  const [moment, setMoment] = useState(0);
  const name = useId();
  const sorted = [...rows].sort((a, b) => (b.odds[moment] ?? 0) - (a.odds[moment] ?? 0) || a.card.displayName.localeCompare(b.card.displayName, 'en'));
  return (
    <div className="draw-odds">
      <SegmentedChoice
        legendVisible
        fill
        legend={deckTexts.drawPick}
        name={name}
        value={moment}
        options={moments.map((label, index) => [index, label] as const)}
        onChange={setMoment}
      />
      <ul className="odds-bars">
        {sorted.map(({ card, count, odds }) => {
          const odd = odds[moment] ?? 0;
          return (
            <li key={card.key} className="odds-bar-row">
              <span className="odds-bar-name">
                <CardName card={card} muteSubname />
                <span className="odds-bar-copies"> {deckTexts.copies(count)}</span>
              </span>
              <span className="odds-bar" aria-hidden="true">
                <span className="odds-bar-fill" style={{ inlineSize: `${odd * 100}%` }} />
              </span>
              <span className="odds-bar-pct">{formatPercent(odd)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Eddies (T-096): sellable cards against the recommendation for this deck's Cost, as a meter, and the
 * average Eddies each turn against the ideal one a turn. Numbers are in the text; the bars are decoration.
 */
export function EddiesPanel({ summary }: { summary: EddieSummary }) {
  const { sellable, deckSize, target, curve, targetTurn, byType, unknown } = summary;
  const under = target === null ? 0 : Math.max(0, target.min - sellable);
  const over = target === null ? 0 : Math.max(0, sellable - target.max);
  const tone: Tone = target === null ? 'neutral' : under > 0 || over > 0 ? 'warn' : 'ok';
  const range = target === null ? '' : target.min === target.max ? String(target.min) : `${target.min}–${target.max}`;
  const pct = target === null ? '' : formatShareRange(target.shareLow, target.shareHigh);
  const scale = Math.max(1, deckSize);
  const onCurve = curve.onCurve[targetTurn - 1] ?? 0;
  return (
    <div className="eddies">
      <div className="eddies-head">
        <p className="eddies-count">
          <strong className={`eddies-number tone-${tone}`}>{sellable}</strong> <span>{deckTexts.eddiesSellable}</span>{' '}
          <span className="eddies-of">{deckTexts.eddiesOf(deckSize)}</span>
        </p>
        {target !== null && (
          <p className={`eddies-verdict tone-${tone}`}>
            {deckTexts.eddiesRecommended(range, pct)} ·{' '}
            {under > 0 ? deckTexts.eddiesLow(under) : over > 0 ? deckTexts.eddiesHigh(over) : deckTexts.eddiesOk}
          </p>
        )}
      </div>
      <span className="eddies-meter" aria-hidden="true">
        <span className={`eddies-meter-fill tone-${tone}`} style={{ inlineSize: `${(Math.min(sellable, scale) / scale) * 100}%` }} />
        {target !== null && (
          <span
            className="eddies-meter-mark"
            style={{ insetInlineStart: `${(target.min / scale) * 100}%`, inlineSize: `max(3px, ${((target.max - target.min) / scale) * 100}%)` }}
          />
        )}
      </span>
      {target !== null && <p className="visually-hidden">{deckTexts.eddiesRecommendedSpoken(sellable, range, pct)}</p>}
      {byType.size > 0 && (
        <ul className="chart-legend">
          {[...byType].map(([type, count]) => (
            <li key={type}>
              <span className={`legend-swatch seg-${chartTypeOf(type)}`} aria-hidden="true" />
              <span lang="en">{type}</span> <strong>{count}</strong>
            </li>
          ))}
        </ul>
      )}

      <p className="eddies-curve-title">{deckTexts.eddiesCurveTitle}</p>
      <ol className="eddies-curve">
        {curve.expected.map((avg, index) => {
          const turn = index + 1;
          return (
            <li key={turn} className={'eddies-turn' + (turn === targetTurn ? ' is-target' : '')}>
              <span className="eddies-turn-value" aria-hidden="true">
                {formatDecimal(avg)}
              </span>
              <span className="eddies-turn-track" aria-hidden="true" style={{ blockSize: `${(turn / curve.expected.length) * 100}%` }}>
                <span className="eddies-turn-fill" style={{ blockSize: `${(avg / turn) * 100}%` }} />
              </span>
              <span className="eddies-turn-label" aria-hidden="true">
                {turn}
              </span>
              <span className="visually-hidden">{deckTexts.eddiesCurveTurn(turn, formatDecimal(avg))}</span>
            </li>
          );
        })}
      </ol>
      <p className="eddies-oncurve">
        <strong>{deckTexts.eddiesOnCurve(targetTurn, formatPercent(onCurve))}</strong>
      </p>
      {target !== null && <p className="hint">{deckTexts.eddiesWhy}</p>}
      {unknown > 0 && <p className="hint">{deckTexts.eddiesUnknown(unknown)}</p>}
      <p className="hint">{deckTexts.eddiesNote}</p>
    </div>
  );
}

/** "55–60 %" (or "58 %" when both round the same). */
function formatShareRange(low: number, high: number): string {
  const a = Math.round(low * 100);
  const b = Math.round(high * 100);
  return a === b ? `${a} %` : `${a}–${b} %`;
}

function chartTypeOf(type: string): string {
  return (CHART_TYPES as readonly string[]).includes(type) ? type.toLowerCase() : 'other';
}
