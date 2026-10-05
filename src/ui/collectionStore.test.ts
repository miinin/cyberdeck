import { toCountMap } from '../domain/collection';
import type { Collection } from '../domain/collection';
import { StorageError, createMemoryRepositories } from '../storage';
import type { CollectionRepository, Loaded } from '../storage';
import { countIn, createCollectionStore } from './collectionStore';
import type { CollectionEvent, CollectionStore } from './collectionStore';

const COLLECTION_KEY = 'cyberdeck:collection';

function stored(entries: { card: string; count: number }[], schemaVersion = 1): string {
  return JSON.stringify({ schemaVersion, savedAt: '2026-10-01T10:00:00.000Z', data: { entries } });
}

interface PendingSave {
  card: string;
  count: number;
  /** Saves through the real in-memory repository and resolves with its answer. */
  finish: () => Promise<void>;
  fail: (error: unknown) => Promise<void>;
}

/**
 * Wraps an in-memory repository so each setCount waits until the test finishes or fails it.
 * `trigger` simulates a change in another tab.
 */
function controlledRepository(initial?: Record<string, string>) {
  const base = createMemoryRepositories({ initial }).collection;
  const pending: PendingSave[] = [];
  const listeners = new Set<() => void>();
  const repository: CollectionRepository = {
    load: () => base.load(),
    setVersionCount: (card, printing, count) => base.setVersionCount(card, printing, count),
    setCount: (card, count) =>
      new Promise<Collection>((resolve, reject) => {
        pending.push({
          card,
          count,
          finish: async () => {
            await base.setCount(card, count).then(resolve, reject);
            await flush();
          },
          fail: async (error) => {
            reject(error);
            await flush();
          },
        });
      }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return { repository, base, pending, trigger: () => listeners.forEach((listener) => listener()) };
}

/** Lets promise callbacks run. */
async function flush() {
  for (let round = 0; round < 5; round += 1) await Promise.resolve();
}

async function started(repository: CollectionRepository) {
  const store = createCollectionStore(repository);
  const events: CollectionEvent[] = [];
  store.onEvent((event) => events.push(event));
  store.start();
  await flush();
  return { store, events };
}

const counts = (store: CollectionStore) => Object.fromEntries(toCountMap(store.getSnapshot().saved));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createCollectionStore: loading', () => {
  it('starts in loading and becomes ready with the saved collection', async () => {
    const { collection } = createMemoryRepositories({
      initial: { [COLLECTION_KEY]: stored([{ card: 'v-streetkid', count: 2 }]) },
    });
    const store = createCollectionStore(collection);
    expect(store.getSnapshot().phase).toBe('loading');
    store.start();
    await flush();
    const snapshot = store.getSnapshot();
    expect(snapshot.phase).toBe('ready');
    expect(countIn(snapshot, 'v-streetkid')).toBe(2);
    expect(snapshot.loadCount).toBe(1);
    expect(snapshot.notices).toEqual([]);
  });

  it('is locked and empty when the stored data is from a newer version', async () => {
    const { collection } = createMemoryRepositories({
      initial: { [COLLECTION_KEY]: stored([{ card: 'v-streetkid', count: 2 }], 99) },
    });
    const { store } = await started(collection);
    expect(store.getSnapshot().phase).toBe('locked');
    expect(countIn(store.getSnapshot(), 'v-streetkid')).toBe(0);
    expect(store.getSnapshot().notices.map((notice) => notice.kind)).toEqual(['newer-version']);
    store.setCount('v-streetkid', 3);
    expect(countIn(store.getSnapshot(), 'v-streetkid')).toBe(0);
  });

  it('shows reset and repaired notices but never migrated, and remembers dismissed ones over a reload', async () => {
    const notices: Loaded<Collection>['notices'] = [
      { kind: 'migrated', from: 1, to: 2 },
      { kind: 'reset', backupKey: 'cyberdeck:backup:collection:x' },
      { kind: 'repaired', dropped: 2 },
    ];
    const repository: CollectionRepository = {
      load: async () => ({ value: { entries: [] }, notices }),
      setCount: async () => ({ entries: [] }),
      setVersionCount: async () => ({ entries: [] }),
      subscribe: () => () => {},
    };
    const { store } = await started(repository);
    expect(store.getSnapshot().notices.map((notice) => notice.kind)).toEqual(['reset', 'repaired']);

    store.dismissNotice('reset');
    expect(store.getSnapshot().notices.map((notice) => notice.kind)).toEqual(['repaired']);
    store.reload();
    await flush();
    expect(store.getSnapshot().notices.map((notice) => notice.kind)).toEqual(['repaired']);
  });

  it('is unavailable when load fails, and reload can recover', async () => {
    const load = vi
      .fn<CollectionRepository['load']>()
      .mockRejectedValueOnce(new StorageError('unavailable', 'blocked'))
      .mockResolvedValueOnce({ value: { entries: [{ card: 'v-streetkid', count: 1 }] }, notices: [] });
    const { store } = await started({ load, setCount: vi.fn(), setVersionCount: vi.fn(), subscribe: () => () => {} });
    expect(store.getSnapshot().phase).toBe('unavailable');
    expect(console.error).toHaveBeenCalledTimes(1);

    store.reload();
    expect(store.getSnapshot().phase).toBe('loading');
    await flush();
    expect(store.getSnapshot().phase).toBe('ready');
    expect(store.getSnapshot().loadCount).toBe(2);
  });

  it('ignores the answer of a load started before dispose (StrictMode runs start twice)', async () => {
    let resolveFirst: (value: Loaded<Collection>) => void = () => {};
    const load = vi
      .fn<CollectionRepository['load']>()
      .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce({ value: { entries: [{ card: 'b', count: 2 }] }, notices: [] });
    const store = createCollectionStore({ load, setCount: vi.fn(), setVersionCount: vi.fn(), subscribe: () => () => {} });
    store.start();
    store.dispose();
    store.start();
    await flush();
    resolveFirst({ value: { entries: [{ card: 'a', count: 1 }] }, notices: [] });
    await flush();
    expect(counts(store)).toEqual({ b: 2 });
    expect(store.getSnapshot().loadCount).toBe(1);
  });
});

