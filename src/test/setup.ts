import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

// Tests must never call the real Netdeck.gg API: any test that forgets to inject
// a fake fetch fails loudly instead (ARCHITECTURE.md, luku 8).
const blockedFetch: typeof fetch = () => {
  throw new Error('Real network access is disabled in tests');
};

beforeEach(() => {
  globalThis.fetch = blockedFetch;
});

afterEach(() => {
  cleanup();
});
