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

export interface Repositories {
  collection: CollectionRepository;
  decks: DeckRepository;
  /** false = browser storage is not in use and data lives only in memory (the UI shows a notice, SR-13). */
  persistent: boolean;
}
