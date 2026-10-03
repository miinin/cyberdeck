/*
 * Public API of the account layer (D-017 kohta 8). The UI imports only from here (ESLint).
 */
import { FIREBASE_SITE, selectAuthMode } from './firebase/sites';
import { createLazyAuthClient } from './lazyAuthClient';
import type { AccountHints, AccountServices } from './types';

export type { AccountHints, AccountServices, AccountUser, AuthClient, AuthErrorKind, AuthState } from './types';
export { createFakeAuth, FAKE_USER } from './memory';
export type { FakeAuth } from './memory';

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
  };
}
