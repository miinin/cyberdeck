import { useMemo, useRef, useState } from 'react';
import { intlLocale } from '../locale';
import {
  openBooster,
  openLegendPack,
  sealedIssues,
  sealedStats,
  SEALED_LEGENDS,
  SEALED_MAX_COLORS,
  SEALED_MIN_MAIN,
  SEALED_SELLABLE_HINT,
  SEALED_UNITS_HINT,
} from '../domain/booster';
import type { BoosterCard, SealedIssue, SealedSetId } from '../domain/booster';
import type { Card } from '../domain/card';
import { uniqueDeckName } from '../domain/deckEdit';
import { toCardsByKey } from '../domain/deckRules';
import {
  addToMain,
  freeCopies,
  isSealedReady,
  newSealedRun,
  poolRows,
  removeFromMain,
  sealedDeckOf,
  SEALED_BOOSTERS,
  SEALED_PACK_STEPS,
  toggleLegend,
  withPack,
} from '../domain/sealed';
import type { SealedRun } from '../domain/sealed';
import type { Rng } from '../domain/testHand';
import { StorageError } from '../storage';
import type { Repositories, StorageErrorKind } from '../storage';
import { BoosterPicture, PackReveal } from './BoosterCards';
import { CardColor } from './CardColor';
import { CardName, cardNameText } from './CardName';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { deckTexts } from './deckTexts';
import { SegmentedChoice } from './SegmentedChoice';
import { sealedTexts as t } from './sealedTexts';
import { routeHash } from './useHashRoute';
import { useSealed } from './useSealed';
import type { SealedChangeResult, SealedHandle } from './useSealed';

const SET_OPTIONS: readonly (readonly [SealedSetId, string])[] = [
  ['welcome-to-night-city', t.setRetail],
  ['welcome-to-night-city-beta', t.setBeta],
];

const COLORS = ['Red', 'Yellow', 'Green', 'Blue'] as const;
const TYPES = ['Unit', 'Gear', 'Program'] as const;

function failureText(kind: Exclude<SealedChangeResult, null>): string {
  return deckTexts.actionFailed(kind as StorageErrorKind | 'unknown');
}

function issueText(issue: SealedIssue, nameOf: (key: string) => string): string {
  switch (issue.kind) {
    case 'main-size':
      return t.issueMainSize(issue.have, issue.need);
    case 'legends':
      return t.issueLegends(issue.have, issue.need);
    case 'colors':
      return t.issueColors(issue.colors, issue.max);
    case 'over-pool':
      return t.issueOverPool(nameOf(issue.card));
  }
}

