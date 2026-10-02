/*
 * Public API of the storage layer. The UI imports only from here (ARCHITECTURE.md 4 and 12, SR-12).
 */
import { createMemoryStore, openBrowserStore, subscribeToBrowserStorage } from './keyValueStore';
import { createRepositories } from './repositories';
import type { Repositories } from './types';

export type {
  CollectionRepository,
  DeckRepository,
  Loaded,
  LoadNotice,
  PreferencesRepository,
  Repositories,
  Theme,
} from './types';
export { StorageError } from './errors';
export type { StorageErrorKind } from './errors';
export { isStoragePersisted, requestPersistentStorage } from './keyValueStore';

/** localStorage when it works, otherwise an in-memory store with `persistent: false` (SR-13). */
export function openBrowserRepositories(): Repositories {
  const store = openBrowserStore();
  if (store === null) {
    return createRepositories({ store: createMemoryStore(), persistent: false });
  }
  return createRepositories({ store, persistent: true, subscribe: subscribeToBrowserStorage });
}

/** In-memory repositories for UI tests (T-012, T-013). `initial` holds raw stored strings by key. */
export function createMemoryRepositories(
  options: { initial?: Readonly<Record<string, string>>; now?: () => Date; newId?: () => string } = {},
): Repositories {
  return createRepositories({
    store: createMemoryStore(options.initial),
    persistent: false,
    now: options.now,
    newId: options.newId,
  });
}
