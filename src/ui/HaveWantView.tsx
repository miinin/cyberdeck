import { useEffect, useMemo, useRef, useState } from 'react';
import type { Card } from '../domain/card';
import { EMPTY_CRITERIA, filterCards } from '../domain/cardSearch';
import { MAX_COLLECTION_COUNT } from '../domain/collection';
import { DEFAULT_SORT, sortCards } from '../domain/cardSort';
import type { CardSort } from '../domain/cardSort';
import { toCardsByKey } from '../domain/deckRules';
import { tradeableOf } from '../domain/tradeCompare';
import type { Repositories } from '../storage';
import { CardImageDialog } from './CardImageDialog';
import { CardList } from './CardList';
import { CardName, cardNameText } from './CardName';
import { ImageSizeSelect } from './ListToolbar';
import type { ImageSize } from './ListToolbar';
import { SortSelect } from './SortSelect';
import { saveErrorLive } from './CollectionNotices';
import { countIn } from './collectionStore';
import { CountControl } from './CountControl';
import { ShareTradeButton } from './ShareTradeButton';
import { SEARCH_MAX_LENGTH } from './CardFilters';
import { texts } from './texts';
import { useCollection } from './useCollection';
import { useWants } from './useWants';
import { proxyTexts } from './proxyTexts';
import { InfoTip } from './InfoTip';
import { SendToProxyButton, useProxyQueue } from './SendToProxy';

/** At most this many search results are listed; a more exact search narrows them (the list stays short). */
const MAX_RESULTS = 20;

/**
 * Have/Want section (T-065): the want list with editing and a name search for adding cards, the cards
 * that are free to trade (read only, T-063) and the trade link button. Card data is rendered as React text (SR-1).
 */
