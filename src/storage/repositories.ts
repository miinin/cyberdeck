/*
 * Collection and deck repositories on top of a KeyValueStore (ARCHITECTURE.md 12.7).
 * Every write reads fresh state, validates, changes it with pure functions and saves it with
 * one setItem, all in one synchronous block (SR-13). Unreadable or older data is copied to a
 * backup key before anything overwrites it (SR-11).
 */
import { isCardKey } from '../domain/cardKey';
import type { CardKey } from '../domain/cardKey';
import { countOf, EMPTY_COLLECTION, MAX_COLLECTION_COUNT, MAX_COLLECTION_ENTRIES, withCount } from '../domain/collection';
import type { Collection } from '../domain/collection';
import { MAX_DECKS } from '../domain/deck';
import type { Deck, DeckContent, DeckId } from '../domain/deck';
import { isUid } from '../domain/uid';
import { isDeckId, parseCollection, parseDeckContent, parseDeckList } from '../domain/validate';
import type { Parsed } from '../domain/validate';
import { decodeEnvelope, encodeEnvelope } from './envelope';
import type { EnvelopeSpec, Migration } from './envelope';
import { StorageError, toStorageError } from './errors';
import {
  accountKeyPrefix,
  BACKUP_PREFIX,
  COLLECTION_KEY,
  COLLECTION_SCHEMA_VERSION,
  DECKS_KEY,
  DECKS_SCHEMA_VERSION,
  MAX_BACKUPS_PER_AGGREGATE,
  THEME_KEY,
  VIEW_KEY,
  EDIT_MODE_KEY,
  DECK_PICK_VIEW_KEY,
  ACCOUNT_LAST_UID_KEY,
  ACCOUNT_REDIRECT_PENDING_KEY,
} from './keys';
import type { KeyValueStore } from './keyValueStore';
import { COLLECTION_MIGRATIONS, DECKS_MIGRATIONS } from './migrations';
import type {
  CollectionRepository,
  DeckRepository,
  Loaded,
  LoadNotice,
  LocalData,
  SyncBase,
  SyncStorage,
  PreferencesRepository,
  Repositories,
  Theme,
  CatalogViewMode,
  DeckPickView,
} from './types';

export interface RepositoryOptions {
  store: KeyValueStore;
  persistent: boolean;
  /** Default () => new Date(). */
  now?: () => Date;
  /** Default () => crypto.randomUUID(). */
  newId?: () => string;
  /** Default: no change events. */
  subscribe?: (keys: readonly string[], listener: () => void) => () => void;
  /**
   * Account uid (T-054c, D-017 kohta 4): collection, decks, backups and the sync base live under
   * `cyberdeck:u:{uid}:`. Without it the keys are the signed-out ones. Preferences are never namespaced.
   */
  namespace?: string;
  /** Tests only; default []. */
  migrations?: { collection?: readonly Migration[]; decks?: readonly Migration[] };
}

/** One stored entity: its key, schema and how its value is wrapped in the envelope's data. */
interface Aggregate<T> {
  name: 'collection' | 'decks';
  key: string;
  spec: EnvelopeSpec<T>;
  empty: T;
  toData: (value: T) => unknown;
}

type AggregateId = Pick<Aggregate<unknown>, 'name' | 'key'>;

interface Change<T, R> {
  next: T;
  result: R;
}

/**
 * Test migrations replace the real chain, and the version they lead to becomes the current
 * version (migrations[i] goes from i + 1 to i + 2). Without them the production chain from
 * migrations.ts and the version from keys.ts are used.
 */
function specWith<T>(
  version: number,
  migrations: readonly Migration[],
  testMigrations: readonly Migration[] | undefined,
  parse: (data: unknown) => Parsed<T> | null,
): EnvelopeSpec<T> {
  if (testMigrations === undefined) return { currentVersion: version, migrations, parse };
  return { currentVersion: testMigrations.length + 1, migrations: testMigrations, parse };
}

