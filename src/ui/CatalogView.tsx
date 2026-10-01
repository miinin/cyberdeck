import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Card } from '../domain/card';
import type { CardKey } from '../domain/cardKey';
import type { Repositories } from '../storage';
import {
  EMPTY_CRITERIA,
  KNOWN_CARD_COLORS,
  KNOWN_CARD_TYPES,
  filterCards,
  filterOptions,
  isFilterActive,
  toggleValue,
} from '../domain/cardSearch';
import type { CardFilterCriteria } from '../domain/cardSearch';
import { CardFilters } from './CardFilters';
import { CardList } from './CardList';
import type { OwnedColumn } from './CardList';
import { countIn } from './collectionStore';
import type { CollectionSnapshot } from './collectionStore';
import { useCollection } from './useCollection';
import { cardCount, texts } from './texts';
import { countOf } from '../domain/collection';
import { useDelayedAnnouncement } from './useDelayedAnnouncement';
import type { Announcement } from './useDelayedAnnouncement';
import type { CatalogState } from './useCardCatalog';

interface ViewModel {
  /** Visible status line under the heading (empty in the error state). */
  status: string;
  /** Text for the polite live region. */
  live: string;
  notice: { tone: 'danger' | 'warning'; title: string; body: string } | null;
  emptyMessage: string | null;
  showRetry: boolean;
  /** Loaded cards that can be searched. Empty in every state without a list (UX.md 5.8). */
  cards: readonly Card[];
  /** Fewer usable cards than the API reported (the PARTIAL state). */
  missingCards: boolean;
}

/**
 * Maps the loading state to what the view shows (UX.md 4.5). PM decision 2026-09-30:
 * any failed page is the ERROR state; PARTIAL means all pages loaded but fewer usable
 * cards than the API's total (e.g. invalid cards were skipped).
 */
