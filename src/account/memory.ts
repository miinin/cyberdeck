/* In-memory account services for tests (D-017 kohta 8). No network, no Firebase. */
import { createAuthState, SIGNED_OUT } from './authState';
import { MAX_DECKS } from '../domain/deck';
import { PUBLIC_DECK_SCHEMA_VERSION, PUBLIC_PAGE_SIZE, parsePublicDeck, publicDeckId } from '../domain/publicDeck';
import type { PublicDeck } from '../domain/publicDeck';
import { isTradeShareId, parseTradeShareDoc, TRADE_SHARE_SCHEMA_VERSION, tradeShareId } from '../domain/tradeLink';
import { isDeckId } from '../domain/validate';
import { isUid } from '../domain/uid';
import {
  buildSnapshot,
  checkChange,
  decodeMeta,
  encodeCollectionDoc,
  encodeDeckDoc,
  encodeGamesDoc,
  encodeWantsDoc,
  encodeHavesDoc,
  MAX_COLLECTION_BYTES,
  META_SCHEMA_VERSION,
} from './cloudCodec';
import { CloudError } from './cloudError';
import type { CloudErrorKind } from './cloudError';
import type {
  AccountUser,
  AuthClient,
  AuthErrorKind,
  CloudMeta,
  CloudStore,
  DeleteAccountResult,
  PublicDeckStore,
  TradeShareStore,
} from './types';

export const FAKE_USER: AccountUser = { uid: 'fakeUid123', email: 'testi@example.com' };

export type FakeAuth = AuthClient & {
  /** Sign-in calls so far. */
  readonly signInCalls: number;
  /** The next signIn fails with this kind instead of signing in (null = cancelled by the user). */
  failNextSignIn(kind: AuthErrorKind | null): void;
  /** deleteAccount calls so far. */
  readonly deleteCalls: number;
  /** The next deleteAccount returns this instead of deleting the account. */
  setNextDeleteResult(result: DeleteAccountResult): void;
};

export function createFakeAuth(
  options: { available?: boolean; user?: AccountUser | null; signInAs?: AccountUser } = {},
): FakeAuth {
  const { available = true, user = null, signInAs = FAKE_USER } = options;
  const state = createAuthState(user === null ? SIGNED_OUT : { status: 'signed-in', user, error: null });
  let signInCalls = 0;
  let deleteCalls = 0;
  let nextDeleteResult: DeleteAccountResult = 'deleted';
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
    async deleteAccount() {
      deleteCalls += 1;
      if (nextDeleteResult !== 'deleted') {
        const result = nextDeleteResult;
        nextDeleteResult = 'deleted';
        return result;
      }
      state.set(SIGNED_OUT);
      return 'deleted';
    },
    failNextSignIn(kind) {
      nextFailure = { kind };
    },
    get deleteCalls() {
      return deleteCalls;
    },
    setNextDeleteResult(result) {
      nextDeleteResult = result;
    },
  };
}

