/*
 * Account layer contracts (D-017 kohta 8). No React and no Firebase types here, so the UI and the tests
 * depend only on these interfaces.
 */
import type { Collection } from '../domain/collection';
import type { Deck, DeckId } from '../domain/deck';
import type { GameLog } from '../domain/games';
import type { PublicDeck, PublicDeckInput } from '../domain/publicDeck';

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
  /**
   * Deletes the Firebase Auth user (D-017 K-P5). `reauth` = a recent login is needed: the page goes to Google and
   * the deletion finishes after the return. Never rejects. The cloud data must be deleted first (the rules need
   * the signed-in user).
   */
  deleteAccount(): Promise<DeleteAccountResult>;
}

export type DeleteAccountResult = 'deleted' | 'reauth' | 'failed';

/** Services the app gets from the account layer. */
export interface AccountServices {
  auth: AuthClient;
  /** The cloud copy of one account (Firestore in the app, memory in tests). The uid must be valid. */
  cloud(uid: string): CloudStore;
  /**
   * Public decks (T-098, D-025). `uid` = the signed-in account, needed to publish and remove; null = reading
   * only (works signed out). The uid is never part of anything public (SR-30).
   */
  publicDecks(uid: string | null): PublicDeckStore;
}

/** Where the next page starts. Opaque to the caller: pass back what the previous page returned. */
export type PublicDeckCursor = object;

export interface PublicDeckPage {
  /** Valid public decks, newest update first. */
  items: PublicDeck[];
  /** null = the last page. */
  next: PublicDeckCursor | null;
  /** Documents that did not pass validation and were left out (SR-37). */
  dropped: number;
}

/**
 * `publicDecks/{pubId}` (D-025, SEC-098). Reads work signed out; the writes need the signed-in account the
 * store was created for. All methods throw CloudError.
 */
export interface PublicDeckStore {
  /** One page of at most PUBLIC_PAGE_SIZE decks, ordered by updatedAt descending (SR-33). */
  list(cursor: PublicDeckCursor | null): Promise<PublicDeckPage>;
  /** null = no such public deck, or the document is not valid. */
  get(pubId: string): Promise<PublicDeck | null>;
  /** Creates or updates the public copy of `input.deckId`. */
  publish(input: PublicDeckInput): Promise<void>;
  /** Deletes the public copy of one deck. A missing copy is not an error. */
  remove(deckId: DeckId): Promise<void>;
  /** Deletes the public copies of the decks (account deletion, SR-36). A missing copy is not an error. */
  removeMany(deckIds: readonly DeckId[]): Promise<void>;
}

/** Storage for the account hints; `PreferencesRepository` implements it (src/storage). */
export interface AccountHints {
  loadLastUid(): string | null;
  saveLastUid(uid: string | null): void;
  loadRedirectPending(): boolean;
  saveRedirectPending(pending: boolean): void;
  loadDeletePending(): boolean;
  saveDeletePending(pending: boolean): void;
}

/** Cloud meta document `users/{uid}` (D-017 kohta 3). `newer` = a newer app wrote it: sync locks (SR-23 kohta 4). */
export interface CloudMeta {
  rev: number;
  newer: boolean;
}

/** One cloud document after validation. `invalid` is never a deletion (SR-23 kohta 3). */
export type CloudDoc<T> = { kind: 'missing' } | { kind: 'ok'; value: T } | { kind: 'invalid' };

/** Everything under `users/{uid}`, validated with the same parse functions as localStorage (SR-23 kohta 1). */
export interface CloudSnapshot {
  meta: CloudMeta | null;
  /** Valid decks; the id comes from the document id. */
  decks: Deck[];
  /** Decks that exist in the cloud but did not pass validation: the merge must keep the local copy. */
  invalidDeckIds: DeckId[];
  collection: CloudDoc<Collection>;
  /** `users/{uid}/collection/want` (D-018), validated like the collection. */
  wants: CloudDoc<Collection>;
  /** `users/{uid}/games/log` (T-122, D-030), validated with parseGameLog. */
  games: CloudDoc<GameLog>;
  /** `users/{uid}/collection/have` (T-145), validated like the collection. */
  haves: CloudDoc<Collection>;
  /** Invalid documents, rows and sections left out (shown as a warning, SR-23 kohta 3). */
  dropped: number;
  /** A document or the meta has a newer schema version: no writes (SR-23 kohta 4). */
  locked: boolean;
  /** More than MAX_DECKS decks in the cloud: nothing may be deleted (SR-23 kohta 5). */
  limitExceeded: boolean;
}

/** Documents to write in one transaction. The meta's rev grows by one in the same transaction. */
export interface CloudChange {
  putDecks: readonly Deck[];
  deleteDecks: readonly DeckId[];
  /** undefined = the collection is not written. */
  collection?: Collection;
  /** undefined = the want list is not written. */
  wants?: Collection;
  /** undefined = the game log is not written. */
  games?: GameLog;
  /** undefined = the own Have list is not written (T-145). */
  haves?: Collection;
}

export interface CloudStore {
  readMeta(): Promise<CloudMeta | null>;
  readAll(): Promise<CloudSnapshot>;
  /**
   * Writes `change` if the cloud rev is still `expectedRev` (0 = no meta yet) and returns the new rev.
   * Throws CloudError.
   */
  commit(change: CloudChange, expectedRev: number): Promise<number>;
  /** Deletes every document under the account (decks, collection, wants, haves, games and meta). Throws CloudError. */
  deleteAll(): Promise<void>;
}
