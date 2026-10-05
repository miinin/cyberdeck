import { isCardKey } from './cardKey';
import type { CardKey } from './cardKey';
import { isPrintingKey, MAX_VERSIONS_PER_CARD } from './printing';
import type { PrintingKey } from './printing';

export const MAX_COLLECTION_COUNT = 999; // SR-11
export const MAX_COLLECTION_ENTRIES = 5000; // SR-11

/** One owned card. A stored count is always 1–999; count 0 means the row does not exist. */
export interface CollectionEntry {
  readonly card: CardKey;
  readonly count: number;
  /**
   * Optional breakdown of the copies by printing (D-020). The sum is at most `count`; the rest is
   * "version unknown". Absent when nothing is broken down.
   */
  readonly versions?: Readonly<Record<PrintingKey, number>>;
}

export type Versions = Readonly<Record<PrintingKey, number>>;

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

/** The copies of `card` broken down by printing (empty when none). */
export function versionsOf(collection: Collection, card: CardKey): Versions {
  return collection.entries.find((entry) => entry.card === card)?.versions ?? {};
}

export function versionsTotal(versions: Versions | undefined): number {
  return versions === undefined ? 0 : Object.values(versions).reduce((sum, n) => sum + n, 0);
}

/** Copies of `card` whose printing is not known: count minus the breakdown. */
export function unknownVersionCount(collection: Collection, card: CardKey): number {
  return countOf(collection, card) - versionsTotal(versionsOf(collection, card));
}

/** The lowest count `card` can be set to: the sum of its breakdown (D-020: lower is blocked, never trimmed). */
export function minCountOf(collection: Collection, card: CardKey): number {
  return versionsTotal(versionsOf(collection, card));
}

function checkCount(count: number): void {
  if (!Number.isInteger(count) || count < 0 || count > MAX_COLLECTION_COUNT) {
    throw new RangeError('Count must be an integer 0–999');
  }
}

function rebuilt(collection: Collection, entry: CollectionEntry | null, card: CardKey): Collection {
  const entries = collection.entries.filter((other) => other.card !== card);
  if (entry !== null && entry.count > 0) entries.push(entry);
  entries.sort((a, b) => compareCardKeys(a.card, b.card));
  return { entries };
}

function entryWith(card: CardKey, count: number, versions: Versions): CollectionEntry {
  return Object.keys(versions).length > 0 ? { card, count, versions } : { card, count };
}

/**
 * Returns a new collection where `card` has `count` copies (0 removes the row). The breakdown by printing is
 * kept. Throws RangeError for an invalid key, a count that is not an integer 0–999 or a count below the
 * breakdown's sum (check minCountOf first, or use trySetCount).
 */
export function withCount(collection: Collection, card: CardKey, count: number): Collection {
  if (!isCardKey(card)) throw new RangeError('Invalid card key');
  checkCount(count);
  const versions = versionsOf(collection, card);
  if (count < versionsTotal(versions)) throw new RangeError('Count is below the total of the versions');
  return rebuilt(collection, count > 0 ? entryWith(card, count, versions) : null, card);
}

export type SetCountResult =
  | { ok: true; collection: Collection }
  /** The count is below the breakdown's sum; the user must lower a version first. */
  | { ok: false; minimum: number };

/** Like withCount, but a count below the breakdown's sum is reported instead of thrown. */
export function trySetCount(collection: Collection, card: CardKey, count: number): SetCountResult {
  const minimum = isCardKey(card) ? minCountOf(collection, card) : 0;
  if (Number.isInteger(count) && count < minimum) return { ok: false, minimum };
  return { ok: true, collection: withCount(collection, card, count) };
}

/**
 * Sets the copies of one printing of `card` and moves the total with it: raising a version raises the count
 * by the same amount, lowering it lowers the count; the "unknown" copies stay as they are (D-020).
 * Throws RangeError for an invalid key, a negative or too large number, more than 32 printings or a total over 999.
 */
export function setVersionCount(collection: Collection, card: CardKey, printing: PrintingKey, n: number): Collection {
  if (!isCardKey(card)) throw new RangeError('Invalid card key');
  if (!isPrintingKey(printing)) throw new RangeError('Invalid printing key');
  checkCount(n);
  const current = versionsOf(collection, card);
  const before = current[printing] ?? 0;
  const versions: Record<PrintingKey, number> = Object.fromEntries(
    Object.entries(current).filter(([key]) => key !== printing),
  );
  if (n > 0) versions[printing] = n;
  if (Object.keys(versions).length > MAX_VERSIONS_PER_CARD) throw new RangeError('Too many versions');
  const count = countOf(collection, card) + n - before;
  checkCount(count);
  return rebuilt(collection, count > 0 ? entryWith(card, count, versions) : null, card);
}

/** Lookup table for the UI. A Map, never a plain object, so any key is safe (SR-11). */
export function toCountMap(collection: Collection): Map<CardKey, number> {
  return new Map(collection.entries.map((entry) => [entry.card, entry.count]));
}
