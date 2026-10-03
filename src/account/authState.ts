import type { AuthState } from './types';

/** Shared state holder for the Firebase and fake auth clients: one snapshot and a listener list. */
export function createAuthState(initial: AuthState) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next: Partial<AuthState>) {
      state = { ...state, ...next };
      for (const listener of [...listeners]) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const SIGNED_OUT: AuthState = { status: 'signed-out', user: null, error: null };