function toViewModel(state: CatalogState): ViewModel {
  const base = { notice: null, emptyMessage: null, showRetry: false, cards: [], missingCards: false };
  switch (state.status) {
    case 'loading':
      return { ...base, status: texts.loading, live: texts.loading };
    case 'error':
      return {
        ...base,
        status: '',
        live: texts.errorLive,
        notice: { tone: 'danger', title: texts.errorTitle, body: texts.errorBody },
        showRetry: true,
      };
    case 'ready': {
      const { cards, reportedTotal } = state.catalog;
      if (cards.length < reportedTotal) {
        return {
          ...base,
          status: texts.partialStatus(cards.length, reportedTotal),
          live: texts.partialLive(cards.length, reportedTotal),
          notice: { tone: 'warning', title: texts.partialTitle, body: texts.partialBody },
          showRetry: true,
          cards,
          missingCards: true,
        };
      }
      if (cards.length === 0) {
        return {
          ...base,
          status: texts.emptyStatus,
          live: texts.emptyLive,
          emptyMessage: texts.emptyBody,
          showRetry: true,
        };
      }
      // More cards than `total` is an API inconsistency: the visible count follows the visible rows.
      return { ...base, status: cardCount(cards.length), live: texts.loaded(cards.length), cards };
    }
  }
}

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
  state,
  onRetry,
  repositories,
}: {
  state: CatalogState;
  onRetry: () => void;
  /** Created once in App (a stable reference). */
  repositories: Repositories;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Lives here, above the form, so it survives a retry (UX.md 5.8, WCAG 3.3.7).
  const [criteria, setCriteria] = useState<CardFilterCriteria>(EMPTY_CRITERIA);
  const ownedOnlyRef = useRef<HTMLInputElement>(null);
  const [ownedOnlyChecked, setOwnedOnly] = useState(false);
  /** Rows kept visible under "Vain omistetut" after their count went to 0 (UX.md 6.6, A5). */
  const [kept, setKept] = useState<ReadonlySet<CardKey>>(NO_KEYS);
  const view = toViewModel(state);
  const { snapshot: collection, store: collectionStore } = useCollection(repositories.collection, () => {});
  const allCards = view.cards;

  // The filter exists only while counts can be changed; a locked collection turns it off (UX.md 6.6).
  if (ownedOnlyChecked && (collection.phase === 'locked' || collection.phase === 'unavailable')) {
    setOwnedOnly(false);
  }
  const ownedOnly = ownedOnlyChecked && collection.phase === 'ready';
  const visibleCards = (next: CardFilterCriteria, nextOwnedOnly: boolean, nextKept: ReadonlySet<CardKey>) => {
    const matching = filterCards(allCards, next);
    if (!nextOwnedOnly) return matching;
    return matching.filter((card) => countIn(collection, card.key) > 0 || nextKept.has(card.key));
  };
  const isActive = (next: CardFilterCriteria, nextOwnedOnly: boolean) => isFilterActive(next) || nextOwnedOnly;

  const filtered = visibleCards(criteria, ownedOnly, kept);
  const filterActive = isActive(criteria, ownedOnly);
  const showFilters = allCards.length > 0;

  // The search is kept over a retry (5.8), so the loaded message tells the filter result of the
  // criteria in use when this state arrived (K9, UX-002). Frozen per state: later changes are
  // announced with the delay, not by rewriting the loaded message.
  const [loadedWith, setLoadedWith] = useState({ state, criteria, ownedOnly });
  if (loadedWith.state !== state) setLoadedWith({ state, criteria, ownedOnly });
  const loadedActive = isActive(loadedWith.criteria, loadedWith.ownedOnly);
  const loadResult = describeResult(
    loadedActive,
    visibleCards(loadedWith.criteria, loadedWith.ownedOnly, NO_KEYS).length,
    allCards.length,
  );
  const loadedFiltered = showFilters && loadedActive;
  const loadedLive = !loadedFiltered
    ? view.live
    : view.missingCards
      ? texts.partialFilteredLive(loadResult.text)
      : texts.loadedFilteredLive(allCards.length, loadResult.text);

  // The loaded message already told this result, so the same result is not announced again.
  const announcer = useDelayedAnnouncement(state, showFilters ? loadResult.key : null);

  /** Any change of the search, a selection or "Vain omistetut" (UX.md 5.6, 6.6). */
  const updateFilters = (
    next: CardFilterCriteria,
    nextOwnedOnly: boolean,
    when: 'later' | 'now' | 'never',
    force = false,
  ) => {
    setCriteria(next);
    setOwnedOnly(nextOwnedOnly);
    // New conditions: rows whose count went to 0 are no longer kept.
    setKept(NO_KEYS);
    const announcement = describeResult(
      isActive(next, nextOwnedOnly),
      visibleCards(next, nextOwnedOnly, NO_KEYS).length,
      allCards.length,
    );
    if (when === 'later') announcer.announceLater(announcement);
    else if (when === 'now') announcer.announceNow(announcement, force);
    else announcer.cancel();
  };
  const updateCriteria = (next: CardFilterCriteria, when: 'later' | 'now' | 'never') =>
    updateFilters(next, ownedOnly, when);

  const handleRetry = () => {
    // The retry button disappears while loading; keep focus from falling to <body> (UX.md 4.6).
    headingRef.current?.focus();
    onRetry();
  };

  const handleClearFilters = () => {
    updateFilters(EMPTY_CRITERIA, false, 'now', true);
    // The button disappears with the empty result; the search field is the natural next step (UX.md 5.7).
    searchInputRef.current?.focus();
  };

  const retryButton: ReactNode = view.showRetry ? (
    <button type="button" className="button-primary" onClick={handleRetry}>
      {texts.retry}
    </button>
  ) : null;

  const owned: OwnedColumn | undefined =
    collection.phase === 'unavailable'
      ? undefined
      : {
          mode: collection.phase,
          countOf: (card) => countIn(collection, card.key),
          onChange: (card, count) => {
            if (ownedOnly) setKept((current) => (current.has(card.key) ? current : new Set(current).add(card.key)));
            collectionStore.setCount(card.key, count);
          },
          onLimit: () => {},
        };
  const summary =
    collection.phase === 'loading'
      ? texts.collectionLoading
      : collection.phase === 'ready'
        ? collectionSummary(collection, allCards)
        : null;

  const status = showFilters && filterActive ? texts.filteredStatus(filtered.length, allCards.length) : view.status;
  const noResults = showFilters && filtered.length === 0;
  // "Vain omistetut" alone and nothing owned: guide to marking cards instead (UX.md 6.6).
  const noOwnedCards = noResults && ownedOnly && !isFilterActive(criteria);

  const handleShowAll = () => {
    updateFilters(criteria, false, 'now', true);
    ownedOnlyRef.current?.focus();
  };

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        {texts.heading}
      </h1>
      <p id="card-status" className="status-line" hidden={status === ''}>
        {status}
      </p>
      {showFilters && summary !== null && (
        <p id="collection-summary" className="status-line">
          {summary}
        </p>
      )}
      {/* Stays mounted across all states so screen readers announce each change. */}
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announcer.text ?? loadedLive}
      </div>

      {view.notice !== null && (
        <div className={`notice notice-${view.notice.tone}`}>
          <h2>{view.notice.title}</h2>
          <p>{view.notice.body}</p>
          {retryButton}
        </div>
      )}

      {view.emptyMessage !== null && (
        <div className="empty">
          <p>{view.emptyMessage}</p>
          {retryButton}
        </div>
      )}

      {showFilters && (
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
          searchInputRef={searchInputRef}
          ownedOnly={collection.phase === 'ready' ? ownedOnly : undefined}
          ownedOnlyRef={ownedOnlyRef}
          onToggleOwnedOnly={() => updateFilters(criteria, !ownedOnly, 'later')}
          onQueryChange={(query, composing) =>
            updateCriteria({ ...criteria, query }, composing ? 'never' : 'later')
          }
          onToggleType={(type) => updateCriteria({ ...criteria, types: toggleValue(criteria.types, type) }, 'later')}
          onToggleColor={(color) =>
            updateCriteria({ ...criteria, colors: toggleValue(criteria.colors, color) }, 'later')
          }
          onSearchSubmit={() =>
            announcer.announceNow(describeResult(filterActive, filtered.length, allCards.length))
          }
        />
      )}

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
        />
      )}
    </>
  );
}
