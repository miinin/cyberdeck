/*
 * CloudStore contract (T-054b, D-017 kohta 8, SR-23): the same tests run against the memory store and the
 * Firestore store on fake Firestore Lite modules. No network, no Firebase.
 */
import type { Collection } from '../domain/collection';
import { MAX_DECKS } from '../domain/deck';
import type { Deck } from '../domain/deck';
import { CLOUD_ROOT } from './cloudCodec';
import { CloudError, toCloudError } from './cloudError';
import type { CloudErrorKind } from './cloudError';
import { createFirestoreCloudStore } from './firebase/firestoreCloudStore';
import type { FirestoreModules } from './firebase/loadFirebase';
import { createMemoryCloud } from './memory';
import type { MemoryCloudPath } from './memory';
import type { CloudChange, CloudStore } from './types';

const UID = 'user123';
const NOW = new Date('2026-10-03T12:00:00.000Z');

function deck(id: string, name = 'Pakka'): Deck {
  return {
    id,
    name,
    sections: [{ name: '', cards: [{ card: 'detonate', count: 2 }] }],
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-02T10:00:00.000Z',
  };
}

const COLLECTION: Collection = { entries: [{ card: 'detonate', count: 3 }] };
const WANTS: Collection = { entries: [{ card: 'detonate', count: 2 }] };

function deckDoc(data: unknown, schemaVersion: unknown = 1) {
  return { schemaVersion, savedAt: NOW.toISOString(), data };
}

const change = (patch: Partial<CloudChange> = {}): CloudChange => ({ putDecks: [], deleteDecks: [], ...patch });

async function cloudErrorKind(promise: Promise<unknown>): Promise<CloudErrorKind | 'resolved'> {
  try {
    await promise;
    return 'resolved';
  } catch (error) {
    return error instanceof CloudError ? error.kind : 'unknown';
  }
}

/* ---------- Fake Firestore Lite: just the functions the store uses ---------- */

type Ref = { path: string; id: string };
const SERVER_TIME = { serverTimestamp: true };

