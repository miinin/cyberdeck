import { useRef } from 'react';
import type { ReactNode } from 'react';
import { CardList } from './CardList';
import { cardCount, texts } from './texts';
import type { CatalogState } from './useCardCatalog';

interface ViewModel {
  /** Visible status line under the heading (empty in the error state). */
  status: string;
  /** Text for the polite live region. */
  live: string;
  notice: { tone: 'danger' | 'warning'; title: string; body: string } | null;
  emptyMessage: string | null;
  showRetry: boolean;
  cards: Parameters<typeof CardList>[0]['cards'];
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

export function CatalogView({ state, onRetry }: { state: CatalogState; onRetry: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const view = toViewModel(state);

  const handleRetry = () => {
    // The retry button disappears while loading; keep focus from falling to <body> (UX.md 4.6).
    headingRef.current?.focus();
    onRetry();
  };

  const retryButton: ReactNode = view.showRetry ? (
    <button type="button" className="button-primary" onClick={handleRetry}>
      {texts.retry}
    </button>
  ) : null;

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        {texts.heading}
      </h1>
      <p id="card-status" className="status-line" hidden={view.status === ''}>
        {view.status}
      </p>
      {/* Stays mounted across all states so screen readers announce each change. */}
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {view.live}
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

      {view.cards.length > 0 && <CardList cards={view.cards} />}
    </>
  );
}
