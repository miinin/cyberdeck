import { compareCardKeys, EMPTY_COLLECTION, MAX_COLLECTION_COUNT, MAX_COLLECTION_ENTRIES } from './collection';
import type { Collection, CollectionEntry } from './collection';
import { isCardKey } from './cardKey';
import type { CardKey } from './cardKey';

/**
 * Cards the user wants (D-018). Same shape and limits as the collection (SR-11): count is how many more
 * copies the user wants (1–999), not a target total, and it does not shrink when the collection grows.
 */
export type WantList = Collection;
export const EMPTY_WANTS: WantList = EMPTY_COLLECTION;

export interface MissingRow {
  readonly card: CardKey;
  readonly missing: number;
}

/**
 * Adds the missing cards of a deck to the want list with the max rule: a card's want becomes
 * max(current want, missing), capped at 999, so the same shortfall from several decks is not counted twice
 * and a larger existing want is kept. Invalid rows (bad key, missing not a positive integer) are skipped.
 * New cards are added only while the list has room (5000 rows). Returns the same object when nothing changes.
 */
export function addMissingToWants(wants: WantList, rows: readonly MissingRow[]): WantList {
  const counts = new Map<CardKey, number>(wants.entries.map((entry) => [entry.card, entry.count]));
  let changed = false;
  for (const { card, missing } of rows) {
    if (!isCardKey(card) || !Number.isInteger(missing) || missing < 1) continue;
    const target = Math.min(missing, MAX_COLLECTION_COUNT);
    const current = counts.get(card);
    if (current === undefined) {
      if (counts.size >= MAX_COLLECTION_ENTRIES) continue;
    } else if (current >= target) {
      continue;
    }
    counts.set(card, target);
    changed = true;
  }
  if (!changed) return wants;
  const entries: CollectionEntry[] = [...counts].map(([card, count]) => ({ card, count }));
  entries.sort((a, b) => compareCardKeys(a.card, b.card));
  return { entries };
}
