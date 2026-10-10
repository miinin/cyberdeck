import { createMemoryRepositories } from '../../storage';
import type { Repositories } from '../../storage';
import { createMemoryCloud } from '../memory';
import type { MemoryCloud } from '../memory';
import type { CloudStore } from '../types';
import { createSyncEngine } from './syncEngine';
import type { SyncEngine } from './syncEngine';

const UID = 'user123';
const CONTENT = { name: 'Pakka', sections: [{ name: '', cards: [{ card: 'detonate', count: 2 }] }] };

let clock = Date.parse('2026-10-03T10:00:00.000Z');
const now = () => new Date((clock += 1000));
let ids = 0;

/** One "device": its own browser storage, a sync engine without Web Locks and the shared cloud. */
function device(cloud: CloudStore, options: { debounceMs?: number; intervalMs?: number } = {}) {
  const repos: Repositories = createMemoryRepositories({ now, newId: () => `deck${(ids += 1)}` }).forAccount(UID);
  const engine: SyncEngine = createSyncEngine({ uid: UID, cloud, storage: repos.sync, now, locks: null, ...options });
  return { repos, engine };
}

let cloud: MemoryCloud;
beforeEach(() => {
  cloud = createMemoryCloud({ uid: UID, now });
  ids = 0;
});

describe('sync engine: schema 2 -> 3 (D-022)', () => {
  const BETA = 'welcometonightcitybeta:031';
  const RETAIL = 'welcometonightcityretail:031';
  const v2 = { schemaVersion: 2, savedAt: '2026-10-03T09:00:00.000Z', data: { entries: [{ card: 'detonate', count: 3 }] } };

  it('converts local and cloud v2 data the same way, so nothing is lost and a later change from another device wins', async () => {
    cloud.setRaw('collection/main', v2);
    cloud.setRaw('meta', { schemaVersion: 1, rev: 1, updatedAt: '2026-10-03T09:00:00.000Z' });
    const base = JSON.stringify({ v: 1, rev: 1, decks: [], collection: v2.data, wants: { entries: [] } });
    const initial = {
      [`cyberdeck:u:${UID}:collection`]: JSON.stringify(v2),
      [`cyberdeck:u:${UID}:sync-base`]: base,
    };
    const repos = createMemoryRepositories({ now, initial }).forAccount(UID);
    const a = { repos, engine: createSyncEngine({ uid: UID, cloud, storage: repos.sync, now, locks: null }) };
    await a.engine.syncNow();
    expect((await a.repos.collection.load()).value.entries).toEqual([{ card: 'detonate', count: 3, versions: { [BETA]: 3 } }]);
    expect(a.engine.status().state).toBe('idle');

    const b = device(cloud);
    await b.engine.syncNow();
    expect((await b.repos.collection.load()).value.entries).toEqual([{ card: 'detonate', count: 3, versions: { [BETA]: 3 } }]);
    await b.repos.collection.setVersionCount('detonate', RETAIL, 1);
    await b.engine.syncNow();
    expect(cloud.getRaw('collection/main')).toMatchObject({ schemaVersion: 3 });

    await a.engine.syncNow();
    expect((await a.repos.collection.load()).value.entries).toEqual([{ card: 'detonate', count: 4, versions: { [BETA]: 3, [RETAIL]: 1 } }]);
  });

  it('locks a client that finds a version 4 collection in the cloud and leaves it untouched', async () => {
    const newer = { schemaVersion: 4, savedAt: '', data: {} };
    cloud.setRaw('collection/main', newer);
    cloud.setRaw('meta', { schemaVersion: 1, rev: 2, updatedAt: '2026-10-03T10:00:00.000Z' });
    const a = device(cloud);
    await a.repos.collection.setCount('detonate', 1);
    await a.engine.syncNow();
    expect(a.engine.status().state).toBe('locked');
    expect(cloud.getRaw('collection/main')).toEqual(newer);
  });
});

