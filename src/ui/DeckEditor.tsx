import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Card } from '../domain/card';
import type { Deck, DeckContent } from '../domain/deck';
import { MAX_DECK_DISTINCT_CARDS } from '../domain/deck';
import { checkDeckName, distinctRows, withDeckCount } from '../domain/deckEdit';
import {
  MAX_MAIN_DECK,
  MIN_MAIN_DECK,
  addBlocker,
  colorDistribution,
  costCurve,
  deckCounts,
  deckTotals,
  groupDeck,
  hasSameNameLegend,
  ramLimits,
  toCardsByKey,
  validateDeck,
  deckCounts as countsOfDeck,
  deckTotals as totalsOfDeck,
  LEGEND_COUNT as LEGEND_LIMIT,
  MAX_COPIES as COPY_LIMIT,
} from '../domain/deckRules';
import {
  EMPTY_CRITERIA,
  KNOWN_CARD_COLORS,
  KNOWN_CARD_RARITIES,
  KNOWN_CARD_TYPES,
  filterCards,
  filterOptions,
  isFilterActive,
  numberFilterOptionsFor,
  toggleValue,
} from '../domain/cardSearch';
import type { CardFilterCriteria } from '../domain/cardSearch';
import { StorageError } from '../storage';
import type { DeckPickView, Repositories, StorageErrorKind } from '../storage';
import { ActiveFilters, criteriaFilters } from './ActiveFilters';
import { CardFilters } from './CardFilters';
import { useCardHoverPreview } from './CardHoverPreview';
import { CardImageDialog } from './CardImageDialog';
import { cardNameText } from './CardName';
import { DeckPickImage } from './DeckPickImage';
import { DeckList } from './DeckList';
import type { DeckView } from './DeckList';
import { DeckPickTable } from './DeckPickTable';
import { DeckStats } from './DeckStats';
import type { MissingCard } from '../domain/deckExport';
import type { PickBlocker } from './DeckPickTable';
import { countIn } from './collectionStore';
import { deckTexts } from './deckTexts';
import { ExportButtons } from './ExportButtons';
import { ImageSizeSelect } from './ListToolbar';
import type { ImageSize } from './ListToolbar';
import { Stepper } from './Stepper';
import { texts } from './texts';
import { useCollection } from './useCollection';
import { trackDeckSave } from './useDecks';
import { EDITOR_WIDE_QUERY, FINE_POINTER_QUERY, useMediaQuery } from './useMediaQuery';

/** A change is saved this long after the last edit (T-013). */
export const AUTOSAVE_DELAY_MS = 500;

/** A count change is announced this long after the last one, so fast repeats are told once (T-050b). */
export const CHANGE_ANNOUNCE_MS = 400;

/** The "same Legend" message stays this long (T-045). */
export const TOAST_MS = 4000;

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';
type SaveErrorKind = StorageErrorKind | 'unknown';