describe('createCollectionStore: saving', () => {
  it('saves a count, keeps it after a reload and reports from and to', async () => {
    const repositories = createMemoryRepositories();
    const { store, events } = await started(repositories.collection);

    store.setCount('v-streetkid', 1);
    expect(countIn(store.getSnapshot(), 'v-streetkid')).toBe(1);
    await flush();
    expect(store.getSnapshot().targets.size).toBe(0);
    expect(counts(store)).toEqual({ 'v-streetkid': 1 });
    expect(events).toEqual([{ type: 'saved', card: 'v-streetkid', from: 0, to: 1 }, { type: 'idle' }]);

    const reloaded = (await repositories.collection.load()).value;
    expect(toCountMap(reloaded).get('v-streetkid')).toBe(1);
  });

  it('count 0 removes the card from the collection', async () => {
    const { collection } = createMemoryRepositories({
      initial: { [COLLECTION_KEY]: stored([{ card: 'v-streetkid', count: 1 }]) },
    });
    const { store, events } = await started(collection);
    store.setCount('v-streetkid', 0);
    await flush();
    expect(store.getSnapshot().saved.entries).toEqual([]);
    expect(events[0]).toEqual({ type: 'saved', card: 'v-streetkid', from: 1, to: 0 });
  });

  it('fast presses: shows the newest target, saves one at a time and skips values in between', async () => {
    const { repository, pending } = controlledRepository();
    const { store, events } = await started(repository);

    store.setCount('v-streetkid', 1);
    store.setCount('v-streetkid', 2);
    store.setCount('v-streetkid', 3);
    store.setCount('v-streetkid', 4);
    expect(countIn(store.getSnapshot(), 'v-streetkid')).toBe(4);
    expect(pending.map((save) => save.count)).toEqual([1]); // one save at a time
    expect(store.isSaving()).toBe(true);

    await pending[0]?.finish();
    // The older answer (1) does not overwrite the newer target on screen.
    expect(countIn(store.getSnapshot(), 'v-streetkid')).toBe(4);
    expect(pending.map((save) => save.count)).toEqual([1, 4]); // 2 and 3 are never saved

    await pending[1]?.finish();
    expect(countIn(store.getSnapshot(), 'v-streetkid')).toBe(4);
    expect(store.getSnapshot().targets.size).toBe(0);
    expect(store.isSaving()).toBe(false);
    expect(events).toEqual([
      { type: 'saved', card: 'v-streetkid', from: 0, to: 1 },
      { type: 'saved', card: 'v-streetkid', from: 1, to: 4 },
      { type: 'idle' },
    ]);
  });

  it('saves waiting targets of different cards in turn', async () => {
    const { repository, pending } = controlledRepository();
    const { store } = await started(repository);
    store.setCount('a', 1);
    store.setCount('b', 2);
    expect(pending.map((save) => save.card)).toEqual(['a']);
    await pending[0]?.finish();
    expect(pending.map((save) => save.card)).toEqual(['a', 'b']);
    await pending[1]?.finish();
    expect(counts(store)).toEqual({ a: 1, b: 2 });
  });

  it.each(['quota', 'unavailable', 'limit-reached', 'invalid-input'] as const)(
    'a failed save (%s) returns every count to the last saved value and drops waiting targets',
    async (kind) => {
      const { repository, pending } = controlledRepository({
        [COLLECTION_KEY]: stored([{ card: 'a', count: 2 }]),
      });
      const { store, events } = await started(repository);

      store.setCount('a', 3);
      store.setCount('a', 4);
      store.setCount('b', 1);
      await pending[0]?.fail(new StorageError(kind, 'technical detail'));

      const snapshot = store.getSnapshot();
      expect(countIn(snapshot, 'a')).toBe(2);
      expect(countIn(snapshot, 'b')).toBe(0);
      expect(snapshot.targets.size).toBe(0);
      expect(snapshot.saveError).toBe(kind);
      expect(pending).toHaveLength(1); // waiting targets were not saved
      expect(store.isSaving()).toBe(false);
      expect(events).toEqual([{ type: 'save-failed', kind }]);
    },
  );

  it('falls back to the value saved during the same burst when a later save fails', async () => {
    const { repository, pending } = controlledRepository();
    const { store } = await started(repository);
    store.setCount('a', 1);
    store.setCount('a', 2);
    await pending[0]?.finish();
    await pending[1]?.fail(new StorageError('quota', 'full'));
    expect(countIn(store.getSnapshot(), 'a')).toBe(1);
  });

  it('a successful save clears the save error; dismissing clears it too', async () => {
    const { repository, pending } = controlledRepository();
    const { store } = await started(repository);
    store.setCount('a', 1);
    await pending[0]?.fail(new StorageError('unavailable', 'x'));
    expect(store.getSnapshot().saveError).toBe('unavailable');
    store.setCount('a', 1);
    await pending[1]?.finish();
    expect(store.getSnapshot().saveError).toBeNull();

    store.setCount('a', 2);
    await pending[2]?.fail(new Error('not a storage error'));
    expect(store.getSnapshot().saveError).toBe('unknown');
    store.dismissSaveError();
    expect(store.getSnapshot().saveError).toBeNull();
  });

  it('newer-version on save locks the collection and shows it empty', async () => {
    const { repository, pending } = controlledRepository({
      [COLLECTION_KEY]: stored([{ card: 'a', count: 2 }]),
    });
    const { store, events } = await started(repository);
    store.setCount('a', 3);
    await pending[0]?.fail(new StorageError('newer-version', 'newer'));
    const snapshot = store.getSnapshot();
    expect(snapshot.phase).toBe('locked');
    expect(countIn(snapshot, 'a')).toBe(0);
    expect(snapshot.notices.map((notice) => notice.kind)).toEqual(['newer-version']);
    expect(snapshot.saveError).toBeNull();
    expect(events).toEqual([{ type: 'save-failed', kind: 'newer-version' }]);
  });

  it('after a reset notice, a save whose backup fails is a save error and the count stays (A4)', async () => {
    // With backupKey null the raw value stays and every write backs it up first; here that backup fails.
    const repositories = createMemoryRepositories({ initial: { [COLLECTION_KEY]: 'not json' } });
    const failing: CollectionRepository = {
      ...repositories.collection,
      setCount: async () => {
        throw new StorageError('quota', 'Storage backup failed');
      },
    };
    const { store } = await started(failing);
    expect(store.getSnapshot().notices[0]?.kind).toBe('reset');
    store.setCount('a', 1);
    await flush();
    expect(store.getSnapshot().saveError).toBe('quota');
    expect(countIn(store.getSnapshot(), 'a')).toBe(0);
  });
});

