/*
 * The trade link stores (T-178, D-037): the same contract tests for the in-memory and the Firestore store
 * (fake Firestore Lite), as for the public decks. The rules are checked statically in firestoreRules.test.ts.
 */
import { createHash } from 'node:crypto';
import { tradeShareId } from '../domain/tradeLink';
import { CloudError } from './cloudError';
import type { CloudErrorKind } from './cloudError';
import { createFirestoreTradeShares } from './firebase/firestoreTradeShares';
import type { FirestoreModules } from './firebase/loadFirebase';
import { createMemoryTradeShares } from './memory';
import type { TradeShareStore } from './types';

const UID = 'user123';
const OTHER = 'other456';
const idOf = (uid: string) => createHash('sha256').update(`${uid}#trade`).digest('hex').slice(0, 16);

async function errorKind(promise: Promise<unknown>): Promise<CloudErrorKind | 'resolved'> {
  try {
    await promise;
    return 'resolved';
  } catch (error) {
    return error instanceof CloudError ? error.kind : 'unknown';
  }
}

/* ---------- Fake Firestore Lite for the trade links ---------- */

const SERVER_TIME = { serverTimestamp: true };

function createFakeFirestore() {
  const docs = new Map<string, Record<string, unknown>>();
  const apps: { name: string }[] = [];
  const reads: string[] = [];
  const writes: { op: string; path: string; keys: string[] }[] = [];
  let nextError: { code: string } | null = null;

  const maybeFail = () => {
    if (nextError === null) return;
    const error = nextError;
    nextError = null;
    throw error;
  };
  const snapshot = (path: string) => {
    const data = docs.get(path);
    return { exists: () => data !== undefined, data: () => (data === undefined ? undefined : { ...data }) };
  };
  const resolve = (data: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value === SERVER_TIME ? '2026-10-18T10:00:00.000Z' : value]));

  const firestore = {
    getFirestore: () => ({}),
    doc: (_db: unknown, ...segments: string[]) => ({ path: segments.join('/') }),
    serverTimestamp: () => SERVER_TIME,
    async getDoc(ref: { path: string }) {
      maybeFail();
      reads.push(ref.path);
      return snapshot(ref.path);
    },
    async setDoc(ref: { path: string }, data: Record<string, unknown>) {
      maybeFail();
      writes.push({ op: 'set', path: ref.path, keys: Object.keys(data) });
      docs.set(ref.path, resolve(data));
    },
    async deleteDoc(ref: { path: string }) {
      maybeFail();
      writes.push({ op: 'delete', path: ref.path, keys: [] });
      docs.delete(ref.path);
    },
    async runTransaction<T>(_db: unknown, update: (tx: unknown) => Promise<T>): Promise<T> {
      maybeFail();
      const pending: (() => void)[] = [];
      const tx = {
        get: async (ref: { path: string }) => snapshot(ref.path),
        update: (ref: { path: string }, data: Record<string, unknown>) =>
          pending.push(() => {
            writes.push({ op: 'update', path: ref.path, keys: Object.keys(data) });
            docs.set(ref.path, resolve(data));
          }),
      };
      const result = await update(tx);
      for (const write of pending) write();
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
    reads,
    writes,
    failNext(code: string) {
      nextError = { code };
    },
  };
}

interface Harness {
  forUser(uid: string | null): TradeShareStore;
  stored(): Map<string, Record<string, unknown>>;
  setRaw(id: string, doc: Record<string, unknown>): void;
  /** Reads that reached the backend. */
  reads(): number;
  failNext(kind: 'offline' | 'denied'): void;
}

function memoryHarness(): Harness {
  // The memory store keeps the rules' 10 s gap between writes (BRK-06); this clock lets every call be 11 s later.
  let time = Date.parse('2026-01-01T00:00:00Z');
  const memory = createMemoryTradeShares({ now: () => new Date((time += 11_000)) });
  return {
    forUser: memory.forUser,
    stored: () => memory.docs,
    setRaw: (id, doc) => memory.docs.set(id, doc),
    reads: () => memory.reads,
    failNext: memory.failNext,
  };
}

function firestoreHarness(): Harness {
  const fake = createFakeFirestore();
  const codes = { offline: 'unavailable', denied: 'permission-denied' };
  return {
    forUser: (uid) => createFirestoreTradeShares({ uid, load: async () => fake.modules }),
    stored: () => new Map([...fake.docs].map(([path, data]) => [path.slice('tradeShares/'.length), data])),
    setRaw: (id, doc) => fake.docs.set(`tradeShares/${id}`, doc),
    reads: () => fake.reads.length,
    failNext: (kind) => fake.failNext(codes[kind]),
  };
}