function createFakeFirestore() {
  const docs = new Map<string, unknown>();
  const queries: { path: string; limit: number }[] = [];
  let nextError: { code: string } | null = null;

  function maybeFail() {
    if (nextError === null) return;
    const error = nextError;
    nextError = null;
    throw error;
  }

  function snapshot(path: string) {
    const data = docs.get(path);
    return {
      id: path.slice(path.lastIndexOf('/') + 1),
      exists: () => data !== undefined,
      data: () => (data === undefined ? undefined : structuredClone(data)),
    };
  }

  const firestore = {
    getFirestore: () => ({}),
    doc: (_db: unknown, ...segments: string[]): Ref => ({ path: segments.join('/'), id: segments.at(-1) ?? '' }),
    collection: (_db: unknown, ...segments: string[]) => ({ path: segments.join('/') }),
    limit: (count: number) => ({ count }),
    query: (ref: { path: string }, limit: { count: number }) => ({ path: ref.path, limit: limit.count }),
    serverTimestamp: () => SERVER_TIME,
    async getDoc(ref: Ref) {
      maybeFail();
      return snapshot(ref.path);
    },
    async getDocs(query: { path: string; limit: number }) {
      maybeFail();
      queries.push(query);
      const prefix = `${query.path}/`;
      const paths = [...docs.keys()]
        .filter((path) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
        .sort()
        .slice(0, query.limit);
      return { docs: paths.map(snapshot) };
    },
    async runTransaction<T>(_db: unknown, update: (tx: unknown) => Promise<T>): Promise<T> {
      maybeFail();
      const writes: (() => void)[] = [];
      const tx = {
        get: async (ref: Ref) => snapshot(ref.path),
        set: (ref: Ref, data: unknown) => writes.push(() => docs.set(ref.path, structuredClone(data))),
        delete: (ref: Ref) => writes.push(() => docs.delete(ref.path)),
      };
      const result = await update(tx);
      for (const write of writes) write();
      return result;
    },
  };
  const modules = { app: { getApp: () => ({}) }, firestore } as unknown as FirestoreModules;
  return {
    modules,
    docs,
    queries,
    failNext(code: string) {
      nextError = { code };
    },
  };
}

const KIND_TO_CODE: Record<CloudErrorKind, string> = {
  conflict: 'aborted',
  offline: 'unavailable',
  denied: 'permission-denied',
  quota: 'resource-exhausted',
  'too-large': 'invalid-argument',
  locked: 'failed-precondition',
  unknown: 'internal',
};

/* ---------- Contract ---------- */

interface Harness {
  store: CloudStore;
  setRaw(path: MemoryCloudPath, value: unknown): void;
  getRaw(path: MemoryCloudPath): unknown;
  failNext(kind: 'offline' | 'denied'): void;
}

function memoryHarness(): Harness {
  const cloud = createMemoryCloud({ uid: UID, now: () => NOW });
  return { store: cloud, setRaw: cloud.setRaw, getRaw: cloud.getRaw, failNext: cloud.failNext };
}

function firestoreHarness(): Harness {
  const fake = createFakeFirestore();
  const fullPath = (path: MemoryCloudPath) => (path === 'meta' ? `${CLOUD_ROOT}/${UID}` : `${CLOUD_ROOT}/${UID}/${path}`);
  return {
    store: createFirestoreCloudStore({ uid: UID, load: async () => fake.modules, now: () => NOW }),
    setRaw: (path, value) => fake.docs.set(fullPath(path), structuredClone(value)),
    getRaw: (path) => fake.docs.get(fullPath(path)),
    failNext: (kind) => fake.failNext(KIND_TO_CODE[kind]),
  };
}

describe.each([
  ['memory', memoryHarness],
  ['firestore (fake modules)', firestoreHarness],
])('CloudStore contract: %s', (_name, makeHarness) => {
  let h: Harness;
  beforeEach(() => {
    h = makeHarness();
  });

  it('reads an empty account', async () => {
    expect(await h.store.readMeta()).toBeNull();
    expect(await h.store.readAll()).toEqual({
      meta: null,
      decks: [],
      invalidDeckIds: [],
      collection: { kind: 'missing' },
      wants: { kind: 'missing' },
      dropped: 0,
      locked: false,
      limitExceeded: false,
    });
  });

  it('creates the meta with rev 1 and reads back what it wrote', async () => {
    const rev = await h.store.commit(change({ putDecks: [deck('d1'), deck('d2')], collection: COLLECTION }), 0);
    expect(rev).toBe(1);
    expect(await h.store.readMeta()).toEqual({ rev: 1, newer: false });
    const snapshot = await h.store.readAll();
    expect(snapshot.decks).toEqual([deck('d1'), deck('d2')]);
    expect(snapshot.collection).toEqual({ kind: 'ok', value: COLLECTION });
    expect(snapshot.dropped).toBe(0);
  });

  it('writes exactly the keys the rules allow', async () => {
    const extra = { ...deck('d1'), extra: 'x' } as Deck;
    await h.store.commit(change({ putDecks: [extra], collection: COLLECTION }), 0);
    const stored = h.getRaw('decks/d1') as { data: object };
    expect(Object.keys(stored).sort()).toEqual(['data', 'savedAt', 'schemaVersion']);
    expect(Object.keys(stored.data).sort()).toEqual(['createdAt', 'name', 'sections', 'updatedAt']);
    expect(stored).toMatchObject({ schemaVersion: 1, savedAt: NOW.toISOString() });
    expect(Object.keys(h.getRaw('collection/main') as object).sort()).toEqual(['data', 'savedAt', 'schemaVersion']);
    expect(Object.keys(h.getRaw('meta') as object).sort()).toEqual(['rev', 'schemaVersion', 'updatedAt']);
  });

  it('writes the validated values, not the raw input (SR-23 kohta 6)', async () => {
    const raw: Deck = { ...deck('d1', '  Pakka‮  '), createdAt: 'x'.repeat(100) };
    await h.store.commit(change({ putDecks: [raw] }), 0);
    const stored = h.getRaw('decks/d1') as { data: { name: string; createdAt: string } };
    expect(stored.data.name).toBe('Pakka');
    expect(stored.data.createdAt).toBe('1970-01-01T00:00:00.000Z');
  });

  it('increments rev by one, deletes decks and leaves the collection when not given', async () => {
    await h.store.commit(change({ putDecks: [deck('d1'), deck('d2')], collection: COLLECTION }), 0);
    expect(await h.store.commit(change({ deleteDecks: ['d1'] }), 1)).toBe(2);
    const snapshot = await h.store.readAll();
    expect(snapshot.meta).toEqual({ rev: 2, newer: false });
    expect(snapshot.decks.map((d) => d.id)).toEqual(['d2']);
    expect(snapshot.collection).toEqual({ kind: 'ok', value: COLLECTION });
  });

  it('refuses a commit when the rev has changed and writes nothing', async () => {
    await h.store.commit(change({ putDecks: [deck('d1')] }), 0);
    expect(await cloudErrorKind(h.store.commit(change({ putDecks: [deck('d2')] }), 0))).toBe('conflict');
    expect(await cloudErrorKind(h.store.commit(change({ putDecks: [deck('d2')] }), 2))).toBe('conflict');
    expect((await h.store.readAll()).decks.map((d) => d.id)).toEqual(['d1']);
    expect(await h.store.readMeta()).toEqual({ rev: 1, newer: false });
  });

  it('refuses invalid decks, invalid ids and too many writes before sending anything', async () => {
    const bad = { ...deck('d1'), name: '' };
    expect(await cloudErrorKind(h.store.commit(change({ putDecks: [bad] }), 0))).toBe('unknown');
    expect(await cloudErrorKind(h.store.commit(change({ deleteDecks: ['../x'] }), 0))).toBe('unknown');
    const many = Array.from({ length: 499 }, (_, i) => deck(`d${i}`));
    expect(await cloudErrorKind(h.store.commit(change({ putDecks: many, collection: COLLECTION }), 0))).toBe('too-large');
    expect(await h.store.readMeta()).toBeNull();
  });

  it('keeps invalid deck documents apart from deletions (SR-23 kohta 3)', async () => {
    await h.store.commit(change({ putDecks: [deck('d1')] }), 0);
    h.setRaw('decks/d2', deckDoc({ name: '', sections: [] }));
    h.setRaw('decks/d3', 'not a document');
    const snapshot = await h.store.readAll();
    expect(snapshot.decks.map((d) => d.id)).toEqual(['d1']);
    expect(snapshot.invalidDeckIds).toEqual(['d2', 'd3']);
    expect(snapshot.dropped).toBe(2);
    expect(snapshot.locked).toBe(false);
  });

  it('drops documents whose id is not a deck id and counts dropped rows', async () => {
    h.setRaw('decks/__proto__', deckDoc({ name: 'X', sections: [] }));
    h.setRaw('decks/d1', deckDoc({ ...deck('d1'), sections: [{ name: '', cards: [{ card: 'detonate', count: 2 }, 'x'] }] }));
    const snapshot = await h.store.readAll();
    expect(snapshot.decks.map((d) => d.id)).toEqual(['d1']);
    expect(snapshot.invalidDeckIds).toEqual([]);
    expect(snapshot.dropped).toBe(2);
  });

  it('takes the deck id from the document id and copies only known fields (SR-23 kohdat 1–2)', async () => {
    const hostile = JSON.parse(
      '{"id":"other","name":"P","sections":[],"createdAt":"2026-10-01T10:00:00.000Z","updatedAt":"2026-10-01T10:00:00.000Z",' +
        '"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},"owner":"x"}',
    );
    h.setRaw('decks/d1', deckDoc(hostile));
    const [loaded] = (await h.store.readAll()).decks;
    expect(loaded).toEqual({ id: 'd1', name: 'P', sections: [], createdAt: hostile.createdAt, updatedAt: hostile.updatedAt });
    expect(Object.keys(loaded as object).sort()).toEqual(['createdAt', 'id', 'name', 'sections', 'updatedAt']);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('locks on a newer schema version in a deck, the collection or the meta (SR-23 kohta 4)', async () => {
    h.setRaw('decks/d1', deckDoc(deck('d1'), 2));
    let snapshot = await h.store.readAll();
    expect(snapshot).toMatchObject({ locked: true, invalidDeckIds: ['d1'], decks: [], dropped: 0 });

    h.setRaw('decks/d1', undefined);
    h.setRaw('collection/main', { schemaVersion: 7, savedAt: '', data: {} });
    snapshot = await h.store.readAll();
    expect(snapshot).toMatchObject({ locked: true, collection: { kind: 'invalid' } });

    h.setRaw('collection/main', undefined);
    h.setRaw('meta', { schemaVersion: 2, rev: 4, updatedAt: '' });
    expect(await h.store.readMeta()).toEqual({ rev: 4, newer: true });
    expect((await h.store.readAll()).locked).toBe(true);
    expect(await cloudErrorKind(h.store.commit(change({ putDecks: [deck('d1')] }), 4))).toBe('locked');
  });

  it('writes the want list to its own document and leaves it alone when not given (D-018)', async () => {
    await h.store.commit(change({ collection: COLLECTION, wants: WANTS }), 0);
    let snapshot = await h.store.readAll();
    expect(snapshot.wants).toEqual({ kind: 'ok', value: WANTS });
    expect(snapshot.collection).toEqual({ kind: 'ok', value: COLLECTION });
    expect(Object.keys(h.getRaw('collection/want') as object).sort()).toEqual(['data', 'savedAt', 'schemaVersion']);
    expect(h.getRaw('collection/want')).toMatchObject({ schemaVersion: 1, data: { entries: WANTS.entries } });

    await h.store.commit(change({ collection: { entries: [] } }), 1);
    snapshot = await h.store.readAll();
    expect(snapshot.wants).toEqual({ kind: 'ok', value: WANTS });
  });

  it('validates the want list like the collection and locks on a newer version (D-018)', async () => {
    h.setRaw('collection/want', deckDoc({ entries: [{ card: 'detonate', count: 2 }, { card: 'detonate', count: 1 }, null] }));
    let snapshot = await h.store.readAll();
    expect(snapshot.wants).toEqual({ kind: 'ok', value: WANTS });
    expect(snapshot.dropped).toBe(2);
    expect(snapshot.collection).toEqual({ kind: 'missing' });

    h.setRaw('collection/want', deckDoc({ entries: 'x' }));
    snapshot = await h.store.readAll();
    expect(snapshot.wants).toEqual({ kind: 'invalid' });
    expect(snapshot.dropped).toBe(1);
    expect(snapshot.locked).toBe(false);

    h.setRaw('collection/want', { schemaVersion: 7, savedAt: '', data: {} });
    snapshot = await h.store.readAll();
    expect(snapshot).toMatchObject({ locked: true, wants: { kind: 'invalid' } });
  });

  it('refuses an invalid want list before sending anything', async () => {
    const bad = { entries: [{ card: 'detonate', count: 1000 }] };
    expect(await cloudErrorKind(h.store.commit(change({ wants: bad }), 0))).toBe('unknown');
    expect(await h.store.readMeta()).toBeNull();
  });

  it('validates the collection: invalid rows are dropped, a wrong shape is invalid', async () => {
    h.setRaw('collection/main', deckDoc({ entries: [{ card: 'detonate', count: 3 }, { card: 'detonate', count: 1 }, null] }, 3));
    let snapshot = await h.store.readAll();
    expect(snapshot.collection).toEqual({ kind: 'ok', value: COLLECTION });
    expect(snapshot.dropped).toBe(2);

    h.setRaw('collection/main', deckDoc({ entries: 'x' }));
    snapshot = await h.store.readAll();
    expect(snapshot.collection).toEqual({ kind: 'invalid' });
    expect(snapshot.dropped).toBe(1);
  });

  it('converts a version 2 collection to Beta on reading, leaves version 3 alone and locks on version 4 (D-022)', async () => {
    const entries = [{ card: 'detonate', count: 3, versions: { 'welcometonightcityretail:031': 1 } }, { card: 'minotaur', count: 1 }];
    h.setRaw('collection/main', deckDoc({ entries }, 2));
    let snapshot = await h.store.readAll();
    expect(snapshot.collection).toEqual({
      kind: 'ok',
      value: {
        entries: [
          { card: 'detonate', count: 3, versions: { 'welcometonightcityretail:031': 1, 'welcometonightcitybeta:031': 2 } },
          { card: 'minotaur', count: 1 },
        ],
      },
    });
    expect(snapshot.locked).toBe(false);

    h.setRaw('collection/main', deckDoc({ entries }, 3));
    snapshot = await h.store.readAll();
    expect(snapshot.collection).toEqual({
      kind: 'ok',
      value: { entries: [{ card: 'detonate', count: 3, versions: { 'welcometonightcityretail:031': 1 } }, { card: 'minotaur', count: 1 }] },
    });

    h.setRaw('collection/main', deckDoc({ entries }, 4));
    snapshot = await h.store.readAll();
    expect(snapshot).toMatchObject({ locked: true, collection: { kind: 'invalid' } });
  });

  it('does not convert the want list, whatever it holds (D-022)', async () => {
    const entries = [{ card: 'detonate', count: 3 }];
    h.setRaw('collection/want', deckDoc({ entries }, 1));
    expect((await h.store.readAll()).wants).toEqual({ kind: 'ok', value: { entries } });
  });

  it('writes the collection as version 3', async () => {
    await h.store.commit(change({ collection: COLLECTION }), 0);
    expect(h.getRaw('collection/main')).toMatchObject({ schemaVersion: 3 });
  });

  it('reports more than MAX_DECKS decks instead of cutting them silently (SR-23 kohta 5)', async () => {
    for (let i = 0; i <= MAX_DECKS; i += 1) {
      const id = `d${String(i).padStart(3, '0')}`;
      h.setRaw(`decks/${id}`, deckDoc(deck(id)));
    }
    const snapshot = await h.store.readAll();
    expect(snapshot.limitExceeded).toBe(true);
    expect(snapshot.decks).toHaveLength(MAX_DECKS);
  });

  it('deletes everything under the account and nothing else', async () => {
    await h.store.commit(change({ putDecks: [deck('d1'), deck('d2')], collection: COLLECTION, wants: WANTS }), 0);
    await h.store.deleteAll();
    expect(await h.store.readMeta()).toBeNull();
    expect(await h.store.readAll()).toMatchObject({
      meta: null,
      decks: [],
      collection: { kind: 'missing' },
      wants: { kind: 'missing' },
    });
    await h.store.deleteAll(); // already empty: fine
  });

  it('turns a meta the rules would never allow into an error', async () => {
    h.setRaw('meta', { schemaVersion: 1, rev: 'x' });
    expect(await cloudErrorKind(h.store.readMeta())).toBe('unknown');
  });

  it('classifies failures', async () => {
    h.failNext('offline');
    expect(await cloudErrorKind(h.store.readMeta())).toBe('offline');
    h.failNext('denied');
    expect(await cloudErrorKind(h.store.commit(change(), 0))).toBe('denied');
    expect(await h.store.commit(change(), 0)).toBe(1);
  });
});

describe('createMemoryCloud', () => {
  it('refuses a collection document at or over the byte limit', async () => {
    const cloud = createMemoryCloud({ maxCollectionBytes: 100 });
    expect(await cloudErrorKind(cloud.commit(change({ collection: COLLECTION }), 0))).toBe('too-large');
    expect(cloud.paths()).toEqual([]);
  });

  it('refuses a want document at or over the byte limit', async () => {
    const cloud = createMemoryCloud({ maxCollectionBytes: 100 });
    expect(await cloudErrorKind(cloud.commit(change({ wants: WANTS }), 0))).toBe('too-large');
    expect(cloud.paths()).toEqual([]);
  });

  it('counts document reads', async () => {
    const cloud = createMemoryCloud();
    await cloud.readMeta();
    expect(cloud.reads).toBe(1);
  });
});

describe('createFirestoreCloudStore', () => {
  it('refuses an invalid uid before building any path (SR-23 kohta 8)', () => {
    expect(() => createFirestoreCloudStore({ uid: '../other', load: async () => createFakeFirestore().modules })).toThrow(
      CloudError,
    );
  });

  it('uses users/{uid} paths, a MAX_DECKS + 1 query and the server time in the meta', async () => {
    const fake = createFakeFirestore();
    const store = createFirestoreCloudStore({ uid: UID, load: async () => fake.modules, now: () => NOW });
    await store.commit(change({ putDecks: [deck('d1')], collection: COLLECTION, wants: WANTS }), 0);
    expect([...fake.docs.keys()].sort()).toEqual([
      `users/${UID}`,
      `users/${UID}/collection/main`,
      `users/${UID}/collection/want`,
      `users/${UID}/decks/d1`,
    ]);
    expect(fake.docs.get(`users/${UID}`)).toEqual({ schemaVersion: 1, rev: 1, updatedAt: SERVER_TIME });
    await store.readAll();
    expect(fake.queries).toEqual([{ path: `users/${UID}/decks`, limit: MAX_DECKS + 1 }]);
  });

  it('reports a failed SDK load as offline and loads again on the next call', async () => {
    const fake = createFakeFirestore();
    const load = vi.fn().mockRejectedValueOnce(new Error('chunk')).mockResolvedValue(fake.modules);
    const store = createFirestoreCloudStore({ uid: UID, load });
    expect(await cloudErrorKind(store.readMeta())).toBe('offline');
    expect(await store.readMeta()).toBeNull();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('uses the real loader by default, which is disabled in tests', async () => {
    expect(await cloudErrorKind(createFirestoreCloudStore({ uid: UID }).readMeta())).toBe('offline');
  });
});

describe('toCloudError', () => {
  it.each([
    ['unavailable', 'offline'],
    ['deadline-exceeded', 'offline'],
    ['permission-denied', 'denied'],
    ['unauthenticated', 'denied'],
    ['resource-exhausted', 'quota'],
    ['aborted', 'conflict'],
    ['internal', 'unknown'],
    ['__proto__', 'unknown'],
    ['toString', 'unknown'],
  ])('maps %s to %s', (code, kind) => {
    expect(toCloudError({ code }).kind).toBe(kind);
  });

  it('keeps a CloudError and maps anything else to unknown', () => {
    const error = new CloudError('locked');
    expect(toCloudError(error)).toBe(error);
    expect(toCloudError(new Error('x')).kind).toBe('unknown');
    expect(toCloudError(null).kind).toBe('unknown');
  });
});
