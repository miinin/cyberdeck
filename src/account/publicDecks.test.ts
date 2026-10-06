/*
 * PublicDeckStore contract (T-098, D-025, SEC-098): the same tests run against the memory store and the
 * Firestore store on fake Firestore Lite modules. No network, no Firebase.
 */
import { PUBLIC_PAGE_SIZE, publicDeckId } from '../domain/publicDeck';
import type { PublicDeckInput } from '../domain/publicDeck';
import { CloudError } from './cloudError';
import type { CloudErrorKind } from './cloudError';
import { createFirestorePublicDecks } from './firebase/firestorePublicDecks';
import type { FirestoreModules } from './firebase/loadFirebase';
import { createMemoryPublicDecks } from './memory';
import { createPublicDeckPublisher, MIN_GAP_MS } from './publicPublisher';
import type { PublicDeckStore } from './types';

const UID = 'user123';
const OTHER = 'other456';

function input(deckId: string, patch: Partial<PublicDeckInput> = {}): PublicDeckInput {
  return { deckId, name: `Pakka ${deckId}`, legends: 'V, Streetkid', cardCount: 43, deck: 'QQ', nickname: null, ...patch };
}

async function errorKind(promise: Promise<unknown>): Promise<CloudErrorKind | 'resolved'> {
  try {
    await promise;
    return 'resolved';
  } catch (error) {
    return error instanceof CloudError ? error.kind : 'unknown';
  }
}

/* ---------- Fake Firestore Lite for the public decks ---------- */

type Ts = { toDate: () => Date; at: number };
const SERVER_TIME = { serverTimestamp: true };

function createFakeFirestore() {
  const docs = new Map<string, Record<string, unknown>>();
  const apps: { name: string }[] = [];
  const queries: { limit: number; ordered: boolean; after: string | null }[] = [];
  let clock = Date.parse('2026-10-06T10:00:00.000Z');
  let nextError: { code: string } | null = null;

  const stamp = (): Ts => {
    clock += 60_000;
    const at = clock;
    return { toDate: () => new Date(at), at };
  };
  const resolve = (data: Record<string, unknown>) => {
    const out: Record<string, unknown> = {};
    const time = stamp();
    for (const [key, value] of Object.entries(data)) out[key] = value === SERVER_TIME ? time : value;
    return out;
  };
  const maybeFail = () => {
    if (nextError === null) return;
    const error = nextError;
    nextError = null;
    throw error;
  };
  const snapshot = (path: string) => {
    const data = docs.get(path);
    return {
      id: path.slice(path.lastIndexOf('/') + 1),
      path,
      exists: () => data !== undefined,
      data: () => (data === undefined ? undefined : { ...data }),
    };
  };

  const firestore = {
    getFirestore: () => ({}),
    doc: (_db: unknown, ...segments: string[]) => ({ path: segments.join('/') }),
    collection: (_db: unknown, ...segments: string[]) => ({ path: segments.join('/') }),
    orderBy: () => ({ kind: 'order' }),
    limit: (count: number) => ({ kind: 'limit', count }),
    startAfter: (snap: { path: string }) => ({ kind: 'after', path: snap.path }),
    query: (ref: { path: string }, ...constraints: { kind: string; count?: number; path?: string }[]) => ({
      path: ref.path,
      constraints,
    }),
    serverTimestamp: () => SERVER_TIME,
    async getDoc(ref: { path: string }) {
      maybeFail();
      return snapshot(ref.path);
    },
    async getDocs(query: { path: string; constraints: { kind: string; count?: number; path?: string }[] }) {
      maybeFail();
      const limit = query.constraints.find((c) => c.kind === 'limit')?.count ?? Infinity;
      const after = query.constraints.find((c) => c.kind === 'after')?.path ?? null;
      queries.push({ limit, ordered: query.constraints.some((c) => c.kind === 'order'), after });
      const prefix = `${query.path}/`;
      const sorted = [...docs.keys()]
        .filter((path) => path.startsWith(prefix))
        .sort((a, b) => ((docs.get(b)?.updatedAt as Ts).at - (docs.get(a)?.updatedAt as Ts).at) || a.localeCompare(b));
      const start = after === null ? 0 : sorted.indexOf(after) + 1;
      return { docs: sorted.slice(start, start + limit).map(snapshot) };
    },
    async deleteDoc(ref: { path: string }) {
      maybeFail();
      docs.delete(ref.path);
    },
    async runTransaction<T>(_db: unknown, update: (tx: unknown) => Promise<T>): Promise<T> {
      maybeFail();
      const writes: (() => void)[] = [];
      const tx = {
        get: async (ref: { path: string }) => snapshot(ref.path),
        set: (ref: { path: string }, data: Record<string, unknown>) => writes.push(() => docs.set(ref.path, resolve(data))),
        delete: (ref: { path: string }) => writes.push(() => docs.delete(ref.path)),
      };
      const result = await update(tx);
      for (const write of writes) write();
      return result;
    },
  };
  const app = {
    getApps: () => apps,
    getApp: () => ({ name: '[DEFAULT]' }),
    initializeApp: (_options: unknown, name: string) => {
      apps.push({ name });
      return { name };
    },
  };
  return {
    modules: { app, firestore } as unknown as FirestoreModules,
    docs,
    apps,
    queries,
    failNext(code: string) {
      nextError = { code };
    },
  };
}

