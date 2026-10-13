import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { createAccountSession, createBrowserAccountServices, createPublicDeckPublisher, watchPublicDecks } from './account';
import type { AccountServices } from './account';
import logoUrl from './assets/brand/cyberdeck-tcg-logo-header.webp';
import { CARDS } from './data/cards';
import type { Card } from './domain/card';
import { openBrowserRepositories } from './storage';
import type { Repositories } from './storage';
import { CatalogView } from './ui/CatalogView';
import { DeckEditor } from './ui/DeckEditor';
import { SharedDeckView } from './ui/SharedDeckView';
import { HaveWantView } from './ui/HaveWantView';
import { CollectionView } from './ui/CollectionView';
import { collectionTexts } from './ui/collectionTexts';
import { ProxyView } from './ui/ProxyView';
import { proxyTexts } from './ui/proxyTexts';
import { useProxyCount } from './ui/SendToProxy';
import { SharedTradeView } from './ui/SharedTradeView';
import { DecksView } from './ui/DecksView';
import { PublicDeckView } from './ui/PublicDeckView';
import { PublicDecksContext } from './ui/PublicDecksContext';
import type { PublicDecksApi } from './ui/PublicDecksContext';
import { deckTexts } from './ui/deckTexts';
import { sectionOf, useHashRoute } from './ui/useHashRoute';
import { texts } from './ui/texts';
import { LanguageSwitch } from './ui/LanguageSwitch';
import { ThemeToggle } from './ui/ThemeToggle';
import { AccountMenu } from './ui/AccountMenu';
import { FirstSignInDialog } from './ui/FirstSignInDialog';

/**
 * `cards` defaults to the bundled data (D-013); tests pass a small list, in-memory repositories and
 * fake account services (T-054a).
 */
