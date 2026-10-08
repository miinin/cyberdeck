/*
 * Public API of the storage layer. The UI imports only from here (ARCHITECTURE.md 4 and 12, SR-12).
 */
import type { Collection } from '../domain/collection';
import { parseCollection } from '../domain/validate';
import type { EnvelopeSpec } from './envelope';
import { COLLECTION_SCHEMA_VERSION, WANTS_SCHEMA_VERSION } from './keys';
import { createMemoryStore, openBrowserStore, subscribeToBrowserStorage } from './keyValueStore';
import { COLLECTION_MIGRATIONS, WANTS_MIGRATIONS } from './migrations';
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
  CatalogViewMode,
  DeckPickView,
  DeckListView,
  DefaultEdition,
  ScanMode,
  CollectionPrefs,
  LocalData,
  SyncBase,
  SyncStorage,
} from './types';
export { DEFAULT_COLLECTION_PREFS } from './types';
export { StorageError } from './errors';
export type { StorageErrorKind } from './errors';
export { isStoragePersisted, requestPersistentStorage } from './keyValueStore';
export { decodeEnvelopeValue } from './envelope';
export { LOCALES, readStoredLocale, saveStoredLocale } from './locale';
export type { Locale } from './locale';
export type { Decoded, EnvelopeSpec, Migration } from './envelope';

/**
 * The collection's envelope schema, shared by localStorage and the cloud copy (D-017 kohta 3): the same
 * version, migrations and validation.
 */
export const COLLECTION_ENVELOPE_SPEC: EnvelopeSpec<Collection> = {
  currentVersion: COLLECTION_SCHEMA_VERSION,
  migrations: COLLECTION_MIGRATIONS,
  parse: parseCollection,
};

/** The want list's envelope schema, shared by localStorage and the cloud copy (D-018): own version and migrations. */
export const WANTS_ENVELOPE_SPEC: EnvelopeSpec<Collection> = {
  currentVersion: WANTS_SCHEMA_VERSION,
  migrations: WANTS_MIGRATIONS,
  parse: parseCollection,
};

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