/** Paths below `users/{uid}`: `meta` (the user document), `decks/{deckId}`, `collection/main`, `collection/want` and `games/log`. */
export type MemoryCloudPath = 'meta' | 'collection/main' | 'collection/want' | 'collection/have' | 'games/log' | `decks/${string}`;

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
      return buildSnapshot(meta, deckDocs, read('collection/main'), read('collection/want'), read('games/log'), read('collection/have'));
    },
    async deleteAll() {
      failIfAsked();
      docs.clear();
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
      if (change.wants !== undefined) docs.set('collection/want', encodeWantsDoc(change.wants, savedAt));
      if (change.games !== undefined) docs.set('games/log', encodeGamesDoc(change.games, savedAt));
      if (change.haves !== undefined) docs.set('collection/have', encodeHavesDoc(change.haves, savedAt));
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

/** The public decks of every account in memory: one shared collection, like `publicDecks` in Firestore. */
export type MemoryPublicDecks = {
  /** A store for the signed-in account `uid`, or for reading only (null). */
  forUser(uid: string | null): PublicDeckStore;
  /** Stored documents by pubId (raw, as the rules would see them, with ISO times). */
  readonly docs: Map<string, Record<string, unknown>>;
  /** Raw writes, e.g. an invalid document from another client. */
  setRaw(pubId: string, value: Record<string, unknown> | undefined): void;
  /** Writes so far (publish, remove): the rate-limit tests count them. */
  readonly writes: number;
  /** Lists so far. */
  readonly lists: number;
  /** The next call fails with this kind instead. */
  failNext(kind: CloudErrorKind): void;
};

/** In-memory PublicDeckStore with the Firestore store's contract. It does not emulate the security rules. */
export function createMemoryPublicDecks(options: { now?: () => Date } = {}): MemoryPublicDecks {
  const { now = () => new Date() } = options;
  const docs = new Map<string, Record<string, unknown>>();
  let writes = 0;
  let lists = 0;
  let nextFailure: CloudErrorKind | null = null;

  function failIfAsked() {
    if (nextFailure === null) return;
    const kind = nextFailure;
    nextFailure = null;
    throw new CloudError(kind);
  }

  return {
    docs,
    setRaw(pubId, value) {
      if (value === undefined) docs.delete(pubId);
      else docs.set(pubId, structuredClone(value));
    },
    get writes() {
      return writes;
    },
    get lists() {
      return lists;
    },
    failNext(kind) {
      nextFailure = kind;
    },
    forUser(uid) {
      if (uid !== null && !isUid(uid)) throw new CloudError('unknown');
      const pubIdOf = (deckId: string) => {
        if (uid === null || !isDeckId(deckId)) throw new CloudError('denied');
        return publicDeckId(uid, deckId);
      };
      return {
        async list(cursor) {
          failIfAsked();
          lists += 1;
          const sorted = [...docs.entries()].sort(([a, x], [b, y]) =>
            String(y.updatedAt).localeCompare(String(x.updatedAt)) || a.localeCompare(b),
          );
          const start = typeof cursor === 'object' && cursor !== null && 'index' in cursor ? Number(cursor.index) : 0;
          const page = sorted.slice(start, start + PUBLIC_PAGE_SIZE);
          const items: PublicDeck[] = [];
          let dropped = 0;
          for (const [pubId, raw] of page) {
            const parsed = parsePublicDeck(pubId, structuredClone(raw));
            if (parsed === null) dropped += 1;
            else items.push(parsed);
          }
          const end = start + page.length;
          return { items, next: end < sorted.length ? { index: end } : null, dropped };
        },
        async get(pubId) {
          failIfAsked();
          const raw = docs.get(pubId);
          return raw === undefined ? null : parsePublicDeck(pubId, structuredClone(raw));
        },
        async publish(input) {
          failIfAsked();
          const pubId = await pubIdOf(input.deckId);
          const time = now().toISOString();
          const existing = docs.get(pubId);
          writes += 1;
          docs.set(pubId, {
            schemaVersion: PUBLIC_DECK_SCHEMA_VERSION,
            deckId: input.deckId,
            name: input.name,
            legends: input.legends,
            cardCount: input.cardCount,
            deck: input.deck,
            nickname: input.nickname,
            publishedAt: existing?.publishedAt ?? time,
            updatedAt: time,
          });
        },
        async remove(deckId) {
          failIfAsked();
          const pubId = await pubIdOf(deckId);
          writes += 1;
          docs.delete(pubId);
        },
        async removeMany(deckIds) {
          failIfAsked();
          const pubIds = await Promise.all(deckIds.filter(isDeckId).map(pubIdOf));
          writes += 1;
          for (const pubId of pubIds) docs.delete(pubId);
        },
      };
    },
  };
}

/** The trade links of every account in memory: one shared collection, like `tradeShares` in Firestore (T-178). */
export type MemoryTradeShares = {
  /** A store for the signed-in account `uid`, or for reading only (null). */
  forUser(uid: string | null): TradeShareStore;
  /** Stored documents by shareId (raw, as the rules would see them). */
  readonly docs: Map<string, Record<string, unknown>>;
  /** Writes so far (publish, update, remove). */
  readonly writes: number;
  /** Reads so far (get): "no request for a malformed id" tests count them. */
  readonly reads: number;
  /** The next call fails with this kind instead. */
  failNext(kind: CloudErrorKind): void;
};

/** In-memory TradeShareStore with the Firestore store's contract. It does not emulate the security rules. */
export function createMemoryTradeShares(options: { now?: () => Date } = {}): MemoryTradeShares {
  const { now = () => new Date() } = options;
  const docs = new Map<string, Record<string, unknown>>();
  let writes = 0;
  let reads = 0;
  let nextFailure: CloudErrorKind | null = null;

  function failIfAsked() {
    if (nextFailure === null) return;
    const kind = nextFailure;
    nextFailure = null;
    throw new CloudError(kind);
  }

  return {
    docs,
    get writes() {
      return writes;
    },
    get reads() {
      return reads;
    },
    failNext(kind) {
      nextFailure = kind;
    },
    forUser(uid) {
      if (uid !== null && !isUid(uid)) throw new CloudError('unknown');
      const idOf = () => {
        if (uid === null) throw new CloudError('denied');
        return tradeShareId(uid);
      };
      const doc = (data: string) => ({ schemaVersion: TRADE_SHARE_SCHEMA_VERSION, data, updatedAt: now().toISOString() });
      return {
        async get(shareId) {
          failIfAsked();
          if (!isTradeShareId(shareId)) return null;
          reads += 1;
          const raw = docs.get(shareId);
          return raw === undefined ? null : parseTradeShareDoc(structuredClone(raw));
        },
        ownId: async () => {
          failIfAsked();
          return idOf();
        },
        async publish(data) {
          failIfAsked();
          const id = await idOf();
          writes += 1;
          docs.set(id, doc(data));
        },
        async update(data) {
          failIfAsked();
          const id = await idOf();
          if (!docs.has(id)) return false;
          writes += 1;
          docs.set(id, doc(data));
          return true;
        },
        async remove() {
          failIfAsked();
          const id = await idOf();
          writes += 1;
          docs.delete(id);
        },
      };
    },
  };
}
