import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { texts } from './ui/texts';
import './styles.css';

document.title = `${texts.heading} · ${texts.appName}`;

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Root element #root is missing from index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
