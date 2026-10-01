import { isCardKey } from './cardKey';
import type { CardKey } from './cardKey';

export const MAX_COLLECTION_COUNT = 999; // SR-11
export const MAX_COLLECTION_ENTRIES = 5000; // SR-11

/** One owned card. A stored count is always 1–999; count 0 means the row does not exist. */
export interface CollectionEntry {
  readonly card: CardKey;
  readonly count: number;
}

/** Owned cards, each key at most once, ordered by key. */
export interface Collection {
  readonly entries: readonly CollectionEntry[];
}

export const EMPTY_COLLECTION: Collection = Object.freeze({ entries: Object.freeze([]) });

/** Orders card keys by code unit, so the stored order is the same in every browser and locale. */
export function compareCardKeys(a: CardKey, b: CardKey): number {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

export function countOf(collection: Collection, card: CardKey): number {
  return collection.entries.find((entry) => entry.card === card)?.count ?? 0;
}

/**
 * Returns a new collection where `card` has `count` copies (0 removes the row).
 * Throws RangeError for an invalid key or a count that is not an integer 0–999.
 */
export function withCount(collection: Collection, card: CardKey, count: number): Collection {
  if (!isCardKey(card)) throw new RangeError('Invalid card key');
  if (!Number.isInteger(count) || count < 0 || count > MAX_COLLECTION_COUNT) {
    throw new RangeError('Count must be an integer 0–999');
  }
  const entries = collection.entries.filter((entry) => entry.card !== card);
  if (count > 0) entries.push({ card, count });
  entries.sort((a, b) => compareCardKeys(a.card, b.card));
  return { entries };
}

/** Lookup table for the UI. A Map, never a plain object, so any key is safe (SR-11). */
export function toCountMap(collection: Collection): Map<CardKey, number> {
  return new Map(collection.entries.map((entry) => [entry.card, entry.count]));
}
