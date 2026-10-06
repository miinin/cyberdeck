import { createMemoryRepositories } from '../../storage';
import type { Repositories } from '../../storage';
import { createMemoryCloud, createMemoryPublicDecks } from '../memory';
import type { MemoryPublicDecks } from '../memory';
import { publicDeckId } from '../../domain/publicDeck';
import type { MemoryCloud } from '../memory';
import { createAccountSession } from './session';

const UID = 'user123';
const CONTENT = { name: 'Pakka', sections: [{ name: '', cards: [{ card: 'detonate', count: 2 }] }] };

let clock = Date.parse('2026-10-03T10:00:00.000Z');
const now = () => new Date((clock += 1000));
let ids = 0;

/** A browser: signed-out data and the account's data in one store. */
function browser(initial: Record<string, string> = {}) {
  const anonymous: Repositories = createMemoryRepositories({ initial, now, newId: () => `deck${(ids += 1)}` });
  return { anonymous, account: anonymous.forAccount(UID) };
}

function open(b: ReturnType<typeof browser>, cloud: MemoryCloud) {
  const session = createAccountSession({ uid: UID, ...b, cloud, now, locks: null });
  session.start();
  return session;
}

const settle = () => vi.waitFor(() => expect(true).toBe(true)).then(() => new Promise((resolve) => setTimeout(resolve, 20)));

let cloud: MemoryCloud;
beforeEach(() => {
  cloud = createMemoryCloud({ uid: UID, now });
  ids = 0;
});

describe('first sign-in', () => {
  it('pulls the account data into an empty browser', async () => {
    const other = browser();
    await other.account.decks.create(CONTENT);
    const first = open(other, cloud);
    await settle();
    first.dispose();

    const b = browser();
    const session = open(b, cloud);
    await vi.waitFor(() => expect(session.status().phase).toBe('running'));
    await settle();
    expect((await b.account.decks.list()).value).toHaveLength(1);
    session.dispose();
  });

  it('moves the signed-out data to an empty account and clears it only after the sync', async () => {
    const b = browser();
    await b.anonymous.decks.create(CONTENT);
    await b.anonymous.collection.setCount('detonate', 4);
    const session = open(b, cloud);
    await vi.waitFor(() => expect(session.status().sync.lastSyncedAt).not.toBeNull());
    await settle();

    expect((await b.account.decks.list()).value).toHaveLength(1);
    expect(cloud.paths()).toContain('collection/main');
    expect((await b.anonymous.decks.list()).value).toEqual([]);
    expect((await b.anonymous.collection.load()).value.entries).toEqual([]);
    session.dispose();
  });

  it('keeps the signed-out data and a backup when the first sync fails', async () => {
    const b = browser();
    await b.anonymous.decks.create(CONTENT);
    // The plan reads once; the engine's first round then fails.
    const real = cloud.readAll.bind(cloud);
    let calls = 0;
    vi.spyOn(cloud, 'readAll').mockImplementation(async () => {
      calls += 1;
      if (calls > 1) {
        const { CloudError } = await import('../cloudError');
        throw new CloudError('offline');
      }
      return real();
    });
    const session = open(b, cloud);
    await vi.waitFor(() => expect(session.status().sync.state).toBe('offline'));
    await settle();
    expect((await b.anonymous.decks.list()).value).toHaveLength(1);
    session.dispose();
  });

  it('moves a signed-out want list to an empty account too (D-018)', async () => {
    const b = browser();
    await b.anonymous.wants.setCount('detonate', 3);
    const session = open(b, cloud);
    await vi.waitFor(() => expect(session.status().sync.lastSyncedAt).not.toBeNull());
    await settle();
    expect((await b.account.wants.load()).value.entries).toEqual([{ card: 'detonate', count: 3 }]);
    expect(cloud.paths()).toContain('collection/want');
    expect((await b.anonymous.wants.load()).value.entries).toEqual([]);
    session.dispose();
  });

  it('asks when the cloud has only a want list and the browser has data', async () => {
    const other = browser();
    await other.account.wants.setCount('detonate', 1);
    const first = open(other, cloud);
    await vi.waitFor(() => expect(first.status().sync.lastSyncedAt).not.toBeNull());
    first.dispose();

    const b = browser();
    await b.anonymous.collection.setCount('detonate', 1);
    const session = open(b, cloud);
    await vi.waitFor(() => expect(session.status().phase).toBe('choose'));
    session.dispose();
  });

  it('asks when both sides have data and merges on request', async () => {
    const other = browser();
    await other.account.decks.create({ ...CONTENT, name: 'Tililla' });
    const seed = open(other, cloud);
    await settle();
    seed.dispose();

    const b = browser();
    await b.anonymous.decks.create({ ...CONTENT, name: 'Selaimessa' });
    const session = open(b, cloud);
    await vi.waitFor(() => expect(session.status().phase).toBe('choose'));
    expect((await b.account.decks.list()).value).toEqual([]);

    session.choose('merge');
    await vi.waitFor(() => expect(session.status().sync.lastSyncedAt).not.toBeNull());
    await settle();
    expect((await b.account.decks.list()).value.map((deck) => deck.name).sort()).toEqual(['Selaimessa', 'Tililla']);
    expect((await b.anonymous.decks.list()).value).toEqual([]);
    expect([...cloud.paths()].filter((path) => path.startsWith('decks/'))).toHaveLength(2);
    session.dispose();
  });

  it('uses only the account data on request and leaves the signed-out data alone', async () => {
    const other = browser();
    await other.account.decks.create({ ...CONTENT, name: 'Tililla' });
    const seed = open(other, cloud);
    await settle();
    seed.dispose();

    const b = browser();
    await b.anonymous.decks.create({ ...CONTENT, name: 'Selaimessa' });
    const session = open(b, cloud);
    await vi.waitFor(() => expect(session.status().phase).toBe('choose'));
    session.choose('account-only');
    await vi.waitFor(() => expect(session.status().sync.lastSyncedAt).not.toBeNull());
    await settle();
    expect((await b.account.decks.list()).value.map((deck) => deck.name)).toEqual(['Tililla']);
    expect((await b.anonymous.decks.list()).value.map((deck) => deck.name)).toEqual(['Selaimessa']);
    session.dispose();
  });

  it('does not ask again after the first sync and does not touch the signed-out data on later sign-ins', async () => {
    const b = browser();
    await b.anonymous.decks.create(CONTENT);
    const first = open(b, cloud);
    await vi.waitFor(() => expect(first.status().sync.lastSyncedAt).not.toBeNull());
    await settle();
    first.dispose();

    await b.anonymous.decks.create({ ...CONTENT, name: 'Kirjautumaton' });
    const second = open(b, cloud);
    await vi.waitFor(() => expect(second.status().phase).toBe('running'));
    await settle();
    expect((await b.anonymous.decks.list()).value.map((deck) => deck.name)).toEqual(['Kirjautumaton']);
    second.dispose();
  });
});

