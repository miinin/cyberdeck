/*
 * Public API of the account layer (D-017 kohta 8). The UI imports only from here (ESLint).
 */
import { FIREBASE_SITE, selectAuthMode } from './firebase/sites';
import { CloudError } from './cloudError';
import { createLazyAuthClient } from './lazyAuthClient';
import type { AccountHints, AccountServices, CloudStore, PublicDeckStore, TradeShareStore } from './types';

export type {
  AccountHints,
  AccountServices,
  AccountUser,
  AuthClient,
  AuthErrorKind,
  AuthState,
  DeleteAccountResult,
  CloudChange,
  CloudDoc,
  CloudMeta,
  CloudSnapshot,
  CloudStore,
  PublicDeckCursor,
  PublicDeckPage,
  PublicDeckStore,
  TradeShareStore,
} from './types';
export { createAccountSession } from './sync/session';
export type { AccountSession, FirstSignInChoice, SessionStatus } from './sync/session';
export type { SyncState, SyncStatus } from './sync/syncEngine';
export { CloudError } from './cloudError';
export type { CloudErrorKind } from './cloudError';
export { createFakeAuth, createMemoryCloud, createMemoryPublicDecks, createMemoryTradeShares, FAKE_USER } from './memory';
export type { FakeAuth, MemoryCloud, MemoryCloudPath, MemoryPublicDecks, MemoryTradeShares } from './memory';
export { watchPublicDecks } from './publicWatch';
export { createPublicDeckPublisher } from './publicPublisher';
export type { PublicDeckPublisher, PublishState } from './publicPublisher';

/**
 * Firebase-backed services for this build and host. Creating them loads nothing; the auth client and the
 * SDK load as one lazy chunk only when needed (SR-21 kohta 5).
 */
export function createBrowserAccountServices(hints: AccountHints): AccountServices {
  const mode = selectAuthMode(FIREBASE_SITE, window.location.host);
  return {
    auth: createLazyAuthClient({
      available: mode.kind !== 'disabled',
      hints,
      loadClient: async () => {
        const { createFirebaseAuthClient } = await import('./firebase/firebaseAuthClient');
        return createFirebaseAuthClient({ mode, hints });
      },
    }),
    cloud: createLazyCloudStore,
    publicDecks: createLazyPublicDecks,
    tradeShares: createLazyTradeShares,
  };
}

/** Loads the Firestore store (and the SDK chunk) on the first call; the main bundle does not grow (SR-21 kohta 5). */
function createLazyCloudStore(uid: string): CloudStore {
  let store: Promise<CloudStore> | null = null;
  const load = () => {
    if (store === null) {
      const pending = import('./firebase/firestoreCloudStore').then((module) =>
        module.createFirestoreCloudStore({ uid }),
      );
      store = pending;
      // A chunk that did not load is retried on the next call.
      pending.catch(() => {
        if (store === pending) store = null;
      });
    }
    return store.catch(() => {
      throw new CloudError('offline');
    });
  };
  return {
    readMeta: async () => (await load()).readMeta(),
    readAll: async () => (await load()).readAll(),
    commit: async (change, expectedRev) => (await load()).commit(change, expectedRev),
    deleteAll: async () => (await load()).deleteAll(),
  };
}

/** Loads the Firestore public decks store on the first call; reading works signed out. */
function createLazyPublicDecks(uid: string | null): PublicDeckStore {
  let store: Promise<PublicDeckStore> | null = null;
  const load = () => {
    if (store === null) {
      const pending = import('./firebase/firestorePublicDecks').then((module) =>
        module.createFirestorePublicDecks({ uid }),
      );
      store = pending;
      pending.catch(() => {
        if (store === pending) store = null;
      });
    }
    return store.catch(() => {
      throw new CloudError('offline');
    });
  };
  return {
    list: async (cursor) => (await load()).list(cursor),
    get: async (pubId) => (await load()).get(pubId),
    publish: async (input) => (await load()).publish(input),
    remove: async (deckId) => (await load()).remove(deckId),
    removeMany: async (deckIds) => (await load()).removeMany(deckIds),
  };
}

/** Loads the Firestore trade link store on the first call; reading works signed out. */
function createLazyTradeShares(uid: string | null): TradeShareStore {
  let store: Promise<TradeShareStore> | null = null;
  const load = () => {
    if (store === null) {
      const pending = import('./firebase/firestoreTradeShares').then((module) =>
        module.createFirestoreTradeShares({ uid }),
      );
      store = pending;
      pending.catch(() => {
        if (store === pending) store = null;
      });
    }
    return store.catch(() => {
      throw new CloudError('offline');
    });
  };
  return {
    get: async (shareId) => (await load()).get(shareId),
    ownId: async () => (await load()).ownId(),
    publish: async (data) => (await load()).publish(data),
    update: async (data) => (await load()).update(data),
    remove: async () => (await load()).remove(),
  };
}
