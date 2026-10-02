import type { Card } from './card';

/** Search and filter rules for the card list (docs/UX.md luku 5.3). Pure functions, no dependencies. */

/** Known card types in display order. Unknown types from the data are appended after these. */
export const KNOWN_CARD_TYPES: readonly string[] = ['Legend', 'Unit', 'Gear', 'Program'];

/** Known rarities in display order. Unknown rarities from the data are appended after these. */
export const KNOWN_CARD_RARITIES: readonly string[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Secret', 'Nova Rare'];

/** Known card colors in display order. Unknown colors from the data are appended after these. */
export const KNOWN_CARD_COLORS: readonly string[] = ['Red', 'Yellow', 'Green', 'Blue'];

export interface CardFilterCriteria {
  /** Free text as typed by the user. Matched against name and subname. */
  query: string;
  /** Selected types. Empty = all types. */
  types: readonly string[];
  /** Selected colors. Empty = all colors (also cards without a color). */
  colors: readonly string[];
  /** Selected rarities. Empty = all rarities (also cards without one). */
  rarities: readonly string[];
}

export const EMPTY_CRITERIA: CardFilterCriteria = { query: '', types: [], colors: [], rarities: [] };

const COMBINING_MARKS = /\p{M}/gu;
/** Invisible format characters such as zero-width spaces and direction marks (B-014). */
const FORMAT_CHARACTERS = /\p{Cf}/gu;
/** Punctuation separates words, so "V: Streetkid" matches "V Streetkid" (B-013). */
const PUNCTUATION = /\p{P}/gu;
const WHITESPACE_RUN = /\s+/g;

/**
 * Case-, accent- and punctuation-insensitive form of a text: "  Judy  Álvarez: " → "judy alvarez".
 * Plain text only: the result is compared with `includes`, never used as a pattern.
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(FORMAT_CHARACTERS, '')
    .toLowerCase()
    .replace(PUNCTUATION, ' ')
    .replace(WHITESPACE_RUN, ' ')
    .trim();
}

/** True when the search text, a type or a color narrows the list. */
export function isFilterActive(criteria: CardFilterCriteria): boolean {
  return (
    normalizeForSearch(criteria.query) !== '' || criteria.types.length > 0 || criteria.colors.length > 0 ||
    criteria.rarities.length > 0
  );
}

/**
 * Cards matching all of: every word of the search text (each a part of "name subname", in any
 * order, B-013), one of the selected types (OR), one of the selected colors (OR). An empty group
 * does not filter. The original order is kept.
 */
export function filterCards(cards: readonly Card[], criteria: CardFilterCriteria): Card[] {
  const normalizedQuery = normalizeForSearch(criteria.query);
  const words = normalizedQuery === '' ? [] : normalizedQuery.split(' ');
  const types = new Set(criteria.types);
  const colors = new Set(criteria.colors);
  const rarities = new Set(criteria.rarities);

  return cards.filter((card) => {
    if (types.size > 0 && !types.has(card.type)) return false;
    if (colors.size > 0 && (card.color === null || !colors.has(card.color))) return false;
    if (rarities.size > 0 && (card.rarity === null || !rarities.has(card.rarity))) return false;
    if (words.length === 0) return true;
    const searchable = normalizeForSearch(card.subname === null ? card.name : `${card.name} ${card.subname}`);
    return words.every((word) => searchable.includes(word));
  });
}

/**
 * Options for a filter group: the known values in their fixed order, then any other value
 * found in the data or currently selected (so a selection can always be removed), in the
 * order first seen. `null` values are not options.
 */
export function filterOptions(
  known: readonly string[],
  values: Iterable<string | null>,
  selected: readonly string[] = [],
): string[] {
  const options = [...known];
  const seen = new Set(known);
  for (const value of [...values, ...selected]) {
    if (value === null || seen.has(value)) continue;
    seen.add(value);
    options.push(value);
  }
  return options;
}

/** Adds the value if missing, removes it if present. Keeps the order of the others. */
export function toggleValue(values: readonly string[], value: string): string[] {
  return values.includes(value) ? values.filter((current) => current !== value) : [...values, value];
}
