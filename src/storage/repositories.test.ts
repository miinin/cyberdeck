import type { DeckContent } from '../domain/deck';
import { MAX_DECKS } from '../domain/deck';
import { encodeEnvelope } from './envelope';
import { StorageError } from './errors';
import {
  ACCOUNT_LAST_UID_KEY,
  ACCOUNT_REDIRECT_PENDING_KEY,
  BACKUP_PREFIX,
  COLLECTION_KEY,
  DECKS_KEY,
  EDIT_MODE_KEY,
  THEME_KEY,
  VIEW_KEY,
  WANTS_KEY,
} from './keys';
import { createMemoryStore } from './keyValueStore';
import type { KeyValueStore } from './keyValueStore';
import { createRepositories } from './repositories';
import type { RepositoryOptions } from './repositories';

const START = Date.UTC(2026, 9, 1, 12, 0, 0);

function setup(initial: Record<string, string> = {}, options: Partial<RepositoryOptions> = {}) {
  const store = options.store ?? createMemoryStore(initial);
  let tick = 0;
  let ids = 0;
  const repositories = createRepositories({
    store,
    persistent: true,
    now: () => new Date(START + 1000 * tick++),
    newId: () => `deck-${++ids}`,
    ...options,
  });
  return { store, ...repositories };
}

/** A store whose setItem throws `error` for keys accepted by `fails`. */
function failingStore(base: KeyValueStore, error: Error, fails: (key: string) => boolean = () => true): KeyValueStore {
  return {
    getItem: (key) => base.getItem(key),
    setItem: (key, value) => {
      if (fails(key)) throw error;
      base.setItem(key, value);
    },
    removeItem: (key) => base.removeItem(key),
    keys: () => base.keys(),
  };
}

const quotaError = () => new DOMException('full', 'QuotaExceededError');

function stored(version: number, data: unknown): string {
  return encodeEnvelope(data, version, new Date(START));
}

function backupKeys(store: KeyValueStore, name: 'collection' | 'decks' | 'wants'): string[] {
  return store
    .keys()
    .filter((key) => key.startsWith(`${BACKUP_PREFIX}${name}:`))
    .sort();
}

const content: DeckContent = {
  name: 'Esimerkkipakka',
  sections: [{ name: 'Legends', cards: [{ card: 'v-streetkid', count: 1 }] }],
};

