import { useEffect, useMemo, useRef, useState } from 'react';
import { playsetSize } from '../domain/card';
import type { Card } from '../domain/card';
import type { CardKey } from '../domain/cardKey';
import { countOf } from '../domain/collection';
import { StorageError, isStoragePersisted, requestPersistentStorage } from '../storage';
import type { CatalogViewMode, Repositories } from '../storage';
import {
  EMPTY_CRITERIA,
  KNOWN_CARD_COLORS,
  KNOWN_CARD_RARITIES,
  KNOWN_CARD_TYPES,
  filterCards,
  filterOptions,
  numberFilterOptionsFor,
  isFilterActive,
  toggleValue,
} from '../domain/cardSearch';
import type { CardFilterCriteria } from '../domain/cardSearch';
import { CardFilters } from './CardFilters';
import type { CollectionFilter } from './CardFilters';
import { CardImageDialog } from './CardImageDialog';
import { CardList } from './CardList';
import { SortSelect } from './SortSelect';
import { DEFAULT_SORT, sortCards } from '../domain/cardSort';
import type { CardSort } from '../domain/cardSort';
import { CardTable } from './CardTable';
import { ListToolbar } from './ListToolbar';
import type { ImageSize } from './ListToolbar';
import { ActiveFilters, criteriaFilters } from './ActiveFilters';
import { useCardHoverPreview } from './CardHoverPreview';
import type { ActiveFilter } from './ActiveFilters';
import { WIDE_QUERY } from './useMediaQuery';
import type { OwnedColumn } from './CardList';
import { CollectionNotices, loadNotices } from './CollectionNotices';
import { countIn } from './collectionStore';
import type { CollectionSnapshot } from './collectionStore';
import { StorageReminder, persistenceResultText } from './StorageReminder';
import type { PersistenceState } from './StorageReminder';
import { cardCount, texts } from './texts';
import { useCollection } from './useCollection';
import { useDecks } from './useDecks';
import { useCollectionAnnouncements, useLoadNoticeAnnouncement } from './useCollectionAnnouncements';
import { useDelayedAnnouncement } from './useDelayedAnnouncement';
import type { Announcement } from './useDelayedAnnouncement';

/** What the live region says about a filter result (UX.md 5.6). The key identifies state + count. */
function describeResult(active: boolean, shown: number, all: number): Announcement {
  if (!active) return { key: `all:${all}`, text: texts.allShownLive(all) };
  if (shown === 0) return { key: 'none', text: texts.noResultsLive };
  return { key: `some:${shown}`, text: texts.filteredLive(shown, all) };
}

const NO_KEYS: ReadonlySet<CardKey> = new Set();
const NO_NAMES: readonly string[] = [];

/** Summary of the whole collection, counted only from cards in the loaded list (UX.md 6.5, A3). */
function collectionSummary(snapshot: CollectionSnapshot, cards: readonly Card[]): string {
  let distinct = 0;
  let total = 0;
  for (const card of cards) {
    const count = countOf(snapshot.saved, card.key);
    if (count > 0) {
      distinct += 1;
      total += count;
    }
  }
  return distinct === 0 ? texts.collectionEmpty : texts.collectionSummary(distinct, total);
}

