import { StorageError } from './errors';
import { createMemoryStore } from './keyValueStore';
import { createRepositories } from './repositories';

const CONTENT = { name: 'Pakka', sections: [{ name: '', cards: [{ card: 'detonate', count: 2 }] }] };

function open() {
  const store = createMemoryStore();
  const repos = createRepositories({ store, persistent: false, now: () => new Date('2026-10-03T10:00:00.000Z') });
  return { store, repos };
}

describe('account repositories (namespace)', () => {
  it('keeps the account data under its own keys and the signed-out data apart', async () => {
    const { store, repos } = open();
    const account = repos.forAccount('user123');
    await account.decks.create(CONTENT);
    await account.collection.setCount('detonate', 2);
    await account.wants.setCount('detonate', 1);
    expect(store.keys().sort()).toEqual([
      'cyberdeck:u:user123:collection',
      'cyberdeck:u:user123:decks',
      'cyberdeck:u:user123:wants',
    ]);
    expect((await repos.decks.list()).value).toEqual([]);

    await repos.decks.create({ ...CONTENT, name: 'Kirjautumaton' });
    expect((await account.decks.list()).value.map((deck) => deck.name)).toEqual(['Pakka']);
    expect(store.getItem('cyberdeck:decks')).not.toBeNull();
  });

  it('keeps one account away from another', async () => {
    const { repos } = open();
    await repos.forAccount('aaa').decks.create(CONTENT);
    expect((await repos.forAccount('bbb').decks.list()).value).toEqual([]);
  });

  it('rejects an invalid uid', () => {
    const { repos } = open();
    expect(() => repos.forAccount('../x')).toThrow(StorageError);
    expect(() => repos.forAccount('a:b')).toThrow(StorageError);
  });

  it('shares the preferences with the signed-out repositories', async () => {
    const { repos } = open();
    await repos.preferences.saveTheme('light');
    expect(await repos.forAccount('user123').preferences.loadTheme()).toBe('light');
  });
});

