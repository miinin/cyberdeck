import { createAuthState, SIGNED_OUT } from './authState';
import type { AccountHints, AuthClient } from './types';

/**
 * Keeps the main bundle small (T-054a: at most +2 kB gzip): only this wrapper is in the main bundle, and
 * the real client is loaded together with the Firebase SDK on the first sign-in, or at startup when a
 * hint shows an earlier sign-in (SR-21 kohta 5). Mirrors the real client's state once it is loaded.
 */
export function createLazyAuthClient(options: {
  available: boolean;
  hints: AccountHints;
  loadClient: () => Promise<AuthClient>;
}): AuthClient {
  const { available, hints, loadClient } = options;
  const state = createAuthState(SIGNED_OUT);
  let client: Promise<AuthClient> | null = null;
  let started = false;

  function load(): Promise<AuthClient> {
    if (client === null) {
      const pending = loadClient().then((loaded) => {
        loaded.onChange(() => state.set(loaded.state()));
        return loaded;
      });
      client = pending;
      // A failed load may be retried with the next "Kirjaudu".
      pending.catch(() => {
        if (client === pending) client = null;
      });
    }
    return client;
  }

  /** `quiet`: a failed silent restore at startup shows no error (the user did not ask for anything). */
  async function run(action: (loaded: AuthClient) => void | Promise<void>, quiet = false) {
    try {
      await action(await load());
    } catch {
      // The real client never rejects, so this is the chunk failing to load: almost always offline.
      const user = state.get().user;
      state.set({ status: user === null ? 'signed-out' : 'signed-in', error: quiet ? null : 'network' });
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
      if (hints.loadLastUid() === null && !hints.loadRedirectPending()) return;
      state.set({ status: 'loading', error: null });
      void run((loaded) => {
        loaded.start();
        // Never left in 'loading' if the real client had nothing to restore.
        state.set(loaded.state());
      }, true);
    },
    async deleteAccount() {
      try {
        return await (await load()).deleteAccount();
      } catch {
        return 'failed';
      }
    },
    async signIn() {
      if (!available) return;
      state.set({ status: 'loading', error: null });
      await run((loaded) => loaded.signIn());
    },
    // Signed in means the real client is already loaded, so this loads nothing new.
    async signOut() {
      await run((loaded) => loaded.signOut());
    },
  };
}
