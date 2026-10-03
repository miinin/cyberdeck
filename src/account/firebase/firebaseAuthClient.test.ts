import { createMemoryRepositories } from '../../storage';
import type { AccountHints } from '../types';
import { PROD_ENV, TEST_ENV } from './config';
import type { AuthMode } from './sites';
import { authErrorKind, createFirebaseAuthClient } from './firebaseAuthClient';
import { loadFirebase } from './loadFirebase';
import type { FirebaseModules } from './loadFirebase';

type FakeUser = { uid: string; email: string | null };

/** Minimal stand-in for firebase/app and firebase/auth: records calls, never touches the network. */
function fakeFirebase(options: { user?: FakeUser | null; signInUser?: FakeUser; signInError?: unknown } = {}) {
  const calls: string[] = [];
  const providers: { params: Record<string, string> }[] = [];
  let authStateListener: ((user: FakeUser | null) => void) | null = null;
  const auth = { currentUser: options.user ?? null, authStateReady: async () => {} };
  const initializeApp = vi.fn((config: Record<string, string>) => ({ config }));
  const signedIn = () => {
    if (options.signInError !== undefined) throw options.signInError;
    auth.currentUser = options.signInUser ?? { uid: 'newUid1', email: 'uusi@example.com' };
  };
  const modules = {
    app: { initializeApp },
    auth: {
      initializeAuth: vi.fn(() => auth),
      indexedDBLocalPersistence: 'indexedDB',
      browserPopupRedirectResolver: 'resolver',
      onAuthStateChanged: (_auth: unknown, listener: (user: FakeUser | null) => void) => {
        authStateListener = listener;
      },
      GoogleAuthProvider: class {
        params: Record<string, string> = {};
        constructor() {
          providers.push(this);
        }
        setCustomParameters(params: Record<string, string>) {
          this.params = params;
        }
      },
      getRedirectResult: vi.fn(async () => {
        calls.push('getRedirectResult');
        signedIn();
      }),
      signInWithPopup: vi.fn(async () => {
        calls.push('signInWithPopup');
        signedIn();
      }),
      signInWithRedirect: vi.fn(async () => {
        calls.push('signInWithRedirect');
        return new Promise<never>(() => {});
      }),
      signOut: vi.fn(async () => {
        calls.push('signOut');
        auth.currentUser = null;
      }),
    },
  };
  const load = vi.fn(async () => modules as unknown as FirebaseModules);
  return { load, calls, providers, auth, initializeApp, modules, emit: (user: FakeUser | null) => authStateListener?.(user) };
}

function hints(initial: Record<string, string> = {}): AccountHints {
  return createMemoryRepositories({ initial }).preferences;
}

const POPUP: AuthMode = { kind: 'popup', authDomain: 'cyberdeck-tcg-dev.firebaseapp.com' };
const REDIRECT: AuthMode = { kind: 'redirect', authDomain: 'cyberdeck-tcg.web.app' };

async function settle() {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
}