const errorKind = (error: unknown): SaveErrorKind => (error instanceof StorageError ? error.kind : 'unknown');

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
  const [imageSize, setImageSize] = useState<ImageSize>('medium');
  const [changeText, setChangeText] = useState('');
  const changeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clickAdds = useMediaQuery(FINE_POINTER_QUERY, true);
  const preview = useCardHoverPreview();
  const [deckView, setDeckView] = useState<DeckView>('list');
  const [deckInView, setDeckInView] = useState(false);
  const sideRef = useRef<HTMLElement>(null);
  const deckHeadingRef = useRef<HTMLHeadingElement>(null);
  const issuesHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => clearTimeout(changeTimer.current), []);

  // Autosave: the newest unsaved content waits in `pending`; saves run one after another.
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [saveError, setSaveError] = useState<SaveErrorKind | null>(null);
  const saveStateRef = useRef<SaveState>('saved');
  useEffect(() => {
    saveStateRef.current = saveState;
  }, [saveState]);
  const pending = useRef<DeckContent | null>(null);
  /** The updatedAt we last loaded or saved: a different stored value means another tab or a sync changed the deck. */
  const knownUpdatedAt = useRef<string | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const chain = useRef<Promise<unknown>>(Promise.resolve());

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const next = pending.current;
    if (next === null) return;
    pending.current = null;
    setSaveState('saving');
    chain.current = chain.current
      .then(() => repository.update(deckId, next, { expectedUpdatedAt: knownUpdatedAt.current }))
      .then(
        (saved) => {
          knownUpdatedAt.current = saved.updatedAt;
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
        knownUpdatedAt.current = deck.updatedAt;
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

  // Another tab or a sync changed the stored decks: without unsaved changes of our own the editor shows the
  // newest version; with them, the conflict shows when saving (T-054d).
  useEffect(() => {
    if (phase !== 'ready') return;
    let active = true;
    const unsubscribe = repository.subscribe(() => {
      if (pending.current !== null || saveStateRef.current !== 'saved') return;
      void repository.get(deckId).then((deck) => {
        if (!active || pending.current !== null || saveStateRef.current !== 'saved') return;
        if (deck === null) {
          setPhase('not-found');
        } else if (deck.updatedAt !== knownUpdatedAt.current) {
          knownUpdatedAt.current = deck.updatedAt;
          const latest = { name: deck.name, sections: deck.sections };
          contentRef.current = latest;
          setContent(latest);
          setNameText(deck.name);
          setChangeText(deckTexts.reloadedLatest);
        }
      }, () => undefined);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [phase, repository, deckId]);

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
      // The deck list reads after leaving: it waits for the saves still running (B-017).
      if (next === null) {
        if (afterRunningSave) trackDeckSave(chain.current);
        return;
      }
      pending.current = null;
      // On unmount, wait for a save already in flight so the older content cannot land last.
      const write = () => repository.update(deckId, next);
      const save = afterRunningSave ? chain.current.then(write) : write();
      if (afterRunningSave) trackDeckSave(save);
      void save.catch(() => undefined);
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
  const missingCards = useMemo(() => {
    const rows: MissingCard[] = [];
    for (const [key, count] of counts) {
      const card = cardsByKey.get(key);
      const missing = count - countIn(collection, key);
      if (card !== undefined && missing > 0) rows.push({ card, missing });
    }
    return rows;
  }, [counts, cardsByKey, collection]);
  const missingCopies = missingCards.reduce((sum, row) => sum + row.missing, 0);

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
    const next = withDeckCount(base, card.key, count);
    schedule(next);
    clearTimeout(changeTimer.current);
    changeTimer.current = setTimeout(() => {
      const nextTotals = deckTotals(next, cardsByKey);
      const copies = deckCounts(next).get(card.key) ?? 0;
      const name = cardNameText(card);
      setChangeText(
        card.type === 'Legend'
          ? deckTexts.changeAnnounceLegend(name, copies, nextTotals.legends)
          : deckTexts.changeAnnounce(name, copies, nextTotals.main),
      );
    }, CHANGE_ANNOUNCE_MS);
  };

  const openImage = (card: Card) => {
    preview.hide();
    setZoomCard(card);
  };

  /**
   * The short mark tells a same-name Legend (refused) from a broken limit (allowed, T-045). The reason
   * always matches the mark: a same-name Legend wins over the Legend count (UX-045).
   */
  const blockerOf = (card: Card): PickBlocker | null => {
    if (hasSameNameLegend(card, content, cardsByKey)) {
      return { reason: deckTexts.sameLegendReason(card.name), short: deckTexts.blockedLegend };
    }
    const blocker = addBlocker(card, content, cardsByKey);
    if (blocker === null) return null;
    // T-057: mark only when the deck is already over a limit, not when the next copy would be.
    const count = countsOfDeck(content).get(card.key) ?? 0;
    const over =
      card.type === 'Legend'
        ? count > 0 && totalsOfDeck(content, cardsByKey).legends > LEGEND_LIMIT
        : count > COPY_LIMIT || (count > 0 && blocker.startsWith('RAM'));
    if (!over) return null;
    return { reason: deckTexts.dimmedHint(blocker), short: deckTexts.blockedLimit };
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

  // Conflict answers: take the stored deck and drop our unsaved changes, or save ours over it.
  const handleLoadLatest = () => {
    clearTimeout(timer.current);
    pending.current = null;
    void repository.get(deckId).then((deck) => {
      if (deck === null) {
        setPhase('not-found');
        return;
      }
      knownUpdatedAt.current = deck.updatedAt;
      const latest = { name: deck.name, sections: deck.sections };
      contentRef.current = latest;
      setContent(latest);
      setNameText(deck.name);
      setSaveError(null);
      setSaveState('saved');
      setChangeText(deckTexts.reloadedLatest);
    });
  };

  const handleKeepMine = () => {
    void repository.get(deckId).then((deck) => {
      if (deck === null) {
        setSaveError('not-found');
        return;
      }
      knownUpdatedAt.current = deck.updatedAt;
      handleRetry();
    });
  };

  const handleRetry = () => {
    if (pending.current === null) pending.current = contentRef.current;
    flush();
  };

  const filtered = useMemo(() => filterCards(cards, criteria), [cards, criteria]);
  const colors = useMemo(() => colorDistribution(content, cardsByKey), [content, cardsByKey]);
  const legendsCount = totals.legends;

  // Below 64rem the bottom bar is hidden while the deck column is on screen (T-050c).
  useEffect(() => {
    const side = sideRef.current;
    if (side === null || typeof IntersectionObserver !== 'function') return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry !== undefined) setDeckInView(entry.isIntersecting);
    });
    observer.observe(side);
    return () => observer.disconnect();
  }, [phase]);

  const mainState = totals.main < MIN_MAIN_DECK ? 'under' : totals.main > MAX_MAIN_DECK ? 'over' : 'ok';
  const legalityMark =
    issues.length === 0 ? (
      <span className="legality is-legal">
        <span aria-hidden="true">✓</span>
        {deckTexts.legalShort}
      </span>
    ) : (
      <span className="legality is-issues">
        <span aria-hidden="true">⚠</span>
        {deckTexts.issuesCount(issues.length)}
      </span>
    );

  const showDeck = () => {
    sideRef.current?.scrollIntoView?.({ block: 'start' });
    deckHeadingRef.current?.focus({ preventScroll: true });
  };

  const showIssues = () => {
    issuesHeadingRef.current?.scrollIntoView?.({ block: 'nearest' });
    issuesHeadingRef.current?.focus({ preventScroll: true });
  };

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
        <p className="editor-crumb">
          <button type="button" className="link-button" onClick={onBack}>
            <span aria-hidden="true">← </span>
            {deckTexts.backToList}
          </button>
        </p>
      </>
    );
  }

  return (
    <>
      {/* One compact header row (T-050): back link, the name as an editable title, save badge, export. */}
      <div className="editor-head">
        <p className="editor-crumb">
          <button type="button" className="link-button" onClick={onBack}>
            <span aria-hidden="true">← </span>
            {deckTexts.backToList}
          </button>
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="editor-name visually-hidden">
          {content.name}
        </h1>
        <div className="editor-titlebar">
          <div className="deck-name-field editor-name-field">
            <label htmlFor="deck-name" className="visually-hidden">
              {deckTexts.nameLabel}
            </label>
            <input
              id="deck-name"
              type="text"
              value={nameText}
              aria-invalid={nameError !== null ? 'true' : undefined}
              aria-describedby={nameError !== null ? 'deck-name-error' : 'deck-name-hint'}
              onChange={(event) => handleName(event.target.value)}
            />
            <p id="deck-name-hint" className="visually-hidden">
              {deckTexts.nameHint}
            </p>
            {nameError !== null && (
              <p id="deck-name-error" className="field-error">
                {nameError}
              </p>
            )}
          </div>
          <div className="editor-tools">
            {saveState !== 'error' && (
              // Only "Tallennettu" is spoken (T-050b): the in-between states are shown but would talk over the change message.
              <p className={`save-status save-badge${saveState === 'saved' ? ' is-saved' : ''}`}>
                <span role="status">{saveState === 'saved' ? deckTexts.saveSaved : ''}</span>
                {saveState !== 'saved' && (
                  <span aria-hidden="true">{saveState === 'saving' ? deckTexts.saveSaving : deckTexts.saveDirty}</span>
                )}
              </p>
            )}
            <div className="row-actions">
              <ExportButtons deck={content} cardsByKey={cardsByKey} />
            </div>
          </div>
        </div>
      </div>

      {saveState === 'error' && saveError === 'conflict' && (
        <div className="notice notice-danger" role="alert">
          <p>{deckTexts.conflictMessage}</p>
          <div className="row-actions">
            <button type="button" className="button-secondary" onClick={handleLoadLatest}>
              {deckTexts.conflictLoadLatest}
            </button>
            <button type="button" className="button-secondary" onClick={handleKeepMine}>
              {deckTexts.conflictKeepMine}
            </button>
          </div>
        </div>
      )}
      {saveState === 'error' && saveError !== 'conflict' && (
        <div className="notice notice-danger" role="alert">
          <p>{deckTexts.saveFailed(saveError ?? 'unknown')}</p>
          <button type="button" className="button-secondary" onClick={handleRetry}>
            {deckTexts.saveRetry}
          </button>
        </div>
      )}

      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {changeText}
      </p>

      <div className="editor-layout">
        <section className="editor-filters" aria-labelledby="filters-heading">
          <h2 id="filters-heading" className="filters-heading">
            {texts.filtersHeading}
          </h2>
          <CardFilters
            criteria={criteria}
            typeOptions={filterOptions(KNOWN_CARD_TYPES, cards.map((card) => card.type), criteria.types)}
            colorOptions={filterOptions(KNOWN_CARD_COLORS, cards.map((card) => card.color), criteria.colors)}
            rarityOptions={filterOptions(KNOWN_CARD_RARITIES, cards.map((card) => card.rarity), criteria.rarities)}
            numberOptions={numberFilterOptionsFor(cards, criteria)}
            searchInputRef={searchInputRef}
            collectionAllRef={collectionAllRef}
            onCollectionFilterChange={() => undefined}
            onQueryChange={(query) => setCriteria({ ...criteria, query })}
            onToggleType={(type) => setCriteria({ ...criteria, types: toggleValue(criteria.types, type) })}
            onToggleColor={(color) => setCriteria({ ...criteria, colors: toggleValue(criteria.colors, color) })}
            onToggleRarity={(rarity) =>
              setCriteria({ ...criteria, rarities: toggleValue(criteria.rarities, rarity) })
            }
            onToggleNumber={(group, value) => setCriteria({ ...criteria, [group]: toggleValue(criteria[group], value) })}
            onSearchSubmit={() => undefined}
            collapsibleBelow={EDITOR_WIDE_QUERY}
          />
        </section>

        <section className="editor-search" aria-labelledby="search-heading" data-image-size={imageSize}>
          <h2 id="search-heading">{deckTexts.searchHeading}</h2>
          <div className="pick-bar">
            <p className="status-line" role="status">
              {deckTexts.searchResults(filtered.length, cards.length)}
            </p>
            {/* Skip past the results to the deck, shown when focused (UX-044). */}
            <button type="button" className="link-button focus-reveal" onClick={showDeck}>
              {deckTexts.goToDeck}
            </button>
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
            {pickView === 'images' && <ImageSizeSelect name="deck-image-size" value={imageSize} onChange={setImageSize} />}
          </div>
          <ActiveFilters
            filters={criteriaFilters(criteria, setCriteria)}
            showClear={isFilterActive(criteria)}
            onClear={() => {
              setCriteria(EMPTY_CRITERIA);
              searchInputRef.current?.focus();
            }}
            searchInputRef={searchInputRef}
          />
          <p className="hint pick-hint">{deckTexts.pickHint}</p>
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
            <div className="pick-scroll">
              <ul className="pick-images" aria-label={deckTexts.searchHeading}>
                {filtered.map((card) => {
                  const blocker = blockerOf(card);
                  const hintId = `blocker-image-${card.key}`;
                  const count = counts.get(card.key) ?? 0;
                  return (
                    <DeckPickImage
                      key={card.key}
                      card={card}
                      count={count}
                      onChange={(next) => setCount(card, next)}
                      dimmed={blocker !== null}
                      title={blocker?.reason}
                      badge={count > 0 ? deckTexts.inDeckBadge(count) : null}
                      hoverProps={imageSize === 'small' ? preview.bind(card) : undefined}
                      hint={
                        blocker !== null && (
                          <span id={hintId} className="visually-hidden">
                            {blocker.reason}
                          </span>
                        )
                      }
                    >
                      <Stepper
                        name={card.displayName}
                        count={count}
                        onChange={(next) => setCount(card, next)}
                        describedBy={blocker !== null ? hintId : undefined}
                        shortcuts
                      />
                    </DeckPickImage>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="pick-scroll">
              <DeckPickTable
                cards={filtered}
                countOf={(card) => counts.get(card.key) ?? 0}
                blockerOf={blockerOf}
                onChange={setCount}
                onOpenImage={openImage}
                clickAdds={clickAdds}
                hoverProps={preview.bind}
              />
            </div>
          )}
        </section>

        <div className="deck-bar" hidden={deckInView}>
          <p className="deck-bar-text">
            <span className="deck-bar-part">{deckTexts.mobileBarMain(totals.main)}</span>
            <span aria-hidden="true">·</span>
            <span className="deck-bar-part">{deckTexts.legendsProgress(legendsCount)}</span> {legalityMark}
          </p>
          <button type="button" className="button-primary deck-bar-button" onClick={showDeck}>
            {deckTexts.showDeck}
          </button>
        </div>

        <section className="editor-side" aria-labelledby="deck-heading" ref={sideRef}>
          <div className="deck-head">
            <h2 id="deck-heading" className="visually-hidden" ref={deckHeadingRef} tabIndex={-1}>
              {deckTexts.sectionLabel(content.name)}
            </h2>
            <div className="deck-head-row">
              <p className="deck-head-main">{deckTexts.mainProgress(totals.main)}</p>
              {issues.length === 0 ? (
                legalityMark
              ) : (
                <button type="button" className="legality is-issues" onClick={showIssues}>
                  <span aria-hidden="true">⚠</span>
                  {deckTexts.issuesCount(issues.length)}
                </button>
              )}
            </div>
            <progress
              className={`deck-progress is-${mainState}`}
              max={MAX_MAIN_DECK}
              value={Math.min(totals.main, MAX_MAIN_DECK)}
              aria-label={deckTexts.mainProgress(totals.main)}
            />
            <p className="deck-head-sub">{deckTexts.legendsProgress(legendsCount)}</p>
            <p className="deck-back">
              <button type="button" className="link-button" onClick={() => searchInputRef.current?.focus()}>
                <span aria-hidden="true">← </span>
                {deckTexts.backToSearch}
              </button>
            </p>
          </div>

          <div aria-live="polite" aria-atomic="true">
            {issues.length === 0 ? (
              <p className="visually-hidden">{deckTexts.allGood}</p>
            ) : (
              <div className="deck-issues">
                <h3 ref={issuesHeadingRef} tabIndex={-1} className="deck-issues-title">
                  {deckTexts.issuesHeading}
                </h3>
                <ul className="issue-list">
                  {issues.map((issue) => (
                    <li key={issue.type + issue.cards.join(',')} className={issue.severity === 'warning' ? 'is-warning' : undefined}>
                      {issue.severity === 'warning' ? deckTexts.warningPrefix : ''}
                      {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {notice !== null && (
            <p className="field-error" role="alert">
              {notice}
            </p>
          )}

          <DeckList
            grouped={grouped}
            view={deckView}
            onViewChange={setDeckView}
            mainCount={totals.main}
            legendsCount={legendsCount}
            ownedOf={(card) => (collectionReady ? countIn(collection, card.key) : null)}
            onChange={setCount}
            onOpenImage={openImage}
            hoverProps={preview.bind}
          />
          {grouped.unknown.length > 0 && (
            <div className="deck-section">
              <h3 className="deck-group-title">{deckTexts.unknownHeading}</h3>
              <ul className="deck-tiles">
                {grouped.unknown.map(({ key, count }) => (
                  <li key={key} className="deck-unknown">
                    <span className="deck-unknown-key">{key}</span>
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

          <DeckStats
            deck={content}
            cardsByKey={cardsByKey}
            curve={curve}
            colors={colors}
            groups={grouped.groups}
            mainCount={totals.main}
            ramLimitsText={
              limits.size === 0
                ? deckTexts.ramLimitsNone
                : `${deckTexts.ramLimitsLabel}: ${[...limits].map(([color, limit]) => deckTexts.ramLimit(color, limit)).join(' · ')}`
            }
            missingCards={collectionReady ? missingCards : undefined}
            missingText={
              collectionReady
                ? deckTexts.missingFromCollection(missingCopies)
                : collection.phase === 'loading'
                  ? ''
                  : deckTexts.collectionNotReady
            }
          />
        </section>
      </div>
      <CardImageDialog card={zoomCard} onClose={() => setZoomCard(null)} />
      {preview.preview}
    </>
  );
}
