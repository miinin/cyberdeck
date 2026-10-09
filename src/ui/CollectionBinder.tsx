import { useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, TouchEvent } from 'react';
import { getCardImage } from '../data/cardImages';
import { variantImageUrl } from '../data/variantImages';
import {
  binderPockets,
  bookViews,
  pageNumbers,
  paginate,
  placeableCopies,
  pocketFor,
  POCKETS_PER_PAGE,
  swipeDirection,
  turnBook,
  viewIndexOfSheet,
} from '../domain/binder';
import type { Pocket } from '../domain/binder';
import {
  addPage,
  canPlaceCard,
  canRemovePage,
  cleanBinderName,
  initialBinderLayout,
  layoutPageCount,
  MAX_BINDER_NAME,
  placedCounts,
  pocketsBacked,
  removePage,
  setPocket,
  swapOrMovePocket,
} from '../domain/binderLayout';
import type { Card } from '../domain/card';
import { CARD_IMAGE_WIDTH, cardImageHeight } from '../domain/cardImage';
import type { Collection } from '../domain/collection';
import type { PreferencesRepository } from '../storage';
import { BinderCardPicker } from './BinderCardPicker';
import type { PickerCandidate } from './BinderCardPicker';
import { cardNameText } from './CardName';
import { Chevron } from './Chevron';
import { collectionTexts } from './collectionTexts';
import { SwitchButton } from './ListToolbar';
import { SegmentedChoice } from './SegmentedChoice';
import { useBinderLayout } from './useBinderLayout';
import { useMediaQuery, WIDE_QUERY } from './useMediaQuery';

export type BinderMode = 'set' | 'custom';

const hasArt = (key: string, rarity: string) => variantImageUrl(key, rarity) !== null;

const MODE_OPTIONS: readonly (readonly [BinderMode, string])[] = [
  ['set', collectionTexts.binderModeSet],
  ['custom', collectionTexts.binderModeCustom],
];

/** What one pocket of a page holds: a card (with its state), an empty pocket, or a key the catalog does not know. */
interface Slot {
  /** The place in the own binder (the position in the layout); null in the set binder. */
  index: number | null;
  pocket: Pocket | null;
  /** A card key in the own binder that is not in the catalog (it keeps its place). */
  unknownKey?: string;
}

/** The pocket's pictured face: the card's picture (owned) or a dim outline with number and name (missing). */
function PocketFace({ pocket, unknownKey, hideCount }: { pocket: Pocket | null; unknownKey?: string; hideCount: boolean }) {
  const [failed, setFailed] = useState<readonly string[]>([]);
  if (pocket === null) {
    if (unknownKey === undefined) {
      return (
        <span className="pocket-plus" aria-hidden="true">
          +
        </span>
      );
    }
    return (
      <span className="pocket-ghost" aria-hidden="true">
        <span className="pocket-ghost-number">#?</span>
        <span className="pocket-ghost-name">{unknownKey}</span>
      </span>
    );
  }
  const { card, number, copies, artRarity, betaOnly } = pocket;
  const owned = copies > 0;
  const name = cardNameText(card);
  // An owned card always shows something: the owned art, else the base picture, else its number and name.
  const candidates = owned
    ? [artRarity === null ? null : variantImageUrl(card.key, artRarity), getCardImage(card.key)?.medium ?? null].filter((url): url is string => url !== null)
    : [];
  const src = candidates.find((url) => !failed.includes(url)) ?? null;
  return (
    <>
      {src !== null ? (
        <img className="pocket-image" src={src} width={CARD_IMAGE_WIDTH.md} height={cardImageHeight('md')} alt="" loading="lazy" decoding="async" onError={() => setFailed((list) => [...list, src])} />
      ) : (
        <span className={`pocket-ghost${owned ? ' pocket-ghost--owned' : ''}`} aria-hidden="true">
          <span className="pocket-ghost-number">#{number}</span>
          <span className="pocket-ghost-name">{name}</span>
        </span>
      )}
      {betaOnly && (
        <span className="pocket-beta" aria-hidden="true">
          {collectionTexts.betaMark}
        </span>
      )}
      {copies >= 2 && !hideCount && (
        <span className="pocket-count" aria-hidden="true">
          ×{copies}
        </span>
      )}
    </>
  );
}

