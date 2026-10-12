import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { artRarity, artsOf, matchedSpecialRarity } from '../domain/arts';
import type { Card } from '../domain/card';
import { variantImageUrl } from '../data/variantImages';
import {
  EMPTY_CRITERIA,
  filterCards,
  filterOptions,
  isFilterActive,
  KNOWN_CARD_COLORS,
  KNOWN_CARD_RARITIES,
  KNOWN_CARD_TYPES,
  numberFilterOptionsFor,
  officialRarity,
  toggleValue,
} from '../domain/cardSearch';
import type { CardFilterCriteria } from '../domain/cardSearch';
import { DEFAULT_SORT, sortCards } from '../domain/cardSort';
import type { CardSort } from '../domain/cardSort';
import { toCardsByKey } from '../domain/deckRules';
import { hasSetPrinting, setOptions } from '../domain/setFilter';
import type { TradeKeep } from '../domain/tradeRule';
import type { CatalogViewMode, Repositories } from '../storage';
import { ActiveFilters, criteriaFilters } from './ActiveFilters';
import type { ActiveFilter } from './ActiveFilters';
import { CardFilters } from './CardFilters';
import { CardImageDialog } from './CardImageDialog';
import { CardList } from './CardList';
import type { CardListItem } from './CardList';
import { cardNameText } from './CardName';
import { CardTable } from './CardTable';
import { ImageSizeSelect, SwitchButton, VIEW_OPTIONS } from './ListToolbar';
import type { ImageSize } from './ListToolbar';
import { saveErrorLive } from './CollectionNotices';
import { countIn } from './collectionStore';
import { CountControl } from './CountControl';
import { SegmentedChoice } from './SegmentedChoice';
import { ShareTradeButton } from './ShareTradeButton';
import { texts } from './texts';
import { useCollection } from './useCollection';
import { useTradeRule } from './useTradeRule';
import { useWants } from './useWants';
import { WIDE_QUERY } from './useMediaQuery';
import { proxyTexts } from './proxyTexts';
import { InfoTip } from './InfoTip';
import { SendToProxyButton, useProxyQueue } from './SendToProxy';

/** A special rarity is an art only when its picture exists (D-021). */
const hasArt = (key: string, rarity: string) => variantImageUrl(key, rarity) !== null;

type Tab = 'want' | 'have';
type WantScope = 'list' | 'all';

const KEEP_OPTIONS: readonly (readonly [TradeKeep, string])[] = [
  ['playset', texts.tradeKeepPlayset],
  ['one', texts.tradeKeepOne],
  ['none', texts.tradeKeepNone],
];

/**
 * Have/Want section (T-065, T-135): Want and Have as tabs with the same search, filters, order and picture/list view as
 * the other card pages. Want shows the want list or all cards to add from; Have shows the tradeable copies under the
 * user's trade rule (keep a playset, one or nothing; optionally the deck copies). Card data is rendered as React text (SR-1).
 */