/** Reads the stored sync base. Anything unexpected is no base: the next sync then merges both sides. */
function parseSyncBase(raw: string | null): SyncBase | null {
  if (raw === null) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null || !('v' in data) || data.v !== 1) return null;
    const { rev, decks, collection } = data as Record<string, unknown>;
    if (typeof rev !== 'number' || !Number.isSafeInteger(rev) || rev < 0 || !Array.isArray(decks)) return null;
    const parsedCollection = parseCollection(collection);
    if (parsedCollection === null || parsedCollection.dropped > 0) return null;
    const rows: { id: DeckId; updatedAt: string }[] = [];
    for (const row of decks as unknown[]) {
      if (typeof row !== 'object' || row === null) return null;
      const { id, updatedAt } = row as Record<string, unknown>;
      if (!isDeckId(id) || typeof updatedAt !== 'string') return null;
      rows.push({ id, updatedAt });
    }
    return { rev, decks: rows, collection: parsedCollection.value };
  } catch {
    return null;
  }
}

export function createRepositories(options: RepositoryOptions): Repositories {
  const { store } = options;
  const now = options.now ?? (() => new Date());
  const newId = options.newId ?? (() => crypto.randomUUID());
  const subscribeTo = options.subscribe;
  if (options.namespace !== undefined && !isUid(options.namespace)) throw new StorageError('invalid-input', 'Invalid uid');
  const prefix = options.namespace === undefined ? null : accountKeyPrefix(options.namespace);
  const collectionKey = prefix === null ? COLLECTION_KEY : `${prefix}collection`;
  const decksKey = prefix === null ? DECKS_KEY : `${prefix}decks`;
  const backupPrefix = prefix === null ? BACKUP_PREFIX : `${prefix}backup:`;
  const syncBaseKey = `${prefix ?? 'cyberdeck:'}sync-base`;
  /** Same-tab listeners: `ui` hear sync-driven writes, `changes` hear every write (the sync engine). */
  const uiListeners = new Set<() => void>();
  const changeListeners = new Set<() => void>();
  const callAll = (listeners: Set<() => void>) => {
    for (const listener of [...listeners]) listener();
  };

  const collectionAggregate: Aggregate<Collection> = {
    name: 'collection',
    key: collectionKey,
    spec: specWith(COLLECTION_SCHEMA_VERSION, COLLECTION_MIGRATIONS, options.migrations?.collection, parseCollection),
    empty: EMPTY_COLLECTION,
    toData: (collection) => ({ entries: collection.entries }),
  };

  const decksAggregate: Aggregate<Deck[]> = {
    name: 'decks',
    key: decksKey,
    spec: specWith(DECKS_SCHEMA_VERSION, DECKS_MIGRATIONS, options.migrations?.decks, parseDeckList),
    empty: [],
    toData: (decks) => ({ decks }),
  };

  function readRaw(key: string): string | null {
    try {
      return store.getItem(key);
    } catch (error) {
      throw toStorageError(error, 'read');
    }
  }

  /** Copies `raw` to a new backup key and prunes the oldest backups of the same entity. Throws StorageError. */
  function backup(aggregate: AggregateId, raw: string, at: Date): string {
    const prefix = `${backupPrefix}${aggregate.name}:`;
    try {
      const base = `${prefix}${at.toISOString()}`;
      let backupKey = base;
      for (let suffix = 1; store.getItem(backupKey) !== null; suffix += 1) {
        backupKey = `${base}:${suffix}`;
      }
      store.setItem(backupKey, raw);
      pruneBackups(prefix, backupKey);
      return backupKey;
    } catch (error) {
      throw toStorageError(error, 'backup');
    }
  }

  /** Removes the oldest backups over the limit. Touches only backup keys and never the one just written. */
  function pruneBackups(prefix: string, keep: string) {
    try {
      const backups = store
        .keys()
        .filter((key) => key.startsWith(prefix) && key !== keep)
        .sort();
      const excess = backups.length - (MAX_BACKUPS_PER_AGGREGATE - 1);
      for (const key of backups.slice(0, Math.max(0, excess))) {
        store.removeItem(key);
      }
    } catch {
      // The backup itself is saved; failing to prune old ones loses nothing.
    }
  }

  function load<T>(aggregate: Aggregate<T>): Loaded<T> {
    const raw = readRaw(aggregate.key);
    const decoded = decodeEnvelope(raw, aggregate.spec);
    const notices: LoadNotice[] = [];

    switch (decoded.kind) {
      case 'empty':
        return { value: aggregate.empty, notices };
      case 'newer':
        notices.push({ kind: 'newer-version', version: decoded.version });
        return { value: aggregate.empty, notices };
      case 'corrupt':
        notices.push({ kind: 'reset', backupKey: resetCorrupt(aggregate, raw) });
        return { value: aggregate.empty, notices };
      case 'ok':
        if (decoded.dropped > 0) {
          // Only the count, never the data (SR-11).
          console.warn(`Stored ${aggregate.name}: ${decoded.dropped} invalid item(s) skipped`);
          notices.push({ kind: 'repaired', dropped: decoded.dropped });
        }
        if (decoded.fromVersion < aggregate.spec.currentVersion) {
          notices.push({ kind: 'migrated', from: decoded.fromVersion, to: aggregate.spec.currentVersion });
        }
        return { value: decoded.value, notices };
    }
  }

  /** Backs up unreadable data and clears the live key. Returns the backup key, or null when backup failed. */
  function resetCorrupt(aggregate: AggregateId, raw: string | null): string | null {
    console.warn(`Stored ${aggregate.name} is unreadable; starting from empty`);
    if (raw === null) return null;
    let backupKey: string;
    try {
      backupKey = backup(aggregate, raw, now());
    } catch {
      return null; // The live value stays; writes keep failing until the backup succeeds.
    }
    try {
      store.removeItem(aggregate.key);
    } catch {
      // The backup exists; the next write backs up again and then overwrites.
    }
    return backupKey;
  }

  /**
   * Reads fresh state, applies `change` and saves the result with one setItem. Data that is
   * unreadable, older or partly invalid is backed up first. No await between read and write.
   */
  function mutate<T, R>(aggregate: Aggregate<T>, change: (current: T, at: Date) => Change<T, R>): R {
    const at = now(); // one timestamp per change: savedAt, updatedAt and the backup key agree
    const raw = readRaw(aggregate.key);
    const decoded = decodeEnvelope(raw, aggregate.spec);
    if (decoded.kind === 'newer') {
      throw new StorageError('newer-version', `Stored ${aggregate.name} has a newer schema version`);
    }
    const current = decoded.kind === 'ok' ? decoded.value : aggregate.empty;
    const { next, result } = change(current, at);
    if (next === current) return result;

    const needsBackup =
      decoded.kind === 'corrupt' ||
      (decoded.kind === 'ok' && (decoded.fromVersion < aggregate.spec.currentVersion || decoded.dropped > 0));
    if (needsBackup && raw !== null) backup(aggregate, raw, at);

    try {
      store.setItem(aggregate.key, encodeEnvelope(aggregate.toData(next), aggregate.spec.currentVersion, at));
    } catch (error) {
      throw toStorageError(error, 'write');
    }
    callAll(changeListeners);
    return result;
  }

  function subscribe(key: string, listener: () => void): () => void {
    uiListeners.add(listener);
    const unsubscribe = subscribeTo ? subscribeTo([key], listener) : () => {};
    return () => {
      uiListeners.delete(listener);
      unsubscribe();
    };
  }

  /** Validates deck content from the caller. Anything the validator would drop is an error, not a silent fix. */
  function validContent(content: DeckContent): DeckContent {
    const parsed = parseDeckContent(content);
    if (parsed === null || parsed.dropped > 0) {
      throw new StorageError('invalid-input', 'Deck content is not valid');
    }
    return parsed.value;
  }

  const collection: CollectionRepository = {
    load: async () => load(collectionAggregate),
    setCount: async (card: CardKey, count: number) => {
      if (!isCardKey(card) || !Number.isInteger(count) || count < 0 || count > MAX_COLLECTION_COUNT) {
        throw new StorageError('invalid-input', 'Invalid card key or count');
      }
      return mutate(collectionAggregate, (current) => {
        if (count > 0 && countOf(current, card) === 0 && current.entries.length >= MAX_COLLECTION_ENTRIES) {
          throw new StorageError('limit-reached', 'Collection is full');
        }
        const next = withCount(current, card, count);
        return { next, result: next };
      });
    },
    subscribe: (listener) => subscribe(collectionKey, listener),
  };

  const decks: DeckRepository = {
    list: async () => load(decksAggregate),
    get: async (id: DeckId) => {
      if (!isDeckId(id)) return null;
      return load(decksAggregate).value.find((deck) => deck.id === id) ?? null;
    },
    create: async (content: DeckContent) => {
      const { name, sections } = validContent(content);
      return mutate(decksAggregate, (current, at) => {
        if (current.length >= MAX_DECKS) throw new StorageError('limit-reached', 'Too many decks');
        const id = newId();
        if (!isDeckId(id) || current.some((deck) => deck.id === id)) {
          throw new StorageError('unavailable', 'Could not create a unique deck id');
        }
        const timestamp = at.toISOString();
        const deck: Deck = { id, name, sections, createdAt: timestamp, updatedAt: timestamp };
        return { next: [...current, deck], result: deck };
      });
    },
    update: async (id: DeckId, content: DeckContent) => {
      const { name, sections } = validContent(content);
      return mutate(decksAggregate, (current, at) => {
        const index = isDeckId(id) ? current.findIndex((deck) => deck.id === id) : -1;
        const existing = current[index];
        if (existing === undefined) throw new StorageError('not-found', 'Deck not found');
        const deck: Deck = { id, name, sections, createdAt: existing.createdAt, updatedAt: at.toISOString() };
        return { next: current.map((item, itemIndex) => (itemIndex === index ? deck : item)), result: deck };
      });
    },
    remove: async (id: DeckId) => {
      mutate(decksAggregate, (current) => {
        const next = current.filter((deck) => deck.id !== id);
        return { next: next.length === current.length ? current : next, result: undefined };
      });
    },
    subscribe: (listener) => subscribe(decksKey, listener),
  };

  function readHint(key: string): string | null {
    try {
      return store.getItem(key);
    } catch {
      return null;
    }
  }

  function writeHint(key: string, value: string | null) {
    try {
      if (value === null) store.removeItem(key);
      else store.setItem(key, value);
    } catch {
      // Ignored on purpose (see the account hints below).
    }
  }

  const preferences: PreferencesRepository = {
    loadTheme: async () => {
      try {
        // Anything other than 'light' (nothing, 'dark', unknown) is the dark default and is not rewritten.
        return store.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
      } catch {
        return 'dark';
      }
    },
    saveTheme: async (theme: Theme) => {
      if (theme !== 'light' && theme !== 'dark') {
        throw new StorageError('invalid-input', 'Unknown theme');
      }
      try {
        store.setItem(THEME_KEY, theme);
      } catch (error) {
        throw toStorageError(error, 'write');
      }
      return theme;
    },
    loadView: async () => {
      try {
        return store.getItem(VIEW_KEY) === 'table' ? 'table' : 'grid';
      } catch {
        return 'grid';
      }
    },
    saveView: async (view: CatalogViewMode) => {
      if (view !== 'grid' && view !== 'table') throw new StorageError('invalid-input', 'Unknown view');
      try {
        store.setItem(VIEW_KEY, view);
      } catch (error) {
        throw toStorageError(error, 'write');
      }
      return view;
    },
    loadEditMode: async () => {
      try {
        const raw = store.getItem(EDIT_MODE_KEY);
        return raw === 'on' ? true : raw === 'off' ? false : null;
      } catch {
        return null;
      }
    },
    saveEditMode: async (on: boolean) => {
      try {
        store.setItem(EDIT_MODE_KEY, on ? 'on' : 'off');
      } catch (error) {
        throw toStorageError(error, 'write');
      }
      return on;
    },
    loadDeckPickView: async () => {
      try {
        return store.getItem(DECK_PICK_VIEW_KEY) === 'images' ? 'images' : 'list';
      } catch {
        return 'list';
      }
    },
    saveDeckPickView: async (view: DeckPickView) => {
      if (view !== 'list' && view !== 'images') throw new StorageError('invalid-input', 'Unknown view');
      try {
        store.setItem(DECK_PICK_VIEW_KEY, view);
      } catch (error) {
        throw toStorageError(error, 'write');
      }
      return view;
    },
    // Account hints never throw: a failed write only means the SDK is not preloaded next time.
    loadLastUid: () => {
      const raw = readHint(ACCOUNT_LAST_UID_KEY);
      return raw !== null && isUid(raw) ? raw : null;
    },
    saveLastUid: (uid: string | null) => writeHint(ACCOUNT_LAST_UID_KEY, uid !== null && isUid(uid) ? uid : null),
    loadRedirectPending: () => readHint(ACCOUNT_REDIRECT_PENDING_KEY) === '1',
    saveRedirectPending: (pending: boolean) => writeHint(ACCOUNT_REDIRECT_PENDING_KEY, pending ? '1' : null),
  };

  const serialize = (data: LocalData) => JSON.stringify([data.decks, data.collection.entries]);

  function readLocal(): LocalData | null {
    const decksDecoded = decodeEnvelope(readRaw(decksKey), decksAggregate.spec);
    const collectionDecoded = decodeEnvelope(readRaw(collectionKey), collectionAggregate.spec);
    if (decksDecoded.kind === 'newer' || decksDecoded.kind === 'corrupt') return null;
    if (collectionDecoded.kind === 'newer' || collectionDecoded.kind === 'corrupt') return null;
    return {
      decks: decksDecoded.kind === 'ok' ? decksDecoded.value : [],
      collection: collectionDecoded.kind === 'ok' ? collectionDecoded.value : EMPTY_COLLECTION,
    };
  }

  const sync: SyncStorage = {
    read() {
      try {
        return readLocal();
      } catch {
        return null;
      }
    },
    apply(expected, next) {
      const current = readLocal();
      if (current === null || serialize(current) !== serialize(expected)) return false;
      if (serialize(next) === serialize(current)) return true;
      mutate(decksAggregate, () => ({ next: [...next.decks], result: undefined }));
      mutate(collectionAggregate, () => ({ next: next.collection, result: undefined }));
      callAll(uiListeners);
      return true;
    },
    loadBase() {
      try {
        return parseSyncBase(readRaw(syncBaseKey));
      } catch {
        return null;
      }
    },
    saveBase(base) {
      writeHint(syncBaseKey, base === null ? null : JSON.stringify({ v: 1, ...base }));
    },
    backupAll() {
      const at = now();
      for (const aggregate of [decksAggregate, collectionAggregate]) {
        const raw = readRaw(aggregate.key);
        if (raw !== null) backup(aggregate, raw, at);
      }
    },
    clear() {
      try {
        store.removeItem(decksKey);
        store.removeItem(collectionKey);
      } catch (error) {
        throw toStorageError(error, 'write');
      }
      callAll(uiListeners);
      callAll(changeListeners);
    },
    onChange(listener) {
      changeListeners.add(listener);
      const unsubscribe = subscribeTo ? subscribeTo([decksKey, collectionKey], listener) : () => {};
      return () => {
        changeListeners.delete(listener);
        unsubscribe();
      };
    },
  };

  return {
    collection,
    decks,
    preferences,
    persistent: options.persistent,
    sync,
    forAccount: (uid) => createRepositories({ ...options, namespace: uid }),
  };
}