/** One pocket: a link to the card; in the edit mode of the own binder a button that selects the pocket. */
function BinderPocket({
  slot,
  slotLabel,
  hideCount,
  edit,
}: {
  slot: Slot;
  slotLabel: string;
  hideCount: boolean;
  edit: { selected: boolean; onActivate: (tappedAt: number) => void } | null;
}) {
  const { pocket, unknownKey } = slot;
  const owned = pocket !== null && pocket.copies > 0;
  const state = pocket === null ? (unknownKey === undefined ? 'empty' : 'missing') : owned ? 'owned' : 'missing';
  const face = <PocketFace pocket={pocket} unknownKey={unknownKey} hideCount={hideCount} />;
  const className = `pocket pocket--${state}${edit?.selected ? ' pocket--selected' : ''}`;
  const name = pocket === null ? (unknownKey ?? '') : cardNameText(pocket.card);

  if (edit !== null) {
    const label = pocket === null && unknownKey === undefined ? collectionTexts.binderSlotEmpty(slotLabel) : collectionTexts.binderSlotCard(slotLabel, name, owned);
    return (
      <li className={className}>
        <button type="button" className="pocket-link" aria-pressed={edit.selected} aria-label={label} onClick={(event) => edit.onActivate(event.timeStamp)}>
          {face}
        </button>
      </li>
    );
  }
  if (pocket === null) {
    const label = unknownKey === undefined ? collectionTexts.binderSlotEmpty(slotLabel) : collectionTexts.binderSlotCard(slotLabel, name, false);
    return (
      <li className={className}>
        <span className="pocket-link" role="img" aria-label={label}>
          {face}
        </span>
      </li>
    );
  }
  return (
    <li className={className}>
      <a
        className="pocket-link"
        href={`#/kortti/${encodeURIComponent(pocket.card.key)}`}
        aria-label={owned ? collectionTexts.pocketOwned(pocket.number, name, pocket.copies, pocket.betaOnly) : collectionTexts.pocketMissing(pocket.number, name)}
      >
        {face}
      </a>
    </li>
  );
}

/** The front cover (with the title and the collecting status) or the back cover (the pattern only). Drawn with CSS, no pictures. */
function BinderCover({ side, title, status }: { side: 'front' | 'back'; title: string; status: string }) {
  return (
    <section className={`binder-page binder-cover binder-cover--${side}`} aria-label={side === 'front' ? collectionTexts.coverFront : collectionTexts.coverBack}>
      {/* An empty page of pockets, hidden: the cover takes exactly the size of a page, so the buttons below do not move. */}
      <div className="binder-cover-sizer" aria-hidden="true">
        <ul className="binder-pockets">
          {Array.from({ length: POCKETS_PER_PAGE }, (_, i) => (
            <li key={i} className="pocket" />
          ))}
        </ul>
        <span className="binder-page-number" />
      </div>
      <span className="binder-cover-art" aria-hidden="true" />
      {side === 'front' && (
        <div className="binder-cover-text">
          <h3 className="binder-cover-title">{title}</h3>
          <p className="binder-cover-status">{status}</p>
        </div>
      )}
    </section>
  );
}

/**
 * The collector binder (T-109, T-116, T-120): the cards of the one set (Retail and Beta together) in number order, or the
 * user's own binder where they place the owned cards themselves. 3 x 3 pockets, a page (narrow screen) or a spread of
 * two pages (wide screen) at a time, between a front and a back cover. Only the visible pages are rendered, and the
 * pictures load lazily.
 */