describe('sync storage', () => {
  it('apply replaces the data only if it is still what the caller read', async () => {
    const { repos } = open();
    const sync = repos.forAccount('user123').sync;
    const empty = { decks: [], collection: { entries: [] }, wants: { entries: [] }, games: { games: [] } };
    expect(sync.read()).toEqual(empty);
    const account = repos.forAccount('user123');
    await account.decks.create(CONTENT);

    expect(sync.apply(empty, { decks: [], collection: { entries: [{ card: 'detonate', count: 1 }] }, wants: { entries: [] }, games: { games: [] } })).toBe(false);
    expect((await account.collection.load()).value.entries).toEqual([]);

    const current = sync.read() ?? empty;
    expect(sync.apply(current, { decks: [], collection: { entries: [{ card: 'detonate', count: 1 }] }, wants: { entries: [] }, games: { games: [] } })).toBe(true);
    expect((await account.decks.list()).value).toEqual([]);
    expect((await account.collection.load()).value.entries).toEqual([{ card: 'detonate', count: 1 }]);
  });

  it('apply notifies the UI listeners of this tab', async () => {
    const { repos } = open();
    const account = repos.forAccount('user123');
    const listener = vi.fn();
    account.decks.subscribe(listener);
    account.sync.apply({ decks: [], collection: { entries: [] }, wants: { entries: [] }, games: { games: [] } }, { decks: [], collection: { entries: [{ card: 'detonate', count: 1 }] }, wants: { entries: [] }, games: { games: [] } });
    expect(listener).toHaveBeenCalled();
  });

  it('onChange hears every local write in this tab', async () => {
    const { repos } = open();
    const account = repos.forAccount('user123');
    const listener = vi.fn();
    const unsubscribe = account.sync.onChange(listener);
    await account.collection.setCount('detonate', 1);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    await account.collection.setCount('detonate', 2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('read is null for unreadable data and never overwrites it', async () => {
    const { store, repos } = open();
    store.setItem('cyberdeck:u:user123:decks', '{broken');
    const sync = repos.forAccount('user123').sync;
    expect(sync.read()).toBeNull();
    expect(store.getItem('cyberdeck:u:user123:decks')).toBe('{broken');
  });

  it('reads a base saved before the want list existed as an empty want list', () => {
    const { store, repos } = open();
    const sync = repos.forAccount('user123').sync;
    store.setItem('cyberdeck:u:user123:sync-base', '{"v":1,"rev":2,"decks":[],"collection":{"entries":[]}}');
    expect(sync.loadBase()).toEqual({ rev: 2, decks: [], collection: { entries: [] }, wants: { entries: [] }, games: { games: [] } });
    store.setItem('cyberdeck:u:user123:sync-base', '{"v":1,"rev":2,"decks":[],"collection":{"entries":[]},"wants":"x"}');
    expect(sync.loadBase()).toBeNull();
  });

  it('converts a v1 base to Beta like the collection, leaves a v2 base and the wants alone (D-022)', () => {
    const { store, repos } = open();
    const sync = repos.forAccount('user123').sync;
    const entries = [{ card: 'detonate', count: 2 }];
    const baseKey = 'cyberdeck:u:user123:sync-base';
    store.setItem(baseKey, JSON.stringify({ v: 1, rev: 2, decks: [], collection: { entries }, wants: { entries }, games: { games: [] } }));
    expect(sync.loadBase()).toEqual({
      rev: 2,
      decks: [],
      collection: { entries: [{ card: 'detonate', count: 2, versions: { 'welcometonightcitybeta:031': 2 } }] },
      wants: { entries },
      games: { games: [] },
    });
    store.setItem(baseKey, JSON.stringify({ v: 2, rev: 2, decks: [], collection: { entries }, wants: { entries }, games: { games: [] } }));
    expect(sync.loadBase()).toMatchObject({ collection: { entries } });
    sync.saveBase({ rev: 3, decks: [], collection: { entries }, wants: { entries }, games: { games: [] } });
    expect(JSON.parse(store.getItem(baseKey) ?? '')).toMatchObject({ v: 2 });
    expect(sync.loadBase()).toMatchObject({ rev: 3, collection: { entries } });
  });

  it('reads nothing for sync when the stored want list is unreadable or newer', () => {
    const { store, repos } = open();
    const sync = repos.forAccount('user123').sync;
    store.setItem('cyberdeck:u:user123:wants', '{broken');
    expect(sync.read()).toBeNull();
    store.setItem('cyberdeck:u:user123:wants', JSON.stringify({ schemaVersion: 9, savedAt: '', data: {} }));
    expect(sync.read()).toBeNull();
  });

  it('apply replaces the want list with the rest and sees a change of it as a change', async () => {
    const { repos } = open();
    const account = repos.forAccount('user123');
    const before = account.sync.read();
    if (before === null) throw new Error('test setup');
    await account.wants.setCount('detonate', 2);
    expect(account.sync.apply(before, before)).toBe(false);
    const current = account.sync.read();
    if (current === null) throw new Error('test setup');
    expect(account.sync.apply(current, { ...current, wants: { entries: [{ card: 'detonate', count: 7 }] } })).toBe(true);
    expect((await account.wants.load()).value.entries).toEqual([{ card: 'detonate', count: 7 }]);
  });

  it('stores the base and treats a damaged base as none', () => {
    const { store, repos } = open();
    const sync = repos.forAccount('user123').sync;
    expect(sync.loadBase()).toBeNull();
    const base = { rev: 3, decks: [{ id: 'abc', updatedAt: '2026-10-03T10:00:00.000Z' }], collection: { entries: [] }, wants: { entries: [] }, games: { games: [] } };
    sync.saveBase(base);
    expect(sync.loadBase()).toEqual(base);
    store.setItem('cyberdeck:u:user123:sync-base', '{"v":1,"rev":"x"}');
    expect(sync.loadBase()).toBeNull();
    sync.saveBase(null);
    expect(store.getItem('cyberdeck:u:user123:sync-base')).toBeNull();
  });

  it('backupAll copies the raw data to backup keys and clear removes only the data keys', async () => {
    const { store, repos } = open();
    await repos.decks.create(CONTENT);
    await repos.collection.setCount('detonate', 1);
    await repos.wants.setCount('detonate', 1);
    repos.sync.backupAll();
    const keys = store.keys();
    expect(keys.filter((key) => key.startsWith('cyberdeck:backup:decks:'))).toHaveLength(1);
    expect(keys.filter((key) => key.startsWith('cyberdeck:backup:collection:'))).toHaveLength(1);
    expect(keys.filter((key) => key.startsWith('cyberdeck:backup:wants:'))).toHaveLength(1);
    repos.sync.clear();
    expect(store.getItem('cyberdeck:decks')).toBeNull();
    expect(store.getItem('cyberdeck:collection')).toBeNull();
    expect(store.getItem('cyberdeck:wants')).toBeNull();
    expect(store.keys().filter((key) => key.startsWith('cyberdeck:backup:'))).toHaveLength(3);
  });
});

describe('erasing the account data', () => {
  it('removes every key of the account, including backups and the base, and nothing else', async () => {
    const { store, repos } = open();
    const account = repos.forAccount('user123');
    await account.decks.create(CONTENT);
    await account.collection.setCount('detonate', 1);
    await account.wants.setCount('detonate', 1);
    account.sync.backupAll();
    account.sync.saveBase({ rev: 1, decks: [], collection: { entries: [] }, wants: { entries: [] }, games: { games: [] } });
    await repos.forAccount('other456').decks.create(CONTENT);
    await repos.decks.create(CONTENT);
    await repos.preferences.saveTheme('light');

    account.sync.eraseAccount();
    expect(store.keys().filter((key) => key.startsWith('cyberdeck:u:user123:'))).toEqual([]);
    expect(store.getItem('cyberdeck:u:other456:decks')).not.toBeNull();
    expect(store.getItem('cyberdeck:decks')).not.toBeNull();
    expect(store.getItem('cyberdeck:theme')).toBe('light');
  });

  it('never erases the signed-out data', async () => {
    const { store, repos } = open();
    await repos.decks.create(CONTENT);
    repos.sync.eraseAccount();
    expect(store.getItem('cyberdeck:decks')).not.toBeNull();
  });
});

describe('deck update conflict (T-042)', () => {
  it('rejects an update when the stored updatedAt differs and writes nothing', async () => {
    const { repos } = open();
    const deck = await repos.decks.create(CONTENT);
    await expect(repos.decks.update(deck.id, CONTENT, { expectedUpdatedAt: '2000-01-01T00:00:00.000Z' })).rejects.toMatchObject({
      kind: 'conflict',
    });
    expect((await repos.decks.get(deck.id))?.name).toBe('Pakka');
  });

  it('updates when the expected updatedAt matches or is not given', async () => {
    const { repos } = open();
    const deck = await repos.decks.create(CONTENT);
    const saved = await repos.decks.update(deck.id, { ...CONTENT, name: 'Uusi' }, { expectedUpdatedAt: deck.updatedAt });
    expect(saved.name).toBe('Uusi');
    await expect(repos.decks.update(deck.id, { ...CONTENT, name: 'Vielä uudempi' })).resolves.toMatchObject({ name: 'Vielä uudempi' });
  });
});
