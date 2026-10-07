import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getCardImage } from '../data/cardImages';
import { variantImageUrl } from '../data/variantImages';
import { playsetSize } from '../domain/card';
import type { Card } from '../domain/card';
import { CARD_IMAGE_WIDTH, cardImageHeight } from '../domain/cardImage';
import { EMPTY_COLLECTION } from '../domain/collection';
import {
  collectionOverview,
  colorProgress,
  hasRecordedVersions,
  missingCards,
  rarityProgress,
  setProgress,
  specialArtProgress,
  typeProgress,
} from '../domain/collectionProgress';
import type { MissingFilter } from '../domain/collectionProgress';
import { CHART_TYPES } from '../domain/deckStats';
import { setOptions } from '../domain/setFilter';
import type { Repositories } from '../storage';
import { AddMissingToWantsButton } from './AddMissingToWants';
import { typeColorClass } from './CardColor';
import { CardName } from './CardName';
import { Ring } from './DeckCharts';
import { RaritySymbol } from './RaritySymbol';
import { SendToProxyButton, useProxyQueue } from './SendToProxy';
import { collectionTexts } from './collectionTexts';
import { formatPercent } from './deckTexts';
import { cardCount } from './texts';
import { ScanCardsButton } from './CardScanner';
import { useCollection } from './useCollection';
import { useDefaultEdition } from './useDefaultEdition';
import { useWants } from './useWants';

/** One row of a breakdown: the name, a bar (decoration) and the numbers (the text says everything). */
function ProgressRow({ label, owned, total, barClass = '' }: { label: ReactNode; owned: number; total: number; barClass?: string }) {
  const share = total <= 0 ? 0 : owned / total;
  return (
    <li className={`progress-row ${barClass}`}>
      <span className="progress-label">{label}</span>
      <span className="progress-bar" aria-hidden="true">
        <span className="progress-fill" style={{ inlineSize: `${share * 100}%` }} />
      </span>
      <span className="progress-numbers">
        <strong>{owned}</strong> / {total}
        <span className="progress-pct"> · {formatPercent(share)}</span>
      </span>
    </li>
  );
}

function MissingCard({ card }: { card: Card }) {
  const image = getCardImage(card.key);
  return (
    <li>
      <a className="missing-tile" href={`#/kortti/${encodeURIComponent(card.key)}`}>
        {image !== null ? (
          <img
            className="card-image"
            src={image.medium}
            width={CARD_IMAGE_WIDTH.md}
            height={cardImageHeight('md')}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="card-image card-image--missing" aria-hidden="true" />
        )}
        <span className="missing-tile-name">
          <span className="visually-hidden">{collectionTexts.openCard}</span>
          <CardName card={card} />
        </span>
      </a>
    </li>
  );
}

/**
 * Collection progress (T-105): where the collection stands at a glance (overview rings, by set, by rarity,
 * by color and type) and what is missing, with buttons that act on the missing cards. Charts are decoration:
 * the numbers are always written out.
 */
