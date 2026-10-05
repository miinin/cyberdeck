/*
 * One signed-in account on this device (T-054c, D-017 kohta 6): decides what happens to the signed-out
 * data at the first sign-in, then runs the sync engine. No React; the UI only reads `status()` and answers
 * the choice. The signed-out data is cleared only after the first sync has succeeded, and a backup is
 * made before it is touched (SR-11).
 */
import { EMPTY_COLLECTION } from '../../domain/collection';
import type { Collection } from '../../domain/collection';
import type { LocalData, Repositories, SyncStorage } from '../../storage';
import type { CloudDoc, CloudStore } from '../types';
import { mergeCollection, mergeDecks } from './merge';
import { createSyncEngine } from './syncEngine';
import type { SyncStatus } from './syncEngine';

function isEmptyDoc(doc: CloudDoc<Collection>) {
  return doc.kind === 'missing' || (doc.kind === 'ok' && doc.value.entries.length === 0);
}

export type SessionPhase = 'starting' | 'choose' | 'running';
export type FirstSignInChoice = 'merge' | 'account-only';

export interface SessionStatus {
  phase: SessionPhase;
  sync: SyncStatus;
}

export interface AccountSession {
  /** Plans the first sign-in and starts syncing. Safe to call more than once; works again after `dispose`. */
  start(): void;
  /** The answer to the dialog (phase 'choose'). */
  choose(choice: FirstSignInChoice): void;
  dispose(): void;
  status(): SessionStatus;
  onChange(listener: () => void): () => void;
  /**
   * "Poista tilin tiedot" (T-054d): stops syncing, deletes the cloud data, then everything the account has in
   * this browser. false = the cloud data could not be deleted (syncing resumes). The Auth user is deleted by
   * the caller after this.
   */
  deleteAccountData(): Promise<boolean>;
  /** Runs a sync round now (the engine is started after the first sign-in has been settled). */
  syncNow(): Promise<void>;
}

function isEmptyData(data: LocalData) {
  return data.decks.length === 0 && data.collection.entries.length === 0 && data.wants.entries.length === 0;
}

/**
 * Copies the signed-out data into the account's local data (backup first). Per deck the later updatedAt
 * wins, per card the signed-out count; nothing the account already has is lost. Returns false when
 * either side cannot be read.
 */
export function copySignedOutData(anonymous: SyncStorage, account: SyncStorage): boolean {
  const from = anonymous.read();
  const into = account.read();
  if (from === null || into === null) return false;
  anonymous.backupAll();
  const decks = mergeDecks(from.decks, into.decks, []);
  const collection = mergeCollection(from.collection, into.collection, EMPTY_COLLECTION);
  const wants = mergeCollection(from.wants, into.wants, EMPTY_COLLECTION);
  return account.apply(into, { decks: decks.decks, collection: collection.collection, wants: wants.collection });
}

export function createAccountSession(options: {
  uid: string;
  /** The signed-out repositories and the account's repositories (`forAccount(uid)`). */
  anonymous: Repositories;
  account: Repositories;
  cloud: CloudStore;
  now?: () => Date;
  locks?: Parameters<typeof createSyncEngine>[0]['locks'];
  debounceMs?: number;
  intervalMs?: number;
}): AccountSession {
  const { uid, anonymous, account, cloud } = options;
  const engine = createSyncEngine({
    uid,
    cloud,
    storage: account.sync,
    now: options.now,
    locks: options.locks,
    debounceMs: options.debounceMs,
    intervalMs: options.intervalMs,
  });
  const listeners = new Set<() => void>();
  let phase: SessionPhase = 'starting';
  let planning = false;
  let disposed = false;
  let removeRetry: (() => void) | null = null;

  let planFailed = false;
  const compute = (): SessionStatus => ({
    phase,
    sync: planFailed && phase === 'starting' ? { ...engine.status(), state: 'offline', pending: true } : engine.status(),
  });
  let snapshot = compute();
  const notify = () => {
    snapshot = compute();
    for (const listener of [...listeners]) listener();
  };
  engine.onChange(notify);

  /** First sync done: after a transfer the signed-out data is cleared only now. */
  async function run(clearSignedOutAfter: boolean) {
    phase = 'running';
    notify();
    engine.start();
    if (!clearSignedOutAfter) return;
    await engine.syncNow();
    const done = engine.status();
    if (!disposed && done.state === 'idle' && !done.pending) {
      try {
        anonymous.sync.clear();
      } catch {
        // Left in place; the backup and the copy in the account both exist.
      }
    }
  }

  async function plan() {
    if (planning || disposed) return;
    planning = true;
    planFailed = false;
    try {
      if (account.sync.loadBase() !== null) return await run(false);
      const signedOut = anonymous.sync.read();
      if (signedOut === null || isEmptyData(signedOut)) return await run(false);

      const snapshot = await cloud.readAll();
      if (snapshot.locked) return await run(false);
      const cloudEmpty =
        snapshot.decks.length === 0 &&
        snapshot.invalidDeckIds.length === 0 &&
        isEmptyDoc(snapshot.collection) &&
        isEmptyDoc(snapshot.wants);
      if (cloudEmpty) {
        if (copySignedOutData(anonymous.sync, account.sync)) return await run(true);
        return await run(false);
      }
      phase = 'choose';
      notify();
    } catch {
      // The cloud could not be asked (offline): stay in 'starting' and plan again on focus or online.
      planFailed = true;
      notify();
    } finally {
      planning = false;
    }
  }

  return {
    start() {
      if (removeRetry !== null) {
        // Already started: only resume the engine (it is stopped after a failed account deletion, SEC-044).
        if (phase === 'running' && !disposed) engine.start();
        return;
      }
      disposed = false;
      const retry = () => {
        if (phase === 'starting') void plan();
      };
      window.addEventListener('focus', retry);
      window.addEventListener('online', retry);
      removeRetry = () => {
        window.removeEventListener('focus', retry);
        window.removeEventListener('online', retry);
      };
      void plan();
    },
    choose(choice) {
      if (phase !== 'choose') return;
      if (choice === 'merge' && copySignedOutData(anonymous.sync, account.sync)) {
        void run(true);
      } else {
        void run(false);
      }
    },
    dispose() {
      disposed = true;
      engine.stop();
      removeRetry?.();
      removeRetry = null;
    },
    status: () => snapshot,
    onChange(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async deleteAccountData() {
      engine.stop();
      await engine.whenIdle();
      try {
        await cloud.deleteAll();
        account.sync.eraseAccount();
        return true;
      } catch {
        engine.start();
        return false;
      }
    },
    syncNow: () => engine.syncNow(),
  };
}
