/* In-memory account services for tests (D-017 kohta 8). No network, no Firebase. */
import { createAuthState, SIGNED_OUT } from './authState';
import { MAX_DECKS } from '../domain/deck';
import { isUid } from '../domain/uid';
import {
  buildSnapshot,
  checkChange,
  decodeMeta,
  encodeCollectionDoc,
  encodeDeckDoc,
  MAX_COLLECTION_BYTES,
  META_SCHEMA_VERSION,
} from './cloudCodec';
import { CloudError } from './cloudError';
import type { CloudErrorKind } from './cloudError';
import type { AccountUser, AuthClient, AuthErrorKind, CloudMeta, CloudStore } from './types';

export const FAKE_USER: AccountUser = { uid: 'fakeUid123', email: 'testi@example.com' };

export type FakeAuth = AuthClient & {
  /** Sign-in calls so far. */
  readonly signInCalls: number;
  /** The next signIn fails with this kind instead of signing in (null = cancelled by the user). */
  failNextSignIn(kind: AuthErrorKind | null): void;
};

export function createFakeAuth(
  options: { available?: boolean; user?: AccountUser | null; signInAs?: AccountUser } = {},
): FakeAuth {
  const { available = true, user = null, signInAs = FAKE_USER } = options;
  const state = createAuthState(user === null ? SIGNED_OUT : { status: 'signed-in', user, error: null });
  let signInCalls = 0;
  let nextFailure: { kind: AuthErrorKind | null } | null = null;

  return {
    available,
    get signInCalls() {
      return signInCalls;
    },
    state: state.get,
    current: () => state.get().user,
    onChange: state.subscribe,
    start() {},
    async signIn() {
      signInCalls += 1;
      if (!available) return;
      if (nextFailure !== null) {
        const { kind } = nextFailure;
        nextFailure = null;
        state.set({ error: kind });
        return;
      }
      state.set({ status: 'signed-in', user: signInAs, error: null });
    },
    async signOut() {
      state.set(SIGNED_OUT);
    },
    failNextSignIn(kind) {
      nextFailure = { kind };
    },
  };
}

/** Paths below `users/{uid}`: `meta` (the user document), `decks/{deckId}` and `collection/main`. */
export type MemoryCloudPath = 'meta' | 'collection/main' | `decks/${string}`;

export type MemoryCloud = CloudStore & {
  /** Puts a raw document, e.g. an invalid one written by another client. undefined deletes it. */
  setRaw(path: MemoryCloudPath, value: unknown): void;
  getRaw(path: MemoryCloudPath): unknown;
  paths(): MemoryCloudPath[];
  /** Documents read so far (quota estimates, D-017 kohta 5). */
  readonly reads: number;
  /** The next call (read or commit) fails with this kind instead. */
  failNext(kind: CloudErrorKind): void;
};

/**
 * In-memory CloudStore with the Firestore store's contract: the same validation and encoding
 * (cloudCodec.ts), the same rev check and the same errors. It does not emulate the security rules.
 */
export function createMemoryCloud(
  options: { uid?: string; now?: () => Date; maxCollectionBytes?: number } = {},
): MemoryCloud {
  const { uid = FAKE_USER.uid, now = () => new Date(), maxCollectionBytes = MAX_COLLECTION_BYTES } = options;
  if (!isUid(uid)) throw new CloudError('unknown');
  const docs = new Map<MemoryCloudPath, unknown>();
  let reads = 0;
  let nextFailure: CloudErrorKind | null = null;

  function read(path: MemoryCloudPath): unknown {
    reads += 1;
    return docs.has(path) ? structuredClone(docs.get(path)) : undefined;
  }

  function failIfAsked() {
    if (nextFailure === null) return;
    const kind = nextFailure;
    nextFailure = null;
    throw new CloudError(kind);
  }

  function readMetaDoc(): CloudMeta | null {
    const raw = read('meta');
    return raw === undefined ? null : decodeMeta(raw);
  }

  return {
    async readMeta() {
      failIfAsked();
      return readMetaDoc();
    },
    async readAll() {
      failIfAsked();
      const meta = readMetaDoc();
      const deckDocs = [...docs.keys()]
        .filter((path) => path.startsWith('decks/'))
        .sort()
        .slice(0, MAX_DECKS + 1)
        .map((path) => ({ id: path.slice('decks/'.length), data: read(path) }));
      return buildSnapshot(meta, deckDocs, read('collection/main'));
    },
    async commit(requested, expectedRev) {
      failIfAsked();
      const change = checkChange(requested, maxCollectionBytes);
      const meta = readMetaDoc();
      if (meta?.newer) throw new CloudError('locked');
      const rev = meta?.rev ?? 0;
      if (rev !== expectedRev) throw new CloudError('conflict');

      const savedAt = now().toISOString();
      for (const deck of change.putDecks) docs.set(`decks/${deck.id}`, encodeDeckDoc(deck, savedAt));
      for (const id of change.deleteDecks) docs.delete(`decks/${id}`);
      if (change.collection !== undefined) docs.set('collection/main', encodeCollectionDoc(change.collection, savedAt));
      docs.set('meta', { schemaVersion: META_SCHEMA_VERSION, rev: rev + 1, updatedAt: savedAt });
      return rev + 1;
    },
    setRaw(path, value) {
      if (value === undefined) docs.delete(path);
      else docs.set(path, structuredClone(value));
    },
    getRaw: (path) => structuredClone(docs.get(path)),
    paths: () => [...docs.keys()].sort(),
    get reads() {
      return reads;
    },
    failNext(kind) {
      nextFailure = kind;
    },
  };
}