describe('deleting the account data', () => {
  it('deletes the cloud data and everything the account has in the browser, but not the signed-out data', async () => {
    const b = browser();
    await b.account.decks.create(CONTENT);
    await b.account.wants.setCount('detonate', 1);
    const session = open(b, cloud);
    await vi.waitFor(() => expect(session.status().sync.lastSyncedAt).not.toBeNull());
    expect(cloud.paths()).toContain('meta');
    expect(cloud.paths()).toContain('collection/want');
    await b.anonymous.decks.create({ ...CONTENT, name: 'Kirjautumaton' });

    expect(await session.deleteAccountData()).toBe(true);
    expect(cloud.paths()).toEqual([]);
    expect((await b.account.decks.list()).value).toEqual([]);
    expect((await b.account.wants.load()).value.entries).toEqual([]);
    expect(b.account.sync.loadBase()).toBeNull();
    expect((await b.anonymous.decks.list()).value.map((deck) => deck.name)).toEqual(['Kirjautumaton']);
    session.dispose();
  });

  it('keeps the browser data and resumes syncing when the cloud data cannot be deleted', async () => {
    const b = browser();
    await b.account.decks.create(CONTENT);
    const session = open(b, cloud);
    await vi.waitFor(() => expect(session.status().sync.lastSyncedAt).not.toBeNull());
    cloud.failNext('offline');
    expect(await session.deleteAccountData()).toBe(false);
    expect((await b.account.decks.list()).value).toHaveLength(1);
    expect(cloud.paths()).toContain('meta');
    session.dispose();
  });

  it('never syncs again after the data was deleted (no re-upload)', async () => {
    const b = browser();
    await b.account.decks.create(CONTENT);
    const session = open(b, cloud);
    await vi.waitFor(() => expect(session.status().sync.lastSyncedAt).not.toBeNull());
    await session.deleteAccountData();
    window.dispatchEvent(new Event('focus'));
    await settle();
    expect(cloud.paths()).toEqual([]);
    session.dispose();
  });
});

describe('account deletion and public decks (T-098, SR-36)', () => {
  const PUBLIC_INPUT = { name: 'Pakka', legends: '', cardCount: 2, deck: 'QQ', nickname: null };

  async function publicSetup() {
    const b = browser();
    const publicDecks: MemoryPublicDecks = createMemoryPublicDecks({ now });
    const deck = await b.account.decks.create(CONTENT);
    await b.account.decks.setPublish(deck.id, { public: true, nickname: 'Nick' });
    await publicDecks.forUser(UID).publish({ ...PUBLIC_INPUT, deckId: deck.id });
    const session = createAccountSession({ uid: UID, ...b, cloud, publicDecks: publicDecks.forUser(UID), now, locks: null });
    session.start();
    await vi.waitFor(() => expect(session.status().sync.lastSyncedAt).not.toBeNull());
    return { b, publicDecks, deck, session };
  }

  it('deletes the public copies before the private cloud data', async () => {
    const { publicDecks, deck, session } = await publicSetup();
    const pubId = await publicDeckId(UID, deck.id);
    expect(publicDecks.docs.has(pubId)).toBe(true);
    // The cloud still has the private data at the moment the public copy is gone.
    const privateAtDeletion: string[] = [];
    const original = cloud.deleteAll;
    cloud.deleteAll = async () => {
      privateAtDeletion.push(publicDecks.docs.has(pubId) ? 'public still there' : 'public gone');
      return original();
    };
    expect(await session.deleteAccountData()).toBe(true);
    expect(privateAtDeletion).toEqual(['public gone']);
    expect(publicDecks.docs.size).toBe(0);
    expect(cloud.paths()).toEqual([]);
    session.dispose();
  });

  it('keeps the private data when a public copy cannot be deleted, and resumes syncing', async () => {
    const { b, publicDecks, deck, session } = await publicSetup();
    publicDecks.failNext('offline');
    expect(await session.deleteAccountData()).toBe(false);
    expect(cloud.paths()).toContain('meta');
    expect((await b.account.decks.list()).value).toHaveLength(1);
    expect(publicDecks.docs.has(await publicDeckId(UID, deck.id))).toBe(true);
    session.dispose();
  });
});
