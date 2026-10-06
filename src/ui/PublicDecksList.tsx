import { useEffect, useRef, useState } from 'react';
import { intlLocale } from '../locale';
import { deckTexts } from './deckTexts';
import { usePublicDecks } from './PublicDecksContext';
import { cachedPublicDecks, rememberPublicDecks } from './publicDecksCache';
import type { LoadedPublicDecks as Loaded } from './publicDecksCache';
import { useNoIndex } from './useNoIndex';

const dateFormat = new Intl.DateTimeFormat(intlLocale, { dateStyle: 'short', timeStyle: 'short' });


/**
 * The "Julkiset pakat" tab (T-098, D-025): 24 decks per page, newest update first, "Näytä lisää" for the next
 * page. Everything shown is plain React text from validated documents (SR-37). The list is not indexed (SR-41).
 */
export function PublicDecksList({ onOpen }: { onOpen: (pubId: string) => void }) {
  useNoIndex();
  const { store } = usePublicDecks();
  const [data, setData] = useState<Loaded | null>(() => (store === null ? null : (cachedPublicDecks(store) ?? null)));
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>(
    data !== null ? 'ready' : store === null ? 'error' : 'loading',
  );
  const [more, setMore] = useState<'idle' | 'loading' | 'error'>('idle');
  const [live, setLive] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  /** Counts the reads of the first page; 0 = the one on opening, which the session cache may answer. */
  const [attempt, setAttempt] = useState(0);
  const firstNewRef = useRef<string | null>(null);

  useEffect(() => {
    if (store === null || (attempt === 0 && cachedPublicDecks(store) !== undefined)) return;
    let active = true;
    store.list(null).then(
      (page) => {
        if (!active) return;
        const loaded = { items: page.items, next: page.next, dropped: page.dropped };
        rememberPublicDecks(store, loaded);
        setData(loaded);
        setRefreshing(false);
        setPhase('ready');
      },
      () => {
        if (!active) return;
        setRefreshing(false);
        // A failed refresh keeps the list that is shown; a failed first read shows the error.
        setPhase((current) => (current === 'loading' ? 'error' : current));
        setLive(deckTexts.publicError);
      },
    );
    return () => {
      active = false;
    };
  }, [store, attempt]);

  /** Reads the first page again. The shown list stays until the new one is there, so the page does not jump. */
  const refresh = () => {
    if (data === null) setPhase('loading');
    else setRefreshing(true);
    setAttempt((n) => n + 1);
  };

  const loadMore = () => {
    if (store === null || data === null || data.next === null || more === 'loading') return;
    setMore('loading');
    store.list(data.next).then(
      (page) => {
        const loaded = { items: [...data.items, ...page.items], next: page.next, dropped: data.dropped + page.dropped };
        rememberPublicDecks(store, loaded);
        // Focus moves to the first new deck, so the page does not jump and keyboard users continue from there.
        firstNewRef.current = page.items[0]?.pubId ?? null;
        setData(loaded);
        setMore('idle');
        setLive(deckTexts.publicLoadedLive(loaded.items.length));
      },
      () => setMore('error'),
    );
  };

  useEffect(() => {
    const id = firstNewRef.current;
    if (id === null) return;
    firstNewRef.current = null;
    document.querySelector<HTMLElement>(`[data-public-open="${CSS.escape(id)}"]`)?.focus();
  });

  return (
    <>
      <p>{deckTexts.publicIntro}</p>
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {live}
      </div>

      {phase === 'loading' && (
        <p className="status-line" role="status">
          {deckTexts.publicLoading}
        </p>
      )}
      {phase === 'error' && (
        <div className="notice notice-danger" role="alert">
          <p>{deckTexts.publicError}</p>
          <button type="button" className="button-secondary" onClick={() => refresh()}>
            {deckTexts.publicRetry}
          </button>
        </div>
      )}

      {phase === 'ready' && data !== null && (
        <>
          {data.dropped > 0 && (
            <div className="notice notice-warning">
              <p>{deckTexts.publicDroppedNotice(data.dropped)}</p>
            </div>
          )}
          {data.items.length === 0 ? (
            <div className="empty deck-empty">
              <p>{deckTexts.publicEmpty}</p>
            </div>
          ) : (
            <ul className="deck-list public-deck-list" aria-label={deckTexts.publicListLabel}>
              {data.items.map((deck) => (
                <li key={deck.pubId} className="deck-row public-deck-row">
                  <div className="deck-card-body">
                    <h2 className="deck-name">{deck.name}</h2>
                    <p className="public-deck-legends">
                      <span className="visually-hidden">{deckTexts.publicLegends}: </span>
                      {deck.legends === '' ? deckTexts.publicNoLegends : deck.legends}
                    </p>
                    <p className="deck-counts">{deckTexts.publicCardCount(deck.cardCount)}</p>
                    <p className="public-deck-by">
                      {deckTexts.publicBy}: {deck.nickname ?? deckTexts.publicAnonymous}
                    </p>
                    <p className="deck-updated">
                      {deckTexts.publicUpdated}{' '}
                      <time dateTime={deck.updatedAt}>{dateFormat.format(new Date(deck.updatedAt))}</time>
                    </p>
                  </div>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="button-primary"
                      data-public-open={deck.pubId}
                      aria-label={deckTexts.publicOpenLabel(deck.name)}
                      onClick={() => onOpen(deck.pubId)}
                    >
                      {deckTexts.publicOpen}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="public-deck-actions">
            {data.next !== null && (
              <button type="button" className="button-secondary" disabled={more === 'loading'} onClick={loadMore}>
                {more === 'loading' ? deckTexts.publicMoreLoading : deckTexts.publicMore}
              </button>
            )}
            <button type="button" className="button-secondary" disabled={refreshing} onClick={() => refresh()}>
              {refreshing ? deckTexts.publicRefreshing : deckTexts.publicRefresh}
            </button>
          </div>
          {more === 'error' && (
            <p className="field-error" role="alert">
              {deckTexts.publicError}
            </p>
          )}
        </>
      )}
    </>
  );
}
