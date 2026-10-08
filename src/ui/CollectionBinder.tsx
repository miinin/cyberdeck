import { useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, TouchEvent } from 'react';
import { getCardImage } from '../data/cardImages';
import { variantImageUrl } from '../data/variantImages';
import { binderPockets, clampPage, pageNumbers, paginate, swipeDirection, turnPage, visiblePages } from '../domain/binder';
import type { Pocket } from '../domain/binder';
import type { Card } from '../domain/card';
import { CARD_IMAGE_WIDTH, cardImageHeight } from '../domain/cardImage';
import type { Collection } from '../domain/collection';
import { cardNameText } from './CardName';
import { Chevron } from './Chevron';
import { collectionTexts } from './collectionTexts';
import { SwitchButton } from './ListToolbar';
import { useMediaQuery, WIDE_QUERY } from './useMediaQuery';

const hasArt = (key: string, rarity: string) => variantImageUrl(key, rarity) !== null;

/** One pocket: the card's picture (owned) or a dim outline with number and name (missing). */
function BinderPocket({ pocket }: { pocket: Pocket }) {
  const { card, number, copies, artRarity, betaOnly } = pocket;
  const owned = copies > 0;
  const name = cardNameText(card);
  // An owned card always shows something: the owned art, else the base picture, else its number and name.
  const [failed, setFailed] = useState<readonly string[]>([]);
  const candidates = owned
    ? [artRarity === null ? null : variantImageUrl(card.key, artRarity), getCardImage(card.key)?.medium ?? null].filter((url): url is string => url !== null)
    : [];
  const src = candidates.find((url) => !failed.includes(url)) ?? null;
  return (
    <li className={`pocket ${owned ? 'pocket--owned' : 'pocket--missing'}`}>
      <a
        className="pocket-link"
        href={`#/kortti/${encodeURIComponent(card.key)}`}
        aria-label={owned ? collectionTexts.pocketOwned(number, name, copies, betaOnly) : collectionTexts.pocketMissing(number, name)}
      >
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
        {copies >= 2 && (
          <span className="pocket-count" aria-hidden="true">
            ×{copies}
          </span>
        )}
      </a>
    </li>
  );
}

/**
 * The collector binder (T-109, T-116): the cards of the one set (Retail and Beta together) in 3 x 3 pockets, a page (narrow screen) or a spread of
 * two pages (wide screen) at a time. Only the visible pages are rendered, and the pictures load lazily.
 */
export function CollectionBinder({
  cards,
  collection,
  showMissing,
  onShowMissingChange,
}: {
  cards: readonly Card[];
  collection: Collection;
  showMissing: boolean;
  onShowMissingChange: (on: boolean) => void;
}) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const wide = useMediaQuery(WIDE_QUERY, false);
  const columns = wide ? 2 : 1;
  const title = useId();

  const all = useMemo(() => binderPockets(cards, collection, hasArt), [cards, collection]);
  const ownedCount = all.filter((pocket) => pocket.copies > 0).length;
  const pages = useMemo(() => paginate(showMissing ? all : all.filter((pocket) => pocket.copies > 0)), [all, showMissing]);
  const current = clampPage(page, pages.length);
  const shown = visiblePages(current, pages.length, columns);
  const { first, last } = pageNumbers(shown);
  const atStart = (shown[0] ?? 0) === 0;
  const atEnd = (shown[shown.length - 1] ?? 0) >= pages.length - 1;

  const turn = (by: 1 | -1) => {
    setDirection(by);
    setPage(turnPage(current, by, pages.length, columns));
  };

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
    if (by !== 0) turn(by);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowRight') turn(1);
    else if (event.key === 'ArrowLeft') turn(-1);
  };

  return (
    <section className="binder" aria-labelledby={title}>
      <h2 id={title} className="binder-title visually-hidden">
        {collectionTexts.binderHeading}
      </h2>
      <div className="binder-controls">
        <p className="hint binder-count">{collectionTexts.binderOwnedCount(ownedCount, all.length)}</p>
        <SwitchButton
          checked={showMissing}
          label={collectionTexts.binderShowMissing}
          onChange={(on) => {
            onShowMissingChange(on);
            setPage(0);
          }}
        />
      </div>

      {pages.length === 0 ? (
        <p className="binder-empty">{collectionTexts.binderEmpty}</p>
      ) : (
        <>
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
            <div className="binder-spread" key={shown[0]} data-turn={direction === 1 ? 'next' : 'prev'}>
              {shown.map((index) => (
                <section key={index} className="binder-page" aria-labelledby={`${title}-p${index}`}>
                  <ul className="binder-pockets">
                    {(pages[index] ?? []).map((pocket) => (
                      <BinderPocket key={pocket.card.key} pocket={pocket} />
                    ))}
                  </ul>
                  <h3 id={`${title}-p${index}`} className="binder-page-number">
                    {collectionTexts.binderPage(index + 1)}
                  </h3>
                </section>
              ))}
            </div>
          </div>
          <div className="binder-nav">
            <button type="button" className="button-secondary" aria-label={collectionTexts.binderPrev} aria-disabled={atStart} onClick={() => !atStart && turn(-1)}>
              <Chevron direction="left" />
              <span className="binder-nav-label">{collectionTexts.binderPrev}</span>
            </button>
            <p role="status" aria-live="polite" className="binder-position">
              {collectionTexts.binderPosition(first, last, pages.length)}
            </p>
            <button type="button" className="button-secondary" aria-label={collectionTexts.binderNext} aria-disabled={atEnd} onClick={() => !atEnd && turn(1)}>
              <span className="binder-nav-label">{collectionTexts.binderNext}</span>
              <Chevron direction="right" />
            </button>
          </div>
          <p id={`${title}-help`} className="hint binder-help">
            {collectionTexts.binderHelp}
          </p>
        </>
      )}
    </section>
  );
}
