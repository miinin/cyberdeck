import { createMemoryRepositories, openBrowserRepositories } from './index';
import { COLLECTION_KEY, DECKS_KEY } from './keys';
import {
  createMemoryStore,
  openBrowserStore,
  requestPersistentStorage,
  subscribeToBrowserStorage,
} from './keyValueStore';

// Restore spies before the global afterEach in src/test/setup.ts clears localStorage.
afterEach(() => {
  vi.restoreAllMocks();
});

function stubStorageManager(value: unknown) {
  Object.defineProperty(navigator, 'storage', { value, configurable: true });
}

function blockLocalStorage() {
  vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new DOMException('The operation is insecure.', 'SecurityError');
  });
}

describe('openBrowserStore', () => {
  it('returns a working store backed by localStorage and leaves no probe key', () => {
    const store = openBrowserStore();
    expect(store).not.toBeNull();
    store?.setItem('cyberdeck:test', 'value');
    expect(window.localStorage.getItem('cyberdeck:test')).toBe('value');
    expect(store?.getItem('cyberdeck:test')).toBe('value');
    expect(store?.keys()).toEqual(['cyberdeck:test']);
    store?.removeItem('cyberdeck:test');
    expect(window.localStorage.length).toBe(0);
  });

  it('returns null when reading localStorage throws a SecurityError', () => {
    blockLocalStorage();
    expect(openBrowserStore()).toBeNull();
  });

  it('returns null when writing fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(openBrowserStore()).toBeNull();
  });
});

describe('openBrowserRepositories', () => {
  it('uses localStorage when it works', async () => {
    const repositories = openBrowserRepositories();
    expect(repositories.persistent).toBe(true);
    await repositories.collection.setCount('detonate', 2);
    expect(window.localStorage.getItem(COLLECTION_KEY)).toContain('"detonate"');
  });

  it('falls back to memory with persistent false when storage is blocked', async () => {
    blockLocalStorage();
    const repositories = openBrowserRepositories();
    expect(repositories.persistent).toBe(false);
    await repositories.collection.setCount('detonate', 2);
    expect((await repositories.collection.load()).value.entries).toEqual([{ card: 'detonate', count: 2 }]);
    const deck = await repositories.decks.create({ name: 'Pakka', sections: [] });
    expect(await repositories.decks.get(deck.id)).toEqual(deck);
  });
});

describe('createMemoryRepositories', () => {
  it('starts from the given raw values and uses the given clock and ids', async () => {
    const repositories = createMemoryRepositories({
      initial: { [DECKS_KEY]: 'broken' },
      now: () => new Date('2026-10-01T12:00:00.000Z'),
      newId: () => 'fixed-id',
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(repositories.persistent).toBe(false);
    expect((await repositories.decks.list()).notices[0]).toMatchObject({ kind: 'reset' });
    expect(await repositories.decks.create({ name: 'P', sections: [] })).toMatchObject({
      id: 'fixed-id',
      createdAt: '2026-10-01T12:00:00.000Z',
    });
  });
});

describe('createMemoryStore', () => {
  it('stores, lists and removes values', () => {
    const store = createMemoryStore({ a: '1' });
    store.setItem('b', '2');
    expect(store.keys()).toEqual(['a', 'b']);
    store.removeItem('a');
    expect(store.getItem('a')).toBeNull();
    expect(store.getItem('b')).toBe('2');
  });

  it('handles keys such as __proto__ as ordinary keys', () => {
    const store = createMemoryStore();
    store.setItem('__proto__', 'x');
    expect(store.getItem('__proto__')).toBe('x');
    expect(({} as Record<string, unknown>).x).toBeUndefined();
  });
});

describe('subscribeToBrowserStorage', () => {
  it('calls the listener for its keys and for clear, and not after unsubscribing', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToBrowserStorage([COLLECTION_KEY], listener);

    window.dispatchEvent(new StorageEvent('storage', { key: COLLECTION_KEY }));
    expect(listener).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new StorageEvent('storage', { key: DECKS_KEY }));
    expect(listener).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    window.dispatchEvent(new StorageEvent('storage', { key: COLLECTION_KEY }));
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('requestPersistentStorage', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'storage');
  });

  it('returns false without navigator.storage', async () => {
    expect('storage' in navigator).toBe(false);
    expect(await requestPersistentStorage()).toBe(false);
  });

  it('returns false when persist is not supported', async () => {
    stubStorageManager({});
    expect(await requestPersistentStorage()).toBe(false);
  });

  it('returns the browser answer', async () => {
    const persist = vi.fn(async () => true);
    stubStorageManager({ persist });
    expect(await requestPersistentStorage()).toBe(true);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('returns false when the browser throws', async () => {
    const persist = vi.fn(async () => {
      throw new Error('denied');
    });
    stubStorageManager({ persist });
    expect(await requestPersistentStorage()).toBe(false);
  });
});