export function CatalogView({
  cards: allCards,
  repositories,
  headerSlot = null,
}: {
  /** All cards, bundled with the app (D-013). A stable reference: it also owns the live announcements. */
  cards: readonly Card[];
  /** Created once in App (a stable reference). */
  repositories: Repositories;
  /** Header element for the persistent storage button (rendered by App). */
  headerSlot?: HTMLElement | null;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [criteria, setCriteria] = useState<CardFilterCriteria>(EMPTY_CRITERIA);
  const collectionAllRef = useRef<HTMLInputElement>(null);
  const [collectionChoice, setCollectionFilter] = useState<CollectionFilter>('all');
  /** Rows kept visible under "Vain omistetut" after their count went to 0 (UX.md 6.6, A5). */
  const [kept, setKept] = useState<ReadonlySet<CardKey>>(NO_KEYS);
  const { snapshot: collection, store: collectionStore } = useCollection(repositories.collection);
  // Which decks each card is in (T-013). Decks that cannot be read just leave the mention out.
  const { phase: decksPhase, decks } = useDecks(repositories.decks);
  const decksByCard = useMemo(() => {
    const byCard = new Map<CardKey, string[]>();
    for (const deck of decks) {
      for (const key of new Set(deck.sections.flatMap((section) => section.cards.map((row) => row.card)))) {
        byCard.set(key, [...(byCard.get(key) ?? []), deck.name]);
      }
    }
    return byCard;
  }, [decks]);
  const decksOf = decksPhase === 'ready' ? (card: Card) => decksByCard.get(card.key) ?? NO_NAMES : undefined;
  const [persistence, setPersistence] = useState<PersistenceState>('idle');
  const persistenceResultRef = useRef<HTMLParagraphElement>(null);
  /** Set by the button: the result paragraph takes focus once it is rendered. */
  const focusPersistenceResult = useRef(false);
  /** The card in the enlarged image dialog, and the thumbnail button that opened it (T-027 UX). */
  const [openCard, setOpenCard] = useState<Card | null>(null);
  const imageOpenerRef = useRef<HTMLButtonElement | null>(null);
  // Bigger image beside a table row on mouse hover (T-052); the grid already shows the images.
  const preview = useCardHoverPreview();

  // List view and the edit switch are remembered like the theme (T-040). The edit switch has no saved
  // value until the user chooses; then it starts on for an empty collection and off otherwise, decided once.
  const [view, setView] = useState<CatalogViewMode>('grid');
  // Grid image size (T-050a): session state, not saved.
  const [imageSize, setImageSize] = useState<ImageSize>('medium');
  const [sort, setSort] = useState<CardSort>(DEFAULT_SORT);
  const [editMode, setEditMode] = useState<boolean | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const userChose = useRef({ view: false, edit: false });
  useEffect(() => {
    let active = true;
    void Promise.all([repositories.preferences.loadView(), repositories.preferences.loadEditMode()]).then(
      ([savedView, savedEdit]) => {
        if (!active) return;
        if (!userChose.current.view) setView(savedView);
        if (!userChose.current.edit) setEditMode(savedEdit);
        setPreferencesLoaded(true);
      },
    );
    return () => {
      active = false;
    };
  }, [repositories]);
  if (editMode === null && preferencesLoaded && collection.phase === 'ready') {
    setEditMode(allCards.every((card) => countOf(collection.saved, card.key) === 0));
  }
  const editable = editMode === true;
  const savePreference = (save: Promise<unknown>) => {
    // No message to the user, as with the theme (T-025 A3); only the error kind.
    save.catch((error: unknown) => {
      console.warn(`Preference could not be saved (${error instanceof StorageError ? error.kind : 'unknown'})`);
    });
  };
  const handleViewChange = (next: CatalogViewMode) => {
    userChose.current.view = true;
    setView(next);
    savePreference(repositories.preferences.saveView(next));
  };
  const handleEditChange = (next: boolean) => {
    userChose.current.edit = true;
    setEditMode(next);
    savePreference(repositories.preferences.saveEditMode(next));
  };

  // The filter exists only while counts can be changed; a locked collection turns it off (UX.md 6.6).
  if (collectionChoice !== 'all' && (collection.phase === 'locked' || collection.phase === 'unavailable')) {
    setCollectionFilter('all');
  }
  const collectionFilter: CollectionFilter = collection.phase === 'ready' ? collectionChoice : 'all';
  const ownedOnly = collectionFilter === 'owned';
  const visibleCards = (next: CardFilterCriteria, nextFilter: CollectionFilter, nextKept: ReadonlySet<CardKey>) => {
    const matching = filterCards(allCards, next);
    if (nextFilter === 'all') return matching;
    return matching.filter((card) => {
      if (nextKept.has(card.key)) return true;
      const count = countIn(collection, card.key);
      return nextFilter === 'owned' ? count > 0 : count < playsetSize(card);
    });
  };
  const isActive = (next: CardFilterCriteria, nextFilter: CollectionFilter) =>
    isFilterActive(next) || nextFilter !== 'all';

  const filtered = visibleCards(criteria, collectionFilter, kept);
  // T-060: the grid follows the shared order; the table sorts the same way itself (header buttons).
  const sortedForGrid = view === 'grid' ? sortCards(filtered, sort.key, sort.direction) : filtered;
  const filterActive = isActive(criteria, collectionFilter);

  // The cards are there from the first render, so the live region starts with the loaded message.
  // It already tells the unfiltered result, so that result is not announced again right away.
  const allShown = describeResult(false, allCards.length, allCards.length);
  const announcer = useDelayedAnnouncement(allCards, allShown.key);
  const collectionAnnouncer = useCollectionAnnouncements(announcer, collectionStore, allCards, collection.saveError);
  const collectionNotices = loadNotices(collection, repositories.persistent);
  useLoadNoticeAnnouncement(
    announcer,
    allCards,
    collection.loadCount,
    collectionNotices.map((notice) => notice.live).join(' '),
  );

  // Read-only check: never asks the user, so it may run on load (A2). The request itself waits for the button (SR-13).
  useEffect(() => {
    if (!repositories.persistent) return;
    let active = true;
    void isStoragePersisted().then((persisted) => {
      if (active && persisted) setPersistence((current) => (current === 'idle' ? 'already' : current));
    });
    return () => {
      active = false;
    };
  }, [repositories]);

  const handleRequestPersistence = () => {
    setPersistence('busy');
    void requestPersistentStorage().then((granted) => {
      const result: PersistenceState = granted ? 'granted' : 'denied';
      focusPersistenceResult.current = true;
      setPersistence(result);
      collectionAnnouncer.announce(persistenceResultText(result) ?? '');
    });
  };

  useEffect(() => {
    // The button is replaced by the result; keep focus from falling to <body> (UX.md 6.7).
    if (focusPersistenceResult.current && persistenceResultText(persistence) !== null) {
      focusPersistenceResult.current = false;
      persistenceResultRef.current?.focus();
    }
  }, [persistence]);

  const focusHeading = () => headingRef.current?.focus();

  /** Any change of the search, a selection or "Vain omistetut" (UX.md 5.6, 6.6). */
  const updateFilters = (
    next: CardFilterCriteria,
    nextFilter: CollectionFilter,
    when: 'later' | 'now' | 'never',
    force = false,
  ) => {
    setCriteria(next);
    setCollectionFilter(nextFilter);
    // New conditions: rows whose count went to 0 are no longer kept.
    setKept(NO_KEYS);
    const announcement = describeResult(
      isActive(next, nextFilter),
      visibleCards(next, nextFilter, NO_KEYS).length,
      allCards.length,
    );
    if (when === 'later') announcer.announceLater(announcement);
    else if (when === 'now') announcer.announceNow(announcement, force);
    else announcer.cancel();
  };
  const updateCriteria = (next: CardFilterCriteria, when: 'later' | 'now' | 'never') =>
    updateFilters(next, collectionFilter, when);

  const handleClearFilters = () => {
    updateFilters(EMPTY_CRITERIA, 'all', 'now', true);
    // The button disappears with the empty result; the search field is the natural next step (UX.md 5.7).
    searchInputRef.current?.focus();
  };

  const owned: OwnedColumn | undefined =
    collection.phase === 'unavailable'
      ? undefined
      : {
          mode: collection.phase,
          countOf: (card) => countIn(collection, card.key),
          onChange: (card, count) => {
            if (collectionFilter !== 'all') setKept((current) => (current.has(card.key) ? current : new Set(current).add(card.key)));
            collectionStore.setCount(card.key, count);
          },
          onLimit: collectionAnnouncer.announceLimit,
          editable,
        };
  const summary =
    collection.phase === 'loading'
      ? texts.collectionLoading
      : collection.phase === 'ready'
        ? collectionSummary(collection, allCards)
        : null;

  const status = filterActive ? texts.filteredStatus(filtered.length, allCards.length) : cardCount(allCards.length);
  const listCaption = filterActive ? texts.tableCaptionFiltered : texts.tableCaption;
  const noResults = filtered.length === 0;
  // "Vain omistetut" alone and nothing owned: guide to marking cards instead (UX.md 6.6).
  const noOwnedCards = noResults && ownedOnly && !isFilterActive(criteria);

  const handleOpenImage = (card: Card, opener: HTMLButtonElement) => {
    preview.hide();
    imageOpenerRef.current = opener;
    setOpenCard(card);
  };

  const handleCloseImage = () => {
    setOpenCard(null);
    // Back to the thumbnail; if its row is gone, the search field is the nearest stable place.
    const opener = imageOpenerRef.current;
    imageOpenerRef.current = null;
    if (opener?.isConnected) opener.focus();
    else searchInputRef.current?.focus();
  };

  const handleShowAll = () => {
    updateFilters(criteria, 'all', 'now', true);
    collectionAllRef.current?.focus();
  };

  // Chips for the selected values, in the order of the form (T-050a, T-052).
  const activeFilters: ActiveFilter[] = [
    ...(collectionFilter === 'all'
      ? []
      : [
          {
            id: 'collection',
            label: collectionFilter === 'owned' ? texts.collectionOwned : texts.collectionMissing,
            onRemove: () => updateFilters(criteria, 'all', 'later'),
          },
        ]),
    ...criteriaFilters(criteria, (next) => updateCriteria(next, 'later')),
  ];

  return (
    <>
      <div className="page-head">
        <h1 ref={headingRef} tabIndex={-1}>
          {texts.heading}
        </h1>
        <div className="page-head-status">
          <p id="card-status" className="status-line">
            {status}
          </p>
          {summary !== null && (
            <p id="collection-summary" className="status-line is-summary">
              {summary}
            </p>
          )}
        </div>
      </div>
      {/* Stays mounted so screen readers announce each change. */}
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announcer.text ?? texts.loaded(allCards.length)}
      </div>

      <CollectionNotices
        snapshot={collection}
        persistent={repositories.persistent}
        onDismiss={(kind) => {
          collectionStore.dismissNotice(kind);
          focusHeading();
        }}
        onDismissSaveError={() => {
          collectionStore.dismissSaveError();
          focusHeading();
        }}
        onReload={() => {
          focusHeading();
          collectionStore.reload();
        }}
      />

      {collection.phase === 'ready' && repositories.persistent && (
        <StorageReminder
          state={persistence}
          resultRef={persistenceResultRef}
          slot={headerSlot}
          onRequest={handleRequestPersistence}
        />
      )}

      <div className="catalog-layout">
        <section className="catalog-filters" aria-labelledby="filters-heading">
          <h2 id="filters-heading" className="filters-heading">
            {texts.filtersHeading}
          </h2>
          <CardFilters
            criteria={criteria}
            typeOptions={filterOptions(
              KNOWN_CARD_TYPES,
              allCards.map((card) => card.type),
              criteria.types,
            )}
            colorOptions={filterOptions(
              KNOWN_CARD_COLORS,
              allCards.map((card) => card.color),
              criteria.colors,
            )}
            rarityOptions={filterOptions(
              KNOWN_CARD_RARITIES,
              allCards.map((card) => card.rarity),
              criteria.rarities,
            )}
            numberOptions={numberFilterOptionsFor(allCards, criteria)}
            searchInputRef={searchInputRef}
            collectionFilter={collection.phase === 'ready' ? collectionFilter : undefined}
            collectionAllRef={collectionAllRef}
            onCollectionFilterChange={(next) => updateFilters(criteria, next, 'later')}
            onQueryChange={(query, composing) =>
              updateCriteria({ ...criteria, query }, composing ? 'never' : 'later')
            }
            onToggleType={(type) => updateCriteria({ ...criteria, types: toggleValue(criteria.types, type) }, 'later')}
            onToggleColor={(color) =>
              updateCriteria({ ...criteria, colors: toggleValue(criteria.colors, color) }, 'later')
            }
            onToggleRarity={(rarity) =>
              updateCriteria({ ...criteria, rarities: toggleValue(criteria.rarities, rarity) }, 'later')
            }
            onToggleNumber={(group, value) =>
              updateCriteria({ ...criteria, [group]: toggleValue(criteria[group], value) }, 'later')
            }
            onSearchSubmit={() =>
              announcer.announceNow(describeResult(filterActive, filtered.length, allCards.length))
            }
            collapsibleBelow={WIDE_QUERY}
          />
        </section>

        <section className="catalog-results" aria-labelledby="results-heading" data-image-size={imageSize}>
          <h2 id="results-heading" className="visually-hidden">
            {texts.resultsHeading}
          </h2>
          <ListToolbar
            view={view}
            onViewChange={handleViewChange}
            editable={collection.phase === 'ready' ? editable : undefined}
            onEditChange={handleEditChange}
            imageSize={view === 'grid' ? imageSize : undefined}
            onImageSizeChange={setImageSize}
          />
          <SortSelect sort={sort} onChange={setSort} />

          <ActiveFilters
            filters={activeFilters}
            // The empty state has its own button for the same action (no two buttons with one name).
            showClear={filterActive && !(noResults && !noOwnedCards)}
            onClear={handleClearFilters}
            searchInputRef={searchInputRef}
          />

          {noResults && (
            <div className="empty">
              <p>{noOwnedCards ? texts.ownedOnlyEmptyBody : texts.noResultsBody}</p>
              <button
                type="button"
                className="button-primary"
                onClick={noOwnedCards ? handleShowAll : handleClearFilters}
              >
                {noOwnedCards ? texts.showAllCards : texts.clearFilters}
              </button>
            </div>
          )}

          {filtered.length > 0 &&
            (view === 'table' ? (
              <CardTable
                cards={filtered}
                caption={listCaption}
                owned={owned}
                decksOf={decksOf}
                onOpenImage={handleOpenImage}
                hoverProps={preview.bind}
                sort={sort}
                onSortChange={setSort}
              />
            ) : (
              <CardList cards={sortedForGrid} caption={listCaption} owned={owned} decksOf={decksOf} onOpenImage={handleOpenImage} />
            ))}
        </section>
      </div>

      {view === 'table' && preview.preview}
      <CardImageDialog card={openCard} onClose={handleCloseImage} />
    </>
  );
}