describe('createCollectionStore: other tabs', () => {
  it('reloads quietly when another tab changes the data', async () => {
    const { repository, base, trigger } = controlledRepository();
    const { store, events } = await started(repository);
    await base.setCount('a', 5); // the other tab writes to the same store
    trigger();
    await flush();
    expect(counts(store)).toEqual({ a: 5 });
    expect(events).toEqual([{ type: 'external' }]);
  });

  it('waits for its own saves before reloading', async () => {
    const { repository, base, pending, trigger } = controlledRepository();
    const { store, events } = await started(repository);
    store.setCount('a', 1);
    await base.setCount('b', 3);
    trigger();
    await flush();
    expect(events).toEqual([]); // not reloaded while saving
    expect(countIn(store.getSnapshot(), 'b')).toBe(0);

    await pending[0]?.finish();
    await flush();
    expect(counts(store)).toEqual({ a: 1, b: 3 });
    expect(events.map((event) => event.type)).toEqual(['saved', 'idle', 'external']);
  });

  it('locks when another tab saved a newer version', async () => {
    const { repository, base, trigger } = controlledRepository();
    const { store } = await started(repository);
    vi.spyOn(base, 'load').mockResolvedValue({
      value: { entries: [] },
      notices: [{ kind: 'newer-version', version: 2 }],
    });
    trigger();
    await flush();
    expect(store.getSnapshot().phase).toBe('locked');
  });

  it('stops listening after dispose', async () => {
    const { repository, base, trigger } = controlledRepository();
    const { store, events } = await started(repository);
    store.dispose();
    await base.setCount('a', 1);
    trigger();
    await flush();
    expect(events).toEqual([]);
    expect(counts(store)).toEqual({});
  });
});