export function HaveWantView({ cards, repositories }: { cards: readonly Card[]; repositories: Repositories }) {
  const { snapshot: collection } = useCollection(repositories.collection);
  const { snapshot: wants, store: wantsStore } = useWants(repositories.wants);
  const proxyQueue = useProxyQueue(repositories.proxy);
  const cardsByKey = useMemo(() => toCardsByKey(cards), [cards]);
  const { rule, setRule, tradeableOf } = useTradeRule(repositories, cardsByKey);
  const [tab, setTab] = useState<Tab>('want');
  const [scope, setScope] = useState<WantScope | null>(null);
  const [view, setView] = useState<CatalogViewMode>('grid');
  const [criteria, setCriteria] = useState<CardFilterCriteria>(EMPTY_CRITERIA);
  const [setChoice, setSetChoice] = useState<string | null>(null);
  const [live, setLive] = useState('');
  const [sort, setSort] = useState<CardSort>(DEFAULT_SORT);
  const [imageSize, setImageSize] = useState<ImageSize>('medium');
  const [openCard, setOpenCard] = useState<Card | null>(null);
  const imageOpenerRef = useRef<HTMLButtonElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const wantHeadingRef = useRef<HTMLHeadingElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const collectionAllRef = useRef<HTMLInputElement>(null);
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
  const wantedCount = useMemo(() => (wantReady ? cards.filter((card) => countIn(wants, card.key) > 0).length : 0), [wantReady, cards, wants]);
  // An empty want list opens on all cards, so there is something to add from. Fixed once the list has loaded, so the
  // view does not jump when the last card leaves the list; a choice of the user wins.
  if (wantReady && scope === null) setScope(wantedCount === 0 ? 'all' : 'list');
  const wantScope: WantScope = scope ?? (wantedCount === 0 ? 'all' : 'list');
  const tradeable = useMemo(
    () => (collection.phase === 'ready' ? tradeableOf(collection.saved) : new Map<string, number>()),
    [collection.phase, collection.saved, tradeableOf],
  );

  // The search: the same filters as the Cards section; the collection filter is left out.
  const setList = useMemo(() => setOptions(cards), [cards]);
  const matching = useMemo(
    () => filterCards(cards, criteria).filter((card) => setChoice === null || hasSetPrinting(card, setChoice)),
    [cards, criteria, setChoice],
  );
  const shown = useMemo(() => {
    const base =
      tab === 'have'
        ? matching.filter((card) => tradeable.has(card.key))
        : wantScope === 'list'
          ? matching.filter((card) => countIn(wants, card.key) > 0)
          : matching;
    return sortCards(base, sort.key, sort.direction);
  }, [tab, matching, tradeable, wantScope, wants, sort]);
  const filterActive = isFilterActive(criteria) || setChoice !== null;

  // As on the Cards page (D-021, T-141): a box starts on the special art a rarity or set filter matches, e.g. Nova Rare.
  const artsByCard = useMemo(() => new Map(cards.map((card) => [card.key, artsOf(card, hasArt)])), [cards]);
  const filterArtUrl = (card: Card): string | null => {
    const rarity = matchedSpecialRarity(card, criteria.rarities, setChoice, hasArt);
    return rarity === null ? null : variantImageUrl(card.key, rarity);
  };
  const rarityOf = (card: Card): string | null => matchedSpecialRarity(card, criteria.rarities, setChoice, hasArt) ?? card.rarity;
  const gridItems = shown.map((card): CardListItem => {
    const arts = artsByCard.get(card.key) ?? [];
    const imageUrl = filterArtUrl(card);
    const versionUrls = arts.map((art) => (art.rarity === null ? null : variantImageUrl(card.key, art.rarity)));
    const versionRarities = arts.map((art) => artRarity(card, art));
    const lone = arts.length === 1 && arts[0] !== undefined ? artRarity(card, arts[0]) : undefined;
    return { card, art: null, imageUrl, artCount: arts.length, versionUrls, versionRarities, startVersion: Math.max(0, versionUrls.indexOf(imageUrl)), rarity: lone };
  });
  const activeFilters: ActiveFilter[] = [
    ...(setChoice === null
      ? []
      : [{ id: 'set', label: setList.find((option) => option.family === setChoice)?.label ?? setChoice, onRemove: () => setSetChoice(null) }]),
    ...criteriaFilters(criteria, setCriteria),
  ];
  const clearFilters = () => {
    setSetChoice(null);
    setCriteria(EMPTY_CRITERIA);
    searchInputRef.current?.focus();
  };

  const change = (card: Card, count: number) => {
    wantsStore.setCount(card.key, count);
    // In the want list the row leaves; keep focus on the page instead of letting it fall to <body>.
    if (count === 0 && wantScope === 'list') wantHeadingRef.current?.focus();
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

  const wantFoot = (card: Card) => {
    const count = countIn(wants, card.key);
    return (
      <>
        <CountControl card={card} count={count} mode="ready" onChange={change} onLimit={limit} editable kind="want" />
        {count > 0 && (
          <SendToProxyButton
            rows={[{ card: card.key, count }]}
            queue={proxyQueue}
            label={proxyTexts.sendWant}
            name={proxyTexts.sendWantName(cardNameText(card))}
            className="link-button"
          />
        )}
      </>
    );
  };
  const haveFoot = (card: Card) => (
    <p className="have-want-owned">
      {texts.haveRow(tradeable.get(card.key) ?? 0)}
      <span className="hint"> · {texts.haveOwnedRow(countIn(collection, card.key))}</span>
    </p>
  );

  const results = (caption: string, foot: (card: Card) => ReactNode, columnLabel: string) =>
    view === 'grid' ? (
      <CardList cards={shown} items={gridItems} caption={caption} onOpenImage={openImage} renderFoot={foot} />
    ) : (
      <CardTable
        cards={shown}
        caption={caption}
        onOpenImage={openImage}
        sort={sort}
        onSortChange={setSort}
        artUrlOf={filterArtUrl}
        rarityOf={rarityOf}
        extraColumn={{ label: columnLabel, render: foot }}
      />
    );
  const noResults = (empty: string) => (
    <div className="empty">
      <p>{filterActive ? texts.wantSearchNone : empty}</p>
      {filterActive && (
        <button type="button" className="button-secondary" onClick={clearFilters}>
          {texts.clearFilters}
        </button>
      )}
    </div>
  );

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
      {collection.phase === 'ready' && wantReady && <ShareTradeButton have={collection.saved} want={wants.saved} tradeable={tradeable} />}

      <div className="catalog-layout">
        <section className="catalog-filters" aria-labelledby="hw-filters-heading">
          <h2 id="hw-filters-heading" className="filters-heading">
            {texts.filtersHeading}
          </h2>
          <CardFilters
            criteria={criteria}
            setOptions={setList}
            setFamily={setChoice}
            onSetChange={setSetChoice}
            typeOptions={filterOptions(KNOWN_CARD_TYPES, cards.map((card) => card.type), criteria.types)}
            colorOptions={filterOptions(KNOWN_CARD_COLORS, cards.map((card) => card.color), criteria.colors)}
            rarityOptions={filterOptions(
              KNOWN_CARD_RARITIES,
              cards.flatMap((card) => [card.rarity, ...(card.printings ?? []).map((p) => p.rarity)]).map((r) => (r === null ? null : officialRarity(r))),
              criteria.rarities,
            )}
            numberOptions={numberFilterOptionsFor(cards, criteria)}
            searchInputRef={searchInputRef}
            collectionAllRef={collectionAllRef}
            onCollectionFilterChange={() => undefined}
            onQueryChange={(query) => setCriteria({ ...criteria, query })}
            onToggleType={(type) => setCriteria({ ...criteria, types: toggleValue(criteria.types, type) })}
            onToggleColor={(color) => setCriteria({ ...criteria, colors: toggleValue(criteria.colors, color) })}
            onToggleSellable={() => setCriteria({ ...criteria, sellable: criteria.sellable !== true })}
            onToggleRarity={(rarity) => setCriteria({ ...criteria, rarities: toggleValue(criteria.rarities, rarity) })}
            onToggleNumber={(group, value) => setCriteria({ ...criteria, [group]: toggleValue(criteria[group], value) })}
            onSearchSubmit={() => undefined}
            collapsibleBelow={WIDE_QUERY}
            results={{ count: shown.length, id: 'have-want-results' }}
            sort={sort}
            onSortChange={setSort}
          />
        </section>

        <section id="have-want-results" className="catalog-results have-want-results" aria-label={texts.resultsHeading} data-image-size={imageSize}>
          <SegmentedChoice
            className="hw-tabs"
            legend={texts.hwTabsLegend}
            name="have-want-tab"
            value={tab}
            options={[
              ['want', texts.hwTabWant(wantedCount)],
              ['have', texts.hwTabHave(tradeable.size)],
            ]}
            onChange={setTab}
          />

          <div className="list-toolbar">
            <SegmentedChoice legend={texts.viewLegend} name="have-want-view" value={view} options={VIEW_OPTIONS} onChange={setView} />
            <ImageSizeSelect name="have-want-image-size" value={imageSize} onChange={setImageSize} disabled={view !== 'grid'} />
          </div>
          <ActiveFilters filters={activeFilters} showClear={filterActive && shown.length > 0} onClear={clearFilters} searchInputRef={searchInputRef} />

          {tab === 'want' && (
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
                  <div className="hw-scope-row">
                    <SegmentedChoice
                      className="hw-scope"
                      legend={texts.wantScopeLegend}
                      name="want-scope"
                      value={wantScope}
                      options={[
                        ['list', texts.wantScopeList],
                        ['all', texts.wantScopeAll],
                      ]}
                      onChange={setScope}
                    />
                    {wantScope === 'list' && wantedCount > 0 && (
                      <SendToProxyButton
                        rows={cards.filter((card) => countIn(wants, card.key) > 0).map((card) => ({ card: card.key, count: countIn(wants, card.key) }))}
                        queue={proxyQueue}
                        label={proxyTexts.sendAllWants}
                        className="link-button missing-link"
                      />
                    )}
                  </div>
                  {shown.length === 0 ? noResults(texts.wantEmpty) : results(texts.wantHeading, wantFoot, texts.wantColumn)}
                </>
              )}
            </section>
          )}

          {tab === 'have' && (
            <section aria-labelledby="have-heading">
              <div className="heading-row has-info-tip">
                <h2 id="have-heading">{texts.haveHeading}</h2>
                <InfoTip>{texts.haveIntro}</InfoTip>
              </div>
              <div className="hw-scope-row trade-rule">
                <SegmentedChoice
                  className="hw-scope"
                  legend={texts.tradeRuleLegend}
                  legendVisible
                  name="trade-keep"
                  value={rule.keep}
                  options={KEEP_OPTIONS}
                  describedBy="trade-rule-hint"
                  onChange={(keep) => setRule({ ...rule, keep })}
                >
                  <p id="trade-rule-hint" className="visually-hidden">
                    {texts.tradeRuleHint}
                  </p>
                </SegmentedChoice>
                <SwitchButton checked={rule.keepDeckCards} label={texts.tradeKeepDecks} onChange={(keepDeckCards) => setRule({ ...rule, keepDeckCards })} />
              </div>
              {collection.phase === 'loading' && <p>{texts.haveLoading}</p>}
              {(collection.phase === 'unavailable' || collection.phase === 'locked') && <p role="alert">{texts.haveUnavailable}</p>}
              {collection.phase === 'ready' && (shown.length === 0 ? noResults(texts.haveEmpty) : results(texts.haveHeading, haveFoot, texts.haveColumn))}
            </section>
          )}
        </section>
      </div>
      <CardImageDialog card={openCard} onClose={closeImage} />
    </>
  );
}
