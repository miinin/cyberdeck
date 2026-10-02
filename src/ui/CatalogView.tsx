import { useEffect, useRef, useState } from 'react';
import { playsetSize } from '../domain/card';
import type { Card } from '../domain/card';
import type { CardKey } from '../domain/cardKey';
import { countOf } from '../domain/collection';
import { isStoragePersisted, requestPersistentStorage } from '../storage';
import type { Repositories } from '../storage';
import {
  EMPTY_CRITERIA,
  KNOWN_CARD_COLORS,
  KNOWN_CARD_RARITIES,
  KNOWN_CARD_TYPES,
  filterCards,
  filterOptions,
  isFilterActive,
  toggleValue,
} from '../domain/cardSearch';
import type { CardFilterCriteria } from '../domain/cardSearch';
import { CardFilters } from './CardFilters';
import type { CollectionFilter } from './CardFilters';
import { CardImageDialog } from './CardImageDialog';
import { CardList } from './CardList';
import type { OwnedColumn } from './CardList';
import { CollectionNotices, loadNotices } from './CollectionNotices';
import { countIn } from './collectionStore';
import type { CollectionSnapshot } from './collectionStore';
import { StorageReminder, persistenceResultText } from './StorageReminder';
import type { PersistenceState } from './StorageReminder';
import { cardCount, texts } from './texts';
import { useCollection } from './useCollection';
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
}: {
  /** All cards, bundled with the app (D-013). A stable reference: it also owns the live announcements. */
  cards: readonly Card[];
  /** Created once in App (a stable reference). */
  repositories: Repositories;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [criteria, setCriteria] = useState<CardFilterCriteria>(EMPTY_CRITERIA);
  const collectionAllRef = useRef<HTMLInputElement>(null);
  const [collectionChoice, setCollectionFilter] = useState<CollectionFilter>('all');
  /** Rows kept visible under "Vain omistetut" after their count went to 0 (UX.md 6.6, A5). */
  const [kept, setKept] = useState<ReadonlySet<CardKey>>(NO_KEYS);
  const { snapshot: collection, store: collectionStore } = useCollection(repositories.collection);
  const [persistence, setPersistence] = useState<PersistenceState>('idle');
  const persistenceResultRef = useRef<HTMLParagraphElement>(null);
  /** Set by the button: the result paragraph takes focus once it is rendered. */
  const focusPersistenceResult = useRef(false);
  /** The card in the enlarged image dialog, and the thumbnail button that opened it (T-027 UX). */
  const [openCard, setOpenCard] = useState<Card | null>(null);
  const imageOpenerRef = useRef<HTMLButtonElement | null>(null);

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
        };
  const summary =
    collection.phase === 'loading'
      ? texts.collectionLoading
      : collection.phase === 'ready'
        ? collectionSummary(collection, allCards)
        : null;

  const status = filterActive ? texts.filteredStatus(filtered.length, allCards.length) : cardCount(allCards.length);
  const noResults = filtered.length === 0;
  // "Vain omistetut" alone and nothing owned: guide to marking cards instead (UX.md 6.6).
  const noOwnedCards = noResults && ownedOnly && !isFilterActive(criteria);

  const handleOpenImage = (card: Card, opener: HTMLButtonElement) => {
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

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        {texts.heading}
      </h1>
      <p id="card-status" className="status-line">
        {status}
      </p>
      {summary !== null && (
        <p id="collection-summary" className="status-line is-summary">
          {summary}
        </p>
      )}
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
          onRequest={handleRequestPersistence}
        />
      )}

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
        onSearchSubmit={() =>
          announcer.announceNow(describeResult(filterActive, filtered.length, allCards.length))
        }
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

      {filtered.length > 0 && (
        <CardList
          cards={filtered}
          caption={filterActive ? texts.tableCaptionFiltered : texts.tableCaption}
          owned={owned}
          onOpenImage={handleOpenImage}
        />
      )}

      <CardImageDialog card={openCard} onClose={handleCloseImage} />
    </>
  );
}
