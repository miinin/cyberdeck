/*
 * Firebase Auth behind the AuthClient contract (D-017 kohta 1, SR-21). Google only, `select_account`,
 * IndexedDB persistence. Redirect on the published site (same origin), popup on localhost. Tokens are
 * never read, stored or logged; errors become fixed kinds.
 */
import { isUid } from '../../domain/uid';
import { createAuthState, SIGNED_OUT } from '../authState';
import type { AccountHints, AccountUser, AuthClient, AuthErrorKind } from '../types';
import { FIREBASE_ENV } from './config';
import type { FirebaseEnv } from './config';
import type { AuthMode } from './sites';
import { loadFirebase } from './loadFirebase';
import type { FirebaseModules } from './loadFirebase';

type Session = {
  sdk: FirebaseModules['auth'];
  auth: ReturnType<FirebaseModules['auth']['initializeAuth']>;
};

/** The user closed the popup or started another one: not an error to show. */
const CANCELLED_CODES = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled']);

/** Thrown when the lazy SDK chunk does not load: almost always a lost connection. */
const LOAD_FAILED = { code: 'auth/network-request-failed' };

/** null = cancelled by the user. Reads only `code`, never the message or other fields (SR-21 kohta 4). */
export function authErrorKind(error: unknown): AuthErrorKind | null {
  const code =
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : '';
  if (CANCELLED_CODES.has(code)) return null;
  if (code === 'auth/network-request-failed') return 'network';
  if (code === 'auth/popup-blocked') return 'popup-blocked';
  return 'unknown';
}

/** Only the uid and the email leave the Firebase User object (SR-29 kohta 1). */
function toAccountUser(user: { uid: string; email: string | null } | null): AccountUser | null {
  if (user === null || !isUid(user.uid)) return null;
  return { uid: user.uid, email: typeof user.email === 'string' ? user.email : null };
}

export function createFirebaseAuthClient(options: {
  /** The project keys; defaults to this build's project. */
  env?: FirebaseEnv;
  mode: AuthMode;
  hints: AccountHints;
  /** Tests pass fake modules; the default loads the real SDK lazily. */
  load?: () => Promise<FirebaseModules>;
}): AuthClient {
  const { env = FIREBASE_ENV, mode, hints, load = loadFirebase } = options;
  const available = mode.kind !== 'disabled';
  const state = createAuthState(SIGNED_OUT);
  let session: Promise<Session> | null = null;
  let started = false;

  function showUser(user: AccountUser | null) {
    hints.saveLastUid(user?.uid ?? null);
    state.set({ status: user === null ? 'signed-out' : 'signed-in', user });
  }

  function fail(error: unknown, current: AccountUser | null) {
    hints.saveRedirectPending(false);
    state.set({ status: current === null ? 'signed-out' : 'signed-in', user: current, error: authErrorKind(error) });
  }

  async function createSession(authDomain: string): Promise<Session> {
    let modules: FirebaseModules;
    try {
      modules = await load();
    } catch {
      throw LOAD_FAILED;
    }
    const app = modules.app.initializeApp({
      apiKey: env.apiKey,
      authDomain,
      projectId: env.projectId,
      appId: env.appId,
      messagingSenderId: env.messagingSenderId,
    });
    const auth = modules.auth.initializeAuth(app, {
      persistence: modules.auth.indexedDBLocalPersistence,
      popupRedirectResolver: modules.auth.browserPopupRedirectResolver,
    });
    // Later changes (e.g. the session revoked elsewhere). While loading, the flows below decide.
    modules.auth.onAuthStateChanged(auth, (user) => {
      if (state.get().status !== 'loading') showUser(toAccountUser(user));
    });
    return { sdk: modules.auth, auth };
  }

  function open(): Promise<Session> {
    if (mode.kind === 'disabled') return Promise.reject(new Error('Sign-in is disabled on this host'));
    if (session === null) {
      const pending = createSession(mode.authDomain);
      session = pending;
      // A failed load may be retried with the next "Kirjaudu".
      pending.catch(() => {
        if (session === pending) session = null;
      });
    }
    return session;
  }

  async function restore() {
    state.set({ status: 'loading', error: null });
    const redirected = hints.loadRedirectPending();
    try {
      const { sdk, auth } = await open();
      if (redirected) {
        try {
          await sdk.getRedirectResult(auth);
        } finally {
          hints.saveRedirectPending(false);
        }
      }
      await auth.authStateReady();
      showUser(toAccountUser(auth.currentUser));
    } catch (error) {
      // Only a failed sign-in is shown. A failed silent restore (e.g. offline at startup) keeps the
      // hint, so the next startup tries again, and the user can still press "Kirjaudu".
      fail(redirected ? error : { code: 'auth/user-cancelled' }, null);
    }
  }

  return {
    available,
    state: state.get,
    current: () => state.get().user,
    onChange: state.subscribe,
    start() {
      if (started || !available) return;
      started = true;
      if (hints.loadLastUid() !== null || hints.loadRedirectPending()) void restore();
    },
    async signIn() {
      if (!available) return;
      const before = state.get().user;
      state.set({ status: 'loading', error: null });
      try {
        const { sdk, auth } = await open();
        const provider = new sdk.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        if (mode.kind === 'popup') {
          await sdk.signInWithPopup(auth, provider);
          showUser(toAccountUser(auth.currentUser));
        } else {
          hints.saveRedirectPending(true);
          // The page navigates to Google; restore() reads the result on return.
          await sdk.signInWithRedirect(auth, provider);
        }
      } catch (error) {
        fail(error, before);
      }
    },
    // No 'loading' state: the account menu stays as it is until the sign-out is done.
    async signOut() {
      const before = state.get().user;
      try {
        if (session !== null) {
          const { sdk, auth } = await session;
          await sdk.signOut(auth);
        }
        showUser(null);
      } catch (error) {
        fail(error, before);
      }
    },
  };
}
