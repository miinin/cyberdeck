import { newSealedRun, withPack } from '../domain/sealed';
import type { SealedRun } from '../domain/sealed';
import { encodeEnvelope } from './envelope';
import { StorageError } from './errors';
import { BACKUP_PREFIX, SEALED_KEY } from './keys';
import { createMemoryStore } from './keyValueStore';
import { createRepositories } from './repositories';

const START = Date.UTC(2026, 10, 1, 12, 0, 0);

function setup(initial: Record<string, string> = {}) {
  const store = createMemoryStore(initial);
  let tick = 0;
  const repositories = createRepositories({ store, persistent: true, now: () => new Date(START + 1000 * tick++) });
  return { store, ...repositories };
}

const pack = [{ card: 'a', printing: 'welcometonightcityretail:001', rarity: 'Common' as const }];
const run: SealedRun = { ...withPack(newSealedRun('welcome-to-night-city'), pack), main: [{ card: 'a', count: 1 }] };

async function errorKind(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return 'resolved';
  } catch (error) {
    return error instanceof StorageError ? error.kind : 'other';
  }
}

describe('sealed repository (T-173)', () => {
  it('starts empty', async () => {
    expect((await setup().sealed.load()).value).toBeNull();
  });

  it('saves a run in an envelope under cyberdeck:sealed and reads it back', async () => {
    const { store, sealed } = setup();
    await sealed.save(run);
    expect(JSON.parse(store.getItem(SEALED_KEY) ?? '')).toMatchObject({ schemaVersion: 1, data: { run } });
    expect((await sealed.load()).value).toEqual(run);
  });

  it('refuses a run that is not valid and keeps the saved one', async () => {
    const { sealed } = setup();
    await sealed.save(run);
    expect(await errorKind(sealed.save({ ...run, main: [{ card: 'a', count: 2 }] }))).toBe('invalid-input');
    expect(await errorKind(sealed.save({ ...run, set: 'other' as never }))).toBe('invalid-input');
    expect((await sealed.load()).value).toEqual(run);
  });

  it('clears the run', async () => {
    const { sealed } = setup();
    await sealed.save(run);
    await sealed.clear();
    expect((await sealed.load()).value).toBeNull();
  });

  it('backs up unreadable stored data and starts empty (SR-23)', async () => {
    const bad = encodeEnvelope({ run: { ...run, main: [{ card: 'a', count: 5 }] } }, 1, new Date(START));
    const { store, sealed } = setup({ [SEALED_KEY]: bad });
    const loaded = await sealed.load();
    expect(loaded.value).toBeNull();
    expect(loaded.notices).toMatchObject([{ kind: 'reset' }]);
    expect(store.keys().some((key) => key.startsWith(`${BACKUP_PREFIX}sealed:`))).toBe(true);
    expect(store.getItem(SEALED_KEY)).toBeNull();
  });

  it('treats text that is not JSON as unreadable too', async () => {
    const { sealed } = setup({ [SEALED_KEY]: '{oops' });
    expect((await sealed.load()).notices).toMatchObject([{ kind: 'reset' }]);
  });

  it('does not read a run saved by a newer version, and refuses to overwrite it', async () => {
    const newer = encodeEnvelope({ run: null }, 9, new Date(START));
    const { sealed } = setup({ [SEALED_KEY]: newer });
    expect((await sealed.load()).notices).toEqual([{ kind: 'newer-version', version: 9 }]);
    expect(await errorKind(sealed.save(run))).toBe('newer-version');
  });

  it('keeps an account sealed apart from the signed-out one and erases it with the account', async () => {
    const { store, sealed, forAccount } = setup();
    const account = forAccount('abcDEF123456789012345678901a');
    await sealed.save(run);
    expect((await account.sealed.load()).value).toBeNull();
    await account.sealed.save(run);
    expect(store.keys().filter((key) => key.endsWith('sealed'))).toHaveLength(2);
    account.sync.eraseAccount();
    expect((await account.sealed.load()).value).toBeNull();
    expect((await sealed.load()).value).toEqual(run);
  });

  it('is not part of the sync data', () => {
    const { sync } = setup();
    expect(Object.keys(sync.read() ?? {}).sort()).toEqual(['collection', 'decks', 'games', 'haves', 'wants']);
  });
});
