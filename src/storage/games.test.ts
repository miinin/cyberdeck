import { gameLogBytes, gameLogFits, MAX_GAME_LOG_BYTES, MAX_GAMES } from '../domain/games';
import type { GameInput } from '../domain/games';
import { encodeEnvelope } from './envelope';
import { StorageError } from './errors';
import { BACKUP_PREFIX, GAMES_KEY } from './keys';
import { createMemoryStore } from './keyValueStore';
import { createRepositories } from './repositories';
import type { RepositoryOptions } from './repositories';

const START = Date.UTC(2026, 9, 1, 12, 0, 0);
const CONTENT = { name: 'Pakka', sections: [{ name: '', cards: [{ card: 'detonate', count: 2 }] }] };

function setup(initial: Record<string, string> = {}, options: Partial<RepositoryOptions> = {}) {
  const store = options.store ?? createMemoryStore(initial);
  let tick = 0;
  let ids = 0;
  const repositories = createRepositories({
    store,
    persistent: true,
    now: () => new Date(START + 1000 * tick++),
    newId: () => `id-${++ids}`,
    ...options,
  });
  return { store, ...repositories };
}

function input(patch: Partial<GameInput> = {}): GameInput {
  return {
    deckId: 'deck1',
    playedOn: '2026-10-05',
    result: 'win',
    opponentName: null,
    opponentLegends: [],
    turn: null,
    event: null,
    sideboard: false,
    note: null,
    ...patch,
  };
}

async function errorKind(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return 'resolved';
  } catch (error) {
    return error instanceof StorageError ? error.kind : 'other';
  }
}

const stored = (data: unknown, version = 1) => encodeEnvelope(data, version, new Date(START));

