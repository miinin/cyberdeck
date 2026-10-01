/*
 * The only module that touches the browser's storage APIs (SR-12). Everything else uses
 * the KeyValueStore interface, so tests and the in-memory fallback share the same code path.
 */

import { isQuotaError } from './errors';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  keys(): string[];
}

const PROBE_KEY = 'cyberdeck:probe';

function wrapStorage(storage: Storage): KeyValueStore {
  return {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
    keys: () => {
      const keys: string[] = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key !== null) keys.push(key);
      }
      return keys;
    },
  };
}

/**
 * Returns localStorage as a KeyValueStore, or null when it is blocked or does not work.
 * Even reading `window.localStorage` can throw a SecurityError (SR-13), so it is inside the try.
 * A full storage is still returned: saved data stays visible and writes fail with `quota` (SEC-006).
 */
export function openBrowserStore(): KeyValueStore | null {
  try {
    const storage = window.localStorage;
    // Reading must work; a SecurityError here falls through to the outer catch.
    storage.getItem(PROBE_KEY);
    try {
      storage.setItem(PROBE_KEY, '1');
      storage.removeItem(PROBE_KEY);
    } catch (error) {
      if (!isQuotaError(error)) return null;
    }
    return wrapStorage(storage);
  } catch {
    return null;
  }
}

/** Map-based store for tests and for browsers where storage is not available. */
export function createMemoryStore(initial: Readonly<Record<string, string>> = {}): KeyValueStore {
  const items = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value);
    },
    removeItem: (key) => {
      items.delete(key);
    },
    keys: () => [...items.keys()],
  };
}

/**
 * Calls `listener` when another tab changes one of `keys` (or clears storage).
 * The browser fires the `storage` event only in other tabs. Returns an unsubscribe function.
 */
export function subscribeToBrowserStorage(keys: readonly string[], listener: () => void): () => void {
  const handler = (event: StorageEvent) => {
    if (event.key === null || keys.includes(event.key)) listener();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

/**
 * Asks the browser not to evict stored data (navigator.storage.persist). Returns false when
 * unsupported or refused. Call only from a user action, never at startup (SR-13).
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    const storageManager: StorageManager | undefined = navigator.storage;
    if (typeof storageManager?.persist !== 'function') return false;
    return (await storageManager.persist()) === true;
  } catch {
    return false;
  }
}