/** The Sealed tab (T-173): single boosters for fun, and a sealed run from six boosters and a Legend pack to a built deck. */
export function SealedView({
  cards,
  repositories,
  rng = Math.random,
  now = () => new Date(),
}: {
  cards: readonly Card[];
  repositories: Repositories;
  rng?: Rng;
  now?: () => Date;
}) {
  const sealed = useSealed(repositories.sealed);
  const cardsByKey = useMemo(() => toCardsByKey(cards), [cards]);
  const [set, setSet] = useState<SealedSetId>('welcome-to-night-city');
  /** The pack being revealed: its cards and its step (0-based) for the title. */
  const [pack, setPack] = useState<{ cards: readonly BoosterCard[]; step: number } | null>(null);
  /** Single boosters opened for fun (not stored). */
  const [single, setSingle] = useState<{ opened: number; epic: number; iconic: number; secret: number }>({ opened: 0, epic: 0, iconic: 0, secret: 0 });
  const [singlePack, setSinglePack] = useState<readonly BoosterCard[] | null>(null);
  const [failure, setFailure] = useState<Exclude<SealedChangeResult, null> | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (sealed.phase === 'loading') return <p className="status-line">{t.loading}</p>;
  if (sealed.phase === 'unavailable') {
    return (
      <div className="notice notice-danger" role="alert">
        <p>{t.unavailable}</p>
      </div>
    );
  }
  if (sealed.phase === 'locked') {
    return (
      <div className="notice notice-danger" role="alert">
        <p>{deckTexts.actionFailed('newer-version')}</p>
      </div>
    );
  }

  const run = sealed.run;
  const report = (result: SealedChangeResult) => setFailure(result);
  const reset = sealed.notices.some((notice) => notice.kind === 'reset');

  const startSealed = async () => {
    report(await sealed.replace(newSealedRun(set)));
    setPack(null);
  };

  // The pack joins the stored pool only once it is revealed (BRK-04): a reload mid-reveal opens a fresh pack, no card is lost unseen.
  const openStep = (current: SealedRun) => {
    const step = current.opened;
    const opened = step < SEALED_BOOSTERS ? openBooster(cards, current.set, rng) : openLegendPack(cards, current.set, rng);
    setPack({ cards: opened, step });
  };

  const finishPack = async (step: number, revealed: readonly BoosterCard[]) => {
    setPack(null);
    // Only if this step is still the next one, so a repeated click cannot add the pack twice.
    report(await sealed.update((latest) => (latest.opened === step ? withPack(latest, revealed) : latest)));
  };

  const openSingle = () => {
    const opened = openBooster(cards, set, rng);
    setSinglePack(opened);
    setSingle((before) => ({
      opened: before.opened + 1,
      epic: before.epic + opened.filter((entry) => entry.rarity === 'Epic').length,
      iconic: before.iconic + opened.filter((entry) => entry.rarity === 'Iconic').length,
      secret: before.secret + opened.filter((entry) => entry.rarity === 'Secret').length,
    }));
  };

  const notes = (
    <>
      {reset && (
        <div className="notice notice-warning">
          <p>{t.resetNotice}</p>
        </div>
      )}
      {failure !== null && (
        <div className="notice notice-danger" role="alert">
          <p>{failureText(failure)}</p>
        </div>
      )}
    </>
  );

  // A pack is being revealed: the sealed run's, or a single one.
  if (run !== null && pack !== null) {
    const title = pack.step < SEALED_BOOSTERS ? t.stepBooster(pack.step + 1, SEALED_BOOSTERS) : t.stepLegends;
    return (
      <section className="sealed">
        {notes}
        <h2 className="sealed-step">
          {title}
          <span className="sealed-step-of"> · {t.stepOf(pack.step + 1, SEALED_PACK_STEPS)}</span>
        </h2>
        <PackReveal
          key={pack.step}
          pack={pack.cards}
          cardsByKey={cardsByKey}
          title={title}
          nextLabel={pack.step + 1 >= SEALED_PACK_STEPS ? t.toBuilder : t.nextPack}
          onNext={() => void finishPack(pack.step, pack.cards)}
        />
      </section>
    );
  }

  if (run === null && singlePack !== null) {
    const title = t.singlePackTitle(single.opened);
    return (
      <section className="sealed">
        {notes}
        <h2 className="sealed-step">{title}</h2>
        <PackReveal key={single.opened} pack={singlePack} cardsByKey={cardsByKey} title={title} nextLabel={t.singleNext} onNext={() => setSinglePack(null)} />
        <p className="hint sealed-estimate">{t.estimateNote}</p>
      </section>
    );
  }

  if (run !== null && !isSealedReady(run)) {
    const step = run.opened;
    return (
      <section className="sealed">
        {notes}
        <h2 className="sealed-step">
          {step < SEALED_BOOSTERS ? t.stepBooster(step + 1, SEALED_BOOSTERS) : t.stepLegends}
          <span className="sealed-step-of"> · {t.stepOf(step + 1, SEALED_PACK_STEPS)}</span>
        </h2>
        <div className="pack-actions">
          <button type="button" className="button-primary" onClick={() => openStep(run)}>
            {t.openPack}
          </button>
        </div>
        <p className="hint sealed-estimate">{t.estimateNote}</p>
      </section>
    );
  }

  if (run !== null) {
    return (
      <>
        {notes}
        <SealedBuilder
          run={run}
          cardsByKey={cardsByKey}
          sealed={sealed}
          repositories={repositories}
          now={now}
          onFailure={report}
          onNew={() => setConfirming(true)}
        />
        <ConfirmDeleteDialog
          name={confirming ? 'sealed' : null}
          title={t.confirmTitle}
          body={() => t.confirmBody}
          confirmLabel={t.confirmYes}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            setPack(null);
            void sealed.clear().then(report);
          }}
        />
      </>
    );
  }

  return (
    <section className="sealed">
      {notes}
      <p className="sealed-intro">{t.intro}</p>
      <SegmentedChoice legend={t.setLegend} legendVisible className="sealed-set-choice" name="sealed-set" value={set} options={SET_OPTIONS} onChange={setSet} />
      <p className="hint">{t.setHint}</p>
      <div className="sealed-start">
        <section className="sealed-start-card" aria-labelledby="sealed-start-heading">
          <h2 id="sealed-start-heading">{t.startHeading}</h2>
          <p>{t.startHint}</p>
          <p className="sealed-rules">{t.rulesNote}</p>
          <button type="button" className="button-primary" onClick={() => void startSealed()}>
            {t.startSealed}
          </button>
        </section>
        <section className="sealed-start-card" aria-labelledby="sealed-single-heading">
          <h2 id="sealed-single-heading">{t.singleHeading}</h2>
          <p>{t.singleHint}</p>
          <p className="sealed-single-stats" role="status">
            <span>{t.singleOpened(single.opened)}</span>
            <span>{single.opened === 0 ? t.singleNone : t.singleHits(single.epic, single.iconic, single.secret)}</span>
          </p>
          <button type="button" className="button-secondary" onClick={openSingle}>
            {t.openSingle}
          </button>
        </section>
      </div>
      <p className="hint sealed-estimate">{t.estimateNote}</p>
    </section>
  );
}

