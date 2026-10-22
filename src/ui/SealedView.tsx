import { useEffect, useMemo, useRef, useState } from 'react';
import { intlLocale } from '../locale';
import {
  BOOSTER_SIZE,
  LEGEND_PACK_SIZE,
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
import { checkDeckName, uniqueDeckName } from '../domain/deckEdit';
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
  withoutDeckId,
  withPack,
} from '../domain/sealed';
import type { SealedRun } from '../domain/sealed';
import type { Rng } from '../domain/testHand';
import { StorageError } from '../storage';
import type { Repositories, StorageErrorKind } from '../storage';
import { BoosterPicture, ClosedPack, PackGrid, useRevealProgress } from './BoosterCards';
import { CardColor } from './CardColor';
import { CardName, cardNameText } from './CardName';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { deckTexts } from './deckTexts';
import { InfoTip } from './InfoTip';
import { SegmentedChoice } from './SegmentedChoice';
import { sealedTexts as t } from './sealedTexts';
import { routeHash } from './useHashRoute';
import { useSealed } from './useSealed';
import type { SealedChangeResult, SealedHandle } from './useSealed';

const SET_OPTIONS: readonly (readonly [SealedSetId, string])[] = [
  ['welcome-to-night-city', t.setRetail],
  ['welcome-to-night-city-beta', t.setBeta],
];

/** The name of a set, as the set choice shows it. */
function setLabel(id: SealedSetId): string {
  return SET_OPTIONS.find(([key]) => key === id)?.[1] ?? id;
}

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

function FailureNote({ failure }: { failure: Exclude<SealedChangeResult, null> | null }) {
  if (failure === null) return null;
  return (
    <div className="notice notice-danger" role="alert">
      <p>{failureText(failure)}</p>
    </div>
  );
}

/**
 * Single boosters for fun (T-176, the Boosters tab of the Playtest section): one big button opens a booster and turns
 * its cards, the next click opens the next one. Nothing is stored.
 */
export function BoostersView({ cards, rng = Math.random }: { cards: readonly Card[]; rng?: Rng }) {
  const cardsByKey = useMemo(() => toCardsByKey(cards), [cards]);
  const [set, setSet] = useState<SealedSetId>('welcome-to-night-city');
  const [pack, setPack] = useState<readonly BoosterCard[] | null>(null);
  const [stats, setStats] = useState({ opened: 0, epic: 0, iconic: 0, secret: 0 });
  const revealed = useRevealProgress(pack);

  const open = () => {
    const opened = openBooster(cards, set, rng);
    setPack(opened);
    setStats((before) => ({
      opened: before.opened + 1,
      epic: before.epic + opened.filter((entry) => entry.rarity === 'Epic').length,
      iconic: before.iconic + opened.filter((entry) => entry.rarity === 'Iconic').length,
      secret: before.secret + opened.filter((entry) => entry.rarity === 'Secret').length,
    }));
  };

  return (
    <section className="sealed">
      <div className="booster-controls has-info-tip">
        <SegmentedChoice size="sm" legend={t.setLegend} legendVisible className="sealed-set-choice" name="booster-set" value={set} options={SET_OPTIONS} onChange={setSet} />
        <button type="button" className="button-primary booster-open" onClick={open}>
          {stats.opened === 0 ? t.openSingle : t.openNextSingle}
        </button>
        <p className="sealed-single-stats mono" role="status">
          <span>{t.singleOpened(stats.opened)}</span>
          <span>{stats.opened === 0 ? t.singleNone : t.singleHits(stats.epic, stats.iconic, stats.secret)}</span>
        </p>
        <InfoTip>
          <span className="info-tip-line">{t.boostersIntro}</span>
          <span className="info-tip-line">{t.setHint}</span>
          <span className="info-tip-line">{t.estimateNote}</span>
        </InfoTip>
      </div>
      <PackGrid
        pack={pack}
        slots={BOOSTER_SIZE}
        revealed={revealed}
        cardsByKey={cardsByKey}
        title={stats.opened === 0 ? t.openSingle : t.singlePackTitle(stats.opened)}
        closed={{ title: setLabel(set), sub: t.singlePackTitle(stats.opened + 1) }}
      />
    </section>
  );
}

