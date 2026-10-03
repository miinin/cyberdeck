/* In-memory account services for tests (D-017 kohta 8). No network, no Firebase. */
import { createAuthState, SIGNED_OUT } from './authState';
import type { AccountUser, AuthClient, AuthErrorKind } from './types';

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