describe('createFirebaseAuthClient: when the SDK loads (SR-21 kohta 5)', () => {
  it('loads nothing at startup for a user who never signed in', async () => {
    const firebase = fakeFirebase();
    const client = createFirebaseAuthClient({ env: TEST_ENV, mode: POPUP, hints: hints(), load: firebase.load });
    client.start();
    await settle();
    expect(firebase.load).not.toHaveBeenCalled();
    expect(client.state()).toEqual({ status: 'signed-out', user: null, error: null });
  });

  it('never loads on a host where sign-in is off', async () => {
    const firebase = fakeFirebase();
    const store = hints({ 'cyberdeck:account:last-uid': 'abc123' });
    const client = createFirebaseAuthClient({
      env: PROD_ENV,
      mode: { kind: 'disabled' },
      hints: store,
      load: firebase.load,
    });
    client.start();
    await client.signIn();
    expect(client.available).toBe(false);
    expect(firebase.load).not.toHaveBeenCalled();
    expect(client.state()).toEqual({ status: 'signed-out', user: null, error: null });
  });

  it('restores an earlier session when the last uid hint exists', async () => {
    const firebase = fakeFirebase({ user: { uid: 'abc123', email: 'minä@example.com' } });
    const store = hints({ 'cyberdeck:account:last-uid': 'abc123' });
    const client = createFirebaseAuthClient({ env: TEST_ENV, mode: POPUP, hints: store, load: firebase.load });
    const seen: string[] = [];
    client.onChange(() => seen.push(client.state().status));
    client.start();
    client.start();
    await vi.waitFor(() => expect(client.state().status).toBe('signed-in'));
    expect(firebase.load).toHaveBeenCalledTimes(1);
    expect(seen[0]).toBe('loading');
    expect(client.current()).toEqual({ uid: 'abc123', email: 'minä@example.com' });
    expect(firebase.calls).not.toContain('getRedirectResult');
  });

  it('initializes the test project with the popup auth domain and IndexedDB persistence', async () => {
    const firebase = fakeFirebase();
    const client = createFirebaseAuthClient({ env: TEST_ENV, mode: POPUP, hints: hints(), load: firebase.load });
    await client.signIn();
    expect(firebase.initializeApp).toHaveBeenCalledWith({
      apiKey: TEST_ENV.apiKey,
      authDomain: 'cyberdeck-tcg-dev.firebaseapp.com',
      projectId: 'cyberdeck-tcg-dev',
      appId: TEST_ENV.appId,
      messagingSenderId: TEST_ENV.messagingSenderId,
    });
    expect(firebase.modules.auth.initializeAuth).toHaveBeenCalledWith(expect.anything(), {
      persistence: 'indexedDB',
      popupRedirectResolver: 'resolver',
    });
  });

  it('keeps the hint and shows no error when a silent restore fails', async () => {
    const store = hints({ 'cyberdeck:account:last-uid': 'abc123' });
    const load = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const client = createFirebaseAuthClient({ env: TEST_ENV, mode: POPUP, hints: store, load });
    client.start();
    await vi.waitFor(() => expect(client.state().status).toBe('signed-out'));
    expect(client.state().error).toBeNull();
    expect(store.loadLastUid()).toBe('abc123');
  });

  it('clears the hint when the stored session is gone', async () => {
    const firebase = fakeFirebase({ user: null });
    const store = hints({ 'cyberdeck:account:last-uid': 'abc123' });
    const client = createFirebaseAuthClient({ env: TEST_ENV, mode: POPUP, hints: store, load: firebase.load });
    client.start();
    await vi.waitFor(() => expect(client.state().status).toBe('signed-out'));
    expect(store.loadLastUid()).toBeNull();
  });
});