/**
 * The Sealed tab (T-173, T-176): a sealed run from six boosters and a Legend pack to a built deck. One big button opens
 * the packs one after the other; the finished deck is saved among the user's own decks.
 */
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
  const [failure, setFailure] = useState<Exclude<SealedChangeResult, null> | null>(null);
  const [confirming, setConfirming] = useState(false);
  /** The opening was done on this page, so the builder takes the focus the button had. */
  const [openedHere, setOpenedHere] = useState(false);

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
  const reset = sealed.notices.some((notice) => notice.kind === 'reset');
  const notes = (
    <>
      {reset && (
        <div className="notice notice-warning">
          <p>{t.resetNotice}</p>
        </div>
      )}
      <FailureNote failure={failure} />
    </>
  );

  if (run !== null && !isSealedReady(run)) {
    return (
      <section className="sealed">
        {notes}
        <SealedOpening run={run} cards={cards} cardsByKey={cardsByKey} sealed={sealed} rng={rng} onFailure={setFailure} onOpened={() => setOpenedHere(true)} />
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
          autoFocus={openedHere}
          onFailure={setFailure}
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
            setOpenedHere(false);
            void sealed.clear().then(setFailure);
          }}
        />
      </>
    );
  }

  return (
    <section className="sealed">
      {notes}
      <div className="booster-controls has-info-tip">
        <SegmentedChoice size="sm" legend={t.setLegend} legendVisible className="sealed-set-choice" name="sealed-set" value={set} options={SET_OPTIONS} onChange={setSet} />
        <InfoTip>
          <span className="info-tip-line">{t.intro}</span>
          <span className="info-tip-line">{t.setHint}</span>
          <span className="info-tip-line">{t.rulesNote}</span>
          <span className="info-tip-line">{t.estimateNote}</span>
        </InfoTip>
      </div>
      <section className="sealed-start-card" aria-labelledby="sealed-start-heading">
        <ClosedPack title={setLabel(set)} sub={t.startHeading} />
        <div className="sealed-start-body">
          <h2 id="sealed-start-heading">{t.startHeading}</h2>
          <p>{t.startHint}</p>
          <button type="button" className="button-primary" onClick={() => void sealed.replace(newSealedRun(set)).then(setFailure)}>
            {t.startSealed}
          </button>
        </div>
      </section>
    </section>
  );
}

/**
 * Opening the packs of a sealed run with one button (T-176): it opens a pack and turns its cards by themselves; the next
 * click moves the pack into the pool and opens the next one, and after the Legend pack the builder follows. "Open all the
 * rest" opens what is left at once. The pack joins the stored pool only once it has been shown (BRK-04): a reload
 * mid-opening opens a fresh pack, no card is lost unseen. The buttons never move: the pack grid is always below them.
 */
