import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Card } from '../domain/card';
import type { Deck, DeckContent } from '../domain/deck';
import { MAX_DECK_DISTINCT_CARDS } from '../domain/deck';
import { checkDeckName, distinctRows, withDeckCount } from '../domain/deckEdit';
import {
  LEGEND_COUNT,
  addBlocker,
  costCurve,
  deckCounts,
  deckTotals,
  groupDeck,
  hasSameNameLegend,
  ramLimits,
  toCardsByKey,
  validateDeck,
} from '../domain/deckRules';
import type { DeckRow } from '../domain/deckRules';
import {
  EMPTY_CRITERIA,
  KNOWN_CARD_COLORS,
  KNOWN_CARD_RARITIES,
  KNOWN_CARD_TYPES,
  filterCards,
  filterOptions,
  toggleValue,
} from '../domain/cardSearch';
import type { CardFilterCriteria } from '../domain/cardSearch';
import { StorageError } from '../storage';
import type { DeckPickView, Repositories, StorageErrorKind } from '../storage';
import { CardFilters } from './CardFilters';
import { CardImageDialog } from './CardImageDialog';
import { CardName } from './CardName';
import { CostCurve } from './CostCurve';
import { DeckPickImage } from './DeckPickImage';
import { typeColorClass } from './CardColor';
import { countIn } from './collectionStore';
import { deckTexts } from './deckTexts';
import { ExportButtons } from './ExportButtons';
import { texts } from './texts';
import { useCollection } from './useCollection';

/** A change is saved this long after the last edit (T-013). */
export const AUTOSAVE_DELAY_MS = 500;

/** The "same Legend" message stays this long (T-045). */
export const TOAST_MS = 4000;

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';
type SaveErrorKind = StorageErrorKind | 'unknown';

const errorKind = (error: unknown): SaveErrorKind => (error instanceof StorageError ? error.kind : 'unknown');

/** "Unit · Red · Cost 3 · Power 2 · RAM 1 · Rare": plain values, missing ones left out. */
function cardMeta(card: Card): string {
  return [
    card.type,
    card.color,
    card.cost === null ? null : `Cost ${card.cost}`,
    card.power === null ? null : `Power ${card.power}`,
    card.ram === null ? null : `RAM ${card.ram}`,
    card.rarity,
  ]
    .filter((part) => part !== null)
    .join(' · ');
}

