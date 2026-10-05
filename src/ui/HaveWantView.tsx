import { useEffect, useMemo, useRef, useState } from 'react';
import type { Card } from '../domain/card';
import { EMPTY_CRITERIA, filterCards } from '../domain/cardSearch';
import { MAX_COLLECTION_COUNT } from '../domain/collection';
import { toCardsByKey } from '../domain/deckRules';
import { tradeableOf } from '../domain/tradeCompare';
import type { Repositories } from '../storage';
import { CardName, cardNameText } from './CardName';
import { saveErrorLive } from './CollectionNotices';
import { countIn } from './collectionStore';
import { CountControl } from './CountControl';
import { ShareTradeButton } from './ShareTradeButton';
import { SEARCH_MAX_LENGTH } from './CardFilters';
import { texts } from './texts';
import { useCollection } from './useCollection';
import { useWants } from './useWants';

/** At most this many search results are listed; a more exact search narrows them (the list stays short). */
const MAX_RESULTS = 20;

/**
 * Have/Want section (T-065): the want list with editing and a name search for adding cards, the cards
 * that are free to trade (read only, T-063) and the trade link button. Card data is rendered as React text (SR-1).
 */
export function HaveWantView({ cards, repositories }: { cards: readonly Card[]; repositories: Repositories }) {
  const { snapshot: collection } = useCollection(repositories.collection);
  const { snapshot: wants, store: wantsStore } = useWants(repositories.wants);
  const [query, setQuery] = useState('');
  const [live, setLive] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const wantHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // The last saved change is announced once the saves are done, as in the card list.
  const names = useMemo(() => new Map(cards.map((card) => [card.key, cardNameText(card)])), [cards]);
  useEffect(() => {
    let last: { card: string; to: number } | null = null;
    return wantsStore.onEvent((event) => {
      if (event.type === 'saved') last = { card: event.card, to: event.to };
      else if (event.type === 'save-failed') {
        last = null;
        setLive(saveErrorLive(event.kind));
      } else if (event.type === 'idle' && last !== null) {
        const name = names.get(last.card);
        if (name !== undefined) setLive(texts.wantLive(name, last.to));
        last = null;
      }
    });
  }, [wantsStore, names]);

  const wantReady = wants.phase === 'ready';
  const wantedCards = wantReady ? cards.filter((card) => countIn(wants, card.key) > 0) : [];
  const matches = useMemo(
    () => (query.trim() === '' ? [] : filterCards(cards, { ...EMPTY_CRITERIA, query })),
    [cards, query],
  );
  const have = useMemo(() => {
    if (collection.phase !== 'ready') return [];
    const { counts } = tradeableOf(collection.saved, toCardsByKey(cards));
    return cards.flatMap((card) => {
      const tradeable = counts.get(card.key);
      return tradeable === undefined ? [] : [{ card, tradeable }];
    });
  }, [collection.phase, collection.saved, cards]);

  const change = (card: Card, count: number) => {
    wantsStore.setCount(card.key, count);
    // The row leaves the list; keep focus on the page instead of letting it fall to <body>.
    if (count === 0) wantHeadingRef.current?.focus();
  };
  const limit = (card: Card) => setLive(texts.maxReachedLive(cardNameText(card)));

  return (
    <>
      <div className="page-head">
        <h1 ref={headingRef} tabIndex={-1}>
          {texts.haveWantHeading}
        </h1>
      </div>
      <p>{texts.haveWantIntro}</p>
      {/* Stays mounted so screen readers announce each change. */}
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {live}
      </div>
      {collection.phase === 'ready' && wantReady && <ShareTradeButton have={collection.saved} want={wants.saved} />}

      <section aria-labelledby="want-heading">
        <h2 id="want-heading" ref={wantHeadingRef} tabIndex={-1}>
          {texts.wantHeading}
        </h2>
        {wants.phase === 'loading' && <p>{texts.wantLoading}</p>}
        {(wants.phase === 'unavailable' || wants.phase === 'locked') && <p role="alert">{texts.wantUnavailable}</p>}
        {wantReady && (
          <>
            <p className="hint">{texts.wantIntro}</p>
            {wantedCards.length === 0 ? (
              <p>{texts.wantEmpty}</p>
            ) : (
              <ul className="have-want-list">
                {wantedCards.map((card) => (
                  <li key={card.key}>
                    <span className="have-want-name">
                      <CardName card={card} />
                    </span>
                    <CountControl
                      card={card}
                      count={countIn(wants, card.key)}
                      mode="ready"
                      onChange={change}
                      onLimit={limit}
                      editable
                      kind="want"
                    />
                  </li>
                ))}
              </ul>
            )}

            <h3 id="want-search-heading">{texts.wantSearchHeading}</h3>
            <p>
              <label htmlFor="want-search">{texts.wantSearchLabel}</label>{' '}
              <input
                id="want-search"
                type="search"
                autoComplete="off"
                maxLength={SEARCH_MAX_LENGTH}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </p>
            {query.trim() === '' ? (
              <p className="hint">{texts.wantSearchPrompt}</p>
            ) : matches.length === 0 ? (
              <p role="status">{texts.wantSearchNone}</p>
            ) : (
              <>
                <ul className="have-want-list" aria-labelledby="want-search-heading">
                  {matches.slice(0, MAX_RESULTS).map((card) => {
                    const count = countIn(wants, card.key);
                    return (
                      <li key={card.key}>
                        <span className="have-want-name">
                          <CardName card={card} />
                          {count > 0 && <span className="hint"> ({texts.wantInList(count)})</span>}
                        </span>
                        <button
                          type="button"
                          className="button-secondary"
                          disabled={count >= MAX_COLLECTION_COUNT}
                          aria-label={`${texts.wantAddLabel}${cardNameText(card)}`}
                          onClick={() => change(card, count + 1)}
                        >
                          {texts.wantAdd}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {matches.length > MAX_RESULTS && <p className="hint">{texts.wantSearchMore(MAX_RESULTS)}</p>}
              </>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="have-heading">
        <h2 id="have-heading">{texts.haveHeading}</h2>
        {collection.phase === 'loading' && <p>{texts.haveLoading}</p>}
        {(collection.phase === 'unavailable' || collection.phase === 'locked') && (
          <p role="alert">{texts.haveUnavailable}</p>
        )}
        {collection.phase === 'ready' && (
          <>
            <p className="hint">{texts.haveIntro}</p>
            {have.length === 0 ? (
              <p>{texts.haveEmpty}</p>
            ) : (
              <ul className="have-want-list">
                {have.map(({ card, tradeable }) => (
                  <li key={card.key}>
                    <span className="have-want-name">
                      <CardName card={card} />
                    </span>
                    <span>{texts.haveRow(tradeable)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </>
  );
}
