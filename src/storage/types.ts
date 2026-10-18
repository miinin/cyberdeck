import type { TradeRule } from '../domain/tradeRule';
import type { BinderLayout } from '../domain/binderLayout';
import type { CardKey } from '../domain/cardKey';
import type { Collection } from '../domain/collection';
import type { PrintingKey } from '../domain/printing';
import type { Deck, DeckContent, DeckId, DeckPublish } from '../domain/deck';
import type { GameInput, GameLog, GameRecord } from '../domain/games';
import type { SealedRun } from '../domain/sealed';

export type LoadNotice =
  /** Some rows were dropped, the rest was kept. */
  | { kind: 'repaired'; dropped: number }
  /** Data was unreadable: copied to a backup key (null if that failed) and started from empty. */
  | { kind: 'reset'; backupKey: string | null }
  | { kind: 'migrated'; from: number; to: number }
  /** Data has a newer schema version: shown as empty, writes are blocked. */
  | { kind: 'newer-version'; version: number };

export interface Loaded<T> {
  value: T;
  notices: LoadNotice[];
}

export interface CollectionRepository {
  load(): Promise<Loaded<Collection>>;
  /** Count 0 removes the card. Resolves with the saved collection. */
  setCount(card: CardKey, count: number): Promise<Collection>;
  /**
   * Sets the copies of one printing and moves the total count with it (D-020). Resolves with the saved collection.
   * setCount below the sum of the versions rejects with StorageError('invalid-input').
   */
  setVersionCount(card: CardKey, printing: PrintingKey, count: number): Promise<Collection>;
  /** Called when the data changed outside this instance (another tab; MVP-2: onSnapshot). */
  subscribe(listener: () => void): () => void;
}

export interface DeckRepository {
  /** In stored order (creation order). */
  list(): Promise<Loaded<Deck[]>>;
  get(id: DeckId): Promise<Deck | null>;
  /** New id and timestamps; never uses an id from the caller (SR-18). */
  create(content: DeckContent): Promise<Deck>;
  /**
   * Updates updatedAt. Unknown id → StorageError('not-found'). With `expectedUpdatedAt`, a stored deck that has
   * a different updatedAt → StorageError('conflict') and nothing is written (T-042, T-054d).
   */
  update(id: DeckId, content: DeckContent, options?: { expectedUpdatedAt?: string }): Promise<Deck>;
  /**
   * Sets the publishing settings of a deck (T-098); undefined = private. `update` never changes them. Updates
   * updatedAt, so sync carries the setting. Unknown id → StorageError('not-found').
   */
  setPublish(id: DeckId, publish: DeckPublish | undefined): Promise<Deck>;
  /** Unknown id is not an error. */
  remove(id: DeckId): Promise<void>;
  subscribe(listener: () => void): () => void;
}

/**
 * The game results of all decks (T-122, D-030). Every change reads fresh state, validates and saves in one go.
 * Limits (1 000 games, 900 000 bytes) → StorageError('limit-reached'); a bad input → 'invalid-input'.
 */
export interface GameLogRepository {
  load(): Promise<Loaded<GameLog>>;
  /** New id and timestamp; never uses an id from the caller. Resolves with the saved row. */
  add(input: GameInput): Promise<GameRecord>;
  /** Replaces the user's fields of a game and keeps its id and createdAt. Unknown id → StorageError('not-found'). */
  update(id: string, input: GameInput): Promise<GameRecord>;
  /** Unknown id is not an error. */
  remove(id: string): Promise<void>;
  subscribe(listener: () => void): () => void;
}

/**
 * The running sealed (T-173, local only). `load` gives null when none is going. `save` validates the whole run and
 * rejects with StorageError('invalid-input') for one that is not valid (more copies than the pool holds and the like).
 */
export interface SealedRepository {
  load(): Promise<Loaded<SealedRun | null>>;
  save(run: SealedRun): Promise<SealedRun>;
  clear(): Promise<void>;
  subscribe(listener: () => void): () => void;
}