describe('game log repository (T-122)', () => {
  it('adds a game with an app-made id and time, and stores it under cyberdeck:games', async () => {
    const { store, games } = setup();
    const added = await games.add(input({ opponentName: ' Blue aggro ', opponentLegends: ['v-streetkid'], turn: 'first' }));
    expect(added).toMatchObject({ id: 'id-1', createdAt: new Date(START).toISOString(), opponentName: 'Blue aggro' });
    expect(JSON.parse(store.getItem(GAMES_KEY) ?? '')).toMatchObject({ schemaVersion: 1, data: { games: [added] } });
    expect((await setup({}, { store }).games.load()).value.games).toEqual([added]);
  });

  it('never takes an id or time from the caller', async () => {
    const { games } = setup();
    const added = await games.add({ ...input(), id: 'mine', createdAt: '2000-01-01T00:00:00.000Z' } as GameInput);
    expect(added.id).toBe('id-1');
    expect(added.createdAt).not.toBe('2000-01-01T00:00:00.000Z');
  });

  it('keeps the log newest first', async () => {
    const { games } = setup();
    await games.add(input({ playedOn: '2026-10-01' }));
    await games.add(input({ playedOn: '2026-10-05' }));
    await games.add(input({ playedOn: '2026-10-05' }));
    expect((await games.load()).value.games.map((g) => g.id)).toEqual(['id-3', 'id-2', 'id-1']);
  });

  it('updates the user fields and keeps id and createdAt', async () => {
    const { games } = setup();
    const added = await games.add(input());
    const updated = await games.update(added.id, input({ result: 'loss', note: 'Misplayed' }));
    expect(updated).toMatchObject({ id: added.id, createdAt: added.createdAt, result: 'loss', note: 'Misplayed' });
    expect(await errorKind(games.update('nope', input()))).toBe('not-found');
  });

  it('removes a game, and an unknown id is not an error', async () => {
    const { store, games } = setup();
    const added = await games.add(input());
    await games.remove('nope');
    await games.remove(added.id);
    expect((await games.load()).value.games).toEqual([]);
    expect(JSON.parse(store.getItem(GAMES_KEY) ?? '').data).toEqual({ games: [] });
  });

  it.each([
    ['result', { result: 'won' as never }],
    ['date', { playedOn: '2026-02-30' }],
    ['deck id', { deckId: '../x' }],
    ['note length', { note: 'x'.repeat(501) }],
    ['legends', { opponentLegends: ['a', 'b', 'c', 'd'] }],
  ])('rejects a bad %s with invalid-input and writes nothing', async (_label, patch) => {
    const { store, games } = setup();
    expect(await errorKind(games.add(input(patch)))).toBe('invalid-input');
    expect(store.keys()).toEqual([]);
  });

  it('cleans control characters from text before storing', async () => {
    const { games } = setup();
    const added = await games.add(input({ opponentName: 'Blue\n‮aggro', note: '\n' }));
    expect(added.opponentName).toBe('Blueaggro');
    expect(added.note).toBeNull();
  });

  it('stops at MAX_GAMES rows and changes nothing', async () => {
    const rows = Array.from({ length: MAX_GAMES }, (_, i) => ({ ...input(), id: `g${i}`, createdAt: '2026-10-05T10:00:00.000Z' }));
    const { store, games } = setup({ [GAMES_KEY]: stored({ games: rows }) });
    const before = store.getItem(GAMES_KEY);
    expect(await errorKind(games.add(input()))).toBe('limit-reached');
    expect(store.getItem(GAMES_KEY)).toBe(before);
  });

  it('stops at the byte limit even below MAX_GAMES rows', async () => {
    const note = 'ä'.repeat(500);
    const row = (i: number) => ({ ...input({ note }), id: `g${i}`, createdAt: '2026-10-05T10:00:00.000Z' });
    // The most rows that fit; one more would not.
    let count = 1;
    while (gameLogBytes({ games: Array.from({ length: count + 2 }, (_, i) => row(i)) }) <= MAX_GAME_LOG_BYTES) count += 1;
    const rows = Array.from({ length: count + 1 }, (_, i) => row(i));
    expect(gameLogFits({ games: rows })).toBe(true);
    expect(count + 1).toBeLessThan(MAX_GAMES);
    const { store, games } = setup({ [GAMES_KEY]: stored({ games: rows }) });
    const before = store.getItem(GAMES_KEY);
    expect(await errorKind(games.add(input({ note })))).toBe('limit-reached');
    expect(store.getItem(GAMES_KEY)).toBe(before);
    // A game that stays the same size can still be edited.
    expect(await errorKind(games.update('g1', input({ note, result: 'loss' })))).toBe('resolved');
  });
  it('backs up an unreadable log and starts from empty', async () => {
    const { store, games } = setup({ [GAMES_KEY]: '{broken' });
    const loaded = await games.load();
    expect(loaded.value.games).toEqual([]);
    expect(loaded.notices).toMatchObject([{ kind: 'reset' }]);
    expect(store.keys().filter((key) => key.startsWith(`${BACKUP_PREFIX}games:`))).toHaveLength(1);
  });

  it('keeps the valid rows of a partly broken log, backs it up before the next write', async () => {
    const good = { ...input(), id: 'g1', createdAt: '2026-10-05T10:00:00.000Z' };
    const { store, games } = setup({ [GAMES_KEY]: stored({ games: [good, { id: 'x' }] }) });
    const loaded = await games.load();
    expect(loaded.value.games).toEqual([good]);
    expect(loaded.notices).toEqual([{ kind: 'repaired', dropped: 1 }]);
    await games.add(input());
    expect(store.keys().filter((key) => key.startsWith(`${BACKUP_PREFIX}games:`))).toHaveLength(1);
  });

  it('shows a newer log as empty and blocks writes', async () => {
    const raw = stored({ games: [] }, 2);
    const { store, games } = setup({ [GAMES_KEY]: raw });
    expect((await games.load()).notices).toEqual([{ kind: 'newer-version', version: 2 }]);
    expect(await errorKind(games.add(input()))).toBe('newer-version');
    expect(store.getItem(GAMES_KEY)).toBe(raw);
  });

  it('listens to its own key only', () => {
    const subscribe = vi.fn(() => () => {});
    const { games } = setup({}, { subscribe });
    games.subscribe(() => {});
    expect(subscribe).toHaveBeenCalledWith([GAMES_KEY], expect.any(Function));
  });

  it('lives under the account namespace when signed in, and the signed-out log is separate', async () => {
    const { store, games, forAccount } = setup();
    await games.add(input());
    const account = forAccount('user123');
    expect((await account.games.load()).value.games).toEqual([]);
    await account.games.add(input({ result: 'loss' }));
    expect(store.getItem('cyberdeck:u:user123:games')).not.toBeNull();
    expect((await games.load()).value.games).toHaveLength(1);
  });
});