export function HaveWantView({ cards, repositories }: { cards: readonly Card[]; repositories: Repositories }) {
  const { snapshot: collection } = useCollection(repositories.collection);
  const { snapshot: wants, store: wantsStore } = useWants(repositories.wants);
  const proxyQueue = useProxyQueue(repositories.proxy);
  const [query, setQuery] = useState('');
  const [live, setLive] = useState('');
  const [sort, setSort] = useState<CardSort>(DEFAULT_SORT);
  const [imageSize, setImageSize] = useState<ImageSize>('medium');
  const [openCard, setOpenCard] = useState<Card | null>(null);
  const imageOpenerRef = useRef<HTMLButtonElement | null>(null);
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
  const wantedCards = useMemo(
    () =>
      wantReady
        ? sortCards(
            cards.filter((card) => countIn(wants, card.key) > 0),
            sort.key,
            sort.direction,
          )
        : [],
    [wantReady, cards, wants, sort],
  );
  const matches = useMemo(
    () => (query.trim() === '' ? [] : filterCards(cards, { ...EMPTY_CRITERIA, query })),
    [cards, query],
  );
  const have = useMemo(() => {
    if (collection.phase !== 'ready') return { cards: [] as Card[], counts: new Map<string, number>() };
    const { counts } = tradeableOf(collection.saved, toCardsByKey(cards));
    const tradeableCards = cards.filter((card) => counts.has(card.key));
    return { cards: sortCards(tradeableCards, sort.key, sort.direction), counts };
  }, [collection.phase, collection.saved, cards, sort]);

  const change = (card: Card, count: number) => {
    wantsStore.setCount(card.key, count);
    // The row leaves the list; keep focus on the page instead of letting it fall to <body>.
    if (count === 0) wantHeadingRef.current?.focus();
  };
  const openImage = (card: Card, opener: HTMLButtonElement) => {
    imageOpenerRef.current = opener;
    setOpenCard(card);
  };
  const closeImage = () => {
    setOpenCard(null);
    const opener = imageOpenerRef.current;
    imageOpenerRef.current = null;
    if (opener?.isConnected) opener.focus();
    else wantHeadingRef.current?.focus();
  };
  const limit = (card: Card) => setLive(texts.maxReachedLive(cardNameText(card)));

  return (
    <>
      <div className="page-head">
        <div className="heading-row has-info-tip">
          <h1 ref={headingRef} tabIndex={-1}>
            {texts.haveWantHeading}
          </h1>
          <InfoTip>{texts.haveWantIntro}</InfoTip>
        </div>
      </div>
      {/* Stays mounted so screen readers announce each change. */}
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {live}
      </div>
      {collection.phase === 'ready' && wantReady && <ShareTradeButton have={collection.saved} want={wants.saved} />}

      <div className="have-want-results" data-image-size={imageSize}>
        <div className="list-toolbar">
          <ImageSizeSelect name="have-want-image-size" value={imageSize} onChange={setImageSize} />
          <SortSelect sort={sort} onChange={setSort} />
        </div>

        <section aria-labelledby="want-heading">
          <div className="heading-row has-info-tip">
            <h2 id="want-heading" ref={wantHeadingRef} tabIndex={-1}>
              {texts.wantHeading}
            </h2>
            <InfoTip>{texts.wantIntro}</InfoTip>
          </div>
          {wants.phase === 'loading' && <p>{texts.wantLoading}</p>}
          {(wants.phase === 'unavailable' || wants.phase === 'locked') && <p role="alert">{texts.wantUnavailable}</p>}
          {wantReady && (
            <>
              {wantedCards.length > 0 && (
                <div className="missing-add proxy-send">
                  <SendToProxyButton
                    rows={wantedCards.map((card) => ({ card: card.key, count: countIn(wants, card.key) }))}
                    queue={proxyQueue}
                    label={proxyTexts.sendAllWants}
                  />
                </div>
              )}
              {wantedCards.length === 0 ? (
                <p>{texts.wantEmpty}</p>
              ) : (
                <CardList
                  cards={wantedCards}
                  caption={texts.wantHeading}
                  onOpenImage={openImage}
                  renderFoot={(card) => (
                    <>
                      <CountControl
                        card={card}
                        count={countIn(wants, card.key)}
                        mode="ready"
                        onChange={change}
                        onLimit={limit}
                        editable
                        kind="want"
                      />
                      <SendToProxyButton
                        rows={[{ card: card.key, count: countIn(wants, card.key) }]}
                        queue={proxyQueue}
                        label={proxyTexts.sendWant}
                        name={proxyTexts.sendWantName(cardNameText(card))}
                        className="link-button"
                      />
                    </>
                  )}
                />
              )}

              <h3 id="want-search-heading">{texts.wantSearchHeading}</h3>
              <div className="field want-search">
                <label htmlFor="want-search">{texts.wantSearchLabel}</label>
                <input
                  id="want-search"
                  type="search"
                  autoComplete="off"
                  maxLength={SEARCH_MAX_LENGTH}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              {query.trim() === '' ? null : matches.length === 0 ? (
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
          <div className="heading-row has-info-tip">
            <h2 id="have-heading">{texts.haveHeading}</h2>
            <InfoTip>{texts.haveIntro}</InfoTip>
          </div>
          {collection.phase === 'loading' && <p>{texts.haveLoading}</p>}
          {(collection.phase === 'unavailable' || collection.phase === 'locked') && (
            <p role="alert">{texts.haveUnavailable}</p>
          )}
          {collection.phase === 'ready' && (
            <>
              {have.cards.length === 0 ? (
                <p>{texts.haveEmpty}</p>
              ) : (
                <CardList
                  cards={have.cards}
                  caption={texts.haveHeading}
                  onOpenImage={openImage}
                  renderFoot={(card) => (
                    <p className="have-want-owned">
                      {texts.haveRow(have.counts.get(card.key) ?? 0)}
                      <span className="hint"> · {texts.haveOwnedRow(countIn(collection, card.key))}</span>
                    </p>
                  )}
                />
              )}
            </>
          )}
        </section>
      </div>
      <CardImageDialog card={openCard} onClose={closeImage} />
    </>
  );
}
