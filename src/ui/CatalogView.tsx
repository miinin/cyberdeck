import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Card } from '../domain/card';
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
import { cardCount, texts } from './texts';
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
}

/**
 * Maps the loading state to what the view shows (UX.md 4.5). PM decision 2026-09-30:
 * any failed page is the ERROR state; PARTIAL means all pages loaded but fewer usable
 * cards than the API's total (e.g. invalid cards were skipped).
 */
function toViewModel(state: CatalogState): ViewModel {
  const base = { notice: null, emptyMessage: null, showRetry: false, cards: [] };
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

export function CatalogView({ state, onRetry }: { state: CatalogState; onRetry: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Lives here, above the form, so it survives a retry (UX.md 5.8, WCAG 3.3.7).
  const [criteria, setCriteria] = useState<CardFilterCriteria>(EMPTY_CRITERIA);
  const view = toViewModel(state);
  const allCards = view.cards;

  const filtered = useMemo(() => filterCards(allCards, criteria), [allCards, criteria]);
  const filterActive = isFilterActive(criteria);
  const showFilters = allCards.length > 0;

  // The loaded message ("151 korttia ladattu.") already told the unfiltered count.
  const announcer = useDelayedAnnouncement(state, showFilters ? `all:${allCards.length}` : null);

  const updateCriteria = (next: CardFilterCriteria, when: 'later' | 'now' | 'never') => {
    setCriteria(next);
    const announcement = describeResult(
      isFilterActive(next),
      filterCards(allCards, next).length,
      allCards.length,
    );
    if (when === 'later') announcer.announceLater(announcement);
    else if (when === 'now') announcer.announceNow(announcement, true);
    else announcer.cancel();
  };

  const handleRetry = () => {
    // The retry button disappears while loading; keep focus from falling to <body> (UX.md 4.6).
    headingRef.current?.focus();
    onRetry();
  };

  const handleClearFilters = () => {
    updateCriteria(EMPTY_CRITERIA, 'now');
    // The button disappears with the empty result; the search field is the natural next step (UX.md 5.7).
    searchInputRef.current?.focus();
  };

  const retryButton: ReactNode = view.showRetry ? (
    <button type="button" className="button-primary" onClick={handleRetry}>
      {texts.retry}
    </button>
  ) : null;

  const status = showFilters && filterActive ? texts.filteredStatus(filtered.length, allCards.length) : view.status;
  const noResults = showFilters && filtered.length === 0;

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        {texts.heading}
      </h1>
      <p id="card-status" className="status-line" hidden={status === ''}>
        {status}
      </p>
      {/* Stays mounted across all states so screen readers announce each change. */}
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announcer.text ?? view.live}
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
          <p>{texts.noResultsBody}</p>
          <button type="button" className="button-primary" onClick={handleClearFilters}>
            {texts.clearFilters}
          </button>
        </div>
      )}

      {filtered.length > 0 && (
        <CardList cards={filtered} caption={filterActive ? texts.tableCaptionFiltered : texts.tableCaption} />
      )}
    </>
  );
}
