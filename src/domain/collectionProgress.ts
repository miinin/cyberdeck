import { artsOf, ownedPerArt, SPECIAL_ART_RARITIES } from './arts';
import { playsetSize } from './card';
import type { Card } from './card';
import { countOf, versionsOf } from './collection';
import type { Collection } from './collection';
import { KNOWN_CARD_COLORS, KNOWN_CARD_RARITIES, KNOWN_CARD_TYPES, officialRarity } from './cardSearch';
import { hasSetPrinting, ownsSetVersion, setOptions } from './setFilter';
import type { SetGroup } from './setFilter';

/*
 * Collection progress (T-105): pure counts over the card list and the collection. "Owned" always means at
 * least one copy of the card; the copies of a card that are not broken down by printing (D-020) count for the
 * card itself but not for any set.
 */

/** Owned out of all, for one row of a breakdown. */
export interface Progress {
  owned: number;
  total: number;
}

export interface CollectionOverview {
  /** Distinct cards with at least one copy. */
  distinct: number;
  total: number;
  copies: number;
  /** Cards owned in a full playset (3, or 1 for a Legend). */
  playsets: number;
  /** Copies of cards that can be sold for eddies (€$). */
  sellableCopies: number;
}

export function collectionOverview(cards: readonly Card[], collection: Collection): CollectionOverview {
  const overview: CollectionOverview = { distinct: 0, total: cards.length, copies: 0, playsets: 0, sellableCopies: 0 };
  for (const card of cards) {
    const count = countOf(collection, card.key);
    if (count <= 0) continue;
    overview.distinct += 1;
    overview.copies += count;
    if (count >= playsetSize(card)) overview.playsets += 1;
    if (card.eddiable === true) overview.sellableCopies += count;
  }
  return overview;
}

export interface SetProgress extends Progress {
  family: string;
  label: string;
  group: SetGroup;
}

/** Per set: cards that have a printing in it and the ones of those with a recorded copy of such a printing. */
export function setProgress(cards: readonly Card[], collection: Collection): SetProgress[] {
  return setOptions(cards).map(({ family, label, group }) => {
    const inSet = cards.filter((card) => hasSetPrinting(card, family));
    return { family, label, group, total: inSet.length, owned: inSet.filter((card) => ownsSetVersion(card, family, collection)).length };
  });
}

export interface RarityProgress extends Progress {
  rarity: string;
}

/** Per official rarity of the card (its first printing), in the order of KNOWN_CARD_RARITIES; unknown ones last. Cards without a rarity are left out. */
export function rarityProgress(cards: readonly Card[], collection: Collection): RarityProgress[] {
  const rows = new Map<string, Progress>();
  for (const card of cards) {
    if (card.rarity === null) continue;
    const rarity = officialRarity(card.rarity);
    const row = rows.get(rarity) ?? { owned: 0, total: 0 };
    row.total += 1;
    if (countOf(collection, card.key) > 0) row.owned += 1;
    rows.set(rarity, row);
  }
  const ordered = [...KNOWN_CARD_RARITIES.filter((rarity) => rows.has(rarity)), ...[...rows.keys()].filter((rarity) => !KNOWN_CARD_RARITIES.includes(rarity)).sort()];
  return ordered.map((rarity) => ({ rarity, ...(rows.get(rarity) as Progress) }));
}

/**
 * Per special art rarity under its official name (D-021, T-078): Iconic Legend, Iconic Other and Iconic Secret are one
 * "Iconic Rare" row, Nova Rare its own. Cards with that art and those with a copy of it. Rows without cards are left out.
 */
export function specialArtProgress(
  cards: readonly Card[],
  collection: Collection,
  hasArt: (cardKey: string, rarity: string) => boolean = () => true,
): RarityProgress[] {
  const rows = new Map<string, Progress>();
  for (const card of cards) {
    const arts = artsOf(card, hasArt);
    const entry = collection.entries.find((e) => e.card === card.key);
    const owned = ownedPerArt(entry, card, arts);
    for (const art of arts) {
      if (art.rarity === null) continue;
      const name = officialRarity(art.rarity) ?? art.rarity;
      const row = rows.get(name) ?? { owned: 0, total: 0 };
      row.total += 1;
      if ((owned.get(art.artId) ?? 0) > 0) row.owned += 1;
      rows.set(name, row);
    }
  }
  const order = [...new Set(SPECIAL_ART_RARITIES.map((rarity) => officialRarity(rarity) ?? rarity))];
  return order.filter((rarity) => rows.has(rarity)).map((rarity) => ({ rarity, ...(rows.get(rarity) as Progress) }));
}

export interface ValueProgress extends Progress {
  /** The color or type; null = the card has no color. */
  value: string | null;
}

function byValue(cards: readonly Card[], collection: Collection, pick: (card: Card) => string | null, known: readonly string[]): ValueProgress[] {
  const rows = new Map<string | null, Progress>();
  for (const card of cards) {
    const value = pick(card);
    const row = rows.get(value) ?? { owned: 0, total: 0 };
    row.total += 1;
    if (countOf(collection, card.key) > 0) row.owned += 1;
    rows.set(value, row);
  }
  const values = [...rows.keys()];
  const ordered = [
    ...known.filter((value) => rows.has(value)),
    ...values.filter((value): value is string => value !== null && !known.includes(value)).sort(),
    ...values.filter((value) => value === null),
  ];
  return ordered.map((value) => ({ value, ...(rows.get(value) as Progress) }));
}

export const colorProgress = (cards: readonly Card[], collection: Collection): ValueProgress[] =>
  byValue(cards, collection, (card) => card.color, KNOWN_CARD_COLORS);

export const typeProgress = (cards: readonly Card[], collection: Collection): ValueProgress[] =>
  byValue(cards, collection, (card) => card.type, KNOWN_CARD_TYPES);

export interface MissingFilter {
  /** Only cards that have a printing in this set (filter id), or null for all. */
  set: string | null;
  /** Only cards of this official rarity, or null for all. */
  rarity: string | null;
}

export const NO_MISSING_FILTER: MissingFilter = { set: null, rarity: null };

/** Cards with no copy at all in the collection, in the order of `cards`, narrowed by the filter. */
export function missingCards(cards: readonly Card[], collection: Collection, filter: MissingFilter = NO_MISSING_FILTER): Card[] {
  return cards.filter(
    (card) =>
      countOf(collection, card.key) === 0 &&
      (filter.set === null || hasSetPrinting(card, filter.set)) &&
      (filter.rarity === null || (card.rarity !== null && officialRarity(card.rarity) === filter.rarity)),
  );
}

/** Whether the collection has any recorded printing (D-020); without one the per-set rows are all zero. */
export function hasRecordedVersions(cards: readonly Card[], collection: Collection): boolean {
  return cards.some((card) => Object.keys(versionsOf(collection, card.key)).length > 0);
}