/** The pool as a card grid and the deck being built from it. */
function SealedBuilder({
  run,
  cardsByKey,
  sealed,
  repositories,
  now,
  onFailure,
  onNew,
}: {
  run: SealedRun;
  cardsByKey: ReadonlyMap<string, Card>;
  sealed: SealedHandle;
  repositories: Repositories;
  now: () => Date;
  onFailure: (result: SealedChangeResult) => void;
  onNew: () => void;
}) {
  const [color, setColor] = useState<'all' | (typeof COLORS)[number]>('all');
  const [type, setType] = useState<'all' | (typeof TYPES)[number]>('all');
  const [saved, setSaved] = useState<{ id: string; name: string } | null>(null);
  const saving = useRef(false);

  const nameOf = (key: string) => {
    const card = cardsByKey.get(key);
    return card === undefined ? key : cardNameText(card);
  };
  const deck = sealedDeckOf(run);
  const stats = sealedStats(deck, cardsByKey);
  const issues = sealedIssues(run.pool, deck, cardsByKey);
  const rows = poolRows(run.pool).flatMap((row) => {
    const card = cardsByKey.get(row.entry.card);
    return card === undefined ? [] : [{ ...row, card }];
  });
  const legendRows = rows.filter((row) => row.card.type === 'Legend');
  const mainRows = rows.filter((row) => row.card.type !== 'Legend');
  const visible = mainRows.filter((row) => (color === 'all' || row.card.color === color) && (type === 'all' || row.card.type === type));
  const deckRows = run.main.flatMap((row) => {
    const card = cardsByKey.get(row.card);
    return card === undefined || card.type === 'Legend' ? [] : [{ ...row, card }];
  });

  const change = (next: (current: SealedRun) => SealedRun) => {
    setSaved(null);
    void sealed.update(next).then(onFailure);
  };

  const play = () => {
    window.location.hash = routeHash({ name: 'sealedGoldfish' });
  };

  const saveAsDeck = async () => {
    if (saving.current) return;
    saving.current = true;
    onFailure(null);
    try {
      const { value: existing } = await repositories.decks.list();
      const name = uniqueDeckName(
        existing.map((item) => item.name),
        t.deckName(new Intl.DateTimeFormat(intlLocale, { dateStyle: 'short' }).format(now())),
      );
      const created = await repositories.decks.create({
        name,
        sections: [
          {
            name: '',
            cards: [
              ...run.legends.map((key) => ({ card: key, count: 1 })),
              ...deckRows.map((row) => ({ card: row.card.key, count: row.count })),
            ],
          },
        ],
      });
      setSaved({ id: created.id, name: created.name });
    } catch (error) {
      onFailure(error instanceof StorageError ? error.kind : 'unknown');
    } finally {
      saving.current = false;
    }
  };

  return (
    <section className="sealed sealed-builder">
      <h2>{t.builderHeading}</h2>
      <div className="sealed-actions" role="group" aria-label={t.actionsLabel}>
        <button type="button" className="button-primary" disabled={stats.main + run.legends.length === 0} onClick={play}>
          {t.play}
        </button>
        <button
          type="button"
          className="button-secondary"
          disabled={stats.main + run.legends.length === 0 || saved !== null}
          onClick={() => void saveAsDeck()}
        >
          {t.save}
        </button>
        <button type="button" className="button-secondary" onClick={onNew}>
          {t.newSealed}
        </button>
      </div>
      <p className="hint sealed-save-note">{t.saveNote}</p>
      <p className="sealed-saved" role="status">
        {saved !== null && (
          <>
            {t.saved(saved.name)} <a href={routeHash({ name: 'deck', id: saved.id })}>{t.openSavedDeck}</a>
          </>
        )}
      </p>

      <dl className="sealed-status" aria-label={t.statusLabel}>
        <div>
          <dt>{t.statMain}</dt>
          <dd>{t.statMainValue(stats.main, SEALED_MIN_MAIN)}</dd>
        </div>
        <div>
          <dt>{t.statColors}</dt>
          <dd>{t.statColorsValue(stats.colors.length, SEALED_MAX_COLORS)}</dd>
          <dd className="sealed-status-hint" lang="en">
            {t.statColorsNames(stats.colors)}
          </dd>
        </div>
        <div>
          <dt>{t.statUnits}</dt>
          <dd>{stats.units}</dd>
          <dd className="sealed-status-hint">{t.statUnitsHint(SEALED_UNITS_HINT)}</dd>
        </div>
        <div>
          <dt>{t.statSellable}</dt>
          <dd>{stats.sellable}</dd>
          <dd className="sealed-status-hint">{t.statSellableHint(SEALED_SELLABLE_HINT)}</dd>
        </div>
        <div>
          <dt>{t.statLegends}</dt>
          <dd>{t.statLegendsValue(run.legends.length, SEALED_LEGENDS)}</dd>
        </div>
      </dl>
      <ul className="sealed-issues" aria-label={t.issuesLabel}>
        {issues.length === 0 ? <li className="sealed-ok">{t.allGood}</li> : issues.map((issue, index) => <li key={index}>{issueText(issue, nameOf)}</li>)}
      </ul>

      <section aria-labelledby="sealed-legends-heading" className="sealed-block">
        <h3 id="sealed-legends-heading">{t.legendsHeading(run.legends.length, SEALED_LEGENDS)}</h3>
        <p className="hint">{t.legendsHint}</p>
        {legendRows.length === 0 ? (
          <p>{t.legendsNone}</p>
        ) : (
          <ul className="pool-grid">
            {legendRows.map(({ entry, card, count }) => {
              const chosen = run.legends.includes(card.key);
              return (
                <li key={card.key} className={chosen ? 'pool-card is-chosen' : 'pool-card'}>
                  <button
                    type="button"
                    className="pool-card-button"
                    aria-pressed={chosen}
                    onClick={() => change((current) => toggleLegend(current, card.key))}
                  >
                    <BoosterPicture entry={entry} card={card} />
                    <span className="visually-hidden">{(chosen ? t.dropLegend : t.chooseLegend)(cardNameText(card))}</span>
                  </button>
                  <span className="pool-card-name" aria-hidden="true">
                    <CardName card={card} />
                  </span>
                  <span className="pool-card-count" aria-hidden="true">
                    {[chosen ? t.legendChosen : '', count > 1 ? `×${count}` : ''].filter(Boolean).join(' · ')}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="sealed-layout">
        <section aria-labelledby="sealed-pool-heading" className="sealed-block">
          <h3 id="sealed-pool-heading">{t.poolHeading}</h3>
          <p className="hint">{t.poolHint}</p>
          <div className="sealed-filters" role="group" aria-label={t.filtersLabel}>
            <SegmentedChoice
              legend={t.filterColor}
              legendVisible
              name="sealed-color"
              value={color}
              options={[['all', t.filterAll], ...COLORS.map((value) => [value, <span lang="en" key={value}>{value}</span>] as const)]}
              onChange={setColor}
            />
            <SegmentedChoice
              legend={t.filterType}
              legendVisible
              name="sealed-type"
              value={type}
              options={[['all', t.filterAll], ...TYPES.map((value) => [value, <span lang="en" key={value}>{value}</span>] as const)]}
              onChange={setType}
            />
          </div>
          {visible.length === 0 ? (
            <p>{t.poolEmpty}</p>
          ) : (
            // T-173 review (T-174): by type, so the pool reads as a few short lists and not one endless grid.
            TYPES.map((groupType) => {
              const group = visible.filter((row) => row.card.type === groupType);
              if (group.length === 0) return null;
              return (
                <div key={groupType} className="pool-group">
                  <h4 className="pool-group-title" lang="en">
                    {groupType} ({group.reduce((sum, row) => sum + row.count, 0)})
                  </h4>
                  <ul className="pool-grid">
                    {group.map(({ entry, card, count }) => {
                      const free = freeCopies(run, card.key);
                      return (
                        <li key={card.key} className={free < 1 ? 'pool-card is-used' : 'pool-card'}>
                          <button
                            type="button"
                            className="pool-card-button"
                            disabled={free < 1}
                            onClick={() => change((current) => addToMain(current, card.key, false))}
                          >
                            <BoosterPicture entry={entry} card={card} />
                            <span className="visually-hidden">{t.addToDeck(cardNameText(card))}</span>
                          </button>
                          <span className="pool-card-name" aria-hidden="true">
                            <CardName card={card} />
                          </span>
                          <span className="pool-card-count">{t.poolLeft(free, count)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </section>

        <section aria-labelledby="sealed-deck-heading" className="sealed-block sealed-deck">
          <h3 id="sealed-deck-heading">{t.deckHeading}</h3>
          {deckRows.length === 0 ? (
            <p className="hint">{t.deckEmpty}</p>
          ) : (
            <ul className="sealed-deck-list">
              {deckRows.map(({ card, count }) => (
                <li key={card.key}>
                  <span className="sealed-deck-count">{count}×</span>
                  <span className="sealed-deck-name">
                    <span>
                      <CardName card={card} />
                    </span>
                    <span className="sealed-deck-meta">
                      <CardColor color={card.color} /> · <span lang="en">{card.type}</span>
                    </span>
                  </span>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={t.removeFromDeck(cardNameText(card))}
                    title={t.removeFromDeck(cardNameText(card))}
                    onClick={() => change((current) => removeFromMain(current, card.key))}
                  >
                    <span aria-hidden="true">−</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