function SealedOpening({
  run,
  cards,
  cardsByKey,
  sealed,
  rng,
  onFailure,
  onOpened,
}: {
  run: SealedRun;
  cards: readonly Card[];
  cardsByKey: ReadonlyMap<string, Card>;
  sealed: SealedHandle;
  rng: Rng;
  onFailure: (result: SealedChangeResult) => void;
  onOpened: () => void;
}) {
  /** The pack on the table: its cards and its step (0-based). null = the next pack is not opened yet. */
  const [pack, setPack] = useState<{ cards: readonly BoosterCard[]; step: number } | null>(null);
  const revealed = useRevealProgress(pack?.cards ?? null);
  const step = pack?.step ?? run.opened;
  const isLegends = step >= SEALED_BOOSTERS;
  const isLast = step + 1 >= SEALED_PACK_STEPS;

  const packAt = (index: number) => (index < SEALED_BOOSTERS ? openBooster(cards, run.set, rng) : openLegendPack(cards, run.set, rng));
  /** Adds shown packs to the stored pool, each only if its step is still the next one, so a repeated click cannot add a pack twice. */
  const commit = (shown: readonly { cards: readonly BoosterCard[]; step: number }[]) =>
    void sealed
      .update((latest) => shown.reduce((current, item) => (current.opened === item.step ? withPack(current, item.cards) : current), latest))
      .then(onFailure);

  const advance = () => {
    if (pack === null) {
      setPack({ cards: packAt(run.opened), step: run.opened });
      return;
    }
    commit([pack]);
    if (isLast) {
      setPack(null);
      onOpened();
    } else {
      setPack({ cards: packAt(pack.step + 1), step: pack.step + 1 });
    }
  };

  const openRest = () => {
    const queue: { cards: readonly BoosterCard[]; step: number }[] = pack === null ? [] : [pack];
    for (let next = pack === null ? run.opened : pack.step + 1; next < SEALED_PACK_STEPS; next += 1) queue.push({ cards: packAt(next), step: next });
    commit(queue);
    setPack(null);
    onOpened();
  };

  const title = isLegends ? t.stepLegends : t.stepBooster(step + 1, SEALED_BOOSTERS);
  return (
    <>
      <div className="booster-controls has-info-tip">
        <h2 className="sealed-step">{title}</h2>
        <button type="button" className="button-primary booster-open" onClick={advance}>
          {pack === null ? t.openPack : isLast ? t.toBuilder : t.nextPack}
        </button>
        <button type="button" className="button-secondary" disabled={pack !== null && isLast} onClick={openRest}>
          {t.openRest}
        </button>
        <InfoTip>
          {isLegends && <span className="info-tip-line">{t.legendPackHint}</span>}
          <span className="info-tip-line">{t.estimateNote}</span>
        </InfoTip>
      </div>
      <PackGrid
        pack={pack?.cards ?? null}
        slots={isLegends ? LEGEND_PACK_SIZE : BOOSTER_SIZE}
        revealed={revealed}
        cardsByKey={cardsByKey}
        title={title}
        closed={{ title: setLabel(run.set), sub: title }}
      />
    </>
  );
}