describe('deleting a deck deletes its games (T-122, SR-48)', () => {
  it('removes the games of the deck in the same call and leaves the other decks alone', async () => {
    const { games, decks } = setup();
    const a = await decks.create(CONTENT);
    const b = await decks.create({ ...CONTENT, name: 'Toinen' });
    await games.add(input({ deckId: a.id }));
    await games.add(input({ deckId: a.id }));
    const keep = await games.add(input({ deckId: b.id }));
    await decks.remove(a.id);
    expect((await games.load()).value.games).toEqual([keep]);
  });

  it('leaves the games of decks this device does not have when another deck is deleted (SEC-122-3)', async () => {
    const { games, decks } = setup();
    const a = await decks.create(CONTENT);
    const b = await decks.create({ ...CONTENT, name: 'Toinen' });
    const unseen = await games.add(input({ deckId: 'invalid-in-the-cloud' }));
    const keep = await games.add(input({ deckId: a.id }));
    await games.add(input({ deckId: b.id }));
    await decks.remove(b.id);
    expect((await games.load()).value.games.map((g) => g.id).sort()).toEqual([unseen.id, keep.id].sort());
  });

  it('does not write the log when a deck without games is deleted, nor for an unknown deck', async () => {
    const { store, games, decks } = setup();
    const a = await decks.create(CONTENT);
    await decks.remove(a.id);
    expect(store.getItem(GAMES_KEY)).toBeNull();
    const b = await decks.create(CONTENT);
    await games.add(input({ deckId: b.id }));
    const before = store.getItem(GAMES_KEY);
    await decks.remove('unknown');
    expect(store.getItem(GAMES_KEY)).toBe(before);
  });

  it('still deletes the deck when the log is newer than this app can write', async () => {
    const raw = stored({ games: [] }, 2);
    const { store, decks } = setup({ [GAMES_KEY]: raw });
    const a = await decks.create(CONTENT);
    await decks.remove(a.id);
    expect((await decks.list()).value).toEqual([]);
    expect(store.getItem(GAMES_KEY)).toBe(raw);
  });
});

describe('sync storage and the game log (T-122)', () => {
  it('reads, applies, backs up and clears the log with the other data', async () => {
    const { store, games, sync } = setup();
    await games.add(input());
    const local = sync.read();
    expect(local?.games.games).toHaveLength(1);
    if (local === null) return;
    expect(sync.apply(local, { ...local, games: { games: [] } })).toBe(true);
    expect((await games.load()).value.games).toEqual([]);
    await games.add(input());
    sync.backupAll();
    expect(store.keys().filter((key) => key.startsWith(`${BACKUP_PREFIX}games:`))).toHaveLength(1);
    sync.clear();
    expect(store.getItem(GAMES_KEY)).toBeNull();
  });

  it('keeps at most 3 backups of the log', async () => {
    const { store, games, sync } = setup();
    await games.add(input());
    for (let i = 0; i < 5; i += 1) sync.backupAll();
    expect(store.keys().filter((key) => key.startsWith(`${BACKUP_PREFIX}games:`))).toHaveLength(3);
  });

  it('refuses to apply when the log changed meanwhile', async () => {
    const { games, sync } = setup();
    const local = sync.read();
    if (local === null) throw new Error('unreadable');
    await games.add(input());
    expect(sync.apply(local, { ...local, games: { games: [] } })).toBe(false);
  });

  it('cannot be synced from an unreadable or newer log', () => {
    expect(setup({ [GAMES_KEY]: '{broken' }).sync.read()).toBeNull();
    expect(setup({ [GAMES_KEY]: stored({ games: [] }, 2) }).sync.read()).toBeNull();
  });

  it('erases the account log with the account and nothing of the signed-out data', async () => {
    const { store, games, forAccount } = setup();
    await games.add(input());
    const account = forAccount('user123');
    await account.games.add(input());
    account.sync.eraseAccount();
    expect(store.getItem('cyberdeck:u:user123:games')).toBeNull();
    expect(store.getItem(GAMES_KEY)).not.toBeNull();
  });

  it('reads a sync base saved before the game log existed as an empty log', () => {
    const { store, sync } = setup();
    store.setItem('cyberdeck:sync-base', JSON.stringify({ v: 2, rev: 3, decks: [], collection: { entries: [] }, wants: { entries: [] } }));
    expect(sync.loadBase()).toMatchObject({ rev: 3, games: { games: [] } });
    store.setItem('cyberdeck:sync-base', JSON.stringify({ v: 2, rev: 3, decks: [], collection: { entries: [] }, wants: { entries: [] }, games: 'x' }));
    expect(sync.loadBase()).toBeNull();
  });
});
