import type { CardKey } from '../domain/cardKey';
import type { Collection } from '../domain/collection';
import type { Deck, DeckContent, DeckId } from '../domain/deck';

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
  /** Called when the data changed outside this instance (another tab; MVP-2: onSnapshot). */
  subscribe(listener: () => void): () => void;
}

export interface DeckRepository {
  /** In stored order (creation order). */
  list(): Promise<Loaded<Deck[]>>;
  get(id: DeckId): Promise<Deck | null>;
  /** New id and timestamps; never uses an id from the caller (SR-18). */
  create(content: DeckContent): Promise<Deck>;
  /** Updates updatedAt. Unknown id → StorageError('not-found'). */
  update(id: DeckId, content: DeckContent): Promise<Deck>;
  /** Unknown id is not an error. */
  remove(id: DeckId): Promise<void>;
  subscribe(listener: () => void): () => void;
}

export type Theme = 'dark' | 'light';

export type CatalogViewMode = 'grid' | 'table';
/** Deck editor search results as a text list or an image grid (T-045). */
export type DeckPickView = 'list' | 'images';

/** User preferences that are not data (UX.md 8.7). Stored as raw strings, not in an envelope. */
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
  /** Account hint (T-054a): uid of the last signed-in account, or null when none or invalid. Never throws. */
  loadLastUid(): string | null;
  /** Saves a valid uid, or removes the hint for null or an invalid uid. Never throws (a hint only). */
  saveLastUid(uid: string | null): void;
  /** true when a sign-in redirect was started and its result has not been read yet. Never throws. */
  loadRedirectPending(): boolean;
  saveRedirectPending(pending: boolean): void;
}

export interface Repositories {
  collection: CollectionRepository;
  decks: DeckRepository;
  preferences: PreferencesRepository;
  /** false = browser storage is not in use and data lives only in memory (the UI shows a notice, SR-13). */
  persistent: boolean;
}
