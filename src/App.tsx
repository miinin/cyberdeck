import { useState } from 'react';
import { CARDS } from './data/cards';
import type { Card } from './domain/card';
import { openBrowserRepositories } from './storage';
import type { Repositories } from './storage';
import { CatalogView } from './ui/CatalogView';
import { texts } from './ui/texts';
import { ThemeToggle } from './ui/ThemeToggle';

/** `cards` defaults to the bundled data (D-013); tests pass a small list and in-memory repositories. */
export function App({ cards = CARDS, repositories }: { cards?: readonly Card[]; repositories?: Repositories }) {
  // Opened once per page load; tests pass in-memory repositories.
  const [openRepositories] = useState(() => repositories ?? openBrowserRepositories());
  // The persistent storage button lives in the header but its state in the catalog view.
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);

  return (
    <>
      <header className="site-header">
        <div className="container">
          <span className="brand">{texts.appName}</span>
          <span className="header-actions" ref={setHeaderSlot} />
          <ThemeToggle preferences={openRepositories.preferences} />
        </div>
      </header>
      <main className="container">
        <CatalogView cards={cards} repositories={openRepositories} headerSlot={headerSlot} />
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