export type Theme = 'dark' | 'light';

export type CatalogViewMode = 'grid' | 'table';
/** Deck editor search results as a text list or an image grid (T-045). */
export type DeckPickView = 'list' | 'images';
/** The deck column of the editor as a list, stacks or whole cards (T-115). */
export type DeckListView = 'list' | 'stacks' | 'cards';
/** Which Welcome to Night City edition the card boxes' + adds to (D-022). */
export type DefaultEdition = 'beta' | 'retail';
/** Card scanner mode (T-108): confirm every card, or add the recognised cards automatically. */
export type ScanMode = 'single' | 'continuous';
/** Collection page (T-109, T-116, T-112): the owned cards list, the progress overview or the binder, and whether the binder shows missing cards. Older saved fields are ignored. */
export interface CollectionPrefs {
  view: 'own' | 'overview' | 'binder';
  showMissing: boolean;
  /** The binder shows the set in number order or the user's own binder (T-120). */
  binder: 'set' | 'custom';
}
export const DEFAULT_COLLECTION_PREFS: CollectionPrefs = { view: 'own', showMissing: true, binder: 'set' };

/** User preferences that are not data (UX.md 8.7). Stored as raw strings, not in an envelope. */
/** Where a shared trade link takes its Have side from. */
export type TradeShareSource = 'list' | 'collection';

export interface PreferencesRepository {
  /** Saved theme, or 'dark' when nothing valid is saved. Never rejects because of storage problems. */
  loadTheme(): Promise<Theme>;
  /** Resolves with the saved theme. Rejects with StorageError when saving fails (the UI keeps the theme for the session). */
  saveTheme(theme: Theme): Promise<Theme>;
  /** Saved list view, or 'grid' when nothing valid is saved. Never rejects because of storage problems. */
  loadView(): Promise<CatalogViewMode>;
  saveView(view: CatalogViewMode): Promise<CatalogViewMode>;
  /** Saved "edit collection" switch, or null when the user has not chosen (the UI then picks a default). */
  loadEditMode(): Promise<boolean | null>;
  saveEditMode(on: boolean): Promise<boolean>;
  /** Saved deck editor result view, or 'list' when nothing valid is saved. Never rejects because of storage problems. */
  loadDeckPickView(): Promise<DeckPickView>;
  saveDeckPickView(view: DeckPickView): Promise<DeckPickView>;
  /** Saved deck column view, or 'list' when nothing valid is saved. Never rejects because of storage problems. */
  loadDeckListView(): Promise<DeckListView>;
  saveDeckListView(view: DeckListView): Promise<DeckListView>;
  /** Saved default edition, or 'beta' when nothing valid is saved. Never rejects because of storage problems. */
  loadDefaultEdition(): Promise<DefaultEdition>;
  saveDefaultEdition(edition: DefaultEdition): Promise<DefaultEdition>;
  /** Saved scanner mode, or 'single' when nothing valid is saved. Never rejects because of storage problems. */
  loadScanMode(): Promise<ScanMode>;
  saveScanMode(mode: ScanMode): Promise<ScanMode>;
  /** Saved Collection page choices; every missing or invalid field falls back to its default. Never rejects because of storage problems. */
  loadCollectionPrefs(): Promise<CollectionPrefs>;
  saveCollectionPrefs(prefs: CollectionPrefs): Promise<CollectionPrefs>;
  /** Saved trade rule (T-135); every missing or invalid field falls back to its default. Never rejects because of storage problems. */
  loadTradeRule(): Promise<TradeRule>;
  /** Rejects with StorageError when the rule is not valid or saving fails. */
  saveTradeRule(rule: TradeRule): Promise<TradeRule>;
  /** The saved own binder layout, or null when none or it is not valid (the caller then starts a new one). Never rejects because of storage problems. */
  loadBinderLayout(): Promise<BinderLayout | null>;
  /** Saves a valid layout (the name is trimmed and cut to its limit). Rejects with StorageError when the layout is not valid or saving fails. */
  saveBinderLayout(layout: BinderLayout): Promise<BinderLayout>;
  /**
   * What this account shared from this device (T-178, SR-54, SEC-178-1): its own Have list or its collection; null = nothing. Stored under the account's own keys,
   * so another account on the same device never inherits it; signed out it is always false. Never throws.
   */
  loadTradeShared(): TradeShareSource | null;
  /** Signed out: does nothing. Never throws (a hint only). */
  saveTradeShared(source: TradeShareSource | null): void;
  /** Account hint (T-054a): uid of the last signed-in account, or null when none or invalid. Never throws. */
  loadLastUid(): string | null;
  /** Saves a valid uid, or removes the hint for null or an invalid uid. Never throws (a hint only). */
  saveLastUid(uid: string | null): void;
  /** true when a sign-in redirect was started and its result has not been read yet. Never throws. */
  loadRedirectPending(): boolean;
  saveRedirectPending(pending: boolean): void;
  /** Set while the account deletion waits for a re-login redirect (T-054d). */
  loadDeletePending(): boolean;
  saveDeletePending(pending: boolean): void;
}

