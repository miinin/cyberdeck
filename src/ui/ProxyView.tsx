import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  CARDS_PER_SHEET,
  DEFAULT_PROXY_OPTIONS,
  GAPS_MM,
  layoutSheets,
  MAX_PROXY_CARDS,
  queueCopies,
  queueTotal,
  sheetCount,
} from '../domain/proxySheet';
import type { GapMm, ProxyCopy } from '../domain/proxySheet';
import type { Repositories } from '../storage';
import { ActiveFilters, criteriaFilters } from './ActiveFilters';
import type { ActiveFilter } from './ActiveFilters';
import { CardFilters } from './CardFilters';
import { CardList } from './CardList';
import type { CardListItem, OwnedColumn } from './CardList';
import { cardNameText } from './CardName';
import { saveErrorLive } from './CollectionNotices';
import { countIn, versionCountIn } from './collectionStore';
import { ProxySheets } from './ProxySheets';
import { proxyTexts } from './proxyTexts';
import { useProxyQueue } from './SendToProxy';
import { SortSelect } from './SortSelect';
import { cardCount, texts } from './texts';

/** The filters stay collapsed behind one button in the narrow picker; the search field is always visible. */
const NEVER_QUERY = '(min-width: 9999rem)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const FLY_MS = 350;

/** A copy just added: where its picture was (for the flight) and what to look for on the sheet. */
interface PendingAdd {
  key: CardKey;
  artUrl: string | null;
  /** Copies in the queue before the add. */
  before: number;
  from: DOMRect | null;
  src: string | null;
}