describe('sync engine', () => {
  it('uploads local data on the first sync and a second device pulls it', async () => {
    const a = device(cloud);
    const deck = await a.repos.decks.create(CONTENT);
    await a.repos.collection.setCount('detonate', 3);
    await a.engine.syncNow();
    expect(a.engine.status()).toMatchObject({ state: 'idle', pending: false });
    expect(a.engine.status().lastSyncedAt).not.toBeNull();
    expect(cloud.paths()).toEqual(['collection/main', `decks/${deck.id}`, 'meta']);

    const b = device(cloud);
    await b.engine.syncNow();
    expect((await b.repos.decks.list()).value).toEqual([deck]);
    expect((await b.repos.collection.load()).value.entries).toEqual([{ card: 'detonate', count: 3 }]);
  });

  it('syncs the want list both ways, a push without reads and a merge per card (D-018)', async () => {
    const a = device(cloud);
    const b = device(cloud);
    await a.repos.wants.setCount('detonate', 2);
    await a.engine.syncNow();
    expect(cloud.paths()).toEqual(['collection/want', 'meta']);
    await b.engine.syncNow();
    expect((await b.repos.wants.load()).value.entries).toEqual([{ card: 'detonate', count: 2 }]);

    // Only the want list changed on a: a push of that one document.
    await a.repos.wants.setCount('detonate', 5);
    await a.engine.syncNow();
    expect(cloud.getRaw('collection/want')).toMatchObject({ data: { entries: [{ card: 'detonate', count: 5 }] } });
    expect(cloud.paths()).not.toContain('collection/main');

    // Both devices changed different cards: both end up with both.
    await b.repos.wants.setCount('overclock', 1);
    await b.engine.syncNow();
    await a.engine.syncNow();
    const expected = [
      { card: 'detonate', count: 5 },
      { card: 'overclock', count: 1 },
    ];
    expect((await a.repos.wants.load()).value.entries).toEqual(expected);
    expect((await b.repos.wants.load()).value.entries).toEqual(expected);
  });

  it('does not touch the collection document when only the want list changes, and the reverse', async () => {
    const a = device(cloud);
    await a.repos.collection.setCount('detonate', 1);
    await a.engine.syncNow();
    const before = cloud.getRaw('collection/main');
    await a.repos.wants.setCount('detonate', 1);
    await a.engine.syncNow();
    expect(cloud.getRaw('collection/main')).toEqual(before);
    await a.repos.collection.setCount('detonate', 2);
    await a.engine.syncNow();
    expect(cloud.getRaw('collection/want')).toMatchObject({ data: { entries: [{ card: 'detonate', count: 1 }] } });
  });

  it('keeps the local want list and the cloud document when the cloud want list is invalid', async () => {
    const a = device(cloud);
    await a.repos.wants.setCount('detonate', 2);
    await a.engine.syncNow();
    cloud.setRaw('collection/want', { garbage: true });
    cloud.setRaw('meta', { schemaVersion: 1, rev: 7, updatedAt: '2026-10-03T10:00:00.000Z' });
    await a.engine.syncNow();
    expect((await a.repos.wants.load()).value.entries).toEqual([{ card: 'detonate', count: 2 }]);
    expect(cloud.getRaw('collection/want')).toEqual({ garbage: true });
    // SEC-122-1: a later local change must not overwrite the invalid document either.
    await a.repos.wants.setCount('detonate', 3);
    await a.engine.syncNow();
    await a.engine.syncNow();
    expect(cloud.getRaw('collection/want')).toEqual({ garbage: true });
    expect((await a.repos.wants.load()).value.entries).toEqual([{ card: 'detonate', count: 3 }]);
  });

  it('does not overwrite an invalid cloud collection after a later local change (SEC-122-1)', async () => {
    const a = device(cloud);
    await a.repos.collection.setCount('detonate', 2);
    await a.engine.syncNow();
    cloud.setRaw('collection/main', { garbage: true });
    cloud.setRaw('meta', { schemaVersion: 1, rev: 7, updatedAt: '2026-10-03T10:00:00.000Z' });
    await a.engine.syncNow();
    await a.repos.collection.setCount('detonate', 3);
    await a.engine.syncNow();
    expect(cloud.getRaw('collection/main')).toEqual({ garbage: true });
  });

  it('locks when the cloud want list has a newer schema', async () => {
    cloud.setRaw('collection/want', { schemaVersion: 9, savedAt: '', data: {} });
    cloud.setRaw('meta', { schemaVersion: 1, rev: 2, updatedAt: '2026-10-03T10:00:00.000Z' });
    const a = device(cloud);
    await a.repos.wants.setCount('detonate', 1);
    await a.engine.syncNow();
    expect(a.engine.status().state).toBe('locked');
    expect(cloud.getRaw('collection/want')).toEqual({ schemaVersion: 9, savedAt: '', data: {} });
  });

  it('reads only the meta document when nothing changed', async () => {
    const a = device(cloud);
    await a.repos.decks.create(CONTENT);
    await a.engine.syncNow();
    const before = cloud.reads;
    await a.engine.syncNow();
    expect(cloud.reads - before).toBe(1);
  });

  it('pushes a local change without reading the other documents', async () => {
    const a = device(cloud);
    const deck = await a.repos.decks.create(CONTENT);
    await a.engine.syncNow();
    const before = cloud.reads;
    await a.repos.decks.update(deck.id, { ...CONTENT, name: 'Uusi' });
    await a.engine.syncNow();
    // The meta read, plus the transaction's own meta read in the memory store.
    expect(cloud.reads - before).toBeLessThanOrEqual(2);
    expect(cloud.getRaw(`decks/${deck.id}`)).toMatchObject({ data: { name: 'Uusi' } });
  });

  it('propagates a deletion to another device', async () => {
    const a = device(cloud);
    const b = device(cloud);
    const deck = await a.repos.decks.create(CONTENT);
    await a.engine.syncNow();
    await b.engine.syncNow();
    await a.repos.decks.remove(deck.id);
    await a.engine.syncNow();
    await b.engine.syncNow();
    expect((await b.repos.decks.list()).value).toEqual([]);
  });

  it('merges edits made on two devices', async () => {
    const a = device(cloud);
    const b = device(cloud);
    const first = await a.repos.decks.create(CONTENT);
    await a.engine.syncNow();
    await b.engine.syncNow();
    await a.repos.decks.update(first.id, { ...CONTENT, name: 'Muutettu' });
    const second = await b.repos.decks.create({ ...CONTENT, name: 'Toinen' });
    await a.engine.syncNow();
    await b.engine.syncNow();
    await a.engine.syncNow();
    expect((await a.repos.decks.list()).value.map((d) => d.name).sort()).toEqual(['Muutettu', 'Toinen']);
    expect((await b.repos.decks.list()).value.map((d) => d.id).sort()).toEqual([first.id, second.id].sort());
  });

  it('retries when another device commits first', async () => {
    const other = device(cloud);
    await other.repos.decks.create({ ...CONTENT, name: 'Muualta' });
    let raced = false;
    const a = device({
      readMeta: () => cloud.readMeta(),
      readAll: async () => {
        const snapshot = await cloud.readAll();
        if (!raced) {
          raced = true;
          await other.engine.syncNow(); // the other device wins the race after this read
        }
        return snapshot;
      },
      commit: (change, rev) => cloud.commit(change, rev),
      deleteAll: () => cloud.deleteAll(),
    });
    await a.repos.decks.create(CONTENT);
    await a.engine.syncNow();
    expect(a.engine.status().state).toBe('idle');
    expect((await a.repos.decks.list()).value.map((d) => d.name).sort()).toEqual(['Muualta', 'Pakka']);
  });

  it('runs another round when the device data changed during the sync', async () => {
    let edited = false;
    const a: ReturnType<typeof device> = device({
      readMeta: () => cloud.readMeta(),
      readAll: async () => {
        const snapshot = await cloud.readAll();
        if (!edited) {
          edited = true;
          await a.repos.collection.setCount('detonate', 9);
        }
        return snapshot;
      },
      commit: (change, rev) => cloud.commit(change, rev),
      deleteAll: () => cloud.deleteAll(),
    });
    await a.repos.decks.create(CONTENT);
    await a.engine.syncNow();
    expect(a.engine.status()).toMatchObject({ state: 'idle', pending: false });
    expect((await a.repos.collection.load()).value.entries).toEqual([{ card: 'detonate', count: 9 }]);
    expect(cloud.getRaw('collection/main')).toMatchObject({ data: { entries: [{ card: 'detonate', count: 9 }] } });
  });

  it('shows offline, keeps the changes and recovers', async () => {
    const a = device(cloud);
    await a.repos.decks.create(CONTENT);
    cloud.failNext('offline');
    await a.engine.syncNow();
    expect(a.engine.status()).toMatchObject({ state: 'offline', pending: true });
    expect((await a.repos.decks.list()).value).toHaveLength(1);
    await a.engine.syncNow();
    expect(a.engine.status()).toMatchObject({ state: 'idle', pending: false });
  });

  it('shows error for other cloud errors', async () => {
    const a = device(cloud);
    cloud.failNext('quota');
    await a.engine.syncNow();
    expect(a.engine.status().state).toBe('error');
  });

  it('locks when the cloud has a newer schema and writes nothing', async () => {
    cloud.setRaw('meta', { schemaVersion: 99, rev: 5, updatedAt: '2026-10-03T10:00:00.000Z' });
    const a = device(cloud);
    await a.repos.decks.create(CONTENT);
    await a.engine.syncNow();
    expect(a.engine.status().state).toBe('locked');
    expect(cloud.paths()).toEqual(['meta']);
  });

  it('keeps the local deck and the cloud document when a cloud deck is invalid', async () => {
    const a = device(cloud);
    const deck = await a.repos.decks.create(CONTENT);
    await a.engine.syncNow();
    cloud.setRaw(`decks/${deck.id}`, { garbage: true });
    cloud.setRaw('meta', { schemaVersion: 1, rev: 7, updatedAt: '2026-10-03T10:00:00.000Z' });
    await a.engine.syncNow();
    expect((await a.repos.decks.list()).value).toEqual([deck]);
    expect(cloud.getRaw(`decks/${deck.id}`)).toEqual({ garbage: true });
  });

  it('joins a running round instead of starting a second one', async () => {
    const a = device(cloud);
    await a.repos.decks.create(CONTENT);
    await Promise.all([a.engine.syncNow(), a.engine.syncNow()]);
    expect(cloud.getRaw('meta')).toMatchObject({ rev: 1 });
  });

  it('notifies listeners of status changes', async () => {
    const a = device(cloud);
    const states: string[] = [];
    a.engine.onChange(() => states.push(a.engine.status().state));
    await a.engine.syncNow();
    expect(states).toEqual(['syncing', 'idle']);
  });
});

