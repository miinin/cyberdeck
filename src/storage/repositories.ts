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
import { isDeckId, parseCollection, parseDeckContent, parseDeckList } from '../domain/validate';
import type { Parsed } from '../domain/validate';
import { decodeEnvelope, encodeEnvelope } from './envelope';
import type { EnvelopeSpec, Migration } from './envelope';
import { StorageError, toStorageError } from './errors';
import {
  BACKUP_PREFIX,
  COLLECTION_KEY,
  COLLECTION_SCHEMA_VERSION,
  DECKS_KEY,
  DECKS_SCHEMA_VERSION,
  MAX_BACKUPS_PER_AGGREGATE,
} from './keys';
import type { KeyValueStore } from './keyValueStore';
import type { CollectionRepository, DeckRepository, Loaded, LoadNotice, Repositories } from './types';

export interface RepositoryOptions {
  store: KeyValueStore;
  persistent: boolean;
  /** Default () => new Date(). */
  now?: () => Date;
  /** Default () => crypto.randomUUID(). */
  newId?: () => string;
  /** Default: no change events. */
  subscribe?: (keys: readonly string[], listener: () => void) => () => void;
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
 * version (migrations[i] goes from i + 1 to i + 2). Without them the version comes from keys.ts.
 */
function specWith<T>(
  version: number,
  testMigrations: readonly Migration[] | undefined,
  parse: (data: unknown) => Parsed<T> | null,
): EnvelopeSpec<T> {
  if (testMigrations === undefined) return { currentVersion: version, migrations: [], parse };
  return { currentVersion: testMigrations.length + 1, migrations: testMigrations, parse };
}

export function createRepositories(options: RepositoryOptions): Repositories {
  const { store } = options;
  const now = options.now ?? (() => new Date());
  const newId = options.newId ?? (() => crypto.randomUUID());
  const subscribeTo = options.subscribe;

  const collectionAggregate: Aggregate<Collection> = {
    name: 'collection',
    key: COLLECTION_KEY,
    spec: specWith(COLLECTION_SCHEMA_VERSION, options.migrations?.collection, parseCollection),
    empty: EMPTY_COLLECTION,
    toData: (collection) => ({ entries: collection.entries }),
  };

  const decksAggregate: Aggregate<Deck[]> = {
    name: 'decks',
    key: DECKS_KEY,
    spec: specWith(DECKS_SCHEMA_VERSION, options.migrations?.decks, parseDeckList),
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
    const prefix = `${BACKUP_PREFIX}${aggregate.name}:`;
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
    return result;
  }

  function subscribe(key: string, listener: () => void): () => void {
    return subscribeTo ? subscribeTo([key], listener) : () => {};
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
    subscribe: (listener) => subscribe(COLLECTION_KEY, listener),
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
    subscribe: (listener) => subscribe(DECKS_KEY, listener),
  };

  return { collection, decks, persistent: options.persistent };
}
