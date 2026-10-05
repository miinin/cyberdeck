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
  /** Selected Cost values as number filter options ("3", "9+"). Empty = all (also cards without Cost). */
  costs: readonly string[];
  /** Selected Power values as number filter options. Empty = all. */
  powers: readonly string[];
  /** Selected RAM values as number filter options. Empty = all. */
  rams: readonly string[];
}

/** The criteria keys of the number filters (T-052). */
export type NumberFilterGroup = 'costs' | 'powers' | 'rams';

export const EMPTY_CRITERIA: CardFilterCriteria = {
  query: '',
  types: [],
  colors: [],
  rarities: [],
  costs: [],
  powers: [],
  rams: [],
};

/**
 * From these values up the number filters have a single "N+" option (T-052): Cost 9+, Power 10+, RAM 5+ (T-059: 5 vaatii kolme saman väristä Legendiä).
 * Below the cap every value found in the data is its own option.
 */
export const NUMBER_FILTER_CAPS = { cost: 9, power: 10, ram: 5 } as const;

/** The number filter option a value belongs to: 3 → "3", 12 with cap 10 → "10+". */
export function numberOption(value: number, cap: number): string {
  return value >= cap ? `${cap}+` : String(value);
}

/** Smallest value an option stands for, for ordering: "3" → 3, "10+" → 10. */
function optionStart(option: string): number {
  return Number.parseInt(option, 10);
}

/**
 * Options for a number filter: one per value in the data below the cap, then "N+" if any value reaches
 * the cap, plus any selected option (so it can always be removed), in numeric order. `null` is no option.
 */
export function numberFilterOptions(
  values: Iterable<number | null>,
  cap: number,
  selected: readonly string[] = [],
): string[] {
  const options = new Set<string>(selected);
  for (const value of values) {
    if (value !== null && Number.isFinite(value)) options.add(numberOption(value, cap));
  }
  return [...options].sort((a, b) => optionStart(a) - optionStart(b) || a.length - b.length);
}

const NUMBER_FIELDS: readonly (readonly [NumberFilterGroup, keyof typeof NUMBER_FILTER_CAPS])[] = [
  ['costs', 'cost'],
  ['powers', 'power'],
  ['rams', 'ram'],
];

/** Options of every number filter group for these cards, keeping the selected ones. */
export function numberFilterOptionsFor(
  cards: readonly Card[],
  criteria: CardFilterCriteria,
): Record<NumberFilterGroup, string[]> {
  const options = (group: NumberFilterGroup, field: keyof typeof NUMBER_FILTER_CAPS) =>
    numberFilterOptions(
      cards.map((card) => card[field]),
      NUMBER_FILTER_CAPS[field],
      criteria[group],
    );
  return { costs: options('costs', 'cost'), powers: options('powers', 'power'), rams: options('rams', 'ram') };
}

/**
 * True when the value matches one of the selected options ("3" exactly, "9+" from 9 up). Nothing
 * selected matches every value; a card without the value (null) never matches a selection.
 */
export function matchesNumberFilter(value: number | null, selected: readonly string[]): boolean {
  if (selected.length === 0) return true;
  if (value === null) return false;
  return selected.some((option) =>
    option.endsWith('+') ? value >= optionStart(option) : value === optionStart(option),
  );
}

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

/** True when the search text or any filter group narrows the list. */
export function isFilterActive(criteria: CardFilterCriteria): boolean {
  return (
    normalizeForSearch(criteria.query) !== '' || criteria.types.length > 0 || criteria.colors.length > 0 ||
    criteria.rarities.length > 0 || criteria.costs.length > 0 || criteria.powers.length > 0 ||
    criteria.rams.length > 0
  );
}

/** The card's own rarity or the rarity of any of its printings is selected (D-021). */
function hasRarity(card: Card, rarities: ReadonlySet<string>): boolean {
  if (card.rarity !== null && rarities.has(card.rarity)) return true;
  return (card.printings ?? []).some((p) => p.rarity !== null && rarities.has(p.rarity));
}

/**
 * Cards matching all of: every word of the search text (each a part of "name subname", in any
 * order, B-013), and in every group (type, color, rarity, Cost, Power, RAM) one of the selected values
 * (OR within a group). An empty group does not filter. The original order is kept.
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
    if (rarities.size > 0 && !hasRarity(card, rarities)) return false;
    for (const [group, field] of NUMBER_FIELDS) {
      if (!matchesNumberFilter(card[field], criteria[group])) return false;
    }
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
