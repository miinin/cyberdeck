import { createMemoryStore } from './keyValueStore';
import { createRepositories } from './repositories';

function open() {
  const store = createMemoryStore();
  return { store, repos: createRepositories({ store, persistent: false }) };
}

describe('proxy queue repository (T-102)', () => {
  it('saves the queue under its own key and loads it back', async () => {
    const { store, repos } = open();
    await repos.proxy.setCount('detonate', 3);
    expect(store.keys()).toEqual(['cyberdeck:proxy']);
    expect((await repos.proxy.load()).value.entries).toEqual([{ card: 'detonate', count: 3 }]);
    // The collection and the want list are not touched.
    expect((await repos.collection.load()).value.entries).toEqual([]);
    expect((await repos.wants.load()).value.entries).toEqual([]);
  });

  it('rejects an invalid key or count', async () => {
    const { repos } = open();
    await expect(repos.proxy.setCount('Not A Key', 1)).rejects.toThrow();
    await expect(repos.proxy.setCount('detonate', 1000)).rejects.toThrow();
  });

  it('resets corrupt stored data and keeps a backup', async () => {
    const { store, repos } = open();
    store.setItem('cyberdeck:proxy', 'not json');
    const loaded = await repos.proxy.load();
    expect(loaded.value.entries).toEqual([]);
    expect(loaded.notices.some((notice) => notice.kind === 'reset')).toBe(true);
    expect(store.keys().some((key) => key.startsWith('cyberdeck:backup:proxy:'))).toBe(true);
  });

  it("keeps an account's queue under its own namespace and erases it with the account", async () => {
    const { store, repos } = open();
    const account = repos.forAccount('user123');
    await account.proxy.setCount('detonate', 2);
    expect(store.keys()).toEqual(['cyberdeck:u:user123:proxy']);
    expect((await repos.proxy.load()).value.entries).toEqual([]);
    account.sync.eraseAccount();
    expect(store.keys()).toEqual([]);
  });
});