interface Harness {
  forUser(uid: string | null): PublicDeckStore;
  /** Stored raw documents by pubId. */
  stored(): Map<string, Record<string, unknown>>;
  /** Puts a raw document, e.g. an invalid one written by another client. */
  setRaw(pubId: string, doc: Record<string, unknown>): void;
  failNext(kind: 'offline' | 'denied'): void;
}

function memoryHarness(): Harness {
  // Each publish gets a later time, so the order of the list is the order of publishing.
  let tick = Date.parse('2026-10-06T10:00:00.000Z');
  const memory = createMemoryPublicDecks({ now: () => new Date((tick += 60_000)) });
  return { forUser: memory.forUser, stored: () => memory.docs, setRaw: memory.setRaw, failNext: memory.failNext };
}

function firestoreHarness(): Harness {
  const fake = createFakeFirestore();
  const codes = { offline: 'unavailable', denied: 'permission-denied' };
  return {
    forUser: (uid) => createFirestorePublicDecks({ uid, load: async () => fake.modules }),
    stored: () => new Map([...fake.docs].map(([path, data]) => [path.slice('publicDecks/'.length), data])),
    setRaw: (pubId, doc) => fake.docs.set(`publicDecks/${pubId}`, doc),
    failNext: (kind) => fake.failNext(codes[kind]),
  };
}

