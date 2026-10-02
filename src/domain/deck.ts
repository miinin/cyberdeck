import type { CardKey } from './cardKey';

/** Generated with crypto.randomUUID(). Accepted format ^[A-Za-z0-9_-]{1,64}$ (see isDeckId in validate.ts). */
export type DeckId = string;

export const MAX_DECKS = 200; // SR-11
export const MAX_DECK_CARD_COUNT = 99; // count of one row, 1–99 (SR-11)
export const MAX_DECK_DISTINCT_CARDS = 500; // rows in all sections together (SR-11)
export const MAX_DECK_NAME_LENGTH = 100; // 1–100 after cleaning
export const MAX_SECTIONS = 20;
export const MAX_SECTION_NAME_LENGTH = 50; // 0–50; empty = unnamed main section

export interface DeckCard {
  readonly card: CardKey;
  readonly count: number;
}

/** A card appears at most once per section, but the same card may be in several sections. */
export interface DeckSection {
  readonly name: string;
  readonly cards: readonly DeckCard[];
}

/** The user-editable part of a deck; also the shape that file import validates (T-015). */
export interface DeckContent {
  readonly name: string;
  readonly sections: readonly DeckSection[];
}

export interface Deck extends DeckContent {
  readonly id: DeckId;
  /** ISO 8601 */
  readonly createdAt: string;
  /** ISO 8601 */
  readonly updatedAt: string;
}
