import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { texts } from './ui/texts';
import './styles.css';
// T-181: one stylesheet per view package, after the base styles (cascade order matters; keep this order).
import './styles/cards.css';
import './styles/collection.css';
import './styles/decks.css';
import './styles/editor.css';
import './styles/playtest.css';
import './styles/havewant.css';
import './styles/proxy.css';
import './styles/premium.css';

document.title = `${texts.heading} · ${texts.appName}`;

/*
 * A page opened before a release asks for parts of the old version (e.g. the sign-in code), which the release removed:
 * the click would do nothing. Vite reports such a failed load; the page then reloads into the new version. A page that
 * was itself just reloaded does not reload again, so a real network problem never loops (T-155).
 */
window.addEventListener('vite:preloadError', (event) => {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (navigation?.type === 'reload' && performance.now() < 30_000) return;
  event.preventDefault();
  window.location.reload();
});

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Root element #root is missing from index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