async function expectStorageError(promise: Promise<unknown>, kind: StorageError['kind']) {
  const error: unknown = await promise.then(
    () => null,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(StorageError);
  expect((error as StorageError).kind).toBe(kind);
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('empty storage', () => {
  it('loads an empty collection and an empty deck list without notices', async () => {
    const { collection, decks } = setup();
    expect(await collection.load()).toEqual({ value: { entries: [] }, notices: [] });
    expect(await decks.list()).toEqual({ value: [], notices: [] });
    expect(await decks.get('deck-1')).toBeNull();
  });
});

describe('collection', () => {
  it('saves counts that a new instance on the same store reads back', async () => {
    const { store, collection } = setup();
    await collection.setCount('v-streetkid', 2);
    expect(await collection.setCount('detonate', 3)).toEqual({
      entries: [
        { card: 'detonate', count: 3 },
        { card: 'v-streetkid', count: 2 },
      ],
    });

    const reopened = setup({}, { store });
    expect((await reopened.collection.load()).value.entries).toEqual([
      { card: 'detonate', count: 3 },
      { card: 'v-streetkid', count: 2 },
    ]);
    expect(JSON.parse(store.getItem(COLLECTION_KEY) ?? '')).toMatchObject({
      schemaVersion: 3,
      savedAt: '2026-10-01T12:00:01.000Z',
    });
  });

  it('removes a card with count 0', async () => {
    const { collection } = setup();
    await collection.setCount('detonate', 3);
    expect(await collection.setCount('detonate', 0)).toEqual({ entries: [] });
    expect((await collection.load()).value.entries).toEqual([]);
  });

  it.each([
    ['invalid key', 'Detonate', 1],
    ['reserved key', '__proto__', 1],
    ['negative count', 'detonate', -1],
    ['decimal count', 'detonate', 1.5],
    ['NaN count', 'detonate', Number.NaN],
    ['too large count', 'detonate', 1000],
  ])('rejects %s with invalid-input and writes nothing', async (_label, card, count) => {
    const { store, collection } = setup();
    await expectStorageError(collection.setCount(card, count), 'invalid-input');
    expect(store.keys()).toEqual([]);
  });

  it('rejects a new card when the collection is full, but still updates existing ones', async () => {
    const entries = Array.from({ length: 5000 }, (_, index) => ({ card: `card-${index}`, count: 1 }));
    const { collection } = setup({ [COLLECTION_KEY]: stored(1, { entries }) });

    await expectStorageError(collection.setCount('detonate', 1), 'limit-reached');
    expect(await collection.setCount('card-1', 4)).toMatchObject({ entries: expect.arrayContaining([{ card: 'card-1', count: 4 }]) });
  });
});

describe('wants (D-018)', () => {
  it('stores the want list under its own key, apart from the collection', async () => {
    const { store, collection, wants } = setup();
    await collection.setCount('detonate', 1);
    expect(await wants.setCount('detonate', 4)).toEqual({ entries: [{ card: 'detonate', count: 4 }] });
    expect(JSON.parse(store.getItem(WANTS_KEY) ?? '')).toMatchObject({
      schemaVersion: 1,
      data: { entries: [{ card: 'detonate', count: 4 }] },
    });
    expect((await collection.load()).value.entries).toEqual([{ card: 'detonate', count: 1 }]);

    const reopened = setup({}, { store });
    expect((await reopened.wants.load()).value.entries).toEqual([{ card: 'detonate', count: 4 }]);
    expect(await wants.setCount('detonate', 0)).toEqual({ entries: [] });
  });

  it.each([
    ['invalid key', 'Detonate', 1],
    ['reserved key', '__proto__', 1],
    ['negative count', 'detonate', -1],
    ['too large count', 'detonate', 1000],
  ])('rejects %s with invalid-input and writes nothing', async (_label, card, count) => {
    const { store, wants } = setup();
    await expectStorageError(wants.setCount(card, count), 'invalid-input');
    expect(store.keys()).toEqual([]);
  });

  it('rejects a new card when the list is full', async () => {
    const entries = Array.from({ length: 5000 }, (_, index) => ({ card: `card-${index}`, count: 1 }));
    const { wants } = setup({ [WANTS_KEY]: stored(1, { entries }) });
    await expectStorageError(wants.setCount('detonate', 1), 'limit-reached');
    expect(await wants.setCount('card-1', 4)).toMatchObject({ entries: expect.arrayContaining([{ card: 'card-1', count: 4 }]) });
  });

  it('backs up unreadable data under the wants name and starts from empty', async () => {
    const { store, wants } = setup({ [WANTS_KEY]: '{broken' });
    const loaded = await wants.load();
    expect(loaded.value.entries).toEqual([]);
    expect(loaded.notices).toMatchObject([{ kind: 'reset' }]);
    expect(backupKeys(store, 'wants')).toHaveLength(1);
  });

  it('keeps the valid rows of a partly broken list and reports repaired', async () => {
    const raw = stored(1, { entries: [{ card: 'detonate', count: 2 }, { card: 'x', count: 0 }, 'junk'] });
    const { wants } = setup({ [WANTS_KEY]: raw });
    const loaded = await wants.load();
    expect(loaded.value.entries).toEqual([{ card: 'detonate', count: 2 }]);
    expect(loaded.notices).toEqual([{ kind: 'repaired', dropped: 2 }]);
  });

  it('shows newer data as empty and blocks writes', async () => {
    const raw = stored(2, { entries: [{ card: 'detonate', count: 1 }] });
    const { store, wants } = setup({ [WANTS_KEY]: raw });
    expect((await wants.load()).notices).toEqual([{ kind: 'newer-version', version: 2 }]);
    await expectStorageError(wants.setCount('detonate', 2), 'newer-version');
    expect(store.getItem(WANTS_KEY)).toBe(raw);
  });

  it('notifies subscribers of its own key only', () => {
    const subscribe = vi.fn(() => () => {});
    const { wants } = setup({}, { subscribe });
    wants.subscribe(() => {});
    expect(subscribe).toHaveBeenCalledWith([WANTS_KEY], expect.any(Function));
  });
});

describe('decks', () => {
  it('creates, gets, updates and removes decks', async () => {
    const { store, decks } = setup();

    const created = await decks.create(content);
    expect(created).toEqual({
      id: 'deck-1',
      name: 'Esimerkkipakka',
      sections: content.sections,
      createdAt: '2026-10-01T12:00:00.000Z',
      updatedAt: '2026-10-01T12:00:00.000Z',
    });
    const second = await decks.create({ name: 'Toinen', sections: [] });
    expect(await decks.get('deck-1')).toEqual(created);

    const updated = await decks.update('deck-1', { name: 'Uusi nimi', sections: [] });
    expect(updated).toEqual({
      id: 'deck-1',
      name: 'Uusi nimi',
      sections: [],
      createdAt: created.createdAt,
      updatedAt: '2026-10-01T12:00:02.000Z',
    });

    const reopened = setup({}, { store });
    expect((await reopened.decks.list()).value).toEqual([updated, second]);

    await decks.remove('deck-1');
    expect((await decks.list()).value).toEqual([second]);
    expect(await decks.get('deck-1')).toBeNull();
  });

  it('sets the publishing settings, keeps them through edits and bumps updatedAt (T-098)', async () => {
    const { decks } = setup();
    const created = await decks.create(content);
    expect(created.publish).toBeUndefined();

    const published = await decks.setPublish('deck-1', { public: true, nickname: 'Nick' });
    expect(published.publish).toEqual({ public: true, nickname: 'Nick' });
    expect(published.updatedAt > created.updatedAt).toBe(true);
    expect(published.sections).toEqual(created.sections);

    // update() never changes the settings (the editor and rename write content only).
    const edited = await decks.update('deck-1', { name: 'Uusi nimi', sections: [] });
    expect(edited.publish).toEqual({ public: true, nickname: 'Nick' });
    expect((await decks.get('deck-1'))?.publish).toEqual({ public: true, nickname: 'Nick' });

    const priv = await decks.setPublish('deck-1', undefined);
    expect(priv.publish).toBeUndefined();
  });

  it('rejects invalid publishing settings and an unknown deck', async () => {
    const { decks } = setup();
    await decks.create(content);
    await expectStorageError(decks.setPublish('deck-1', { public: true, nickname: 'x'.repeat(31) }), 'invalid-input');
    await expectStorageError(decks.setPublish('missing', { public: true, nickname: null }), 'not-found');
  });

  it('never uses an id from the caller', async () => {
    const { decks } = setup();
    const withId = { ...content, id: 'chosen-by-file', createdAt: '2000-01-01T00:00:00.000Z' } as DeckContent;
    const created = await decks.create(withId);
    expect(created.id).toBe('deck-1');
    expect(created.createdAt).toBe('2026-10-01T12:00:00.000Z');
  });

  it('returns the cleaned name', async () => {
    const { decks } = setup();
    expect((await decks.create({ name: '  Pakka\n// Units (99) ', sections: [] })).name).toBe('Pakka// Units (99)');
  });

  it('rejects update of an unknown id with not-found', async () => {
    const { decks } = setup();
    await decks.create(content);
    await expectStorageError(decks.update('missing', content), 'not-found');
    await expectStorageError(decks.update('__proto__', content), 'not-found');
  });

  it('removes an unknown id without an error or a write', async () => {
    const { store, decks } = setup();
    await decks.remove('missing');
    expect(store.keys()).toEqual([]);
  });

  it.each([
    ['empty name', { name: ' ', sections: [] }],
    ['too long name', { name: 'a'.repeat(101), sections: [] }],
    ['invalid card key', { name: 'P', sections: [{ name: '', cards: [{ card: 'Bad Key', count: 1 }] }] }],
    ['too large count', { name: 'P', sections: [{ name: '', cards: [{ card: 'detonate', count: 100 }] }] }],
    ['zero count', { name: 'P', sections: [{ name: '', cards: [{ card: 'detonate', count: 0 }] }] }],
  ])('rejects %s with invalid-input', async (_label, input) => {
    const { store, decks } = setup();
    await expectStorageError(decks.create(input as DeckContent), 'invalid-input');
    expect(store.keys()).toEqual([]);
  });

  it(`rejects deck number ${MAX_DECKS + 1} with limit-reached`, async () => {
    const list = Array.from({ length: MAX_DECKS }, (_, index) => ({
      id: `existing-${index}`,
      name: `Pakka ${index}`,
      sections: [],
      createdAt: '2026-10-01T12:00:00.000Z',
      updatedAt: '2026-10-01T12:00:00.000Z',
    }));
    const { decks } = setup({ [DECKS_KEY]: stored(1, { decks: list }) });
    await expectStorageError(decks.create(content), 'limit-reached');
    expect((await decks.list()).value).toHaveLength(MAX_DECKS);
  });
});

describe('broken data', () => {
  it('backs up unreadable data exactly, starts from empty and allows writing', async () => {
    const raw = '{"schemaVersion":1,"data":{"entries":[{"card":"detonate"'; // cut-off write
    const { store, collection } = setup({ [COLLECTION_KEY]: raw });

    const loaded = await collection.load();
    const [backupKey] = backupKeys(store, 'collection');
    expect(backupKey).toBe('cyberdeck:backup:collection:2026-10-01T12:00:00.000Z');
    expect(loaded).toEqual({ value: { entries: [] }, notices: [{ kind: 'reset', backupKey }] });
    expect(store.getItem(backupKey ?? '')).toBe(raw);
    expect(store.getItem(COLLECTION_KEY)).toBeNull();

    expect(await collection.setCount('detonate', 1)).toEqual({ entries: [{ card: 'detonate', count: 1 }] });
    expect(store.getItem(backupKey ?? '')).toBe(raw);
  });

  it('backs up unreadable data before the first write even without a load', async () => {
    const raw = 'not json';
    const { store, decks } = setup({ [DECKS_KEY]: raw });
    await decks.create(content);
    const [backupKey] = backupKeys(store, 'decks');
    expect(store.getItem(backupKey ?? '')).toBe(raw);
  });

  it('keeps the intact part of partly broken data and reports repaired', async () => {
    const raw = stored(3, {
      entries: [{ card: 'detonate', count: 3 }, { card: 'constructor', count: 1 }, { card: 'v-streetkid', count: -1 }],
    });
    const { store, collection } = setup({ [COLLECTION_KEY]: raw });

    expect(await collection.load()).toEqual({
      value: { entries: [{ card: 'detonate', count: 3 }] },
      notices: [{ kind: 'repaired', dropped: 2 }],
    });
    expect(console.warn).toHaveBeenCalledWith(expect.not.stringContaining('constructor'));

    await collection.setCount('chrome-fang', 1);
    const [backupKey] = backupKeys(store, 'collection');
    expect(store.getItem(backupKey ?? '')).toBe(raw);
    expect((await collection.load()).notices).toEqual([]);
  });

  it('does not delete or overwrite unreadable data when the backup fails', async () => {
    const raw = '{broken';
    const base = createMemoryStore({ [COLLECTION_KEY]: raw });
    const store = failingStore(base, quotaError(), (key) => key.startsWith(BACKUP_PREFIX));
    const { collection } = setup({}, { store });

    expect(await collection.load()).toEqual({ value: { entries: [] }, notices: [{ kind: 'reset', backupKey: null }] });
    expect(base.getItem(COLLECTION_KEY)).toBe(raw);

    await expectStorageError(collection.setCount('detonate', 1), 'quota');
    expect(base.getItem(COLLECTION_KEY)).toBe(raw);
  });

  it('keeps only the newest backups and never touches live data', async () => {
    const store = createMemoryStore({ [DECKS_KEY]: stored(1, { decks: [] }), 'cyberdeck:other': 'x' });
    const repositories = setup({}, { store });
    for (let round = 0; round < 4; round += 1) {
      store.setItem(COLLECTION_KEY, `broken ${round}`);
      await repositories.collection.load();
    }
    const backups = backupKeys(store, 'collection');
    expect(backups).toHaveLength(3);
    expect(backups.map((key) => store.getItem(key))).toEqual(['broken 1', 'broken 2', 'broken 3']);
    expect(store.getItem(DECKS_KEY)).toBe(stored(1, { decks: [] }));
    expect(store.getItem('cyberdeck:other')).toBe('x');
  });

  it('never prunes the backup it just wrote, even if the clock went backwards', async () => {
    const store = createMemoryStore({
      'cyberdeck:backup:collection:2030-01-01T00:00:00.000Z': 'a',
      'cyberdeck:backup:collection:2030-01-02T00:00:00.000Z': 'b',
      'cyberdeck:backup:collection:2030-01-03T00:00:00.000Z': 'c',
      [COLLECTION_KEY]: 'broken now',
    });
    const { collection } = setup({}, { store });
    const loaded = await collection.load();
    const backupKey = loaded.notices[0]?.kind === 'reset' ? loaded.notices[0].backupKey : null;
    expect(store.getItem(backupKey ?? '')).toBe('broken now');
    expect(backupKeys(store, 'collection')).toHaveLength(3);
  });

  it('does not overwrite a backup written in the same millisecond', async () => {
    const store = createMemoryStore({ [COLLECTION_KEY]: 'first' });
    const { collection } = setup({}, { store, now: () => new Date(START) });
    await collection.load();
    store.setItem(COLLECTION_KEY, 'second');
    await collection.load();
    expect(backupKeys(store, 'collection').map((key) => store.getItem(key))).toEqual(['first', 'second']);
  });
});

describe('schema version', () => {
  it('shows newer data as empty, blocks writes and keeps the raw value unchanged', async () => {
    const raw = stored(4, { entries: [{ card: 'detonate', count: 1 }], future: true });
    const { store, collection, decks } = setup({ [COLLECTION_KEY]: raw, [DECKS_KEY]: raw });

    expect(await collection.load()).toEqual({ value: { entries: [] }, notices: [{ kind: 'newer-version', version: 4 }] });
    await expectStorageError(collection.setCount('detonate', 2), 'newer-version');
    await expectStorageError(decks.create(content), 'newer-version');
    await expectStorageError(decks.remove('deck-1'), 'newer-version');
    expect(store.getItem(COLLECTION_KEY)).toBe(raw);
    expect(store.getItem(DECKS_KEY)).toBe(raw);
    expect(backupKeys(store, 'collection')).toEqual([]);
  });

  // One test migration makes version 2 the current version, so stored version 1 is older.
  it('migrates older data in memory and backs it up before the first overwrite', async () => {
    const raw = stored(1, { cards: [{ card: 'detonate', count: 2 }] });
    const migrations = { collection: [(data: unknown) => ({ entries: (data as { cards: unknown }).cards })] };
    const { store, collection } = setup({ [COLLECTION_KEY]: raw }, { migrations });
    const loaded = await collection.load();
    expect(loaded.value.entries).toEqual([{ card: 'detonate', count: 2 }]);
    expect(loaded.notices).toEqual([{ kind: 'migrated', from: 1, to: 2 }]);
    expect(store.getItem(COLLECTION_KEY)).toBe(raw);

    await collection.setCount('detonate', 3);
    const [backupKey] = backupKeys(store, 'collection');
    expect(store.getItem(backupKey ?? '')).toBe(raw);
    expect(JSON.parse(store.getItem(COLLECTION_KEY) ?? '')).toMatchObject({
      schemaVersion: 2,
      data: { entries: [{ card: 'detonate', count: 3 }] },
    });
  });
});

describe('storage errors', () => {
  it('maps QuotaExceededError to quota and keeps the previous value', async () => {
    const base = createMemoryStore();
    const writable = setup({}, { store: base });
    await writable.collection.setCount('detonate', 1);
    const before = base.getItem(COLLECTION_KEY);

    const { collection } = setup({}, { store: failingStore(base, quotaError()) });
    await expectStorageError(collection.setCount('detonate', 2), 'quota');
    expect(base.getItem(COLLECTION_KEY)).toBe(before);
    expect((await collection.load()).value.entries).toEqual([{ card: 'detonate', count: 1 }]);
  });

  it('maps other storage errors to unavailable', async () => {
    const base = createMemoryStore();
    const throwing: KeyValueStore = {
      ...base,
      getItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
    };
    const { collection, decks } = setup({}, { store: throwing });
    await expectStorageError(collection.load(), 'unavailable');
    await expectStorageError(decks.create(content), 'unavailable');
  });
});

describe('two tabs', () => {
  it('reads fresh state before every write, so changes from both instances are kept', async () => {
    const store = createMemoryStore();
    const first = setup({}, { store });
    const second = setup({}, { store, newId: () => 'other-tab-deck' });

    await first.collection.load();
    await second.collection.load();
    await first.collection.setCount('detonate', 1);
    await second.collection.setCount('chrome-fang', 2);

    expect((await first.collection.load()).value.entries).toEqual([
      { card: 'chrome-fang', count: 2 },
      { card: 'detonate', count: 1 },
    ]);

    await first.decks.create(content);
    await second.decks.create({ name: 'Toinen', sections: [] });
    expect((await first.decks.list()).value.map((deck) => deck.name)).toEqual(['Esimerkkipakka', 'Toinen']);
  });

  it('subscribes through the injected function with the right key', () => {
    const subscribe = vi.fn(() => () => {});
    const { collection, decks } = setup({}, { subscribe });
    const listener = () => {};
    collection.subscribe(listener);
    decks.subscribe(listener);
    expect(subscribe).toHaveBeenNthCalledWith(1, [COLLECTION_KEY], listener);
    expect(subscribe).toHaveBeenNthCalledWith(2, [DECKS_KEY], listener);
  });

  it('returns a no-op unsubscribe without a subscribe function', () => {
    const { collection } = setup();
    expect(() => collection.subscribe(() => {})()).not.toThrow();
  });
});

describe('preferences: theme (T-025, UX.md 8.7)', () => {
  it('loads the dark default when nothing is saved', async () => {
    const { preferences, store } = setup();
    expect(await preferences.loadTheme()).toBe('dark');
    expect(store.getItem(THEME_KEY)).toBeNull();
  });

  it('saves the raw string that a new instance on the same store reads back', async () => {
    const { preferences, store } = setup();
    expect(await preferences.saveTheme('light')).toBe('light');
    expect(store.getItem(THEME_KEY)).toBe('light');
    expect(await createRepositories({ store, persistent: true }).preferences.loadTheme()).toBe('light');

    await preferences.saveTheme('dark');
    expect(store.getItem(THEME_KEY)).toBe('dark');
    expect(await preferences.loadTheme()).toBe('dark');
  });

  it.each(['LIGHT', ' light', '"light"', '', '{"theme":"light"}'])(
    'reads the unknown value %j as dark and does not rewrite it',
    async (raw) => {
      const { preferences, store } = setup({ [THEME_KEY]: raw });
      expect(await preferences.loadTheme()).toBe('dark');
      expect(store.getItem(THEME_KEY)).toBe(raw);
    },
  );

  it('loads dark instead of rejecting when reading storage throws', async () => {
    const base = createMemoryStore({ [THEME_KEY]: 'light' });
    const store: KeyValueStore = {
      ...base,
      getItem: () => {
        throw new DOMException('blocked', 'SecurityError');
      },
    };
    const { preferences } = setup({}, { store });
    expect(await preferences.loadTheme()).toBe('dark');
  });

  it('rejects with quota or unavailable when saving fails and keeps the previous value', async () => {
    const base = createMemoryStore({ [THEME_KEY]: 'dark' });
    const quota = setup({}, { store: failingStore(base, quotaError()) });
    await expectStorageError(quota.preferences.saveTheme('light'), 'quota');
    const blocked = setup({}, { store: failingStore(base, new DOMException('blocked', 'SecurityError')) });
    await expectStorageError(blocked.preferences.saveTheme('light'), 'unavailable');
    expect(base.getItem(THEME_KEY)).toBe('dark');
  });

  it('rejects an unknown theme from the caller without writing', async () => {
    const { preferences, store } = setup();
    await expectStorageError(preferences.saveTheme('blue' as 'dark'), 'invalid-input');
    expect(store.getItem(THEME_KEY)).toBeNull();
  });

  it('does not touch the collection or deck keys', async () => {
    const { preferences, store } = setup();
    await preferences.saveTheme('light');
    expect(store.keys()).toEqual([THEME_KEY]);
  });
});

describe('preferences: list view and edit switch (T-040)', () => {
  it('loads grid and "not chosen" when nothing is saved', async () => {
    const { preferences } = setup();
    expect(await preferences.loadView()).toBe('grid');
    expect(await preferences.loadEditMode()).toBeNull();
  });

  it('saves the view and the switch so that a new instance reads them back', async () => {
    const { preferences, store } = setup();
    await preferences.saveView('table');
    await preferences.saveEditMode(true);
    const again = createRepositories({ store, persistent: true }).preferences;
    expect(await again.loadView()).toBe('table');
    expect(await again.loadEditMode()).toBe(true);
    await preferences.saveEditMode(false);
    expect(await again.loadEditMode()).toBe(false);
  });

  it('reads unknown stored values as the defaults', async () => {
    const { preferences } = setup({ [VIEW_KEY]: 'cards', [EDIT_MODE_KEY]: 'yes' });
    expect(await preferences.loadView()).toBe('grid');
    expect(await preferences.loadEditMode()).toBeNull();
  });

  it('rejects an unknown view and reports a failed save', async () => {
    const { preferences, store } = setup();
    await expectStorageError(preferences.saveView('list' as 'grid'), 'invalid-input');
    expect(store.getItem(VIEW_KEY)).toBeNull();
    const quota = setup({}, { store: failingStore(createMemoryStore(), quotaError()) });
    await expectStorageError(quota.preferences.saveEditMode(true), 'quota');
  });
});

describe('preferences: deck editor result view (T-045)', () => {
  it('defaults to the list, remembers images and ignores unknown values', async () => {
    const { preferences, store } = setup();
    expect(await preferences.loadDeckPickView()).toBe('list');
    await preferences.saveDeckPickView('images');
    const again = createRepositories({ store, persistent: true }).preferences;
    expect(await again.loadDeckPickView()).toBe('images');
    await expectStorageError(preferences.saveDeckPickView('grid' as 'list'), 'invalid-input');
    const odd = setup({ 'cyberdeck:deck-pick-view': 'cards' });
    expect(await odd.preferences.loadDeckPickView()).toBe('list');
  });
});

describe('preferences: default edition (D-022)', () => {
  it('defaults to Beta, remembers Retail and ignores unknown values', async () => {
    const { preferences, store } = setup();
    expect(await preferences.loadDefaultEdition()).toBe('beta');
    await preferences.saveDefaultEdition('retail');
    const again = createRepositories({ store, persistent: true }).preferences;
    expect(await again.loadDefaultEdition()).toBe('retail');
    await expectStorageError(preferences.saveDefaultEdition('fr' as 'beta'), 'invalid-input');
    const odd = setup({ 'cyberdeck:default-edition': 'both' });
    expect(await odd.preferences.loadDefaultEdition()).toBe('beta');
  });
});

describe('preferences: account hints (T-054a, D-017 kohta 1)', () => {
  it('saves, reads back and removes the last uid', () => {
    const { preferences, store } = setup();
    expect(preferences.loadLastUid()).toBeNull();
    preferences.saveLastUid('abcXYZ123');
    expect(store.getItem(ACCOUNT_LAST_UID_KEY)).toBe('abcXYZ123');
    expect(preferences.loadLastUid()).toBe('abcXYZ123');
    preferences.saveLastUid(null);
    expect(store.getItem(ACCOUNT_LAST_UID_KEY)).toBeNull();
  });

  it.each(['', 'a/b', 'cyberdeck:x', 'ä', 'a'.repeat(129)])('never stores or returns the invalid uid %j', (uid) => {
    const { preferences, store } = setup({ [ACCOUNT_LAST_UID_KEY]: uid });
    expect(preferences.loadLastUid()).toBeNull();
    preferences.saveLastUid(uid);
    expect(store.getItem(ACCOUNT_LAST_UID_KEY)).toBeNull();
  });

  it('saves and clears the redirect flag', () => {
    const { preferences, store } = setup();
    expect(preferences.loadRedirectPending()).toBe(false);
    preferences.saveRedirectPending(true);
    expect(store.getItem(ACCOUNT_REDIRECT_PENDING_KEY)).toBe('1');
    expect(preferences.loadRedirectPending()).toBe(true);
    preferences.saveRedirectPending(false);
    expect(store.getItem(ACCOUNT_REDIRECT_PENDING_KEY)).toBeNull();
  });

  it('never throws when storage fails', () => {
    const failing: KeyValueStore = {
      getItem: () => {
        throw new DOMException('blocked', 'SecurityError');
      },
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
      removeItem: () => {
        throw new DOMException('blocked', 'SecurityError');
      },
      keys: () => [],
    };
    const { preferences } = createRepositories({ store: failing, persistent: true });
    expect(preferences.loadLastUid()).toBeNull();
    expect(preferences.loadRedirectPending()).toBe(false);
    expect(() => preferences.saveLastUid('abc')).not.toThrow();
    expect(() => preferences.saveLastUid(null)).not.toThrow();
    expect(() => preferences.saveRedirectPending(true)).not.toThrow();
  });
});

describe('collection versions (D-020)', () => {
  const A = 'welcometonightcityretail:005a';

  it('saves a version, moves the count with it and reads it back', async () => {
    const { store, collection } = setup();
    await collection.setCount('detonate', 2);
    const saved = await collection.setVersionCount('detonate', A, 1);
    expect(saved.entries).toEqual([{ card: 'detonate', count: 3, versions: { [A]: 1 } }]);
    expect(JSON.parse(store.getItem(COLLECTION_KEY) ?? '')).toMatchObject({
      schemaVersion: 3,
      data: { entries: [{ card: 'detonate', count: 3, versions: { [A]: 1 } }] },
    });
    const reopened = setup({}, { store });
    expect((await reopened.collection.load()).value.entries).toEqual(saved.entries);
  });

  it('rejects a count below the versions and invalid input', async () => {
    const { collection } = setup();
    await collection.setVersionCount('detonate', A, 2);
    await expectStorageError(collection.setCount('detonate', 1), 'invalid-input');
    await expectStorageError(collection.setVersionCount('detonate', 'nope', 1), 'invalid-input');
    await expectStorageError(collection.setVersionCount('detonate', A, 1000), 'invalid-input');
    expect(await collection.setCount('detonate', 5)).toEqual({ entries: [{ card: 'detonate', count: 5, versions: { [A]: 2 } }] });
  });

  it('migrates version 1 data: the unversioned copies become Beta (D-022), the count stays', async () => {
    const raw = stored(1, { entries: [{ card: 'detonate', count: 2 }, { card: 'minotaur', count: 1 }] });
    const { collection } = setup({ [COLLECTION_KEY]: raw });
    expect(await collection.load()).toEqual({
      value: {
        entries: [
          { card: 'detonate', count: 2, versions: { 'welcometonightcitybeta:031': 2 } },
          { card: 'minotaur', count: 1 },
        ],
      },
      notices: [{ kind: 'migrated', from: 1, to: 3 }],
    });
  });
});

describe('preferences: scanner mode (T-108)', () => {
  it('defaults to one at a time, remembers continuous and ignores unknown values', async () => {
    const { preferences, store } = setup();
    expect(await preferences.loadScanMode()).toBe('single');
    await preferences.saveScanMode('continuous');
    const again = createRepositories({ store, persistent: true }).preferences;
    expect(await again.loadScanMode()).toBe('continuous');
    await expectStorageError(preferences.saveScanMode('auto' as 'single'), 'invalid-input');
    const odd = setup({ 'cyberdeck:scan-mode': 'both' });
    expect(await odd.preferences.loadScanMode()).toBe('single');
  });
});

describe('preferences: trade rule (T-135)', () => {
  it('defaults to keeping a playset, remembers the rule and fixes invalid fields one by one', async () => {
    const { preferences, store } = setup();
    expect(await preferences.loadTradeRule()).toEqual({ keep: 'playset', keepDeckCards: false, source: null });
    await preferences.saveTradeRule({ keep: 'one', keepDeckCards: true, source: 'list' });
    expect(await createRepositories({ store, persistent: true }).preferences.loadTradeRule()).toEqual({ keep: 'one', keepDeckCards: true, source: 'list' });
    await expectStorageError(preferences.saveTradeRule({ keep: 'all' as 'one', keepDeckCards: true, source: null }), 'invalid-input');
    const odd = setup({ 'cyberdeck:trade-rule': '{"keep":"none","keepDeckCards":"yes"}' });
    expect(await odd.preferences.loadTradeRule()).toEqual({ keep: 'none', keepDeckCards: false, source: null });
    expect(await setup({ 'cyberdeck:trade-rule': 'not json' }).preferences.loadTradeRule()).toEqual({ keep: 'playset', keepDeckCards: false, source: null });
  });
});

describe('preferences: collection page (T-109)', () => {
  it('defaults to the owned cards, remembers the choices and fixes invalid fields one by one', async () => {
    const { preferences, store } = setup();
    expect(await preferences.loadCollectionPrefs()).toEqual({ view: 'own', showMissing: true, binder: 'set' });
    await preferences.saveCollectionPrefs({ view: 'binder', showMissing: false, binder: 'custom' });
    const again = createRepositories({ store, persistent: true }).preferences;
    expect(await again.loadCollectionPrefs()).toEqual({ view: 'binder', showMissing: false, binder: 'custom' });
    await expectStorageError(preferences.saveCollectionPrefs({ view: 'wall' as 'binder', showMissing: true, binder: 'set' }), 'invalid-input');
    const odd = setup({ 'cyberdeck:collection-prefs': '{"view":"binder","art":"x","showMissing":"no"}' });
    expect(await odd.preferences.loadCollectionPrefs()).toEqual({ view: 'binder', showMissing: true, binder: 'set' });
    const old = setup({ 'cyberdeck:collection-prefs': '{"view":"binder","art":"owned","showMissing":false}' });
    expect(await old.preferences.loadCollectionPrefs()).toEqual({ view: 'binder', showMissing: false, binder: 'set' });
    const junk = setup({ 'cyberdeck:collection-prefs': 'not json' });
    expect(await junk.preferences.loadCollectionPrefs()).toEqual({ view: 'own', showMissing: true, binder: 'set' });
    // T-112: a saved overview stays, a value this version does not know falls back to the default.
    const kept = setup({ 'cyberdeck:collection-prefs': '{"view":"overview","showMissing":false}' });
    expect(await kept.preferences.loadCollectionPrefs()).toEqual({ view: 'overview', showMissing: false, binder: 'set' });
    const future = setup({ 'cyberdeck:collection-prefs': '{"view":"wall","showMissing":false}' });
    expect(await future.preferences.loadCollectionPrefs()).toEqual({ view: 'own', showMissing: false, binder: 'set' });
    // T-120: an unknown binder mode falls back to the set.
    const mode = setup({ 'cyberdeck:collection-prefs': '{"view":"binder","binder":"x"}' });
    expect(await mode.preferences.loadCollectionPrefs()).toEqual({ view: 'binder', showMissing: true, binder: 'set' });
  });
});

describe('preferences: deck column view (T-115)', () => {
  it('defaults to the list, remembers stacks and cards and ignores unknown values', async () => {
    const { preferences, store } = setup();
    expect(await preferences.loadDeckListView()).toBe('list');
    await preferences.saveDeckListView('cards');
    const again = createRepositories({ store, persistent: true }).preferences;
    expect(await again.loadDeckListView()).toBe('cards');
    await again.saveDeckListView('stacks');
    expect(await preferences.loadDeckListView()).toBe('stacks');
    await expectStorageError(preferences.saveDeckListView('grid' as 'list'), 'invalid-input');
    const odd = setup({ 'cyberdeck:deck-list-view': 'grid' });
    expect(await odd.preferences.loadDeckListView()).toBe('list');
  });
});

describe('preferences: own binder layout (T-120)', () => {
  const KEY = 'cyberdeck:binder-layout';
  const full = (keys: (string | null)[]) => [...keys, ...Array.from({ length: 9 - keys.length }, () => null)];

  it('has no layout at first, remembers one and pads it to whole pages', async () => {
    const { preferences, store } = setup();
    expect(await preferences.loadBinderLayout()).toBeNull();
    const saved = await preferences.saveBinderLayout({ v: 1, name: '  My binder  ', pockets: ['a', null, 'b'] });
    expect(saved).toEqual({ v: 1, name: 'My binder', pockets: full(['a', null, 'b']) });
    const again = createRepositories({ store, persistent: true }).preferences;
    expect(await again.loadBinderLayout()).toEqual(saved);
  });

  it('cuts the name to 40 characters', async () => {
    const { preferences } = setup();
    const saved = await preferences.saveBinderLayout({ v: 1, name: 'x'.repeat(60), pockets: [] });
    expect(saved.name).toHaveLength(40);
    expect(saved.pockets).toHaveLength(9);
  });

  it('reads stored data defensively: anything wrong is no layout, and nothing throws', async () => {
    const bad: string[] = [
      'not json',
      'null',
      '[]',
      '{"v":2,"name":"x","pockets":[]}',
      '{"v":1,"name":5,"pockets":[]}',
      '{"v":1,"name":"x","pockets":"a"}',
      '{"v":1,"name":"x","pockets":[1]}',
      '{"v":1,"name":"x","pockets":["Not A Key"]}',
      '{"v":1,"name":"x","pockets":["__proto__"]}',
      `{"v":1,"name":"x","pockets":["${'a'.repeat(101)}"]}`,
      `{"v":1,"name":"x","pockets":[${Array.from({ length: 901 }, () => 'null').join(',')}]}`,
    ];
    for (const raw of bad) {
      const { preferences } = setup({ [KEY]: raw });
      expect(await preferences.loadBinderLayout()).toBeNull();
    }
    const edge = setup({ [KEY]: `{"v":1,"name":"x","pockets":[${Array.from({ length: 900 }, () => 'null').join(',')}]}` });
    expect((await edge.preferences.loadBinderLayout())?.pockets).toHaveLength(900);
  });

  it('keeps each account its own layout, and erasing the account removes it', async () => {
    const repos = setup();
    const account = repos.forAccount('user123');
    await account.preferences.saveBinderLayout({ v: 1, name: 'Mine', pockets: ['a'] });
    expect(repos.store.getItem('cyberdeck:u:user123:binder-layout')).not.toBeNull();
    expect(await repos.preferences.loadBinderLayout()).toBeNull();
    expect(await repos.forAccount('other').preferences.loadBinderLayout()).toBeNull();
    account.sync.eraseAccount();
    expect(await account.preferences.loadBinderLayout()).toBeNull();
  });

  it('refuses to save an invalid layout', async () => {
    const { preferences } = setup();
    await expectStorageError(preferences.saveBinderLayout({ v: 1, name: 'x', pockets: ['Bad Key'] }), 'invalid-input');
    await expectStorageError(preferences.saveBinderLayout({ v: 1, name: 'x', pockets: Array.from({ length: 901 }, () => null) }), 'invalid-input');
  });
});

describe('preferences: trade link shared from this device (T-178, SR-54)', () => {
  it('is false signed out and saving does nothing there', () => {
    const { preferences, store } = setup();
    expect(preferences.loadTradeShared()).toBeNull();
    preferences.saveTradeShared('collection');
    expect(preferences.loadTradeShared()).toBeNull();
    expect(store.keys().filter((key) => key.includes('trade-shared'))).toEqual([]);
  });

  it('is kept per account, so another account on the same device does not inherit it', () => {
    const repos = setup();
    repos.forAccount('user123').preferences.saveTradeShared('collection');
    expect(repos.forAccount('user123').preferences.loadTradeShared()).toBe('collection');
    expect(repos.forAccount('other456').preferences.loadTradeShared()).toBeNull();
    expect(repos.preferences.loadTradeShared()).toBeNull();
    repos.forAccount('user123').preferences.saveTradeShared(null);
    expect(repos.forAccount('user123').preferences.loadTradeShared()).toBeNull();
  });

  it('remembers the source, and anything else reads as nothing (SEC-178-1)', () => {
    const repos = setup();
    const account = repos.forAccount('user123');
    account.preferences.saveTradeShared('list');
    expect(account.preferences.loadTradeShared()).toBe('list');
    repos.store.setItem('cyberdeck:u:user123:trade-shared', '1');
    expect(account.preferences.loadTradeShared()).toBeNull();
  });

  it('is removed when the account is erased', () => {
    const repos = setup();
    const account = repos.forAccount('user123');
    account.preferences.saveTradeShared('collection');
    account.sync.eraseAccount();
    expect(account.preferences.loadTradeShared()).toBeNull();
  });
});