/** Flies a clone of the picture from `from` to the new place on the sheet, and flashes the place. */
function playAdd(target: HTMLElement, from: DOMRect | null, src: string | null) {
  target.classList.add('is-new');
  window.setTimeout(() => target.classList.remove('is-new'), 1400);
  const reduced = typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches;
  if (reduced || from === null || src === null || typeof target.animate !== 'function') return;
  const to = target.getBoundingClientRect();
  // A target outside the window (the sheet is below the picker on a phone): only the flash and the counter.
  if (to.width === 0 || to.bottom < 0 || to.top > window.innerHeight) return;
  const clone = document.createElement('img');
  clone.src = src;
  clone.alt = '';
  clone.setAttribute('aria-hidden', 'true');
  clone.className = 'proxy-fly';
  Object.assign(clone.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
  document.body.append(clone);
  target.style.visibility = 'hidden';
  const done = () => {
    clone.remove();
    target.style.visibility = '';
  };
  const flight = clone.animate(
    [
      { transform: 'translate(0, 0) scale(1, 1)' },
      { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width}, ${to.height / from.height})` },
    ],
    { duration: FLY_MS, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
  );
  flight.onfinish = done;
  flight.oncancel = done;
}

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
  const panelRef = useRef<HTMLElement>(null);
  const panelHeadingRef = useRef<HTMLHeadingElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const lastClickRef = useRef<Element | null>(null);
  const pendingRef = useRef<PendingAdd | null>(null);

  const [criteria, setCriteria] = useState<CardFilterCriteria>(EMPTY_CRITERIA);
  const [setChoice, setSetChoice] = useState<string | null>(null);
  const [sort, setSort] = useState<CardSort>(DEFAULT_SORT);
  const [live, setLive] = useState('');
  const [page, setPage] = useState(0);
  /** Counts the adds; the counters flash when it changes. */
  const [bump, setBump] = useState(0);
  const [panelInView, setPanelInView] = useState(false);
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

  /** Remembers a copy that was just added: the sheet then shows its page and the copy flies there (after the render). */
  const noteAdd = (card: Card, artUrl: string | null, source: Element | null) => {
    const picture = (source?.closest('.card-box') ?? source)?.querySelector<HTMLImageElement>('img.card-image') ?? null;
    pendingRef.current = {
      key: card.key,
      artUrl,
      before: total,
      from: picture === null ? null : picture.getBoundingClientRect(),
      src: picture === null ? null : picture.currentSrc || picture.src,
    };
    setBump((n) => n + 1);
  };
  const artUrlOfArt = (card: Card, art: Art) => (art.rarity === null ? null : variantImageUrl(card.key, art.rarity));
  /** The art of a card that a sheet copy or a picture shows (`null` = the card's own picture). */
  const artByUrl = (card: Card, artUrl: string | null) => artsFor(card).find((art) => artUrlOfArt(card, art) === artUrl);

  const handleCountChange = (card: Card, count: number, source: Element | null = lastClickRef.current) => {
    const current = countIn(snapshot, card.key);
    if (count > current && full) {
      setLive(proxyTexts.queueFullLive);
      return;
    }
    if (count > current) noteAdd(card, null, source);
    store.setCount(card.key, count);
  };
  const handleArtChange = (card: Card, art: Art, next: number, source: Element | null = lastClickRef.current) => {
    const before = entryOf(card);
    const current = ownedPerArt(before, card, artsFor(card)).get(art.artId) ?? 0;
    if (next > current && total + next - current > MAX_PROXY_CARDS) {
      setLive(proxyTexts.queueFullLive);
      return;
    }
    if (next > current) noteAdd(card, artUrlOfArt(card, art), source);
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
  // One box per art (a card without arts: one box).
  const resultItems = sorted.flatMap((card): CardListItem[] => {
    const arts = artsFor(card);
    if (arts.length === 0) return [{ card, art: null, imageUrl: null, artCount: 1 }];
    const matching = arts.filter(artMatchesFilter);
    return (matching.length === 0 ? arts : matching).map((art) => ({
      card,
      art,
      imageUrl: art.rarity === null ? null : variantImageUrl(card.key, art.rarity),
      artCount: arts.length,
      rarity: artRarity(card, art),
    }));
  });

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
  const sheetOffset = calibration ? 1 : 0;
  const pageCount = sheets.length + sheetOffset;
  const pageIdx = Math.min(page, Math.max(0, pageCount - 1));
  const pageLabel =
    calibration && pageIdx === 0 ? proxyTexts.calibrationSheetLabel : proxyTexts.sheetLabel(pageIdx - sheetOffset + 1, sheets.length);

  // A copy was just added: the sheet shows its page, then the picture flies to its place and the place flashes.
  useLayoutEffect(() => {
    const pending = pendingRef.current;
    if (pending === null) return;
    if (copies.length < pending.before) {
      pendingRef.current = null;
      return;
    }
    if (copies.length <= pending.before) return;
    let index = -1;
    for (let i = copies.length - 1; i >= 0; i -= 1) {
      if (copies[i]?.key === pending.key && copies[i]?.artUrl === pending.artUrl) {
        index = i;
        break;
      }
    }
    if (index < 0) return;
    const target = Math.floor(index / CARDS_PER_SHEET) + sheetOffset;
    if (pageIdx !== target) {
      setPage(target);
      return;
    }
    pendingRef.current = null;
    const element = printAreaRef.current?.querySelector<HTMLElement>(`.proxy-card[data-copy="${index}"]`);
    if (element) playAdd(element, pending.from, pending.src);
  }, [copies, sheetOffset, pageIdx]);

  // The bottom bar of a narrow window is not needed while the sheet is on screen.
  useEffect(() => {
    const panel = panelRef.current;
    if (panel === null || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setPanelInView(entry?.isIntersecting ?? false), { threshold: 0.25 });
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

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

  const showSheet = () => {
    panelRef.current?.scrollIntoView({ block: 'start' });
    panelHeadingRef.current?.focus({ preventScroll: true });
  };
  /** The picture of a box adds one copy to the sheet (its art when it has one). */
  const handleAddByImage = (card: Card, opener: HTMLButtonElement, artUrl: string | null = null) => {
    const arts = artsFor(card);
    if (arts.length === 0) {
      handleCountChange(card, countIn(snapshot, card.key) + 1, opener);
      return;
    }
    const art = artByUrl(card, artUrl) ?? arts[0];
    if (art === undefined) return;
    handleArtChange(card, art, (ownedPerArt(entryOf(card), card, arts).get(art.artId) ?? 0) + 1, opener);
  };
  /** The Ã— of a card on the sheet removes that copy. */
  const handleRemoveCopy = (copy: ProxyCopy) => {
    const card = cardsByKey.get(copy.key);
    if (card === undefined) return;
    const art = artByUrl(card, copy.artUrl);
    if (art === undefined) handleCountChange(card, Math.max(0, countIn(snapshot, card.key) - 1));
    else handleArtChange(card, art, Math.max(0, (ownedPerArt(entryOf(card), card, artsFor(card)).get(art.artId) ?? 0) - 1));
    // The button that was pressed may be gone with the copy: focus stays on the sheet panel.
    window.setTimeout(() => {
      if (document.activeElement === null || document.activeElement === document.body) panelHeadingRef.current?.focus({ preventScroll: true });
    }, 0);
  };
  const handleCalibration = (on: boolean) => {
    setCalibration(on);
    setPage(0);
  };

  const status = filterActive ? texts.filteredStatus(filtered.length, allCards.length) : cardCount(allCards.length);
  const summary = proxyTexts.summary(total, sheetTotal);

  return (
    <>
      <div className="proxy-screen">
        <div className="proxy-head">
          <h1 ref={headingRef} tabIndex={-1}>
            {proxyTexts.heading}
          </h1>
          <ol className="proxy-steps" aria-label={proxyTexts.stepsLabel}>
            {proxyTexts.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
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
      </div>

      <div className="proxy-layout">
        <section
          className="proxy-pick proxy-screen"
          aria-labelledby="proxy-pick-heading"
          onClickCapture={(event) => {
            lastClickRef.current = event.target instanceof Element ? event.target : null;
          }}
        >
          <h2 id="proxy-pick-heading" className="proxy-col-title">
            {proxyTexts.pickHeading}
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
            collapsibleBelow={NEVER_QUERY}
            results={{ count: filtered.length, id: 'proxy-results' }}
          />

          <div id="proxy-results" className="proxy-results">
            <h3 className="visually-hidden">{proxyTexts.resultsHeading}</h3>
            <div className="proxy-results-bar">
              <p className="status-line">{status}</p>
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
                onOpenImage={handleAddByImage}
                imageLabel={proxyTexts.addByImage}
              />
            )}
          </div>
        </section>

        {/* Narrow window: the sheet is below the picker, this bar leads to it (like "Näytä pakka" in the deck editor). */}
        <div className="deck-bar proxy-screen" hidden={panelInView}>
          <p className="deck-bar-text">
            <span key={bump} className={bump > 0 ? 'deck-bar-part proxy-flash' : 'deck-bar-part'}>
              {proxyTexts.barSummary(total, sheetTotal)}
            </span>
          </p>
          <button type="button" className="button-primary deck-bar-button" onClick={showSheet}>
            {proxyTexts.showSheet}
          </button>
        </div>

        <section ref={panelRef} className="proxy-panel" aria-labelledby="proxy-panel-heading">
          <div className="proxy-panel-head proxy-screen">
            <h2 id="proxy-panel-heading" className="proxy-col-title" ref={panelHeadingRef} tabIndex={-1}>
              {proxyTexts.panelHeading}
            </h2>
            <p className="proxy-summary" id="proxy-summary">
              <span key={bump} className={bump > 0 ? 'proxy-flash' : undefined}>
                {summary}
              </span>
            </p>
          </div>
          {full && <p className="notice proxy-screen">{proxyTexts.queueFull}</p>}
          {pageCount > 1 && (
            <div className="proxy-pager proxy-screen" role="group" aria-label={proxyTexts.sheetPager}>
              <button type="button" className="button-secondary" disabled={pageIdx === 0} aria-label={proxyTexts.prevSheet} onClick={() => setPage(pageIdx - 1)}>
                <span aria-hidden="true">{'‹'}</span>
              </button>
              <span className="proxy-pager-label">{pageLabel}</span>
              <button
                type="button"
                className="button-secondary"
                disabled={pageIdx >= pageCount - 1}
                aria-label={proxyTexts.nextSheet}
                onClick={() => setPage(pageIdx + 1)}
              >
                <span aria-hidden="true">{'›'}</span>
              </button>
            </div>
          )}

          {/* The only part that is printed (all sheets); on screen it shows the current sheet. */}
          <div className="proxy-print-area" ref={printAreaRef}>
            <ProxySheets sheets={sheets} showMark={showMark} calibration={calibration} current={pageIdx} onRemove={handleRemoveCopy} />
            {pageCount === 0 && (
              <div className="proxy-sheet-empty proxy-screen">
                <p>{proxyTexts.emptySheet}</p>
              </div>
            )}
          </div>

          <div className="proxy-print-bar proxy-screen">
            <button type="button" className="button-primary" disabled={total === 0 || preparing} onClick={() => void handlePrint()}>
              {preparing ? proxyTexts.preparing : proxyTexts.printButton}
            </button>
            {ready && total > 0 && (
              <button type="button" className="button-secondary" onClick={() => setAskClear({ cards: total, afterPrint: false })}>
                {proxyTexts.clearQueue}
              </button>
            )}
          </div>

          <details className="proxy-settings proxy-screen">
            <summary>{proxyTexts.settingsHeading}</summary>
            <div className="proxy-settings-body">
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
                <input type="checkbox" checked={calibration} onChange={(event) => handleCalibration(event.target.checked)} />{' '}
                {proxyTexts.calibration}
                <span className="hint"> {proxyTexts.calibrationHint}</span>
              </label>
              <p className="hint">{proxyTexts.printHint}</p>
            </div>
          </details>
          <p className="proxy-note proxy-screen">{proxyTexts.disclaimer}</p>
        </section>
      </div>

      <ClearQueueDialog ask={askClear} onKeep={handleKeep} onClear={handleClear} />
    </>
  );
}