describe('sync triggers', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('syncs at start, 3 seconds after a change, on focus, when back online and every 5 minutes', async () => {
    const a = device(cloud);
    const spy = vi.spyOn(cloud, 'readMeta');
    a.engine.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(spy).toHaveBeenCalledTimes(1);

    await a.repos.decks.create(CONTENT);
    await vi.advanceTimersByTimeAsync(2900);
    expect(spy).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(200);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(cloud.paths()).toHaveLength(2);

    window.dispatchEvent(new Event('focus'));
    await vi.advanceTimersByTimeAsync(0);
    expect(spy).toHaveBeenCalledTimes(3);
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(0);
    expect(spy).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(5);
    a.engine.stop();
  });

  it('stops listening after stop()', async () => {
    const a = device(cloud);
    a.engine.start();
    await vi.advanceTimersByTimeAsync(0);
    a.engine.stop();
    const spy = vi.spyOn(cloud, 'readMeta');
    window.dispatchEvent(new Event('focus'));
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('sync engine: game results (T-122, D-030)', () => {
  const GAME = {
    deckId: 'deck1',
    playedOn: '2026-10-05',
    result: 'win',
    opponentName: 'Blue aggro',
    opponentLegends: [],
    turn: null,
    event: null,
    sideboard: false,
    note: null,
  } as const;

  it('syncs the log both ways: a push of the one document, a merge per game id', async () => {
    const a = device(cloud);
    const b = device(cloud);
    const first = await a.repos.games.add(GAME);
    await a.engine.syncNow();
    expect(cloud.paths()).toEqual(['games/log', 'meta']);
    expect(cloud.getRaw('games/log')).toMatchObject({ schemaVersion: 1, data: { games: [first] } });
    await b.engine.syncNow();
    expect((await b.repos.games.load()).value.games).toEqual([first]);

    // Both devices add a game: both end up with both.
    const second = await b.repos.games.add({ ...GAME, result: 'loss' });
    await b.engine.syncNow();
    const third = await a.repos.games.add({ ...GAME, result: 'draw' });
    await a.engine.syncNow();
    await b.engine.syncNow();
    const ids = (await a.repos.games.load()).value.games.map((g) => g.id).sort();
    expect(ids).toEqual([first.id, second.id, third.id].sort());
    expect((await b.repos.games.load()).value.games.map((g) => g.id).sort()).toEqual(ids);

    // A deletion and an edit on different devices.
    await a.repos.games.remove(first.id);
    await b.repos.games.update(second.id, { ...GAME, result: 'win' });
    await a.engine.syncNow();
    await b.engine.syncNow();
    await a.engine.syncNow();
    for (const side of [a, b]) {
      const games = (await side.repos.games.load()).value.games;
      expect(games.map((g) => g.id).sort()).toEqual([second.id, third.id].sort());
      expect(games.find((g) => g.id === second.id)?.result).toBe('win');
    }
  });

  it('does not touch the other documents when only the log changes', async () => {
    const a = device(cloud);
    await a.repos.collection.setCount('detonate', 1);
    await a.engine.syncNow();
    const before = cloud.getRaw('collection/main');
    await a.repos.games.add(GAME);
    await a.engine.syncNow();
    expect(cloud.getRaw('collection/main')).toEqual(before);
    expect(cloud.paths()).toContain('games/log');
  });

  it('keeps the local log and the cloud document when the cloud log is invalid', async () => {
    const a = device(cloud);
    const added = await a.repos.games.add(GAME);
    await a.engine.syncNow();
    cloud.setRaw('games/log', { garbage: true });
    cloud.setRaw('meta', { schemaVersion: 1, rev: 7, updatedAt: '2026-10-03T10:00:00.000Z' });
    await a.engine.syncNow();
    expect((await a.repos.games.load()).value.games).toEqual([added]);
    expect(cloud.getRaw('games/log')).toEqual({ garbage: true });
    // SEC-122-1: logging another game must not overwrite the invalid document on the next rounds.
    await a.repos.games.add({ ...GAME, result: 'loss' });
    await a.engine.syncNow();
    await a.engine.syncNow();
    expect(cloud.getRaw('games/log')).toEqual({ garbage: true });
    expect((await a.repos.games.load()).value.games).toHaveLength(2);
  });

  it('treats the whole cloud log as invalid when one row cannot be read (SEC-122-2)', async () => {
    const a = device(cloud);
    const added = await a.repos.games.add(GAME);
    await a.engine.syncNow();
    const doc = cloud.getRaw('games/log') as { data: { games: Record<string, unknown>[] } };
    const broken = { ...doc, data: { games: [{ ...doc.data.games[0], unexpected: 'x' }] } };
    cloud.setRaw('games/log', broken);
    cloud.setRaw('meta', { schemaVersion: 1, rev: 7, updatedAt: '2026-10-03T10:00:00.000Z' });
    await a.engine.syncNow();
    expect((await a.repos.games.load()).value.games).toEqual([added]);
    expect(cloud.getRaw('games/log')).toEqual(broken);
  });

  it('keeps the cloud log when it has more than 1000 rows, and deletes nothing', async () => {
    const a = device(cloud);
    const added = await a.repos.games.add(GAME);
    await a.engine.syncNow();
    const rows = Array.from({ length: 1001 }, (_, i) => ({ ...added, id: `g${i}` }));
    const oversized = { schemaVersion: 1, savedAt: '', data: { games: rows } };
    cloud.setRaw('games/log', oversized);
    cloud.setRaw('meta', { schemaVersion: 1, rev: 7, updatedAt: '2026-10-03T10:00:00.000Z' });
    await a.engine.syncNow();
    expect((await a.repos.games.load()).value.games).toEqual([added]);
    expect(cloud.getRaw('games/log')).toEqual(oversized);
  });

  it('locks when the cloud log has a newer schema', async () => {
    cloud.setRaw('games/log', { schemaVersion: 9, savedAt: '', data: {} });
    cloud.setRaw('meta', { schemaVersion: 1, rev: 2, updatedAt: '2026-10-03T10:00:00.000Z' });
    const a = device(cloud);
    await a.repos.games.add(GAME);
    await a.engine.syncNow();
    expect(a.engine.status().state).toBe('locked');
    expect(cloud.getRaw('games/log')).toEqual({ schemaVersion: 9, savedAt: '', data: {} });
  });

  it('stops with an error and writes nothing when the local log is over the byte limit (SR-45)', async () => {
    const note = 'ä'.repeat(500);
    const rows = Array.from({ length: 999 }, (_, i) => ({ ...GAME, id: `g${i}`, createdAt: '2026-10-05T10:00:00.000Z', note }));
    const initial = {
      [`cyberdeck:u:${UID}:games`]: JSON.stringify({ schemaVersion: 1, savedAt: '2026-10-05T10:00:00.000Z', data: { games: rows } }),
    };
    const repos = createMemoryRepositories({ now, initial }).forAccount(UID);
    const engine = createSyncEngine({ uid: UID, cloud, storage: repos.sync, now, locks: null });
    await engine.syncNow();
    expect(engine.status().state).toBe('error');
    expect(cloud.paths()).toEqual([]);
  });
});
