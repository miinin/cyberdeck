import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { createAccountSession, createBrowserAccountServices } from './account';
import type { AccountServices } from './account';
import { CARDS } from './data/cards';
import type { Card } from './domain/card';
import { openBrowserRepositories } from './storage';
import type { Repositories } from './storage';
import { CatalogView } from './ui/CatalogView';
import { DeckEditor } from './ui/DeckEditor';
import { SharedDeckView } from './ui/SharedDeckView';
import { DecksView } from './ui/DecksView';
import { deckTexts } from './ui/deckTexts';
import { useHashRoute } from './ui/useHashRoute';
import { texts } from './ui/texts';
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
          }),
    [uid, signedOutRepositories, openRepositories, accountServices],
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

  return (
    <>
      <header className="site-header">
        <div className="container">
          <span className="brand">{texts.appName}</span>
          <nav className="main-nav" aria-label={deckTexts.navLabel}>
            <a href="#/" aria-current={route.name === 'cards' ? 'page' : undefined}>
              {deckTexts.navCards}
            </a>
            <a href="#/pakat" aria-current={route.name !== 'cards' ? 'page' : undefined}>
              {deckTexts.navDecks}
            </a>
          </nav>
          <ThemeToggle preferences={openRepositories.preferences} />
          <AccountMenu
            auth={accountServices.auth}
            session={session}
            onSignedOut={() => setNotice('signed-out')}
            onAccountDeleted={() => setNotice('deleted')}
          />
        </div>
      </header>
      {notice !== null && uid === null && (
        <div className="container">
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
        {route.name === 'cards' && (
          <CatalogView cards={cards} repositories={openRepositories} headerSlot={headerSlot} />
        )}
        {route.name === 'decks' && (
          <DecksView cards={cards} repositories={openRepositories} onOpen={(id) => navigate({ name: 'deck', id })} />
        )}
        {route.name === 'deck' && (
          <DeckEditor
            key={route.id}
            deckId={route.id}
            cards={cards}
            repositories={openRepositories}
            onBack={() => navigate({ name: 'decks' })}
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
      </main>
      <footer className="site-footer">
        <div className="container">
          <p>{texts.footerUnofficial}</p>
          <p>{texts.footerSource}</p>
        </div>
      </footer>
    </>
  );
}