/** − n + for one card. "−" stays focusable at 0 (aria-disabled) so focus is never lost. */
function Stepper({
  name,
  count,
  onChange,
  addLabel,
  describedBy,
  showCount = true,
}: {
  name: string;
  count: number;
  onChange: (count: number) => void;
  addLabel?: string;
  /** Id of a visible text that explains why adding breaks a rule. */
  describedBy?: string;
  /** False when the count is shown elsewhere (deck rows): only the spoken count stays. */
  showCount?: boolean;
}) {
  return (
    <div className="card-row-controls">
      <button
        type="button"
        className="step step-minus"
        aria-disabled={count === 0 ? 'true' : undefined}
        aria-label={deckTexts.removeCard(name)}
        onClick={() => count > 0 && onChange(count - 1)}
      >
        <span aria-hidden="true">{texts.minusSymbol}</span>
      </button>
      <span className={showCount ? 'deck-card-count' : 'deck-card-count-spoken'}>
        {showCount && <span aria-hidden="true">{count}</span>}
        <span className="visually-hidden">{deckTexts.inDeck(count)}</span>
      </span>
      <button
        type="button"
        className="step step-plus"
        aria-label={addLabel ?? deckTexts.addCard(name)}
        aria-describedby={describedBy}
        onClick={() => onChange(count + 1)}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}

export function DeckEditor({
  deckId,
  cards,
  repositories,
  onBack,
}: {
  deckId: string;
  cards: readonly Card[];
  repositories: Repositories;
  onBack: () => void;
}) {
  const repository = repositories.decks;
  const cardsByKey = useMemo(() => toCardsByKey(cards), [cards]);
  const { snapshot: collection } = useCollection(repositories.collection);

  const [phase, setPhase] = useState<'loading' | 'ready' | 'not-found' | 'unavailable'>('loading');
  const [content, setContent] = useState<DeckContent>({ name: '', sections: [] });
  const contentRef = useRef(content);
  const [nameText, setNameText] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pickView, setPickView] = useState<DeckPickView>('list');
  const pickViewChosen = useRef(false);
  const [criteria, setCriteria] = useState<CardFilterCriteria>(EMPTY_CRITERIA);
  const [zoomCard, setZoomCard] = useState<Card | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const collectionAllRef = useRef<HTMLInputElement>(null);

  // Autosave: the newest unsaved content waits in `pending`; saves run one after another.
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [saveError, setSaveError] = useState<SaveErrorKind | null>(null);
  const pending = useRef<DeckContent | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const chain = useRef<Promise<unknown>>(Promise.resolve());

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const next = pending.current;
    if (next === null) return;
    pending.current = null;
    setSaveState('saving');
    chain.current = chain.current
      .then(() => repository.update(deckId, next))
      .then(
        () => {
          setSaveError(null);
          setSaveState((state) => (pending.current === null ? 'saved' : state));
        },
        (error: unknown) => {
          // Nothing newer is waiting: keep this content so "Yritä tallentaa uudelleen" can resend it.
          if (pending.current === null) pending.current = next;
          setSaveError(errorKind(error));
          setSaveState('error');
        },
      );
  }, [repository, deckId]);

  const schedule = useCallback(
    (next: DeckContent) => {
      contentRef.current = next;
      setContent(next);
      pending.current = next;
      setSaveState('dirty');
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, AUTOSAVE_DELAY_MS);
    },
    [flush],
  );

  useEffect(() => {
    let active = true;
    repository.get(deckId).then(
      (deck: Deck | null) => {
        if (!active) return;
        if (deck === null) {
          setPhase('not-found');
          return;
        }
        const loaded = { name: deck.name, sections: deck.sections };
        contentRef.current = loaded;
        setContent(loaded);
        setNameText(deck.name);
        setPhase('ready');
      },
      () => active && setPhase('unavailable'),
    );
    return () => {
      active = false;
    };
  }, [repository, deckId]);

  // The result view is remembered like the catalog view (T-045); a choice made before loading wins.
  useEffect(() => {
    void repositories.preferences.loadDeckPickView().then((saved) => {
      if (!pickViewChosen.current) setPickView(saved);
    });
  }, [repositories]);

  // The "same Legend" message goes away by itself after 4 s (T-045).
  useEffect(() => {
    if (toast === null) return;
    const id = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (phase !== 'loading') headingRef.current?.focus();
  }, [phase]);

  // Leaving the editor or closing the tab must not lose the last edit. The update runs its write
  // synchronously when called directly, so that also works inside pagehide.
  useEffect(() => {
    const saveNow = (afterRunningSave: boolean) => {
      const next = pending.current;
      if (next === null) return;
      pending.current = null;
      // On unmount, wait for a save already in flight so the older content cannot land last.
      const write = () => repository.update(deckId, next);
      void (afterRunningSave ? chain.current.then(write) : write()).catch(() => undefined);
    };
    const onPageHide = () => saveNow(false);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      clearTimeout(timer.current);
      saveNow(true);
    };
  }, [repository, deckId]);

  const issues = useMemo(() => validateDeck(content, cardsByKey), [content, cardsByKey]);
  const totals = useMemo(() => deckTotals(content, cardsByKey), [content, cardsByKey]);
  const limits = useMemo(() => ramLimits(content, cardsByKey), [content, cardsByKey]);
  const counts = useMemo(() => deckCounts(content), [content]);
  const curve = useMemo(() => costCurve(content, cardsByKey), [content, cardsByKey]);
  const grouped = useMemo(() => groupDeck(content, cardsByKey), [content, cardsByKey]);

  const collectionReady = collection.phase === 'ready';
  const missingCopies = useMemo(() => {
    let missing = 0;
    for (const [key, count] of counts) {
      if (cardsByKey.has(key)) missing += Math.max(0, count - countIn(collection, key));
    }
    return missing;
  }, [counts, cardsByKey, collection]);

  const setCount = (card: Card, count: number) => {
    const base = contentRef.current;
    if (count > (deckCounts(base).get(card.key) ?? 0) && hasSameNameLegend(card, base, cardsByKey)) {
      setToast(deckTexts.sameLegend(card.name));
      return;
    }
    const isNew = !deckCounts(base).has(card.key);
    if (isNew && count > 0 && distinctRows(base) >= MAX_DECK_DISTINCT_CARDS) {
      setNotice(deckTexts.distinctLimit);
      return;
    }
    setNotice(null);
    schedule(withDeckCount(base, card.key, count));
  };

  const handleName = (text: string) => {
    setNameText(text);
    const result = checkDeckName(text);
    if (!result.ok) {
      setNameError(result.error === 'empty' ? deckTexts.nameEmpty : deckTexts.nameTooLong);
      return;
    }
    setNameError(null);
    if (result.name !== contentRef.current.name) schedule({ ...contentRef.current, name: result.name });
  };

  const handlePickView = (next: DeckPickView) => {
    pickViewChosen.current = true;
    setPickView(next);
    repositories.preferences.saveDeckPickView(next).catch(() => undefined);
  };

  const handleRetry = () => {
    if (pending.current === null) pending.current = contentRef.current;
    flush();
  };

  const filtered = useMemo(() => filterCards(cards, criteria), [cards, criteria]);
  const legendsCount = totals.legends;

  if (phase !== 'ready') {
    return (
      <>
        <h1 ref={headingRef} tabIndex={-1}>
          {phase === 'loading' ? deckTexts.editorLoading : deckTexts.listHeading}
        </h1>
        {phase !== 'loading' && (
          <div className="notice notice-danger" role="alert">
            <p>{phase === 'not-found' ? deckTexts.editorNotFound : deckTexts.listUnavailable}</p>
          </div>
        )}
        <p className="editor-back">
          <button type="button" className="button-secondary" onClick={onBack}>
            {deckTexts.backToList}
          </button>
        </p>
      </>
    );
  }

  const renderChip = (card: Card) => {
    if (card.cost !== null) {
      return (
        <span className="deck-line-chip" title={deckTexts.costChip(card.cost)}>
          <span aria-hidden="true">{card.cost}</span>
          <span className="visually-hidden">{deckTexts.costChip(card.cost)}</span>
        </span>
      );
    }
    if (card.ram !== null) return <span className="deck-line-chip is-ram">{deckTexts.ramChip(card.ram)}</span>;
    return null;
  };

  const renderDeckRow = (row: DeckRow) => {
    const have = collectionReady ? countIn(collection, row.card.key) : null;
    const missingCount = have !== null ? Math.max(0, row.count - have) : 0;
    return (
      <li
        key={row.card.key}
        className={`deck-line ${typeColorClass(row.card.color)}` + (missingCount > 0 ? ' is-missing' : '')}
      >
        <span className="deck-line-count" aria-hidden="true">
          {row.count}×
        </span>
        <button
          type="button"
          className="deck-line-name"
          aria-haspopup="dialog"
          aria-label={`${texts.enlargeImage}${row.card.displayName}`}
          title={cardMeta(row.card)}
          onClick={() => setZoomCard(row.card)}
        >
          <CardName card={row.card} muteSubname />
        </button>
        {have !== null && <span className="visually-hidden">{deckTexts.owned(have, row.count)}</span>}
        {missingCount > 0 && <span className="deck-line-missing">{deckTexts.missingCount(missingCount)}</span>}
        {renderChip(row.card)}
        <Stepper
          name={row.card.displayName}
          count={row.count}
          showCount={false}
          onChange={(count) => setCount(row.card, count)}
        />
      </li>
    );
  };

  return (
    <>
      <div className="editor-head">
        <div className="editor-title">
          <p className="editor-back">
            <button type="button" className="button-secondary" onClick={onBack}>
              {deckTexts.backToList}
            </button>
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            {content.name}
          </h1>
        </div>
        <div className="editor-meta">
          <div className="deck-name-field">
            <label htmlFor="deck-name">{deckTexts.nameLabel}</label>
            <input
              id="deck-name"
              type="text"
              value={nameText}
              aria-invalid={nameError !== null ? 'true' : undefined}
              aria-describedby={nameError !== null ? 'deck-name-error' : 'deck-name-hint'}
              onChange={(event) => handleName(event.target.value)}
            />
            <p id="deck-name-hint" className="hint">
              {deckTexts.nameHint}
            </p>
            {nameError !== null && (
              <p id="deck-name-error" className="field-error">
                {nameError}
              </p>
            )}
          </div>
          <div className="row-actions">
            <ExportButtons deck={content} cardsByKey={cardsByKey} />
          </div>
        </div>
      </div>

      {saveState === 'error' ? (
        <div className="notice notice-danger" role="alert">
          <p>{deckTexts.saveFailed(saveError ?? 'unknown')}</p>
          <button type="button" className="button-secondary" onClick={handleRetry}>
            {deckTexts.saveRetry}
          </button>
        </div>
      ) : (
        <p className="save-status" role="status">
          {saveState === 'saved' ? deckTexts.saveSaved : saveState === 'saving' ? deckTexts.saveSaving : deckTexts.saveDirty}
        </p>
      )}

      <div className="editor-layout">
        <section className="editor-search" aria-labelledby="search-heading">
          <h2 id="search-heading">{deckTexts.searchHeading}</h2>
          <CardFilters
            criteria={criteria}
            typeOptions={filterOptions(KNOWN_CARD_TYPES, cards.map((card) => card.type), criteria.types)}
            colorOptions={filterOptions(KNOWN_CARD_COLORS, cards.map((card) => card.color), criteria.colors)}
            rarityOptions={filterOptions(KNOWN_CARD_RARITIES, cards.map((card) => card.rarity), criteria.rarities)}
            searchInputRef={searchInputRef}
            collectionAllRef={collectionAllRef}
            onCollectionFilterChange={() => undefined}
            onQueryChange={(query) => setCriteria({ ...criteria, query })}
            onToggleType={(type) => setCriteria({ ...criteria, types: toggleValue(criteria.types, type) })}
            onToggleColor={(color) => setCriteria({ ...criteria, colors: toggleValue(criteria.colors, color) })}
            onToggleRarity={(rarity) =>
              setCriteria({ ...criteria, rarities: toggleValue(criteria.rarities, rarity) })
            }
            onSearchSubmit={() => undefined}
          />
          <div className="pick-bar">
            <fieldset className="view-select pick-view">
              <legend>{deckTexts.pickViewLegend}</legend>
              <div className="options">
                {(
                  [
                    ['list', deckTexts.pickViewList],
                    ['images', deckTexts.pickViewImages],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="option">
                    <input
                      type="radio"
                      name="deck-pick-view"
                      value={value}
                      checked={pickView === value}
                      onChange={() => handlePickView(value)}
                    />{' '}
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="status-line" role="status">
              {deckTexts.searchResults(filtered.length, cards.length)}
            </p>
          </div>
          <div role="status" className="toast-slot">
            {toast !== null && (
              <p className="toast">
                <span>{toast}</span>
                <button type="button" className="button-secondary" onClick={() => setToast(null)}>
                  {deckTexts.toastClose}
                </button>
              </p>
            )}
          </div>
          {filtered.length === 0 ? (
            <p className="empty">{deckTexts.noSearchResults}</p>
          ) : pickView === 'images' ? (
            <ul className="search-results pick-images" aria-label={deckTexts.searchHeading}>
              {filtered.map((card) => {
                const blocker = addBlocker(card, content, cardsByKey);
                const hintId = `blocker-image-${card.key}`;
                const count = counts.get(card.key) ?? 0;
                const reason =
                  blocker === null ? null : hasSameNameLegend(card, content, cardsByKey) ? blocker : deckTexts.dimmedHint(blocker);
                return (
                  <DeckPickImage
                    key={card.key}
                    card={card}
                    dimmed={blocker !== null}
                    title={reason ?? undefined}
                    badge={count > 0 ? deckTexts.inDeckBadge(count) : null}
                    hint={
                      reason !== null && (
                        <span id={hintId} className="visually-hidden">
                          {reason}
                        </span>
                      )
                    }
                    onAdd={() => setCount(card, count + 1)}
                  >
                    <Stepper
                      name={card.displayName}
                      count={count}
                      onChange={(next) => setCount(card, next)}
                      describedBy={blocker !== null ? hintId : undefined}
                    />
                  </DeckPickImage>
                );
              })}
            </ul>
          ) : (
            <ul className="search-results" aria-label={deckTexts.searchHeading}>
              {filtered.map((card) => {
                const blocker = addBlocker(card, content, cardsByKey);
                const hintId = `blocker-${card.key}`;
                return (
                  <li key={card.key} className={'card-row' + (blocker !== null ? ' is-dimmed' : '')}>
                    <span className="card-row-name">
                      <span>
                        <CardName card={card} />
                      </span>
                      <span className="card-row-meta">{cardMeta(card)}</span>
                      {blocker !== null && (
                        <span id={hintId} className="card-row-meta">
                          {hasSameNameLegend(card, content, cardsByKey) ? blocker : deckTexts.dimmedHint(blocker)}
                        </span>
                      )}
                    </span>
                    <Stepper
                      name={card.displayName}
                      count={counts.get(card.key) ?? 0}
                      onChange={(count) => setCount(card, count)}
                      describedBy={blocker !== null ? hintId : undefined}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="editor-side">
          <section className="deck-summary" aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="visually-hidden">
              {deckTexts.summaryHeading}
            </h2>
            <div className="summary-counts">
              <p className="summary-main">{deckTexts.counts(totals.legends, totals.main)}</p>
              <p>
                {collectionReady
                  ? deckTexts.missingFromCollection(missingCopies)
                  : collection.phase === 'loading'
                    ? ''
                    : deckTexts.collectionNotReady}
              </p>
              <p>
                {limits.size === 0
                  ? deckTexts.ramLimitsNone
                  : `${deckTexts.ramLimitsLabel}: ${[...limits].map(([color, limit]) => deckTexts.ramLimit(color, limit)).join(' · ')}`}
              </p>
            </div>
            <div aria-live="polite" aria-atomic="true">
              {issues.length === 0 ? (
                <p className="summary-ok">{deckTexts.allGood}</p>
              ) : (
                <>
                  <h3 className="visually-hidden">{deckTexts.issuesHeading}</h3>
                  <ul className="issue-list">
                    {issues.map((issue) => (
                      <li key={issue.type + issue.cards.join(',')} className={issue.severity === 'warning' ? 'is-warning' : undefined}>
                        {issue.severity === 'warning' ? deckTexts.warningPrefix : ''}
                        {issue.message}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <CostCurve curve={curve} />
            <p className="hint">{deckTexts.rulesNote}</p>
            {notice !== null && (
              <p className="field-error" role="alert">
                {notice}
              </p>
            )}
          </section>

          <section className="editor-deck" aria-labelledby="deck-heading">
            <h2 id="deck-heading" className="visually-hidden">
              {deckTexts.sectionLabel(content.name)}
            </h2>
            <div className="deck-section">
              <h2>
                {deckTexts.legendsHeading} ({legendsCount}/{LEGEND_COUNT})
              </h2>
              {grouped.legends.length === 0 ? (
                <p className="hint">{deckTexts.legendsEmpty}</p>
              ) : (
                <ul className="deck-cards">{grouped.legends.map(renderDeckRow)}</ul>
              )}
            </div>
            <div className="deck-section">
              <h2>
                {deckTexts.mainHeading} ({totals.main})
              </h2>
              {grouped.groups.length === 0 && grouped.unknown.length === 0 && (
                <p className="hint">{deckTexts.deckEmpty}</p>
              )}
              {grouped.groups.map((group) => (
                <div key={group.type}>
                  <h3 className="deck-group-title" lang="en">
                    {group.type} ({group.rows.reduce((sum, row) => sum + row.count, 0)})
                  </h3>
                  <ul className="deck-cards">{group.rows.map(renderDeckRow)}</ul>
                </div>
              ))}
              {grouped.unknown.length > 0 && (
                <div>
                  <h3 className="deck-group-title">{deckTexts.unknownHeading}</h3>
                  <ul className="deck-cards">
                    {grouped.unknown.map(({ key, count }) => (
                      <li key={key} className="deck-line">
                        <span className="deck-line-name">{key}</span>
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => schedule(withDeckCount(contentRef.current, key, 0))}
                        >
                          {deckTexts.removeUnknown(key, count)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      <CardImageDialog card={zoomCard} onClose={() => setZoomCard(null)} />
    </>
  );
}