export function App({
  cards = CARDS,
  repositories,
  account,
}: {
  cards?: readonly Card[];
  repositories?: Repositories;
  account?: AccountServices;
}) {
  // Opened once per page load; tests pass in-memory repositories.
  const [signedOutRepositories] = useState(() => repositories ?? openBrowserRepositories());
  // Creating the services loads nothing; the Firebase SDK loads only when needed (SR-21 kohta 5).
  const [accountServices] = useState(() => account ?? createBrowserAccountServices(signedOutRepositories.preferences));

  // The signed-in account's data lives under its own keys; the whole view tree below is keyed by the uid,
  // so nothing from one account (or from the signed-out data) leaks into another (T-054c, D-017 kohta 4).
  const authState = useSyncExternalStore(accountServices.auth.onChange, accountServices.auth.state);
  const uid = authState.status === 'signed-in' ? (authState.user?.uid ?? null) : null;
  const openRepositories = useMemo(
    () => (uid === null ? signedOutRepositories : signedOutRepositories.forAccount(uid)),
    [signedOutRepositories, uid],
  );
  const [notice, setNotice] = useState<'signed-out' | 'deleted' | null>(null);
  // Public decks (T-098): reading works signed out; the publisher exists only for a signed-in account.
  const publicStore = useMemo(() => accountServices.publicDecks(uid), [accountServices, uid]);
  const publisher = useMemo(
    () =>
      uid === null
        ? null
        : createPublicDeckPublisher({
            store: publicStore,
            isStillPublic: async (deckId) => (await openRepositories.decks.get(deckId))?.publish?.public === true,
          }),
    [uid, publicStore, openRepositories],
  );
  useEffect(() => () => publisher?.dispose(), [publisher]);
  // A deck deleted or made private on another device loses its public copy (SEC-098b-2).
  useEffect(() => (uid === null ? undefined : watchPublicDecks(openRepositories.decks, publicStore)), [uid, openRepositories, publicStore]);
  const publicApi = useMemo<PublicDecksApi>(
    () => ({ store: publicStore, publisher, signInAvailable: accountServices.auth.available }),
    [publicStore, publisher, accountServices],
  );
  // Creating the session starts nothing; the effect starts and (also in Strict Mode) stops it.
  const session = useMemo(
    () =>
      uid === null
        ? null
        : createAccountSession({
            uid,
            anonymous: signedOutRepositories,
            account: openRepositories,
            cloud: accountServices.cloud(uid),
            publicDecks: publicStore,
            beforeDeleteAccount: () => publisher?.drain() ?? Promise.resolve(),
          }),
    [uid, signedOutRepositories, openRepositories, accountServices, publicStore, publisher],
  );
  useEffect(() => {
    session?.start();
    return () => session?.dispose();
  }, [session]);
  const phase = useSyncExternalStore(
    (listener) => session?.onChange(listener) ?? (() => {}),
    () => session?.status().phase ?? null,
  );
  // T-055: the persistent browser storage button is no longer shown (cloud sync replaces it).
  const headerSlot: HTMLElement | null = null;
  const { route, navigate } = useHashRoute();
  // The accent of the section (T-142): set on <html> so the header, the heading bar and the choices all follow it.
  const section = sectionOf(route);
  useEffect(() => {
    document.documentElement.dataset.section = section;
  }, [section]);
  // T-123: the gallery shows only the card art, so the header (with the mobile bottom bar) and the footer step aside.
  const [galleryOpen, setGalleryOpen] = useState(false);
  const proxyCount = useProxyCount(openRepositories.proxy, route.name);

  return (
    <PublicDecksContext.Provider value={publicApi}>
      <header className="site-header" hidden={galleryOpen}>
        <div className="container">
          <a className="brand" href="#/">
            <img src={logoUrl} alt="Cyberdeck TCG" width={400} height={99} />
          </a>
          <nav className="main-nav" aria-label={deckTexts.navLabel}>
            <a href="#/" aria-current={route.name === 'cards' || route.name === 'card' ? 'page' : undefined}>
              {deckTexts.navCards}
            </a>
            <a href="#/kokoelma" aria-current={route.name === 'collection' ? 'page' : undefined}>
              {collectionTexts.navCollection}
            </a>
            <a
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
              {deckTexts.navDecks}
            </a>
            <a href="#/vaihto" aria-current={route.name === 'havewant' || route.name === 'trade' ? 'page' : undefined}>
              {deckTexts.navHaveWant}
            </a>
            <a href="#/proxy" aria-current={route.name === 'proxy' ? 'page' : undefined}>
              {proxyTexts.navProxy}
              {proxyCount > 0 && (
                <>
                  <span className="nav-badge" aria-hidden="true">
                    {proxyCount > 99 ? '99+' : proxyCount}
                  </span>
                  <span className="visually-hidden">{proxyTexts.navBadgeLabel(proxyCount)}</span>
                </>
              )}
            </a>
          </nav>
          <div className="header-tools">
          <ThemeToggle preferences={openRepositories.preferences} />
          <LanguageSwitch />
          <AccountMenu
            auth={accountServices.auth}
            session={session}
            onSignedOut={() => setNotice('signed-out')}
            onAccountDeleted={() => setNotice('deleted')}
          />
          </div>
        </div>
      </header>
      {notice !== null && uid === null && (
        <div className="container" hidden={galleryOpen}>
          <p className="notice" role="status">
            {notice === 'deleted' ? texts.accountDeletedNotice : texts.accountSignedOutNotice}{' '}
            <button type="button" className="button-secondary" onClick={() => setNotice(null)}>
              {texts.accountSignedOutDismiss}
            </button>
          </p>
        </div>
      )}
      {session !== null && phase === 'choose' && (
        <FirstSignInDialog
          onChoose={(choice) => session.choose(choice)}
          onCancel={() => void accountServices.auth.signOut()}
        />
      )}
      <main className="container" key={uid ?? 'local'}>
        {(route.name === 'cards' || route.name === 'card') && (
          <CatalogView cards={cards} routeCardKey={route.name === 'card' ? route.key : null} repositories={openRepositories} headerSlot={headerSlot} onGalleryChange={setGalleryOpen} />
        )}
        {(route.name === 'decks' || route.name === 'publicDecks' || route.name === 'deckBuild') && (
          <DecksView
            cards={cards}
            repositories={openRepositories}
            tab={route.name === 'publicDecks' ? 'public' : route.name === 'deckBuild' ? 'build' : 'own'}
            onOpen={(id) => navigate({ name: 'deck', id })}
          />
        )}
        {route.name === 'publicDeck' && (
          <PublicDeckView
            key={route.id}
            pubId={route.id}
            cards={cards}
            repositories={openRepositories}
            onOpen={(id) => navigate({ name: 'deck', id })}
          />
        )}
        {route.name === 'deck' && (
          <DeckEditor
            key={route.id}
            deckId={route.id}
            cards={cards}
            repositories={openRepositories}
            onBack={() => navigate({ name: 'decks' })}
            onOpenDeck={(id) => navigate({ name: 'deck', id })}
          />
        )}
        {route.name === 'share' && (
          <SharedDeckView
            data={route.data}
            cards={cards}
            repositories={openRepositories}
            onOpen={(id) => navigate({ name: 'deck', id })}
          />
        )}
        {route.name === 'havewant' && (
          <HaveWantView cards={cards} repositories={openRepositories} />
        )}
        {route.name === 'collection' && <CollectionView cards={cards} repositories={openRepositories} headerSlot={headerSlot} />}
        {route.name === 'proxy' && <ProxyView cards={cards} repositories={openRepositories} />}
        {route.name === 'trade' && (
          <SharedTradeView data={route.data} cards={cards} repositories={openRepositories} />
        )}
      </main>
      <footer className="site-footer" hidden={galleryOpen}>
        <div className="container">
          <p>{texts.footerUnofficial}</p>
          <p>{texts.footerSource}</p>
        </div>
      </footer>
    </PublicDecksContext.Provider>
  );
}