/** The pool as a card grid and the deck being built from it. */
function SealedBuilder({
  run,
  cardsByKey,
  sealed,
  repositories,
  now,
  autoFocus,
  onFailure,
  onNew,
}: {
  run: SealedRun;
  cardsByKey: ReadonlyMap<string, Card>;
  sealed: SealedHandle;
  repositories: Repositories;
  now: () => Date;
  autoFocus: boolean;
  onFailure: (result: SealedChangeResult) => void;
  onNew: () => void;
}) {
  const [color, setColor] = useState<'all' | (typeof COLORS)[number]>('all');
  const [type, setType] = useState<'all' | (typeof TYPES)[number]>('all');
  /** What the last save did, said once; cleared when the deck changes. */
  const [message, setMessage] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState(() => t.deckName(new Intl.DateTimeFormat(intlLocale, { dateStyle: 'short' }).format(now())));
  const [nameError, setNameError] = useState(false);
  /** The deck was edited elsewhere since this run saved it: asks before the changes replace it. */
  const [askReplace, setAskReplace] = useState(false);
  const saving = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // The latest handle for effects that must not run again every time the run changes.
  const sealedRef = useRef(sealed);
  useEffect(() => {
    sealedRef.current = sealed;
  });

  // The button that opened the last pack is gone: the focus goes to the builder, not to the top of the page.
  useEffect(() => {
    if (autoFocus) headingRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  // A run saved as a deck earlier: show that deck's name, or forget the id if the deck has been removed since.
  const savedId = run.deckId;
  useEffect(() => {
    if (savedId === undefined) return;
    let active = true;
    repositories.decks.get(savedId).then(
      (deck) => {
        if (!active) return;
        if (deck === null) void sealedRef.current.update(withoutDeckId).then(onFailure);
        else setNameInput(deck.name);
      },
      () => {},
    );
    return () => {
      active = false;
    };
  }, [savedId, repositories.decks, onFailure]);

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
    setMessage(null);
    void sealed.update(next).then(onFailure);
  };

  const play = () => {
    window.location.hash = routeHash({ name: 'sealedGoldfish' });
  };

  /** Saves the deck among the user's own: the deck this run was saved as before is updated, else a new one is made. */
  const saveAsDeck = async (mode: 'check' | 'replace' | 'new' = 'check') => {
    if (saving.current) return;
    const checked = checkDeckName(nameInput);
    if (!checked.ok) {
      setNameError(true);
      return;
    }
    setNameError(false);
    saving.current = true;
    onFailure(null);
    setMessage(null);
    setAskReplace(false);
    try {
      const found = run.deckId === undefined || mode === 'new' ? null : await repositories.decks.get(run.deckId);
      // Edited elsewhere (the editor) after the last save here: ask first. A run without a stamp cannot tell, so it saves.
      if (mode === 'check' && found !== null && run.deckUpdatedAt !== undefined && found.updatedAt !== run.deckUpdatedAt) {
        setAskReplace(true);
        return;
      }
      const previous = found;
      const { value: existing } = await repositories.decks.list();
      const name = uniqueDeckName(
        existing.filter((item) => item.id !== previous?.id).map((item) => item.name),
        checked.name,
      );
      const content = {
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
      };
      const stored =
        previous === null
          ? await repositories.decks.create(content)
          : await repositories.decks.update(previous.id, content, mode === 'check' && run.deckUpdatedAt !== undefined ? { expectedUpdatedAt: run.deckUpdatedAt } : undefined);
      setNameInput(stored.name);
      setMessage(previous === null ? t.saved(stored.name) : t.updated(stored.name));
      onFailure(await sealed.update((current) => ({ ...current, deckId: stored.id, deckUpdatedAt: stored.updatedAt })));
    } catch (error) {
      onFailure(error instanceof StorageError ? error.kind : 'unknown');
    } finally {
      saving.current = false;
    }
  };

  const nothingToSave = stats.main + run.legends.length === 0;
  return (
    <section className="sealed sealed-builder">
      <h2 ref={headingRef} tabIndex={-1}>
        {t.builderHeading}
      </h2>
      <form
        className="sealed-save"
        aria-label={t.saveFormLabel}
        onSubmit={(event) => {
          event.preventDefault();
          void saveAsDeck();
        }}
      >
        <label className="sealed-save-name">
          <span>{t.deckNameLabel}</span>
          <input
            type="text"
            value={nameInput}
            maxLength={100}
            autoComplete="off"
            aria-invalid={nameError}
            aria-describedby={nameError ? 'sealed-name-error' : undefined}
            onChange={(event) => {
              setNameInput(event.target.value);
              setNameError(false);
            }}
          />
        </label>
        <div className="sealed-save-buttons">
          <button type="submit" className="button-primary" disabled={nothingToSave}>
            {run.deckId === undefined ? t.save : t.saveChanges}
          </button>
          {run.deckId !== undefined && (
            <a className="button-secondary" href={routeHash({ name: 'deck', id: run.deckId })}>
              {t.openSavedDeck}
            </a>
          )}
        </div>
      </form>
      {nameError && (
        <p id="sealed-name-error" className="field-error" role="alert">
          {t.deckNameError}
        </p>
      )}
      {askReplace && (
        <div className="notice notice-warning" role="alert">
          <p>{t.replaceAsk}</p>
          <div className="sealed-save-buttons">
            <button type="button" className="button-primary" onClick={() => void saveAsDeck('replace')}>
              {t.replaceYes}
            </button>
            <button type="button" className="button-secondary" onClick={() => void saveAsDeck('new')}>
              {t.saveAsNew}
            </button>
            <button type="button" className="button-secondary" onClick={() => setAskReplace(false)}>
              {t.replaceCancel}
            </button>
          </div>
        </div>
      )}
      <p className="hint sealed-save-note">{t.saveNote}</p>
      <p className="sealed-saved" role="status">
        {message}
      </p>
      <div className="sealed-actions" role="group" aria-label={t.actionsLabel}>
        <button type="button" className="button-secondary" disabled={nothingToSave} onClick={play}>
          {t.play}
        </button>
        <button type="button" className="button-secondary" onClick={onNew}>
          {t.newSealed}
        </button>
      </div>

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