export function CollectionBinder({
  cards,
  collection,
  preferences,
  mode,
  onModeChange,
  showMissing,
  onShowMissingChange,
}: {
  cards: readonly Card[];
  collection: Collection;
  preferences: PreferencesRepository;
  mode: BinderMode;
  onModeChange: (mode: BinderMode) => void;
  showMissing: boolean;
  onShowMissingChange: (on: boolean) => void;
}) {
  // The place in the book: 0 = the front cover, 1..n = the pages, n + 1 = the back cover. The book opens on the cover.
  const [sheet, setSheet] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const wide = useMediaQuery(WIDE_QUERY, false);
  const columns = wide ? 2 : 1;
  const title = useId();
  const modeName = useId();
  const swipedAt = useRef(Number.NEGATIVE_INFINITY);

  const custom = mode === 'custom';
  const all = useMemo(() => binderPockets(cards, collection, hasArt), [cards, collection]);
  const ownedCount = all.filter((pocket) => pocket.copies > 0).length;
  const cardsByKey = useMemo(() => new Map(cards.map((card) => [card.key, card])), [cards]);

  const { layout, update, saveFailed } = useBinderLayout(preferences, custom, () =>
    initialBinderLayout(
      all.filter((pocket) => pocket.copies > 0).map((pocket) => pocket.card.key),
      '',
    ),
  );

  // The slots of every page of the book.
  const setPages = useMemo(() => paginate(showMissing ? all : all.filter((pocket) => pocket.copies > 0)), [all, showMissing]);
  const customPages = useMemo(() => {
    if (layout === null) return [];
    const copiesOf = (key: string) => {
      const card = cardsByKey.get(key);
      return card === undefined ? 0 : placeableCopies(card, collection);
    };
    const backed = pocketsBacked(layout.pockets, copiesOf);
    const slots: Slot[] = layout.pockets.map((key, index) => {
      if (key === null) return { index, pocket: null };
      const card = cardsByKey.get(key);
      if (card === undefined) return { index, pocket: null, unknownKey: key };
      return { index, pocket: pocketFor(card, collection, hasArt, backed[index] ? copiesOf(key) : 0) };
    });
    return paginate(slots);
  }, [layout, cardsByKey, collection]);
  const pages: Slot[][] = custom ? customPages : setPages.map((page) => page.map((pocket) => ({ index: null, pocket })));
  const pageCount = pages.length;
  const placedOwned = customPages.reduce((sum, page) => sum + page.filter((slot) => slot.pocket !== null && slot.pocket.copies > 0).length, 0);
  const countText = custom ? collectionTexts.binderCustomCount(placedOwned) : collectionTexts.binderOwnedCount(ownedCount, all.length);

  const views = bookViews(pageCount, columns);
  const viewIndex = viewIndexOfSheet(views, sheet, pageCount);
  const view = views[viewIndex] ?? { kind: 'front' as const };
  const atStart = viewIndex === 0;
  const atEnd = viewIndex === views.length - 1;
  const shownPages = view.kind === 'pages' ? view.pages : [];
  const coverName = custom ? (layout === null ? '' : layout.name) || collectionTexts.binderDefaultName : collectionTexts.coverSetName;
  const position =
    view.kind === 'front'
      ? collectionTexts.coverFront
      : view.kind === 'back'
        ? collectionTexts.coverBack
        : (() => {
            const { first, last } = pageNumbers(view.pages);
            return collectionTexts.binderPosition(first, last, pageCount);
          })();

  const turn = (by: 1 | -1) => {
    setDirection(by);
    setSheet(turnBook(sheet, by, pageCount, columns));
  };
  const slotLabel = (index: number) => collectionTexts.binderSlot(Math.floor(index / POCKETS_PER_PAGE) + 1, (index % POCKETS_PER_PAGE) + 1);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = touch === undefined ? null : { x: touch.clientX, y: touch.clientY };
  };
  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStart.current;
    const touch = event.changedTouches[0];
    touchStart.current = null;
    if (start === null || touch === undefined) return;
    const by = swipeDirection(touch.clientX - start.x, touch.clientY - start.y);
    if (by !== 0) {
      swipedAt.current = event.timeStamp;
      turn(by);
    }
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowRight') turn(1);
    else if (event.key === 'ArrowLeft') turn(-1);
  };

  const changeMode = (next: BinderMode) => {
    onModeChange(next);
    setSheet(0);
    setEditing(false);
    setSelected(null);
    setPickerFor(null);
    setAnnouncement('');
  };
  const changeEditing = (on: boolean) => {
    setEditing(on);
    setSelected(null);
    setAnnouncement('');
  };

  const activatePocket = (index: number, tappedAt: number) => {
    // A swipe that turned the page is not a tap on the pocket under the finger.
    if (layout === null || tappedAt - swipedAt.current < 500) return;
    const key = layout.pockets[index];
    if (selected === null) {
      if (key === null) {
        setPickerFor(index);
      } else {
        setSelected(index);
        setAnnouncement(collectionTexts.binderSelected(slotLabel(index)));
      }
      return;
    }
    if (selected === index) {
      setSelected(null);
      setAnnouncement(collectionTexts.binderDeselected);
      return;
    }
    const moved = layout.pockets[index] === null;
    update((current) => ({ ...current, pockets: swapOrMovePocket(current.pockets, selected, index) }));
    setAnnouncement((moved ? collectionTexts.binderMoved : collectionTexts.binderSwapped)(slotLabel(selected), slotLabel(index)));
    setSelected(null);
  };

  const selectedKey = layout !== null && selected !== null ? (layout.pockets[selected] ?? null) : null;
  const clearSelected = () => {
    if (selected === null) return;
    update((current) => ({ ...current, pockets: setPocket(current.pockets, selected, null) }));
    setAnnouncement(collectionTexts.binderCleared(slotLabel(selected)));
    setSelected(null);
  };

  const candidates = useMemo<PickerCandidate[]>(() => {
    if (pickerFor === null || layout === null) return [];
    const placed = placedCounts(layout.pockets, pickerFor);
    const list: PickerCandidate[] = [];
    for (const card of cards) {
      const copies = placeableCopies(card, collection);
      if (copies > 0) list.push({ card, copies, placed: placed.get(card.key) ?? 0 });
    }
    return list;
  }, [pickerFor, layout, cards, collection]);
  const pick = (card: Card) => {
    const index = pickerFor;
    if (index === null || layout === null) return;
    const candidate = candidates.find((item) => item.card.key === card.key);
    if (candidate === undefined || !canPlaceCard(candidate.placed, candidate.copies)) return;
    update((current) => ({ ...current, pockets: setPocket(current.pockets, index, card.key) }));
    setAnnouncement(collectionTexts.binderPlaced(cardNameText(card), slotLabel(index)));
    setPickerFor(null);
    setSelected(null);
  };

  const pocketsLength = layout === null ? 0 : layout.pockets.length;
  const canAddPage = pocketsLength > 0 && addPage(layout?.pockets ?? []).length !== pocketsLength;
  const removeTarget = selected !== null ? Math.floor(selected / POCKETS_PER_PAGE) : shownPages[0] ?? null;
  const canRemove = layout !== null && removeTarget !== null && canRemovePage(layout.pockets, removeTarget);
  const addNewPage = () => {
    if (!canAddPage) return;
    update((current) => ({ ...current, pockets: addPage(current.pockets) }));
    setDirection(1);
    setSheet(pageCount + 1);
    setAnnouncement(collectionTexts.binderPageAdded(pageCount + 1));
  };
  const removeSelectedPage = () => {
    if (!canRemove || removeTarget === null || layout === null) return;
    update((current) => ({ ...current, pockets: removePage(current.pockets, removeTarget) }));
    setSheet((current) => Math.min(current, layoutPageCount(layout.pockets) - 1));
    setSelected(null);
    setAnnouncement(collectionTexts.binderPageRemoved(removeTarget + 1));
  };
  const commitName = () => {
    if (nameDraft === null) return;
    const name = cleanBinderName(nameDraft);
    setNameDraft(null);
    update((current) => (current.name === name ? current : { ...current, name }));
  };

  return (
    <section className="binder" data-columns={columns} aria-labelledby={title}>
      <h2 id={title} className="binder-title visually-hidden">
        {collectionTexts.binderHeading}
      </h2>
      <div className="binder-controls">
        <SegmentedChoice legend={collectionTexts.binderModeLabel} name={modeName} value={mode} options={MODE_OPTIONS} onChange={changeMode} />
        <p className="hint binder-count">{countText}</p>
        {custom ? (
          <SwitchButton checked={editing} label={collectionTexts.binderEdit} onChange={changeEditing} />
        ) : (
          <SwitchButton
            checked={showMissing}
            label={collectionTexts.binderShowMissing}
            onChange={(on) => {
              onShowMissingChange(on);
              setSheet(1);
            }}
          />
        )}
      </div>

      {custom && editing && layout !== null && (
        <div className="binder-tools" role="group" aria-label={collectionTexts.binderToolsGroup}>
          <div className="field binder-rename">
            <label htmlFor={`${title}-name`}>{collectionTexts.binderRename}</label>
            <input
              id={`${title}-name`}
              type="text"
              value={nameDraft ?? layout.name}
              maxLength={MAX_BINDER_NAME}
              placeholder={collectionTexts.binderDefaultName}
              autoComplete="off"
              onChange={(event) => setNameDraft(event.target.value)}
              onBlur={commitName}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitName();
              }}
            />
          </div>
          <div className="binder-tool-actions">
            <button type="button" className="button-secondary" disabled={selectedKey === null} onClick={clearSelected}>
              {collectionTexts.binderClearPocket}
            </button>
            <button type="button" className="button-secondary" disabled={selectedKey === null} onClick={() => setPickerFor(selected)}>
              {collectionTexts.binderChangeCard}
            </button>
            <button type="button" className="button-secondary" disabled={!canAddPage} onClick={addNewPage}>
              {collectionTexts.binderAddPage}
            </button>
            <button type="button" className="button-secondary" disabled={!canRemove} onClick={removeSelectedPage} title={collectionTexts.binderRemovePageHint}>
              {collectionTexts.binderRemovePage((removeTarget ?? 0) + 1)}
            </button>
          </div>
          <p className="hint">{collectionTexts.binderEditHint}</p>
        </div>
      )}
      {custom && editing && (
        <p role="status" aria-live="polite" className="visually-hidden">
          {announcement}
        </p>
      )}
      {custom && saveFailed && (
        <p className="hint" role="alert">
          {collectionTexts.binderSaveFailed}
        </p>
      )}

      {/* The arrow keys turn the page while focus is inside the book; the buttons below do the same. */}
      <div
        className="binder-book"
        role="group"
        aria-label={collectionTexts.binderGroup}
        aria-describedby={`${title}-help`}
        data-columns={columns}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="binder-spread" key={viewIndex} data-turn={direction === 1 ? 'next' : 'prev'}>
          {view.kind !== 'pages' && <BinderCover side={view.kind} title={coverName} status={countText} />}
          {shownPages.map((index) => (
            <section key={index} className="binder-page" aria-labelledby={`${title}-p${index}`}>
              <ul className="binder-pockets">
                {(pages[index] ?? []).map((slot, offset) => {
                  const globalIndex = slot.index;
                  return (
                    <BinderPocket
                      key={globalIndex ?? slot.pocket?.card.key ?? offset}
                      slot={slot}
                      slotLabel={collectionTexts.binderSlot(index + 1, offset + 1)}
                      hideCount={custom}
                      edit={custom && editing && globalIndex !== null ? { selected: selected === globalIndex, onActivate: (tappedAt: number) => activatePocket(globalIndex, tappedAt) } : null}
                    />
                  );
                })}
                {/* A short last page keeps the height of a full one. */}
                {Array.from({ length: Math.max(0, POCKETS_PER_PAGE - (pages[index]?.length ?? 0)) }, (_, i) => (
                  <li key={`filler-${i}`} className="pocket pocket--filler" aria-hidden="true" />
                ))}
              </ul>
              <h3 id={`${title}-p${index}`} className="binder-page-number">
                {collectionTexts.binderPage(index + 1)}
              </h3>
            </section>
          ))}
        </div>
      </div>
      {pageCount === 0 && !(custom && layout === null) && <p className="binder-empty">{collectionTexts.binderEmpty}</p>}
      <div className="binder-nav">
        <button type="button" className="button-secondary" aria-label={collectionTexts.binderPrev} aria-disabled={atStart} onClick={() => !atStart && turn(-1)}>
          <Chevron direction="left" />
          <span className="binder-nav-label">{collectionTexts.binderPrev}</span>
        </button>
        <p role="status" aria-live="polite" className="binder-position">
          {position}
        </p>
        <button type="button" className="button-secondary" aria-label={collectionTexts.binderNext} aria-disabled={atEnd} onClick={() => !atEnd && turn(1)}>
          <span className="binder-nav-label">{collectionTexts.binderNext}</span>
          <Chevron direction="right" />
        </button>
      </div>
      <p id={`${title}-help`} className="hint binder-help">
        {collectionTexts.binderHelp}
      </p>
      <BinderCardPicker open={pickerFor !== null} candidates={candidates} onPick={pick} onClose={() => setPickerFor(null)} />
    </section>
  );
}