describe.each([
  ['memory', memoryHarness],
  ['firestore (fake modules)', firestoreHarness],
])('PublicDeckStore contract: %s', (_name, makeHarness) => {
  let h: Harness;
  beforeEach(() => {
    h = makeHarness();
  });

  it('publishes under the hash id with exactly the allowed fields and no uid (SR-30, SR-31)', async () => {
    await h.forUser(UID).publish(input('deck-1', { nickname: 'Nick' }));
    const pubId = await publicDeckId(UID, 'deck-1');
    expect([...h.stored().keys()]).toEqual([pubId]);
    expect(pubId).not.toContain(UID);
    const doc = h.stored().get(pubId) ?? {};
    expect(Object.keys(doc).sort()).toEqual(
      ['cardCount', 'deck', 'deckId', 'legends', 'name', 'nickname', 'publishedAt', 'schemaVersion', 'updatedAt'].sort(),
    );
    expect(JSON.stringify(doc)).not.toContain(UID);
  });

  it('reads a published deck without signing in', async () => {
    await h.forUser(UID).publish(input('deck-1', { nickname: 'Nick' }));
    const pubId = await publicDeckId(UID, 'deck-1');
    const deck = await h.forUser(null).get(pubId);
    expect(deck).toMatchObject({ pubId, deckId: 'deck-1', name: 'Pakka deck-1', nickname: 'Nick', cardCount: 43 });
    expect(deck?.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(await h.forUser(null).get('f'.repeat(64))).toBeNull();
    expect(await h.forUser(null).get('not-a-pub-id')).toBeNull();
  });

  it('keeps publishedAt when the deck is published again, and changes the content', async () => {
    const store = h.forUser(UID);
    await store.publish(input('deck-1'));
    const pubId = await publicDeckId(UID, 'deck-1');
    const first = await store.get(pubId);
    await store.publish(input('deck-1', { name: 'Uusi nimi', nickname: 'Nick' }));
    const second = await store.get(pubId);
    expect(second?.name).toBe('Uusi nimi');
    expect(second?.nickname).toBe('Nick');
    expect(second?.publishedAt).toBe(first?.publishedAt);
    expect(h.stored().size).toBe(1);
  });

  it('gives two accounts different ids for the same deck id', async () => {
    await h.forUser(UID).publish(input('deck-1'));
    await h.forUser(OTHER).publish(input('deck-1'));
    expect(h.stored().size).toBe(2);
  });

  it('cannot write signed out', async () => {
    expect(await errorKind(h.forUser(null).publish(input('deck-1')))).not.toBe('resolved');
    expect(await errorKind(h.forUser(null).remove('deck-1'))).not.toBe('resolved');
    expect(h.stored().size).toBe(0);
  });

  it('removes one copy, and a missing copy is not an error (SR-35)', async () => {
    const store = h.forUser(UID);
    await store.publish(input('deck-1'));
    await store.publish(input('deck-2'));
    await store.remove('deck-1');
    await store.remove('never-published');
    expect([...h.stored().values()].map((doc) => doc.deckId)).toEqual(['deck-2']);
  });

  it('removes many copies, also those that do not exist (SR-36)', async () => {
    const store = h.forUser(UID);
    await store.publish(input('deck-1'));
    await store.publish(input('deck-2'));
    await h.forUser(OTHER).publish(input('deck-1'));
    await store.removeMany(['deck-1', 'deck-2', 'deck-3', '../bad']);
    expect(h.stored().size).toBe(1);
    expect([...h.stored().values()][0]?.deckId).toBe('deck-1');
  });

  it('lists newest update first in pages of 24 with a cursor (SR-33)', async () => {
    const store = h.forUser(UID);
    for (let i = 0; i < PUBLIC_PAGE_SIZE + 6; i += 1) await store.publish(input(`deck-${i}`));
    const reader = h.forUser(null);
    const first = await reader.list(null);
    expect(first.items).toHaveLength(PUBLIC_PAGE_SIZE);
    expect(first.next).not.toBeNull();
    expect(first.items[0]?.deckId).toBe(`deck-${PUBLIC_PAGE_SIZE + 5}`);
    const second = await reader.list(first.next);
    expect(second.items).toHaveLength(6);
    expect(second.next).toBeNull();
    const ids = [...first.items, ...second.items].map((deck) => deck.deckId);
    expect(new Set(ids).size).toBe(PUBLIC_PAGE_SIZE + 6);
    expect(second.items.at(-1)?.deckId).toBe('deck-0');
  });

  it('leaves out invalid documents and counts them (SR-37)', async () => {
    await h.forUser(UID).publish(input('deck-1'));
    const pubId = await publicDeckId(UID, 'deck-1');
    const good = h.stored().get(pubId) ?? {};
    // A document written by another client: bad deck string, and an unexpected nickname type.
    const bad = { ...good, deck: '<script>', name: 'Huono' };
    const odd = { ...good, nickname: 42, name: 'Outo' };
    const store = h.forUser(null);
    h.setRaw('a'.repeat(64), bad);
    h.setRaw('b'.repeat(64), odd);
    const page = await store.list(null);
    expect(page.items.map((deck) => deck.name)).toEqual(['Pakka deck-1']);
    expect(page.dropped).toBe(2);
    expect(await store.get('a'.repeat(64))).toBeNull();
  });

  it('maps failures to CloudError kinds', async () => {
    h.failNext('offline');
    expect(await errorKind(h.forUser(null).list(null))).toBe('offline');
    h.failNext('denied');
    expect(await errorKind(h.forUser(UID).publish(input('deck-1')))).toBe('denied');
  });

  it('rejects an invalid uid', () => {
    expect(() => h.forUser('../other')).toThrow(CloudError);
  });
});

describe('Firestore public store', () => {
  it('reads with a named app without sign-in and writes with the default app', async () => {
    const fake = createFakeFirestore();
    const store = createFirestorePublicDecks({ uid: UID, load: async () => fake.modules });
    await store.list(null);
    expect(fake.apps.map((app) => app.name)).toEqual(['public-read']);
    await store.list(null);
    expect(fake.apps).toHaveLength(1);
  });

  it('sends one ordered, limited query per page (SR-33)', async () => {
    const fake = createFakeFirestore();
    const store = createFirestorePublicDecks({ uid: null, load: async () => fake.modules });
    await store.list(null);
    expect(fake.queries).toEqual([{ limit: PUBLIC_PAGE_SIZE, ordered: true, after: null }]);
  });

  it('reports offline when the SDK does not load', async () => {
    const store = createFirestorePublicDecks({
      uid: null,
      load: async () => {
        throw new Error('chunk');
      },
    });
    expect(await errorKind(store.list(null))).toBe('offline');
  });
});

describe('public deck publisher (SR-34, SR-35)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function setup() {
    const memory = createMemoryPublicDecks();
    const store = memory.forUser(UID);
    const publisher = createPublicDeckPublisher({ store, now: () => new Date() });
    return { memory, store, publisher };
  }

  it('waits 15 seconds and sends only the newest version once', async () => {
    const { memory, publisher } = setup();
    publisher.schedule(input('deck-1', { name: 'Yksi' }));
    publisher.schedule(input('deck-1', { name: 'Kaksi' }));
    publisher.schedule(input('deck-1', { name: 'Kolme' }));
    expect(publisher.state('deck-1')).toEqual({ kind: 'pending' });
    await vi.advanceTimersByTimeAsync(14_999);
    expect(memory.writes).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    await vi.waitFor(() => expect(memory.writes).toBe(1));
    expect([...memory.docs.values()][0]?.name).toBe('Kolme');
    expect(publisher.state('deck-1').kind).toBe('done');
  });

  it('sends at once on flush, and not twice for the same version', async () => {
    const { memory, publisher } = setup();
    publisher.schedule(input('deck-1'));
    await publisher.flush('deck-1');
    expect(memory.writes).toBe(1);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(memory.writes).toBe(1);
  });

  it('keeps two sends of one deck at least the minimum gap apart', async () => {
    const { memory, publisher } = setup();
    publisher.schedule(input('deck-1', { name: 'Yksi' }));
    await publisher.flush('deck-1');
    const first = Date.now();
    publisher.schedule(input('deck-1', { name: 'Kaksi' }));
    const second = publisher.flush('deck-1');
    await vi.advanceTimersByTimeAsync(MIN_GAP_MS - 1);
    expect(memory.writes).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    await second;
    expect(memory.writes).toBe(2);
    expect(Date.now() - first).toBeGreaterThanOrEqual(MIN_GAP_MS);
  });

  it('keeps the version after a failure and sends it with the next flush', async () => {
    const { memory, publisher } = setup();
    memory.failNext('offline');
    publisher.schedule(input('deck-1'));
    await publisher.flush('deck-1');
    expect(publisher.state('deck-1')).toEqual({ kind: 'error', error: 'offline' });
    expect(memory.writes).toBe(0);
    await publisher.flush('deck-1');
    expect(memory.writes).toBe(1);
    expect(publisher.state('deck-1').kind).toBe('done');
  });

  it('deletes the public copy first and cancels what waits when going private', async () => {
    const { memory, publisher } = setup();
    publisher.schedule(input('deck-1'));
    await publisher.flush('deck-1');
    publisher.schedule(input('deck-1', { name: 'Odottaa' }));
    await publisher.unpublish('deck-1');
    expect(memory.docs.size).toBe(0);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(memory.docs.size).toBe(0);
    expect(publisher.state('deck-1')).toEqual({ kind: 'idle' });
  });

  it('rejects when the deletion fails and keeps the copy', async () => {
    const { memory, publisher } = setup();
    publisher.schedule(input('deck-1'));
    await publisher.flush('deck-1');
    memory.failNext('offline');
    expect(await errorKind(publisher.unpublish('deck-1'))).toBe('offline');
    expect(memory.docs.size).toBe(1);
  });

  it('does not send after dispose', async () => {
    const { memory, publisher } = setup();
    publisher.schedule(input('deck-1'));
    publisher.dispose();
    await vi.advanceTimersByTimeAsync(20_000);
    expect(memory.writes).toBe(0);
  });
});
