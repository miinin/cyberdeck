/*
 * Public API of the account layer (D-017 kohta 8). The UI imports only from here (ESLint).
 */
import { FIREBASE_SITE, selectAuthMode } from './firebase/sites';
import { CloudError } from './cloudError';
import { createLazyAuthClient } from './lazyAuthClient';
import type { AccountHints, AccountServices, CloudStore } from './types';

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
} from './types';
export { createAccountSession } from './sync/session';
export type { AccountSession, FirstSignInChoice, SessionStatus } from './sync/session';
export type { SyncState, SyncStatus } from './sync/syncEngine';
export { CloudError } from './cloudError';
export type { CloudErrorKind } from './cloudError';
export { createFakeAuth, createMemoryCloud, FAKE_USER } from './memory';
export type { FakeAuth, MemoryCloud, MemoryCloudPath } from './memory';

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
