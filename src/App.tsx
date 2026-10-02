import { useState } from 'react';
import { openBrowserRepositories } from './storage';
import type { Repositories } from './storage';
import { CatalogView } from './ui/CatalogView';
import { texts } from './ui/texts';
import { useCardCatalog } from './ui/useCardCatalog';
import type { LoadCatalog } from './ui/useCardCatalog';

export function App({ loadCatalog, repositories }: { loadCatalog?: LoadCatalog; repositories?: Repositories }) {
  const { state, retry } = useCardCatalog(loadCatalog);
  // Opened once per page load; tests pass in-memory repositories.
  const [openRepositories] = useState(() => repositories ?? openBrowserRepositories());

  return (
    <>
      <header className="site-header">
        <div className="container">
          <span className="brand">{texts.appName}</span>
        </div>
      </header>
      <main className="container">
        <CatalogView state={state} onRetry={retry} repositories={openRepositories} />
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
