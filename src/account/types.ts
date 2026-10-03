/*
 * Account layer contracts (D-017 kohta 8). No React and no Firebase types here, so the UI and the tests
 * depend only on these interfaces.
 */

/** The signed-in account. `email` is shown in the UI from memory only, never stored (D-017 kohta 1, SR-29). */
export interface AccountUser {
  uid: string;
  email: string | null;
}

/** Fixed error kinds shown as fixed messages (SR-21 kohta 4). Raw errors are never shown or logged. */
export type AuthErrorKind = 'network' | 'popup-blocked' | 'unknown';

/**
 * `signed-out` = no account; `loading` = the SDK is loading or a sign-in or sign-out is in progress;
 * `signed-in` = `user` is set. `error` is the last failed sign-in, cleared by the next attempt.
 */
export interface AuthState {
  status: 'signed-out' | 'loading' | 'signed-in';
  user: AccountUser | null;
  error: AuthErrorKind | null;
}

export interface AuthClient {
  /** false = sign-in is off on this host (PR previews, unknown hosts, wrong build): the SDK is never loaded. */
  readonly available: boolean;
  state(): AuthState;
  current(): AccountUser | null;
  /** Calls `listener` after every state change. Returns an unsubscribe function. */
  onChange(listener: () => void): () => void;
  /**
   * Restores an earlier session: loads the SDK only when a previous sign-in left a hint
   * (`cyberdeck:account:last-uid` or a pending redirect, SR-21 kohta 5). Safe to call more than once.
   */
  start(): void;
  /**
   * Starts Google sign-in (popup on localhost, redirect on the published site). Never rejects.
   * Does nothing when `available` is false.
   */
  signIn(): Promise<void>;
  signOut(): Promise<void>;
}

/** Services the app gets from the account layer. `cloud` arrives in T-054b. */
export interface AccountServices {
  auth: AuthClient;
}

/** Storage for the account hints; `PreferencesRepository` implements it (src/storage). */
export interface AccountHints {
  loadLastUid(): string | null;
  saveLastUid(uid: string | null): void;
  loadRedirectPending(): boolean;
  saveRedirectPending(pending: boolean): void;
}
