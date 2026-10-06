import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { variantImageUrl } from '../data/variantImages';
import { artRarity, artsOf, entryChanges, ownedPerArt, setArtCount } from '../domain/arts';
import type { Art } from '../domain/arts';
import type { Card } from '../domain/card';
import type { CardKey } from '../domain/cardKey';
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
import type { CollectionEntry } from '../domain/collection';
import { toCardsByKey } from '../domain/deckRules';
import { setFilterId } from '../domain/printing';
import { hasSetPrinting, setOptions } from '../domain/setFilter';
import {
  DEFAULT_PROXY_OPTIONS,
  GAPS_MM,
  layoutSheets,
  MAX_PROXY_CARDS,
  queueCopies,
  queueTotal,
  sheetCount,
} from '../domain/proxySheet';
import type { GapMm } from '../domain/proxySheet';
import type { Repositories } from '../storage';
import { ActiveFilters, criteriaFilters } from './ActiveFilters';
import type { ActiveFilter } from './ActiveFilters';
import { CardFilters } from './CardFilters';
import { CardImageDialog } from './CardImageDialog';
import { CardList } from './CardList';
import type { CardListItem, OwnedColumn } from './CardList';
import { cardNameText } from './CardName';
import { saveErrorLive } from './CollectionNotices';
import { countIn, versionCountIn } from './collectionStore';
import { ImageSizeSelect } from './ListToolbar';
import type { ImageSize } from './ListToolbar';
import { ProxySheets } from './ProxySheets';
import { proxyTexts } from './proxyTexts';
import { useProxyQueue } from './SendToProxy';
import { SortSelect } from './SortSelect';
import { cardCount, texts } from './texts';
import { WIDE_QUERY } from './useMediaQuery';

const hasArt = (key: string, rarity: string) => variantImageUrl(key, rarity) !== null;

/** Waits until the pictures are decoded, so the printout has no empty places (a missing decode() just continues). */
async function decodeAll(root: ParentNode): Promise<void> {
  const images = [...root.querySelectorAll('img')];
  await Promise.all(
    images.map((image) =>
      typeof image.decode === 'function' ? image.decode().catch(() => undefined) : Promise.resolve(),
    ),
  );
}