describe.each([
  ['memory', memoryHarness],
  ['Firestore', firestoreHarness],
])('trade link store (%s)', (_name, make) => {
  it('publishes under the hash id with exactly the allowed fields and no uid (SR-50, SR-52)', async () => {
    const h = make();
    await h.forUser(UID).publish('QQ');
    const stored = h.stored();
    expect([...stored.keys()]).toEqual([idOf(UID)]);
    const doc = stored.get(idOf(UID));
    expect(Object.keys(doc ?? {}).sort()).toEqual(['data', 'schemaVersion', 'updatedAt']);
    expect(doc?.data).toBe('QQ');
    expect(JSON.stringify(doc)).not.toContain(UID);
  });

  it('computes the same id as the app helper', async () => {
    expect(await make().forUser(UID).ownId()).toBe(await tradeShareId(UID));
  });

  it('reads a link without signing in', async () => {
    const h = make();
    await h.forUser(UID).publish('QQ');
    expect(await h.forUser(null).get(idOf(UID))).toEqual({ kind: 'ok', data: 'QQ' });
    expect(await h.forUser(null).get('0'.repeat(16))).toBeNull();
  });

  it('makes no request for a malformed id (SR-53)', async () => {
    const h = make();
    for (const bad of ['', '../users/x', 'a/b', '.*', 'ABCDEF0123456789', 'abc', 'f'.repeat(17)]) {
      expect(await h.forUser(null).get(bad)).toBeNull();
    }
    expect(h.reads()).toBe(0);
  });

  it('returns null for an invalid document and reports a newer one (SR-53)', async () => {
    const h = make();
    h.setRaw('1'.repeat(16), { schemaVersion: 1, data: 'not base64 !', updatedAt: 'x' });
    h.setRaw('2'.repeat(16), { schemaVersion: 7, data: 'QQ', updatedAt: 'x' });
    expect(await h.forUser(null).get('1'.repeat(16))).toBeNull();
    expect(await h.forUser(null).get('2'.repeat(16))).toEqual({ kind: 'newer' });
  });

  it('gives two accounts different ids', async () => {
    const h = make();
    await h.forUser(UID).publish('QQ');
    await h.forUser(OTHER).publish('Qg');
    expect(h.stored().size).toBe(2);
  });

  it('replaces the data when published again', async () => {
    const h = make();
    await h.forUser(UID).publish('QQ');
    await h.forUser(UID).publish('Qg');
    expect(h.stored().get(idOf(UID))?.data).toBe('Qg');
  });

  it('updates an existing link, and never creates one (SR-54)', async () => {
    const h = make();
    expect(await h.forUser(UID).update('QQ')).toBe(false);
    expect(h.stored().size).toBe(0);
    await h.forUser(UID).publish('QQ');
    expect(await h.forUser(UID).update('Qg')).toBe(true);
    expect(h.stored().get(idOf(UID))?.data).toBe('Qg');
  });

  it('removes the link, and a missing one is not an error (SR-56)', async () => {
    const h = make();
    await h.forUser(UID).remove();
    await h.forUser(UID).publish('QQ');
    await h.forUser(OTHER).publish('Qg');
    await h.forUser(UID).remove();
    expect([...h.stored().keys()]).toEqual([idOf(OTHER)]);
  });

  it('cannot write signed out', async () => {
    const h = make();
    expect(await errorKind(h.forUser(null).publish('QQ'))).toBe('denied');
    expect(await errorKind(h.forUser(null).update('QQ'))).toBe('denied');
    expect(await errorKind(h.forUser(null).remove())).toBe('denied');
    expect(h.stored().size).toBe(0);
  });

  it('maps failures to CloudError kinds', async () => {
    const h = make();
    h.failNext('offline');
    expect(await errorKind(h.forUser(UID).publish('QQ'))).toBe('offline');
    h.failNext('denied');
    expect(await errorKind(h.forUser(UID).remove())).toBe('denied');
  });

  it('rejects an invalid uid', () => {
    expect(() => make().forUser('a/b')).toThrow(CloudError);
  });
});

describe('Firestore trade link store', () => {
  it('reads with a named app without sign-in', async () => {
    const fake = createFakeFirestore();
    const store = createFirestoreTradeShares({ uid: UID, load: async () => fake.modules });
    await store.get('0'.repeat(16));
    expect(fake.apps.map((app) => app.name)).toEqual(['public-read']);
  });

  it('updates with an update inside a transaction that reads first, never with a set (SR-54)', async () => {
    const fake = createFakeFirestore();
    const store = createFirestoreTradeShares({ uid: UID, load: async () => fake.modules });
    await store.update('QQ');
    expect(fake.writes).toEqual([]);
    await store.publish('QQ');
    await store.update('Qg');
    expect(fake.writes.map((w) => [w.op, w.keys.sort()])).toEqual([
      ['set', ['data', 'schemaVersion', 'updatedAt']],
      ['update', ['data', 'schemaVersion', 'updatedAt']],
    ]);
  });

  it('reports offline when the SDK does not load', async () => {
    const store = createFirestoreTradeShares({
      uid: null,
      load: async () => {
        throw new Error('chunk');
      },
    });
    expect(await errorKind(store.get('0'.repeat(16)))).toBe('offline');
  });
});
