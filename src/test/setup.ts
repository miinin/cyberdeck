import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

// Tests must never load or call the real Firebase SDK (D-017 kohta 8, SR-27 kohta 4): the only module
// that imports it throws instead. Account tests pass fake auth (src/account/memory.ts) or fake modules.
vi.mock('../account/firebase/loadFirebase', () => ({
  loadFirestore: vi.fn(async () => {
    throw new Error('Real Firebase is disabled in tests');
  }),
  loadFirebase: vi.fn(async () => {
    throw new Error('Real Firebase is disabled in tests');
  }),
}));

// Tests must never call the real Netdeck.gg API: any test that forgets to inject
// a fake fetch fails loudly instead (ARCHITECTURE.md, luku 8).
const blockedFetch: typeof fetch = () => {
  throw new Error('Real network access is disabled in tests');
};

// jsdom has no modal dialogs: a minimal stand-in that opens, closes and fires "close" like a browser (T-027).
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}

beforeEach(() => {
  globalThis.fetch = blockedFetch;
});

afterEach(() => {
  cleanup();
  // Stored data must not leak from one test to the next (ARCHITECTURE.md 12.8).
  localStorage.clear();
  // The route lives in the URL hash (T-013).
  window.location.hash = '';
  // The theme lives on <html>, outside the rendered tree (T-025).
  document.documentElement.removeAttribute('data-theme');
});
