import { useEffect, useRef, useState } from 'react';
import { collectionTexts } from './collectionTexts';
import { deckTexts } from './deckTexts';
import { proxyTexts } from './proxyTexts';
import { sealedTexts } from './sealedTexts';
import { texts } from './texts';
import { isPlaytestRoute } from './useHashRoute';
import type { Route } from './useHashRoute';

/** Line icons (24 px grid, 2 px stroke, like the other icons). Shown only in the phone bottom bar (T-190). */
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      {children}
    </svg>
  );
}

const icons = {
  cards: (
    <Icon>
      <rect x="6" y="3" width="12" height="18" />
      <path d="M9 8h6M9 12h6" />
    </Icon>
  ),
  collection: (
    <Icon>
      <rect x="3" y="4" width="13" height="16" />
      <path d="M8 2h13v16" />
    </Icon>
  ),
  decks: (
    <Icon>
      <path d="M4 8l8-4 8 4-8 4z" />
      <path d="M4 12l8 4 8-4M4 16l8 4 8-4" />
    </Icon>
  ),
  havewant: (
    <Icon>
      <path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" />
    </Icon>
  ),
  more: (
    <Icon>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  ),
  playtest: (
    <Icon>
      <path d="M7 4l13 8-13 8z" />
    </Icon>
  ),
  proxy: (
    <Icon>
      <path d="M7 9V3h10v6M7 17H3V9h18v8h-4" />
      <rect x="7" y="14" width="10" height="7" />
    </Icon>
  ),
};

/**
 * The main navigation. From 40 rem it is the header row (T-181); below that it is a fixed bottom tab bar (T-190): Cards,
 * Collection, Decks, Have/Want and "More", which opens a bottom sheet with Playtest and Proxy. One DOM, the CSS decides
 * which links the phone bar shows (.nav-extra are the two that live in the sheet).
 */
export function MainNav({ route, proxyCount }: { route: Route; proxyCount: number }) {
  // The sheet is open for the page it was opened on, so a navigation (also the back button) closes it.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const moreOpen = openFor === route.name;
  const setMoreOpen = (open: boolean) => setOpenFor(open ? route.name : null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const playtestCurrent = isPlaytestRoute(route) || route.name === 'goldfish';
  const proxyCurrent = route.name === 'proxy';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (moreOpen && !dialog.open) dialog.showModal();
    else if (!moreOpen && dialog.open) dialog.close();
  }, [moreOpen]);

  const badge =
    proxyCount > 0 ? (
      <>
        <span className="nav-badge" aria-hidden="true">
          {proxyCount > 99 ? '99+' : proxyCount}
        </span>
        <span className="visually-hidden">{proxyTexts.navBadgeLabel(proxyCount)}</span>
      </>
    ) : null;

  return (
    <>
      <nav className="main-nav" aria-label={deckTexts.navLabel}>
        <a className="nav-item" href="#/" aria-current={route.name === 'cards' || route.name === 'card' ? 'page' : undefined}>
          {icons.cards}
          <span className="nav-label">{deckTexts.navCards}</span>
        </a>
        <a className="nav-item" href="#/kokoelma" aria-current={route.name === 'collection' ? 'page' : undefined}>
          {icons.collection}
          <span className="nav-label">{collectionTexts.navCollection}</span>
        </a>
        <a
          className="nav-item"
          href="#/pakat"
          aria-current={
            route.name === 'decks' ||
            route.name === 'deck' ||
            route.name === 'share' ||
            route.name === 'publicDecks' ||
            route.name === 'deckBuild' ||
            route.name === 'publicDeck'
              ? 'page'
              : undefined
          }
        >
          {icons.decks}
          <span className="nav-label">{deckTexts.navDecks}</span>
        </a>
        {/* T-188: the colours of the game first (Cards yellow, Collection green, Decks red, Have/Want blue), then Playtest and Proxy. */}
        <a
          className="nav-item"
          href="#/vaihto"
          aria-current={route.name === 'havewant' || route.name === 'trade' || route.name === 'tradeLink' ? 'page' : undefined}
        >
          {icons.havewant}
          <span className="nav-label">{deckTexts.navHaveWant}</span>
        </a>
        <a className="nav-item nav-extra" href="#/testaa" aria-current={playtestCurrent ? 'page' : undefined}>
          {icons.playtest}
          <span className="nav-label">{sealedTexts.navPlaytest}</span>
        </a>
        <a className="nav-item nav-extra" href="#/proxy" aria-current={proxyCurrent ? 'page' : undefined}>
          {icons.proxy}
          <span className="nav-label">{proxyTexts.navProxy}</span>
          {badge}
        </a>
        <button
          type="button"
          className="nav-item nav-more"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          data-current={playtestCurrent || proxyCurrent ? 'true' : undefined}
          onClick={() => setMoreOpen(true)}
        >
          {icons.more}
          <span className="nav-label">{deckTexts.navMore}</span>
        </button>
      </nav>
      <dialog
        ref={dialogRef}
        className="nav-sheet"
        aria-label={deckTexts.navMore}
        onClose={() => setMoreOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setMoreOpen(false);
        }}
      >
        {moreOpen && (
          <div className="nav-sheet-body">
            <div className="nav-sheet-head">
              <h2 className="nav-sheet-title">{deckTexts.navMore}</h2>
              <button type="button" className="button-secondary dialog-close" aria-label={texts.closeDialog} onClick={() => setMoreOpen(false)}>
                {texts.closeSymbol}
              </button>
            </div>
            <a className="nav-sheet-row" href="#/testaa" aria-current={playtestCurrent ? 'page' : undefined} onClick={() => setMoreOpen(false)}>
              {icons.playtest}
              <span>{sealedTexts.navPlaytest}</span>
            </a>
            <a className="nav-sheet-row" href="#/proxy" aria-current={proxyCurrent ? 'page' : undefined} onClick={() => setMoreOpen(false)}>
              {icons.proxy}
              <span>{proxyTexts.navProxy}</span>
              {badge}
            </a>
          </div>
        )}
      </dialog>
    </>
  );
}
