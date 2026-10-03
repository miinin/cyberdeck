/*
 * Sync engine (D-017 kohta 6): one tab at a time per account (Web Locks), a one-read shortcut when nothing
 * changed, at most 3 rounds when another device wins the race, and the triggers of kohta 5. It talks to
 * the cloud only through CloudStore and to the browser only through SyncStorage, so tests use the memory
 * cloud and in-memory repositories and never the network.
 */
import { EMPTY_COLLECTION, MAX_COLLECTION_ENTRIES } from '../../domain/collection';
import { MAX_DECKS } from '../../domain/deck';
import type { LocalData, SyncBase, SyncStorage } from '../../storage';
import { CloudError } from '../cloudError';
import type { CloudChange, CloudStore } from '../types';
import { mergeCollection, mergeDecks, sameCollection } from './merge';

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error' | 'locked';

export interface SyncStatus {
  state: SyncState;
  /** The last successful sync in this session. */
  lastSyncedAt: Date | null;
  /** Local changes that are not in the cloud yet (or the last round failed). */
  pending: boolean;
}

export interface SyncEngine {
  /** Syncs now and starts the triggers. Safe to call more than once. */
  start(): void;
  /** Removes the triggers. A running round finishes. */
  stop(): void;
  /** Runs a round (or joins the running one) and resolves when it is done. Never rejects. */
  syncNow(): Promise<void>;
  /** Resolves when no round is running (used before the account data is deleted). */
  whenIdle(): Promise<void>;
  status(): SyncStatus;
  onChange(listener: () => void): () => void;
}

type LockManagerLike = { request(name: string, callback: () => Promise<void>): Promise<unknown> };

const MAX_ROUNDS = 3;

function baseOf(data: LocalData, rev: number): SyncBase {
  return {
    rev,
    decks: data.decks.map((deck) => ({ id: deck.id, updatedAt: deck.updatedAt })),
    collection: data.collection,
  };
}

function sameAsBase(data: LocalData, base: SyncBase): boolean {
  if (data.decks.length !== base.decks.length) return false;
  const stamps = new Map(base.decks.map((deck) => [deck.id, deck.updatedAt]));
  return (
    data.decks.every((deck) => stamps.get(deck.id) === deck.updatedAt) &&
    sameCollection(data.collection, base.collection)
  );
}

/** Thrown inside a round to end it with a state. */
class Stop extends Error {
  readonly state: SyncState;

  constructor(state: SyncState) {
    super(`sync stopped: ${state}`);
    this.state = state;
  }
}

function stateOf(error: unknown): SyncState {
  if (error instanceof Stop) return error.state;
  if (error instanceof CloudError) {
    if (error.kind === 'offline') return 'offline';
    if (error.kind === 'locked') return 'locked';
  }
  return 'error';
}

