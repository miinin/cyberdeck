import { CatalogView } from './ui/CatalogView';
import { texts } from './ui/texts';
import { useCardCatalog } from './ui/useCardCatalog';
import type { LoadCatalog } from './ui/useCardCatalog';

export function App({ loadCatalog }: { loadCatalog?: LoadCatalog }) {
  const { state, retry } = useCardCatalog(loadCatalog);

  return (
    <>
      <header className="site-header">
        <div className="container">{texts.appName}</div>
      </header>
      <main className="container">
        <CatalogView state={state} onRetry={retry} />
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
