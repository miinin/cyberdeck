import type { Card } from './card';

/** Search and filter rules for the card list (docs/UX.md luku 5.3). Pure functions, no dependencies. */

/** Known card types in display order. Unknown types from the data are appended after these. */
export const KNOWN_CARD_TYPES: readonly string[] = ['Legend', 'Unit', 'Gear', 'Program'];

/** Known card colors in display order. Unknown colors from the data are appended after these. */
export const KNOWN_CARD_COLORS: readonly string[] = ['Red', 'Yellow', 'Green', 'Blue'];

export interface CardFilterCriteria {
  /** Free text as typed by the user. Matched against name and subname. */
  query: string;
  /** Selected types. Empty = all types. */
  types: readonly string[];
  /** Selected colors. Empty = all colors (also cards without a color). */
  colors: readonly string[];
}

export const EMPTY_CRITERIA: CardFilterCriteria = { query: '', types: [], colors: [] };

const COMBINING_MARKS = /\p{M}/gu;
const WHITESPACE_RUN = /\s+/g;

/**
 * Case- and accent-insensitive form of a text: "  Judy  Álvarez " → "judy alvarez".
 * Plain text only: the result is compared with `includes`, never used as a pattern.
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(WHITESPACE_RUN, ' ')
    .trim();
}

/** True when the search text, a type or a color narrows the list. */
export function isFilterActive(criteria: CardFilterCriteria): boolean {
  return normalizeForSearch(criteria.query) !== '' || criteria.types.length > 0 || criteria.colors.length > 0;
}

/**
 * Cards matching all of: the search text (part of "name subname"), one of the selected
 * types (OR), one of the selected colors (OR). An empty group does not filter.
 * The original order is kept.
 */
export function filterCards(cards: readonly Card[], criteria: CardFilterCriteria): Card[] {
  const query = normalizeForSearch(criteria.query);
  const types = new Set(criteria.types);
  const colors = new Set(criteria.colors);

  return cards.filter((card) => {
    if (types.size > 0 && !types.has(card.type)) return false;
    if (colors.size > 0 && (card.color === null || !colors.has(card.color))) return false;
    if (query === '') return true;
    const searchable = card.subname === null ? card.name : `${card.name} ${card.subname}`;
    return normalizeForSearch(searchable).includes(query);
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
