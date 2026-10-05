import { useEffect, useMemo, useRef, useState } from 'react';
import { playsetSize } from '../domain/card';
import type { Card } from '../domain/card';
import type { CardKey } from '../domain/cardKey';
import { countOf, minCountOf } from '../domain/collection';
import { hasSetPrinting, ownsSetVersion, setOptions, versionsBySet } from '../domain/setFilter';
import type { MissingRow } from '../domain/wants';
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
import { AddMissingToWantsButton } from './AddMissingToWants';
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
import { CountControl } from './CountControl';
import { tradeableCount } from '../domain/tradeCompare';
import { countIn, versionCountIn } from './collectionStore';
import { CardVersions } from './CardVersions';
import type { CollectionSnapshot } from './collectionStore';
import { StorageReminder, persistenceResultText } from './StorageReminder';
import type { PersistenceState } from './StorageReminder';
import { cardCount, texts } from './texts';
import { useCollection } from './useCollection';
import { useWants } from './useWants';
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

const COLLECTION_FILTER_LABELS = {
  owned: texts.collectionOwned,
  missing: texts.collectionMissing,
} as const;
const NO_DECKS: readonly { id: string; name: string }[] = [];
const NO_KEYS: ReadonlySet<CardKey> = new Set();

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
  const [setChoice, setSetChoice] = useState<string | null>(null);
  const [kept, setKept] = useState<ReadonlySet<CardKey>>(NO_KEYS);
  const { snapshot: collection, store: collectionStore } = useCollection(repositories.collection);
  const wants = useWants(repositories.wants);
  // Which decks each card is in (T-013). Decks that cannot be read just leave the mention out.
  const { phase: decksPhase, decks } = useDecks(repositories.decks);
  const decksByCard = useMemo(() => {
    const byCard = new Map<CardKey, { id: string; name: string }[]>();
    for (const deck of decks) {
      for (const key of new Set(deck.sections.flatMap((section) => section.cards.map((row) => row.card)))) {
        byCard.set(key, [...(byCard.get(key) ?? []), { id: deck.id, name: deck.name }]);
      }
    }
    return byCard;
  }, [decks]);
  const decksOf = decksPhase === 'ready'
      ? (card: Card) => (decksByCard.get(card.key) ?? NO_DECKS).map((deck) => deck.name)
      : undefined;
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
  const listedOnly = collectionFilter === 'owned';
  const visibleCards = (
    next: CardFilterCriteria,
    nextFilter: CollectionFilter,
    nextKept: ReadonlySet<CardKey>,
    family: string | null = setChoice,
  ) => {
    const matching = filterCards(allCards, next).filter((card) => family === null || hasSetPrinting(card, family));
    if (nextFilter === 'all') return matching;
    return matching.filter((card) => {
      if (nextKept.has(card.key)) return true;
      const count = countIn(collection, card.key);
      if (nextFilter === 'owned') {
        // T-074: with a set chosen, "Omistetut" means a recorded version from that set.
        return family === null || collection.phase !== 'ready' ? count > 0 : ownsSetVersion(card, family, collection.saved);
      }
      return count < playsetSize(card);
    });
  };
  const isActive = (next: CardFilterCriteria, nextFilter: CollectionFilter, family: string | null = setChoice) =>
    isFilterActive(next) || nextFilter !== 'all' || family !== null;

  const filtered = visibleCards(criteria, collectionFilter, kept);
  // T-060: the grid follows the shared order; the table sorts the same way itself (header buttons).
  const sortedForGrid = view === 'grid' ? sortCards(filtered, sort.key, sort.direction) : filtered;
  const filterActive = isActive(criteria, collectionFilter);
  // T-066: shown cards short of a playset, for "add missing to wants".
  const missingRows: MissingRow[] = [];
  if (collection.phase === 'ready') {
    for (const card of filtered) {
      const missing = playsetSize(card) - countIn(collection, card.key);
      if (missing > 0) missingRows.push({ card: card.key, missing });
    }
  }

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

  const handleSetChange = (family: string | null) => {
    setSetChoice(family);
    setKept(NO_KEYS);
    announcer.announceNow(
      describeResult(
        isActive(criteria, collectionFilter, family),
        visibleCards(criteria, collectionFilter, NO_KEYS, family).length,
        allCards.length,
      ),
      true,
    );
  };

  const handleClearFilters = () => {
    setSetChoice(null);
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
          minOf: (card) => minCountOf(collection.saved, card.key),
          editable,
        };
  const summary =
    collection.phase === 'loading'
      ? texts.collectionLoading
      : collection.phase === 'ready'
        ? collectionSummary(collection, allCards)
        : null;

  const setList = useMemo(() => setOptions(allCards), [allCards]);
  const setLabels = new Map(setList.map((option) => [option.family, option.label]));
  const versionRows = collection.phase === 'ready' ? versionsBySet(allCards, collection.saved) : [];
  const versionsText =
    versionRows.length === 0 ? null : texts.versionsSummary(versionRows.map((r) => `${r.label}: ${r.count}`).join(' · '));

  const status = filterActive ? texts.filteredStatus(filtered.length, allCards.length) : cardCount(allCards.length);
  const listCaption = filterActive ? texts.tableCaptionFiltered : texts.tableCaption;
  const noResults = filtered.length === 0;
  // "Vain omistetut" alone and nothing owned: guide to marking cards instead (UX.md 6.6).
  const noOwnedCards = noResults && listedOnly && !isFilterActive(criteria);

  // T-070: the card detail panel in the image dialog; counters only once their stores are ready.
  const details =
    openCard === null ? undefined : (
      <>
        {collection.phase === 'ready' && (
          <section aria-labelledby="card-detail-collection">
            <h3 id="card-detail-collection">{texts.detailCollection}</h3>
            <CountControl
              card={openCard}
              count={countIn(collection, openCard.key)}
              mode="ready"
              onChange={(card, count) => collectionStore.setCount(card.key, count)}
              onLimit={collectionAnnouncer.announceLimit}
              editable={editable}
              min={minCountOf(collection.saved, openCard.key)}
            />
            {countIn(collection, openCard.key) < playsetSize(openCard) && (
              <p>{texts.detailPlaysetMissing(playsetSize(openCard) - countIn(collection, openCard.key))}</p>
            )}
            {countIn(collection, openCard.key) >= playsetSize(openCard) && <p>{texts.playsetFull}</p>}
            {editable && countIn(collection, openCard.key) > 0 && countIn(collection, openCard.key) <= minCountOf(collection.saved, openCard.key) && (
              <p>{texts.versionsLowerFirst}</p>
            )}
          </section>
        )}
        {collection.phase === 'ready' && (
          <CardVersions
            card={openCard}
            count={countIn(collection, openCard.key)}
            versionCount={(printing) => versionCountIn(collection, openCard.key, printing)}
            editable={editable}
            onChange={(printing, count) => collectionStore.setVersionCount(openCard.key, printing, count)}
            onLimit={collectionAnnouncer.announceLimit}
          />
        )}
        {wants.snapshot.phase === 'ready' && (
          <section aria-labelledby="card-detail-want">
            <h3 id="card-detail-want">{texts.detailWant}</h3>
            <CountControl
              card={openCard}
              count={countIn(wants.snapshot, openCard.key)}
              mode="ready"
              onChange={(card, count) => wants.store.setCount(card.key, count)}
              onLimit={() => undefined}
              editable
              kind="want"
            />
            {collection.phase === 'ready' && tradeableCount(countIn(collection, openCard.key), openCard) > 0 && (
              <p>{texts.detailTradeable(tradeableCount(countIn(collection, openCard.key), openCard))}</p>
            )}
          </section>
        )}
        {decksPhase === 'ready' && (
          <section aria-labelledby="card-detail-decks">
            <h3 id="card-detail-decks">{texts.detailDecks}</h3>
            {(decksByCard.get(openCard.key) ?? NO_DECKS).length === 0 ? (
              <p>{texts.detailNoDecks}</p>
            ) : (
              <ul>
                {(decksByCard.get(openCard.key) ?? NO_DECKS).map((deck) => (
                  <li key={deck.id}>
                    <a href={`#/pakat/${deck.id}`}>{deck.name}</a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </>
    );

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
            label: COLLECTION_FILTER_LABELS[collectionFilter],
            onRemove: () => updateFilters(criteria, 'all', 'later'),
          },
        ]),
    ...(setChoice === null
      ? []
      : [
          {
            id: 'set',
            label: texts.setChip(setLabels.get(setChoice) ?? setChoice),
            onRemove: () => handleSetChange(null),
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
          {versionsText !== null && (
            <p id="versions-summary" className="status-line is-summary">
              {versionsText}
            </p>
          )}
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
            setOptions={setList}
            setFamily={setChoice}
            onSetChange={handleSetChange}
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
          <div className="sort-row">
            <SortSelect sort={sort} onChange={setSort} />
            {collection.phase === 'ready' && wants.snapshot.phase === 'ready' && (
              <div className="missing-add">
                <AddMissingToWantsButton rows={missingRows} wants={wants} />
              </div>
            )}
          </div>

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
      <CardImageDialog card={openCard} onClose={handleCloseImage} details={details} />
    </>
  );
}