export function CollectionView({ cards, repositories }: { cards: readonly Card[]; repositories: Repositories }) {
  const { snapshot: collection, store: collectionStore } = useCollection(repositories.collection);
  const [edition, setEdition] = useDefaultEdition(repositories);
  const wants = useWants(repositories.wants);
  const proxyQueue = useProxyQueue(repositories.proxy);
  const [filter, setFilter] = useState<MissingFilter>({ set: null, rarity: null });

  const ready = collection.phase === 'ready';
  const saved = ready ? collection.saved : EMPTY_COLLECTION;
  const data = useMemo(() => {
    const hasArt = (key: string, rarity: string) => variantImageUrl(key, rarity) !== null;
    return {
      overview: collectionOverview(cards, saved),
      sets: setProgress(cards, saved),
      rarities: rarityProgress(cards, saved),
      special: specialArtProgress(cards, saved, hasArt),
      colors: colorProgress(cards, saved),
      types: typeProgress(cards, saved),
      versions: hasRecordedVersions(cards, saved),
    };
  }, [cards, saved]);
  const sets = useMemo(() => setOptions(cards), [cards]);
  const rarityNames = useMemo(() => rarityProgress(cards, EMPTY_COLLECTION).map((row) => row.rarity), [cards]);
  const missing = useMemo(() => missingCards(cards, saved, filter), [cards, saved, filter]);
  const everyMissing = ready && missing.length === 0 && filter.set === null && filter.rarity === null;

  const { overview } = data;
  const share = overview.total === 0 ? 0 : overview.distinct / overview.total;
  const mainSets = data.sets.filter((row) => row.group === 'sets');
  const otherSets = data.sets.filter((row) => row.group === 'other');
  const setRow = (row: (typeof data.sets)[number]) => <ProgressRow key={row.family} label={row.label} owned={row.owned} total={row.total} />;

  return (
    <>
      <div className="page-head">
        <h1>
          {collectionTexts.heading}
        </h1>
        <ScanCardsButton cards={cards} snapshot={collection} store={collectionStore} edition={edition} onEditionChange={setEdition} />
      </div>

      {collection.phase === 'loading' && <p>{collectionTexts.loading}</p>}
      {(collection.phase === 'unavailable' || collection.phase === 'locked') && <p role="alert">{collectionTexts.unavailable}</p>}

      {ready && overview.distinct === 0 && (
        <div className="stats-card collection-empty">
          <h2 className="collection-empty-title">{collectionTexts.emptyTitle}</h2>
          <p>{collectionTexts.emptyBody}</p>
          <p>
            <a className="button-primary" href="#/">
              {collectionTexts.emptyLink}
            </a>
          </p>
        </div>
      )}

      {ready && overview.distinct > 0 && (
        <div className="collection-progress">
          <section className="stats-card collection-wide" aria-labelledby="coll-overview">
            <h2 id="coll-overview" className="stats-card-title">
              {collectionTexts.overviewHeading}
            </h2>
            <div className="overview-gauges">
              <div className="gauge-main">
                <Ring value={overview.distinct} max={overview.total} tone={share >= 1 ? 'ok' : 'neutral'} size="big">
                  <strong aria-hidden="true">{formatPercent(share)}</strong>
                  <small aria-hidden="true">
                    {overview.distinct}/{overview.total}
                  </small>
                </Ring>
                <span className="gauge-label">{collectionTexts.ownedDistinct}</span>
                <span className="visually-hidden">{collectionTexts.ownedOf(overview.distinct, overview.total)}</span>
              </div>
              <dl className="kpi-tiles collection-kpis">
                <div>
                  <dt>{collectionTexts.copiesLabel}</dt>
                  <dd>{overview.copies}</dd>
                  <dd className="kpi-hint">{collectionTexts.copiesHint}</dd>
                </div>
                <div>
                  <dt>{collectionTexts.playsetsLabel}</dt>
                  <dd>
                    {overview.playsets}/{overview.total}
                  </dd>
                  <dd className="kpi-hint">{collectionTexts.playsetsHint(overview.total)}</dd>
                </div>
                <div>
                  <dt>{collectionTexts.sellableLabel}</dt>
                  <dd>{overview.sellableCopies}</dd>
                  <dd className="kpi-hint">{collectionTexts.sellableHint}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="stats-card" aria-labelledby="coll-sets">
            <h2 id="coll-sets" className="stats-card-title">
              {collectionTexts.setsHeading}
            </h2>
            <ul className="progress-list">{mainSets.map(setRow)}</ul>
            {otherSets.length > 0 && (
              <details className="progress-more">
                <summary>
                  {collectionTexts.otherProducts} ({otherSets.length})
                </summary>
                <ul className="progress-list">{otherSets.map(setRow)}</ul>
              </details>
            )}
            <p className="hint">{data.versions ? collectionTexts.setsHint : collectionTexts.setsNoVersions}</p>
          </section>

          <section className="stats-card" aria-labelledby="coll-rarity">
            <h2 id="coll-rarity" className="stats-card-title">
              {collectionTexts.rarityHeading}
            </h2>
            <ul className="progress-list">
              {data.rarities.map((row) => (
                <ProgressRow key={row.rarity} label={<RaritySymbol rarity={row.rarity} showName />} owned={row.owned} total={row.total} />
              ))}
            </ul>
            {data.special.length > 0 && (
              <>
                <h3 className="progress-subtitle">{collectionTexts.specialHeading}</h3>
                <ul className="progress-list">
                  {data.special.map((row) => (
                    <ProgressRow key={row.rarity} label={<RaritySymbol rarity={row.rarity} showName />} owned={row.owned} total={row.total} />
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="stats-card" aria-labelledby="coll-colors">
            <h2 id="coll-colors" className="stats-card-title">
              {collectionTexts.colorsTypesHeading}
            </h2>
            <h3 className="progress-subtitle">{collectionTexts.colorsHeading}</h3>
            <ul className="progress-list">
              {data.colors.map((row) => (
                <ProgressRow
                  key={row.value ?? 'none'}
                  label={row.value === null ? collectionTexts.noColor : <span lang="en">{row.value}</span>}
                  owned={row.owned}
                  total={row.total}
                  barClass={`progress-color ${typeColorClass(row.value)}`}
                />
              ))}
            </ul>
            <h3 className="progress-subtitle">{collectionTexts.typesHeading}</h3>
            <ul className="progress-list">
              {data.types.map((row) => (
                <ProgressRow
                  key={row.value ?? 'none'}
                  label={<span lang="en">{row.value}</span>}
                  owned={row.owned}
                  total={row.total}
                  barClass={`seg-${(CHART_TYPES as readonly (string | null)[]).includes(row.value) ? String(row.value).toLowerCase() : 'other'}`}
                />
              ))}
            </ul>
          </section>

          <section className="stats-card collection-wide" aria-labelledby="coll-missing">
            <h2 id="coll-missing" className="stats-card-title">
              {collectionTexts.missingHeading}
            </h2>
            <p className="hint">{collectionTexts.missingIntro}</p>
            <div className="missing-filters">
              <label className="sort-select">
                {collectionTexts.filterSet}
                <select value={filter.set ?? ''} onChange={(event) => setFilter({ ...filter, set: event.target.value === '' ? null : event.target.value })}>
                  <option value="">{collectionTexts.filterAll}</option>
                  {sets.map((option) => (
                    <option key={option.family} value={option.family}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sort-select">
                {collectionTexts.filterRarity}
                <select value={filter.rarity ?? ''} onChange={(event) => setFilter({ ...filter, rarity: event.target.value === '' ? null : event.target.value })}>
                  <option value="">{collectionTexts.filterAll}</option>
                  {rarityNames.map((rarity) => (
                    <option key={rarity} value={rarity}>
                      {rarity}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p role="status" aria-live="polite" className="missing-count">
              {everyMissing ? collectionTexts.allOwned : collectionTexts.missingCount(missing.length)}
            </p>
            {missing.length > 0 && (
              <>
                <div className="missing-add proxy-send">
                  <AddMissingToWantsButton
                    rows={missing.map((card) => ({ card: card.key, missing: playsetSize(card) }))}
                    wants={wants}
                    label={collectionTexts.wantLabel}
                    confirm
                  />
                  <SendToProxyButton
                    rows={missing.map((card) => ({ card: card.key, count: 1 }))}
                    queue={proxyQueue}
                    label={collectionTexts.proxyLabel}
                  />
                </div>
                <p className="hint">
                  {collectionTexts.wantNote} {collectionTexts.proxyNote}
                </p>
                <ul className="missing-grid" aria-label={cardCount(missing.length)}>
                  {missing.map((card) => (
                    <MissingCard key={card.key} card={card} />
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