describe('createFirebaseAuthClient: sign-in and sign-out', () => {
  it('signs in with a popup on localhost, asks to select the account and saves only the uid hint', async () => {
    const firebase = fakeFirebase();
    const store = hints();
    const client = createFirebaseAuthClient({ env: TEST_ENV, mode: POPUP, hints: store, load: firebase.load });
    await client.signIn();
    expect(firebase.calls).toEqual(['signInWithPopup']);
    expect(firebase.providers.map((provider) => provider.params)).toEqual([{ prompt: 'select_account' }]);
    expect(client.state()).toEqual({
      status: 'signed-in',
      user: { uid: 'newUid1', email: 'uusi@example.com' },
      error: null,
    });
    expect(store.loadLastUid()).toBe('newUid1');
  });

  it('uses a redirect on the published site and reads the result on return', async () => {
    const firebase = fakeFirebase();
    const store = hints();
    const client = createFirebaseAuthClient({ env: PROD_ENV, mode: REDIRECT, hints: store, load: firebase.load });
    void client.signIn();
    await vi.waitFor(() => expect(firebase.calls).toEqual(['signInWithRedirect']));
    expect(store.loadRedirectPending()).toBe(true);
    expect(firebase.initializeApp).toHaveBeenCalledWith(expect.objectContaining({ authDomain: 'cyberdeck-tcg.web.app' }));

    // Back from Google: a new page load with the pending flag.
    const returned = fakeFirebase();
    const next = createFirebaseAuthClient({ env: PROD_ENV, mode: REDIRECT, hints: store, load: returned.load });
    next.start();
    await vi.waitFor(() => expect(next.state().status).toBe('signed-in'));
    expect(returned.calls).toEqual(['getRedirectResult']);
    expect(store.loadRedirectPending()).toBe(false);
    expect(store.loadLastUid()).toBe('newUid1');
  });

  it('shows a fixed error when the redirect result fails and clears the pending flag', async () => {
    const firebase = fakeFirebase({ signInError: { code: 'auth/network-request-failed', message: 'secret details' } });
    const store = hints({ 'cyberdeck:account:redirect-pending': '1' });
    const client = createFirebaseAuthClient({ env: PROD_ENV, mode: REDIRECT, hints: store, load: firebase.load });
    client.start();
    await vi.waitFor(() => expect(client.state().error).toBe('network'));
    expect(client.state().status).toBe('signed-out');
    expect(store.loadRedirectPending()).toBe(false);
  });

  it('shows nothing when the user closes the popup', async () => {
    const firebase = fakeFirebase({ signInError: { code: 'auth/popup-closed-by-user' } });
    const client = createFirebaseAuthClient({ env: TEST_ENV, mode: POPUP, hints: hints(), load: firebase.load });
    await client.signIn();
    expect(client.state()).toEqual({ status: 'signed-out', user: null, error: null });
  });

  it('reports a failed SDK load as a network error and retries on the next sign-in', async () => {
    const firebase = fakeFirebase();
    const load = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockImplementation(firebase.load);
    const client = createFirebaseAuthClient({ env: TEST_ENV, mode: POPUP, hints: hints(), load });
    await client.signIn();
    expect(client.state().error).toBe('network');
    await client.signIn();
    expect(load).toHaveBeenCalledTimes(2);
    expect(client.state().status).toBe('signed-in');
  });

  it('rejects a user whose uid is not a valid storage key part (SR-23 kohta 8)', async () => {
    const firebase = fakeFirebase({ signInUser: { uid: '../other', email: null } });
    const store = hints();
    const client = createFirebaseAuthClient({ env: TEST_ENV, mode: POPUP, hints: store, load: firebase.load });
    await client.signIn();
    expect(client.state().status).toBe('signed-out');
    expect(store.loadLastUid()).toBeNull();
  });

  it('signs out, removes the hint and follows later auth changes', async () => {
    const firebase = fakeFirebase();
    const store = hints();
    const client = createFirebaseAuthClient({ env: TEST_ENV, mode: POPUP, hints: store, load: firebase.load });
    await client.signIn();
    await client.signOut();
    expect(firebase.calls).toEqual(['signInWithPopup', 'signOut']);
    expect(client.state().status).toBe('signed-out');
    expect(store.loadLastUid()).toBeNull();

    // The session ends elsewhere or starts in another tab.
    firebase.emit({ uid: 'other1', email: null });
    expect(client.current()).toEqual({ uid: 'other1', email: null });
    firebase.emit(null);
    expect(client.current()).toBeNull();
  });

  it('signs out without loading the SDK when it was never loaded', async () => {
    const firebase = fakeFirebase();
    const client = createFirebaseAuthClient({ env: TEST_ENV, mode: POPUP, hints: hints(), load: firebase.load });
    await client.signOut();
    expect(firebase.load).not.toHaveBeenCalled();
  });
});

describe('authErrorKind (SR-21 kohta 4)', () => {
  it.each([
    [{ code: 'auth/popup-closed-by-user' }, null],
    [{ code: 'auth/cancelled-popup-request' }, null],
    [{ code: 'auth/network-request-failed' }, 'network'],
    [{ code: 'auth/popup-blocked' }, 'popup-blocked'],
    [{ code: 'auth/unauthorized-domain' }, 'unknown'],
    [{ code: 42 }, 'unknown'],
    [new Error('boom'), 'unknown'],
    [null, 'unknown'],
  ])('maps %j to %j', (error, kind) => {
    expect(authErrorKind(error)).toBe(kind);
  });
});

describe('test setup', () => {
  it('blocks the real Firebase SDK in tests (SR-27 kohta 4)', async () => {
    await expect(loadFirebase()).rejects.toThrow('Real Firebase is disabled in tests');
  });
});
