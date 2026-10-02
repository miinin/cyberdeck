import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

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
});
