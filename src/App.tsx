import { useState } from 'react';
import { createBrowserAccountServices } from './account';
import type { AccountServices } from './account';
import { CARDS } from './data/cards';
import type { Card } from './domain/card';
import { openBrowserRepositories } from './storage';
import type { Repositories } from './storage';
import { CatalogView } from './ui/CatalogView';
import { DeckEditor } from './ui/DeckEditor';
import { DecksView } from './ui/DecksView';
import { deckTexts } from './ui/deckTexts';
import { useHashRoute } from './ui/useHashRoute';
import { texts } from './ui/texts';
import { ThemeToggle } from './ui/ThemeToggle';
import { AccountMenu } from './ui/AccountMenu';

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
  const [openRepositories] = useState(() => repositories ?? openBrowserRepositories());
  // Creating the services loads nothing; the Firebase SDK loads only when needed (SR-21 kohta 5).
  const [accountServices] = useState(() => account ?? createBrowserAccountServices(openRepositories.preferences));
  // The persistent storage button lives in the header but its state in the catalog view.
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
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
          <span className="header-actions" ref={setHeaderSlot} />
          <AccountMenu auth={accountServices.auth} />
          <ThemeToggle preferences={openRepositories.preferences} />
        </div>
      </header>
      <main className="container">
        {route.name === 'cards' && (
          <CatalogView cards={cards} repositories={openRepositories} headerSlot={headerSlot} />
        )}
        {route.name === 'decks' && (
          <DecksView
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