/** Decks and collection together: what the sync engine reads and replaces (T-054c). */
export interface LocalData {
  decks: Deck[];
  collection: Collection;
  /** The want list (D-018), same shape as the collection. */
  wants: Collection;
  /** The game results (T-122, D-030). */
  games: GameLog;
  /** The own Have list (T-143, T-145), same shape as the collection. */
  haves: Collection;
}

/** The state both sides had at the last successful sync: the base of the three-way merge (D-017 kohta 6). */
export interface SyncBase {
  rev: number;
  decks: readonly { id: DeckId; updatedAt: string }[];
  collection: Collection;
  wants: Collection;
  games: GameLog;
  haves: Collection;
}

/** Local data access for the sync engine and the first sign-in. Never throws except `apply`. */
export interface SyncStorage {
  /** null = a stored aggregate is unreadable or has a newer schema: nothing may be synced or overwritten. */
  read(): LocalData | null;
  /**
   * Replaces the stored data with `next` if it still equals `expected` (false = it changed meanwhile, nothing
   * written). Unreadable or older data is backed up first. Notifies the UI. Throws StorageError.
   */
  apply(expected: LocalData, next: LocalData): boolean;
  loadBase(): SyncBase | null;
  saveBase(base: SyncBase | null): void;
  /** Copies the raw decks, collection, wants and games to backup keys (SR-11). */
  backupAll(): void;
  /** Removes the decks, collection, wants and games keys (after a successful transfer). */
  clear(): void;
  /**
   * Removes everything the account has in this browser: decks, collection, wants, games, sync base and backups. Only for
   * account repositories; the signed-out data is never erased this way. Throws StorageError.
   */
  eraseAccount(): void;
  /** Called after any local write, in this tab (all writes) and in other tabs (storage event). */
  onChange(listener: () => void): () => void;
}

export interface Repositories {
  collection: CollectionRepository;
  /** The want list: the same interface and rules as the collection, under its own key (D-018). */
  wants: CollectionRepository;
  /** The proxy print queue (T-102): the collection's interface and rules, local only (not synced). */
  proxy: CollectionRepository;
  /** The own Have list (T-143): the cards the user offers for trade, the want list's rules; synced like the want list (T-145). */
  haves: CollectionRepository;
  /** The game results (T-122, D-030). */
  games: GameLogRepository;
  /** The running sealed (T-173): local only, never synced. */
  sealed: SealedRepository;
  decks: DeckRepository;
  preferences: PreferencesRepository;
  /** false = browser storage is not in use and data lives only in memory (the UI shows a notice, SR-13). */
  persistent: boolean;
  /** Local data access for syncing (T-054c). */
  sync: SyncStorage;
  /** Repositories of one account's data in the same store (keys `cyberdeck:u:{uid}:*`); the preferences are shared except the own binder layout (T-120). */
  forAccount(uid: string): Repositories;
}