export function createSyncEngine(options: {
  uid: string;
  cloud: CloudStore;
  storage: SyncStorage;
  now?: () => Date;
  /** Default navigator.locks; null runs without a lock (browsers that lack it). */
  locks?: LockManagerLike | null;
  debounceMs?: number;
  intervalMs?: number;
}): SyncEngine {
  const { uid, cloud, storage, now = () => new Date(), debounceMs = 3000, intervalMs = 5 * 60 * 1000 } = options;
  const defaultLocks = typeof navigator === 'undefined' ? null : (navigator.locks ?? null);
  const locks = options.locks === undefined ? defaultLocks : options.locks;
  const listeners = new Set<() => void>();
  let status: SyncStatus = { state: 'idle', lastSyncedAt: null, pending: false };
  let running: Promise<void> | null = null;
  let again = false;
  let stops: (() => void)[] = [];

  function set(next: Partial<SyncStatus>) {
    status = { ...status, ...next };
    for (const listener of [...listeners]) listener();
  }

  /** The cloud is as the base left it: write only what the device changed. */
  async function push(local: LocalData, base: SyncBase) {
    const stamps = new Map(base.decks.map((deck) => [deck.id, deck.updatedAt]));
    const localIds = new Set(local.decks.map((deck) => deck.id));
    const change: CloudChange = {
      putDecks: local.decks.filter((deck) => stamps.get(deck.id) !== deck.updatedAt),
      deleteDecks: base.decks.map((deck) => deck.id).filter((id) => !localIds.has(id)),
      collection: sameCollection(local.collection, base.collection) ? undefined : local.collection,
    };
    const rev = await cloud.commit(change, base.rev);
    storage.saveBase(baseOf(local, rev));
  }

  /** Returns false when the device data changed during the round (a new round follows). */
  async function fullSync(local: LocalData, base: SyncBase | null): Promise<boolean> {
    const snapshot = await cloud.readAll();
    if (snapshot.locked) throw new Stop('locked');
    if (snapshot.limitExceeded) throw new Stop('error');
    const expectedRev = snapshot.meta?.rev ?? 0;

    const cloudCollection = snapshot.collection;
    const decks = mergeDecks(local.decks, snapshot.decks, base?.decks ?? [], snapshot.invalidDeckIds);
    const collection = mergeCollection(
      local.collection,
      cloudCollection.kind === 'ok'
        ? cloudCollection.value
        : cloudCollection.kind === 'missing'
          ? EMPTY_COLLECTION
          : null,
      base?.collection ?? EMPTY_COLLECTION,
    );
    if (decks.decks.length > MAX_DECKS || collection.collection.entries.length > MAX_COLLECTION_ENTRIES) {
      throw new Stop('error');
    }

    const change: CloudChange = {
      putDecks: decks.put,
      deleteDecks: decks.remove,
      collection: collection.writeCloud ? collection.collection : undefined,
    };
    const empty = change.putDecks.length === 0 && change.deleteDecks.length === 0 && change.collection === undefined;
    const rev = empty ? expectedRev : await cloud.commit(change, expectedRev);

    const merged: LocalData = { decks: decks.decks, collection: collection.collection };
    // The device data is replaced only if it is still what the merge started from.
    if (!storage.apply(local, merged)) return false;
    storage.saveBase(baseOf(merged, rev));
    return true;
  }

  async function round(): Promise<void> {
    for (let attempt = 0; attempt < MAX_ROUNDS; attempt += 1) {
      const local = storage.read();
      if (local === null) throw new Stop('error');
      const base = storage.loadBase();
      const meta = await cloud.readMeta();
      if (meta?.newer) throw new Stop('locked');
      const rev = meta?.rev ?? 0;

      try {
        if (base !== null && rev === base.rev) {
          if (sameAsBase(local, base)) return; // one read, nothing to do
          await push(local, base);
          return;
        }
        if (await fullSync(local, base)) return;
      } catch (error) {
        if (error instanceof CloudError && error.kind === 'conflict' && attempt < MAX_ROUNDS - 1) continue;
        throw error;
      }
    }
    throw new Stop('error');
  }

  async function runLocked() {
    let more = true;
    while (more) {
      again = false;
      try {
        await round();
        set({ state: 'idle', lastSyncedAt: now(), pending: false });
      } catch (error) {
        set({ state: stateOf(error), pending: true });
      }
      more = again;
    }
  }

  function syncNow(): Promise<void> {
    if (running !== null) {
      again = true;
      return running;
    }
    set({ state: 'syncing' });
    const task = locks === null ? runLocked() : locks.request(`cyberdeck:sync:${uid}`, runLocked).then(() => undefined);
    const finished = task
      .catch(() => set({ state: 'error', pending: true }))
      .finally(() => {
        running = null;
      });
    running = finished;
    return finished;
  }

  return {
    start() {
      if (stops.length > 0) return;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const run = () => void syncNow();
      const onVisible = () => {
        if (document.visibilityState === 'visible') run();
      };
      const unsubscribe = storage.onChange(() => {
        set({ pending: true });
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(run, debounceMs);
      });
      const interval = setInterval(run, intervalMs);
      window.addEventListener('focus', run);
      window.addEventListener('online', run);
      document.addEventListener('visibilitychange', onVisible);
      stops = [
        unsubscribe,
        () => {
          if (timer !== null) clearTimeout(timer);
          clearInterval(interval);
          window.removeEventListener('focus', run);
          window.removeEventListener('online', run);
          document.removeEventListener('visibilitychange', onVisible);
        },
      ];
      run();
    },
    stop() {
      for (const stop of stops) stop();
      stops = [];
      again = false;
    },
    whenIdle: () => running ?? Promise.resolve(),
    syncNow,
    status: () => status,
    onChange(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
