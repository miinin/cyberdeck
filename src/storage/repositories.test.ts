import type { DeckContent } from '../domain/deck';
import { MAX_DECKS } from '../domain/deck';
import { encodeEnvelope } from './envelope';
import { StorageError } from './errors';
import { BACKUP_PREFIX, COLLECTION_KEY, DECKS_KEY } from './keys';
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

function backupKeys(store: KeyValueStore, name: 'collection' | 'decks'): string[] {
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
      schemaVersion: 1,
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
    const raw = stored(1, {
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
    const raw = stored(2, { entries: [{ card: 'detonate', count: 1 }], future: true });
    const { store, collection, decks } = setup({ [COLLECTION_KEY]: raw, [DECKS_KEY]: raw });

    expect(await collection.load()).toEqual({ value: { entries: [] }, notices: [{ kind: 'newer-version', version: 2 }] });
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