/** Asks whether the queue is cleared after printing. */
function ClearQueueDialog({
  ask,
  onKeep,
  onClear,
}: {
  ask: { cards: number; afterPrint: boolean } | null;
  onKeep: () => void;
  onClear: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const open = ask !== null;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog proxy-screen"
      aria-labelledby={titleId}
      onClose={onKeep}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
    >
      {ask !== null && (
        <div className="confirm-dialog-body">
          <h2 id={titleId}>{proxyTexts.clearTitle}</h2>
          <p>{ask.afterPrint ? proxyTexts.clearBody(ask.cards) : proxyTexts.clearManualBody(ask.cards)}</p>
          <div className="row-actions">
            <button type="button" className="button-secondary" onClick={() => dialogRef.current?.close()}>
              {proxyTexts.clearKeep}
            </button>
            <button type="button" className="button-primary" onClick={onClear}>
              {proxyTexts.clearConfirm}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

/**
 * Proxy section (T-102): cards are added to a print queue like in the Cards section, the queue is saved in this
 * browser, and the sheets are printed with the browser's print dialog. Card data is rendered as React text (SR-1).
 */
export function ProxyView({ cards: allCards, repositories }: { cards: readonly Card[]; repositories: Repositories }) {
  const queue = useProxyQueue(repositories.proxy);
  const { snapshot, store } = queue;
  const ready = snapshot.phase === 'ready';
  const headingRef = useRef<HTMLHeadingElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queueRef = useRef<HTMLElement>(null);
  const addRef = useRef<HTMLElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const [criteria, setCriteria] = useState<CardFilterCriteria>(EMPTY_CRITERIA);
  const [setChoice, setSetChoice] = useState<string | null>(null);
  const [sort, setSort] = useState<CardSort>(DEFAULT_SORT);
  const [imageSize, setImageSize] = useState<ImageSize>('medium');
  const [live, setLive] = useState('');
  const [openCard, setOpenCard] = useState<Card | null>(null);
  const [shownArt, setShownArt] = useState<string | null>(null);
  const [gapMm, setGapMm] = useState<GapMm>(DEFAULT_PROXY_OPTIONS.gapMm);
  const [cutMarks, setCutMarks] = useState(DEFAULT_PROXY_OPTIONS.cutMarks);
  const [showMark, setShowMark] = useState(true);
  const [calibration, setCalibration] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [askClear, setAskClear] = useState<{ cards: number; afterPrint: boolean } | null>(null);
  const collectionAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  // The print rules in styles.css hide the rest of the page only while this view is open.
  useEffect(() => {
    document.body.classList.add('is-proxy-view');
    return () => document.body.classList.remove('is-proxy-view');
  }, []);

  const cardsByKey = useMemo(() => toCardsByKey(allCards), [allCards]);
  const names = useMemo(() => new Map(allCards.map((card) => [card.key, cardNameText(card)])), [allCards]);
  useEffect(() => {
    let last: { card: CardKey; to: number } | null = null;
    return store.onEvent((event) => {
      if (event.type === 'saved') last = { card: event.card, to: event.to };
      else if (event.type === 'save-failed') {
        last = null;
        setLive(saveErrorLive(event.kind));
      } else if (event.type === 'idle' && last !== null) {
        const name = names.get(last.card);
        if (name !== undefined) setLive(proxyTexts.queuedLive(name, last.to));
        last = null;
      }
    });
  }, [store, names]);


  /** The card's row as shown now, with unsaved changes. */
  const entryOf = (card: Card): CollectionEntry | undefined => {
    const count = countIn(snapshot, card.key);
    if (count === 0) return undefined;
    const versions: Record<string, number> = {};
    for (const printing of card.printings ?? []) {
      const n = versionCountIn(snapshot, card.key, printing.key);
      if (n > 0) versions[printing.key] = n;
    }
    return Object.keys(versions).length > 0 ? { card: card.key, count, versions } : { card: card.key, count };
  };
  /** Saves the change from `before` to `after`: the version counters first (the total follows them), then a count that still differs. */
  const writeEntry = (card: Card, before: CollectionEntry | undefined, after: CollectionEntry | undefined) => {
    const changes = entryChanges(before, after);
    let count = before?.count ?? 0;
    for (const [printing, n] of changes.versions) {
      count += n - (before?.versions?.[printing] ?? 0);
      store.setVersionCount(card.key, printing, n);
    }
    const wanted = after?.count ?? 0;
    if (count !== wanted) store.setCount(card.key, wanted);
  };
  const artsByCard = useMemo(() => new Map(allCards.map((card) => [card.key, artsOf(card, hasArt)])), [allCards]);
  const artsFor = (card: Card) => artsByCard.get(card.key) ?? [];
  // The queue on screen: the cards with copies in it (saved rows with the unsaved counts over them), by name.
  const queuedCards = allCards.filter((card) => countIn(snapshot, card.key) > 0);
  queuedCards.sort((a, b) => a.displayName.localeCompare(b.displayName, 'en'));
  const shownEntries = queuedCards.map((card) => entryOf(card)).filter((entry): entry is CollectionEntry => entry !== undefined);
  const shown = { entries: shownEntries };
  const total = queueTotal(shown);
  const full = total >= MAX_PROXY_CARDS;

  const handleCountChange = (card: Card, count: number) => {
    if (count > countIn(snapshot, card.key) && full) {
      setLive(proxyTexts.queueFullLive);
      return;
    }
    store.setCount(card.key, count);
  };
  const handleArtChange = (card: Card, art: Art, next: number) => {
    const before = entryOf(card);
    const current = ownedPerArt(before, card, artsFor(card)).get(art.artId) ?? 0;
    if (next > current && total + next - current > MAX_PROXY_CARDS) {
      setLive(proxyTexts.queueFullLive);
      return;
    }
    try {
      const after = setArtCount({ entries: before === undefined ? [] : [before] }, card, art.artId, next, artsFor(card));
      writeEntry(card, before, after.entries[0]);
    } catch {
      setLive(proxyTexts.queueFullLive);
    }
  };

  const owned: OwnedColumn = {
    mode: snapshot.phase === 'ready' ? 'ready' : snapshot.phase === 'loading' ? 'loading' : 'locked',
    countOf: (card) => countIn(snapshot, card.key),
    onChange: handleCountChange,
    onLimit: () => setLive(proxyTexts.queueFullLive),
    artCountOf: (card, art) => ownedPerArt(entryOf(card), card, artsFor(card)).get(art.artId) ?? 0,
    onArtChange: handleArtChange,
    editable: true,
    kind: 'proxy',
  };

  // The search (the same filters as the Cards section; the filters of the collection are left out).
  const setList = useMemo(() => setOptions(allCards), [allCards]);
  const filtered = useMemo(
    () => filterCards(allCards, criteria).filter((card) => setChoice === null || hasSetPrinting(card, setChoice)),
    [allCards, criteria, setChoice],
  );
  const sorted = useMemo(() => sortCards(filtered, sort.key, sort.direction), [filtered, sort]);
  const filterActive = isFilterActive(criteria) || setChoice !== null;
  const artMatchesFilter = (art: Art) =>
    art.printings.some(
      (p) =>
        (criteria.rarities.length === 0 || (p.rarity !== null && criteria.rarities.includes(officialRarity(p.rarity)))) &&
        (setChoice === null || setFilterId(p) === setChoice),
    );
  /** One box per art (a card without arts: one box). */
  const toItems = (list: readonly Card[], onlyQueued: boolean): CardListItem[] =>
    list.flatMap((card): CardListItem[] => {
      const arts = artsFor(card);
      if (arts.length === 0) return [{ card, art: null, imageUrl: null, artCount: 1 }];
      const perArt = ownedPerArt(entryOf(card), card, arts);
      const matching = arts.filter(artMatchesFilter);
      return (onlyQueued || matching.length === 0 ? arts : matching)
        .filter((art) => !onlyQueued || (perArt.get(art.artId) ?? 0) > 0)
        .map((art) => ({
          card,
          art,
          imageUrl: art.rarity === null ? null : variantImageUrl(card.key, art.rarity),
          artCount: arts.length,
          rarity: artRarity(card, art),
        }));
    });
  const resultItems = toItems(sorted, false);
  const queueItems = toItems(queuedCards, true);

  const activeFilters: ActiveFilter[] = [
    ...(setChoice === null
      ? []
      : [{ id: 'set', label: setList.find((option) => option.family === setChoice)?.label ?? setChoice, onRemove: () => setSetChoice(null) }]),
    ...criteriaFilters(criteria, setCriteria),
  ];
  const handleClearFilters = () => {
    setSetChoice(null);
    setCriteria(EMPTY_CRITERIA);
    searchInputRef.current?.focus();
  };

  // The sheets.
  const copies = queueCopies(shown, cardsByKey, variantImageUrl);
  const sheets = layoutSheets(copies, { gapMm, cutMarks });
  const sheetTotal = sheetCount(total);

  const handlePrint = async () => {
    if (total === 0 || preparing) return;
    setPreparing(true);
    try {
      if (printAreaRef.current !== null) await decodeAll(printAreaRef.current);
      window.print();
    } finally {
      setPreparing(false);
      setAskClear({ cards: total, afterPrint: true });
    }
  };
  const handleClear = () => {
    for (const card of queuedCards) store.setCount(card.key, 0);
    setAskClear(null);
    setLive(proxyTexts.queueCleared);
    headingRef.current?.focus();
  };
  const handleKeep = () => setAskClear(null);

  const scrollTo = (target: RefObject<HTMLElement | null>) => {
    target.current?.scrollIntoView({ block: 'start' });
    target.current?.focus({ preventScroll: true });
  };
  const handleOpenImage = (card: Card, opener: HTMLButtonElement, artUrl: string | null = null) => {
    openerRef.current = opener;
    setOpenCard(card);
    setShownArt(artUrl);
  };
  const handleCloseImage = () => {
    setOpenCard(null);
    setShownArt(null);
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener?.isConnected) opener.focus();
    else searchInputRef.current?.focus();
  };

  const status = filterActive ? texts.filteredStatus(filtered.length, allCards.length) : cardCount(allCards.length);

  return (
    <>
      <div className="proxy-screen">
        <div className="page-head">
          <h1 ref={headingRef} tabIndex={-1}>
            {proxyTexts.heading}
          </h1>
          <div className="page-head-status">
            <p className="status-line is-summary" id="proxy-summary">
              {proxyTexts.summary(total, sheetTotal)}
            </p>
          </div>
        </div>
        <p>{proxyTexts.intro}</p>
        <p className="proxy-disclaimer">{proxyTexts.disclaimer}</p>
        {/* Stays mounted so screen readers announce each change. */}
        <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
          {live}
        </div>
        {snapshot.saveError !== null && (
          <p className="notice" role="alert">
            {saveErrorLive(snapshot.saveError)}{' '}
            <button type="button" className="button-secondary" onClick={() => store.dismissSaveError()}>
              {texts.accountSignedOutDismiss}
            </button>
          </p>
        )}
        {snapshot.phase === 'loading' && <p>{proxyTexts.queueLoading}</p>}
        {(snapshot.phase === 'unavailable' || snapshot.phase === 'locked') && <p role="alert">{proxyTexts.queueUnavailable}</p>}
        <div className="proxy-jump">
          <button type="button" className="button-secondary" onClick={() => scrollTo(queueRef)}>
            {proxyTexts.jumpToQueue}
          </button>
          <button type="button" className="button-secondary" onClick={() => scrollTo(addRef)}>
            {proxyTexts.jumpToAdd}
          </button>
        </div>

        <section ref={addRef} tabIndex={-1} className="proxy-add" aria-labelledby="proxy-add-heading">
          <h2 id="proxy-add-heading">{proxyTexts.addHeading}</h2>
          <p className="hint">{proxyTexts.addIntro}</p>
          <div className="catalog-layout">
            <section className="catalog-filters" aria-labelledby="proxy-filters-heading">
              <h2 id="proxy-filters-heading" className="filters-heading">
                {proxyTexts.filtersHeading}
              </h2>
              <CardFilters
                criteria={criteria}
                setOptions={setList}
                setFamily={setChoice}
                onSetChange={setSetChoice}
                typeOptions={filterOptions(KNOWN_CARD_TYPES, allCards.map((card) => card.type), criteria.types)}
                colorOptions={filterOptions(KNOWN_CARD_COLORS, allCards.map((card) => card.color), criteria.colors)}
                rarityOptions={filterOptions(
                  KNOWN_CARD_RARITIES,
                  allCards
                    .flatMap((card) => [card.rarity, ...(card.printings ?? []).map((p) => p.rarity)])
                    .map((r) => (r === null ? null : officialRarity(r))),
                  criteria.rarities,
                )}
                numberOptions={numberFilterOptionsFor(allCards, criteria)}
                searchInputRef={searchInputRef}
                collectionAllRef={collectionAllRef}
                onCollectionFilterChange={() => undefined}
                onQueryChange={(query) => setCriteria({ ...criteria, query })}
                onToggleType={(type) => setCriteria({ ...criteria, types: toggleValue(criteria.types, type) })}
                onToggleColor={(color) => setCriteria({ ...criteria, colors: toggleValue(criteria.colors, color) })}
                onToggleSellable={() => setCriteria({ ...criteria, sellable: criteria.sellable !== true })}
                onToggleRarity={(rarity) => setCriteria({ ...criteria, rarities: toggleValue(criteria.rarities, rarity) })}
                onToggleNumber={(group, value) => setCriteria({ ...criteria, [group]: toggleValue(criteria[group], value) })}
                onSearchSubmit={() => setLive(status)}
                collapsibleBelow={WIDE_QUERY}
                results={{ count: filtered.length, id: 'proxy-results' }}
              />
            </section>

            <section id="proxy-results" className="catalog-results" aria-labelledby="proxy-results-heading" data-image-size={imageSize}>
              <h2 id="proxy-results-heading" className="visually-hidden">
                {proxyTexts.resultsHeading}
              </h2>
              <p className="status-line">{status}</p>
              <div className="list-toolbar">
                <ImageSizeSelect name="proxy-image-size" value={imageSize} onChange={setImageSize} />
              </div>
              <div className="sort-row">
                <SortSelect sort={sort} onChange={setSort} />
              </div>
              <ActiveFilters
                filters={activeFilters}
                showClear={filterActive && filtered.length > 0}
                onClear={handleClearFilters}
                searchInputRef={searchInputRef}
              />
              {filtered.length === 0 ? (
                <div className="empty">
                  <p>{proxyTexts.noResults}</p>
                  {filterActive && (
                    <button type="button" className="button-primary" onClick={handleClearFilters}>
                      {proxyTexts.clearFilters}
                    </button>
                  )}
                </div>
              ) : (
                <CardList
                  cards={sorted}
                  items={resultItems}
                  caption={proxyTexts.resultsCaption}
                  owned={owned}
                  onOpenImage={handleOpenImage}
                />
              )}
            </section>
          </div>
        </section>

        <section ref={queueRef} tabIndex={-1} className="proxy-queue" aria-labelledby="proxy-queue-heading">
          <h2 id="proxy-queue-heading">{proxyTexts.queueHeading}</h2>
          {ready && total === 0 && <p>{proxyTexts.queueEmpty}</p>}
          {full && <p className="notice">{proxyTexts.queueFull}</p>}
          {queueItems.length > 0 && (
            <div className="catalog-results" data-image-size={imageSize}>
              <CardList cards={queuedCards} items={queueItems} caption={proxyTexts.queueCaption} owned={owned} onOpenImage={handleOpenImage} />
            </div>
          )}

          <fieldset className="proxy-settings">
            <legend>{proxyTexts.settingsHeading}</legend>
            <fieldset className="view-select">
              <legend>{proxyTexts.gapLegend}</legend>
              <div className="options">
                {GAPS_MM.map((gap) => (
                  <label key={gap} className="option">
                    <input type="radio" name="proxy-gap" value={gap} checked={gapMm === gap} onChange={() => setGapMm(gap)} />{' '}
                    {proxyTexts.gapOption(gap)}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="option">
              <input type="checkbox" checked={cutMarks} onChange={(event) => setCutMarks(event.target.checked)} /> {proxyTexts.cutMarks}
            </label>
            <label className="option">
              <input type="checkbox" checked={showMark} onChange={(event) => setShowMark(event.target.checked)} /> {proxyTexts.proxyMark}
            </label>
            <label className="option">
              <input type="checkbox" checked={calibration} onChange={(event) => setCalibration(event.target.checked)} />{' '}
              {proxyTexts.calibration}
              <span className="hint"> {proxyTexts.calibrationHint}</span>
            </label>
          </fieldset>

          <div className="proxy-print-bar">
            <button type="button" className="button-primary" disabled={total === 0 || preparing} onClick={() => void handlePrint()}>
              {preparing ? proxyTexts.preparing : proxyTexts.printButton}
            </button>
            {ready && total > 0 && (
              <button type="button" className="button-secondary" onClick={() => setAskClear({ cards: total, afterPrint: false })}>
                {proxyTexts.clearQueue}
              </button>
            )}
            <p className="hint proxy-print-hint">{total === 0 ? proxyTexts.printNothing : proxyTexts.printHint}</p>
          </div>
        </section>

        <h2 className="proxy-preview-heading">{proxyTexts.previewHeading}</h2>
        <p className="hint">
          {proxyTexts.summary(total, sheetTotal)}. {proxyTexts.previewHint}
        </p>
      </div>

      {/* The only part that is printed; on screen it is the preview. */}
      <div className="proxy-print-area" ref={printAreaRef}>
        <ProxySheets sheets={sheets} showMark={showMark} calibration={calibration} />
      </div>

      <ClearQueueDialog ask={askClear} onKeep={handleKeep} onClear={handleClear} />
      <div className="proxy-screen">
        <CardImageDialog card={openCard} onClose={handleCloseImage} artUrl={shownArt} />
      </div>
    </>
  );
}
