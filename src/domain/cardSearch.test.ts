import type { Card } from './card';
import {
  EMPTY_CRITERIA,
  KNOWN_CARD_COLORS,
  KNOWN_CARD_TYPES,
  filterCards,
  filterOptions,
  isFilterActive,
  matchesNumberFilter,
  normalizeForSearch,
  NUMBER_FILTER_CAPS,
  numberFilterOptions,
  numberFilterOptionsFor,
  numberOption,
  toggleValue,
} from './cardSearch';
import type { CardFilterCriteria } from './cardSearch';

function card(slug: string, name: string, subname: string | null, type: string, color: string | null): Card {
  return {
    id: `id-${slug}`,
    key: `key-${slug}`,
    slug,
    name,
    subname,
    displayName: subname === null ? name : `${name} — ${subname}`,
    type,
    color,
    cost: null,
    power: null,
    ram: null, rarity: null,
  };
}

const cards: Card[] = [
  card('johnny-renegade', 'Johnny Silverhand', 'Rocking Renegade', 'Legend', 'Red'),
  card('johnny-fighting', 'Johnny Silverhand', 'Never Stop Fighting', 'Unit', 'Red'),
  card('v-streetkid', 'V', 'Streetkid', 'Legend', 'Blue'),
  card('judy', 'Judy Álvarez', 'Braindance Prodigy', 'Unit', 'Green'),
  card('sombreron', 'El Sombrerón', null, 'Gear', 'Yellow'),
  card('pinch', 'Viktor Vektor', 'You Might Feel a Little Pinch', 'Program', 'Blue'),
  card('mystery', 'Mystery (Prototype)', "Rogue's Edge", 'Program', null),
];

function slugs(result: Card[]): string[] {
  return result.map((item) => item.slug);
}

function search(query: string, extra: Partial<CardFilterCriteria> = {}): string[] {
  return slugs(filterCards(cards, { ...EMPTY_CRITERIA, query, ...extra }));
}

describe('normalizeForSearch', () => {
  it('lowercases, removes accents and collapses whitespace', () => {
    expect(normalizeForSearch('  Judy   ÁLVAREZ\t')).toBe('judy alvarez');
    expect(normalizeForSearch('Les Élémens')).toBe('les elemens');
  });

  it('turns whitespace-only text into an empty string', () => {
    expect(normalizeForSearch(' \n\t ')).toBe('');
  });

  it('turns punctuation into spaces (B-013)', () => {
    expect(normalizeForSearch('Judy Álvarez: Nothing to Doubt')).toBe('judy alvarez nothing to doubt');
    expect(normalizeForSearch('Mystery (Prototype), Rogue-Edge!')).toBe('mystery prototype rogue edge');
  });

  it('removes invisible format characters (B-014)', () => {
    expect(normalizeForSearch('jud​y')).toBe('judy');
    expect(normalizeForSearch('‮judy‎')).toBe('judy');
    expect(normalizeForSearch('​')).toBe('');
  });
});

describe('filterCards: search text', () => {
  it('returns every card in the original order when nothing is selected', () => {
    expect(slugs(filterCards(cards, EMPTY_CRITERIA))).toEqual(slugs(cards));
  });

  it('finds part of a word regardless of case', () => {
    expect(search('silver')).toEqual(['johnny-renegade', 'johnny-fighting']);
    expect(search('SILVER')).toEqual(['johnny-renegade', 'johnny-fighting']);
    expect(search('sIlVeRhAnD')).toEqual(['johnny-renegade', 'johnny-fighting']);
  });

  it('searches the subname and across name and subname', () => {
    expect(search('renegade')).toEqual(['johnny-renegade']);
    expect(search('v streetkid')).toEqual(['v-streetkid']);
    expect(search('silverhand never')).toEqual(['johnny-fighting']);
  });

  it('ignores accents on both sides', () => {
    expect(search('alvarez')).toEqual(['judy']);
    expect(search('Álvarez')).toEqual(['judy']);
    expect(search('ALVÁREZ')).toEqual(['judy']);
    expect(search('sombreron')).toEqual(['sombreron']);
  });

  it('trims and collapses spaces in the search text', () => {
    expect(search('   johnny    silverhand   rocking ')).toEqual(['johnny-renegade']);
  });

  it('treats whitespace-only search text as no search', () => {
    expect(search('    ')).toEqual(slugs(cards));
    expect(isFilterActive({ ...EMPTY_CRITERIA, query: '   ' })).toBe(false);
  });

  it('matches special characters literally, not as patterns', () => {
    expect(search('(prototype)')).toEqual(['mystery']);
    expect(search("rogue's")).toEqual(['mystery']);
    expect(search('$')).toEqual([]);
    expect(search('^')).toEqual([]);
    expect(search('+')).toEqual([]);
    expect(search('|')).toEqual([]);
    expect(search('a$')).toEqual([]);
  });

  it('treats punctuation-only search text as no search, like an empty field (B-013)', () => {
    // Punctuation is a word separator, so these contain no words (and are never regex patterns).
    for (const query of ['.*', '*', '(', '[', '\\', ': -']) {
      expect(search(query)).toEqual(slugs(cards));
      expect(isFilterActive({ ...EMPTY_CRITERIA, query })).toBe(false);
    }
  });

  it('finds a card by its name pasted as "Name: Subname" (B-013)', () => {
    expect(search('V: Streetkid')).toEqual(['v-streetkid']);
    expect(search('Judy Álvarez: Braindance Prodigy')).toEqual(['judy']);
    expect(search('Johnny Silverhand — Rocking Renegade')).toEqual(['johnny-renegade']);
  });

  it('requires every word but not their order or adjacency (B-013)', () => {
    expect(search('johnny rocking')).toEqual(['johnny-renegade']);
    expect(search('renegade johnny')).toEqual(['johnny-renegade']);
    expect(search('johnny streetkid')).toEqual([]);
  });

  it('ignores invisible characters in the search text (B-014)', () => {
    expect(search('jud​y')).toEqual(['judy']);
    expect(search('‮judy')).toEqual(['judy']);
    expect(search('​')).toEqual(slugs(cards));
    expect(isFilterActive({ ...EMPTY_CRITERIA, query: '​' })).toBe(false);
  });

  it('treats an XSS string as plain text (SR-1)', () => {
    expect(search('<script>alert(1)</script>')).toEqual([]);
    expect(search('"><img src=x onerror=alert(1)>')).toEqual([]);

    const sneaky = [card('xss', '<script>alert(1)</script>', null, 'Unit', 'Red')];
    expect(slugs(filterCards(sneaky, { ...EMPTY_CRITERIA, query: '<SCRIPT>' }))).toEqual(['xss']);
  });

  it('copes with very long search text', () => {
    expect(search('x'.repeat(10_000))).toEqual([]);
  });
});

describe('filterCards: types and colors', () => {
  it('shows cards of any selected type (OR within the group)', () => {
    expect(slugs(filterCards(cards, { ...EMPTY_CRITERIA, types: ['Legend'] }))).toEqual([
      'johnny-renegade',
      'v-streetkid',
    ]);
    expect(slugs(filterCards(cards, { ...EMPTY_CRITERIA, types: ['Gear', 'Legend'] }))).toEqual([
      'johnny-renegade',
      'v-streetkid',
      'sombreron',
    ]);
  });

  it('shows cards of any selected color (OR within the group)', () => {
    expect(slugs(filterCards(cards, { ...EMPTY_CRITERIA, colors: ['Blue', 'Yellow'], rarities: [] }))).toEqual([
      'v-streetkid',
      'sombreron',
      'pinch',
    ]);
  });

  it('shows a card without a color only when no color is selected', () => {
    expect(slugs(filterCards(cards, { ...EMPTY_CRITERIA, types: ['Program'] }))).toEqual(['pinch', 'mystery']);
    expect(slugs(filterCards(cards, { ...EMPTY_CRITERIA, types: ['Program'], colors: KNOWN_CARD_COLORS }))).toEqual([
      'pinch',
    ]);
  });

  it('combines search text, types and colors with AND', () => {
    expect(search('johnny', { types: ['Unit'] })).toEqual(['johnny-fighting']);
    expect(search('johnny', { types: ['Unit', 'Legend'], colors: ['Red'], rarities: [] })).toEqual([
      'johnny-renegade',
      'johnny-fighting',
    ]);
    expect(search('v', { types: ['Legend'], colors: ['Blue'], rarities: [] })).toEqual(['v-streetkid']);
    expect(search('johnny', { colors: ['Blue'], rarities: [] })).toEqual([]);
  });

  it('does not change the input list', () => {
    const copy = [...cards];
    filterCards(cards, { ...EMPTY_CRITERIA, query: 'johnny', types: ['Unit'], colors: ['Red'] });
    expect(cards).toEqual(copy);
  });
});

describe('isFilterActive', () => {
  it('is active when search text, a type or a color is used', () => {
    expect(isFilterActive(EMPTY_CRITERIA)).toBe(false);
    expect(isFilterActive({ ...EMPTY_CRITERIA, query: 'v' })).toBe(true);
    expect(isFilterActive({ ...EMPTY_CRITERIA, types: ['Unit'] })).toBe(true);
    expect(isFilterActive({ ...EMPTY_CRITERIA, colors: ['Red'], rarities: [] })).toBe(true);
  });
});

describe('filterOptions', () => {
  it('lists the known values in fixed order even when the data lacks some', () => {
    expect(filterOptions(KNOWN_CARD_TYPES, ['Unit'])).toEqual(['Legend', 'Unit', 'Gear', 'Program']);
  });

  it('appends unknown values once, in the order first seen, and skips null', () => {
    expect(filterOptions(KNOWN_CARD_COLORS, ['Red', 'Purple', null, 'Black', 'Purple'])).toEqual([
      'Red',
      'Yellow',
      'Green',
      'Blue',
      'Purple',
      'Black',
    ]);
  });

  it('keeps a selected value that no longer appears in the data', () => {
    expect(filterOptions(KNOWN_CARD_TYPES, ['Unit'], ['Token'])).toEqual([
      'Legend',
      'Unit',
      'Gear',
      'Program',
      'Token',
    ]);
  });
});

describe('toggleValue', () => {
  it('adds a missing value and removes a present one', () => {
    expect(toggleValue(['Red'], 'Blue')).toEqual(['Red', 'Blue']);
    expect(toggleValue(['Red', 'Blue'], 'Red')).toEqual(['Blue']);
  });
});

describe('filterCards: rarity', () => {
  const withRarity = (slug: string, rarity: string | null): Card => ({
    ...card(slug, slug, null, 'Unit', null),
    rarity,
  });
  const cardsByRarity = [withRarity('a', 'Common'), withRarity('b', 'Rare'), withRarity('c', null), withRarity('d', 'Epic')];

  it('keeps cards of any selected rarity (OR) and drops cards without one', () => {
    const result = filterCards(cardsByRarity, { ...EMPTY_CRITERIA, rarities: ['Rare', 'Epic'] });
    expect(result.map((c) => c.slug)).toEqual(['b', 'd']);
  });

  it('does not filter with no rarity selected and counts as an active filter when selected', () => {
    expect(filterCards(cardsByRarity, EMPTY_CRITERIA)).toHaveLength(4);
    expect(isFilterActive({ ...EMPTY_CRITERIA, rarities: ['Rare'] })).toBe(true);
  });
});

describe('number filters: Cost, Power and RAM (T-052)', () => {
  const withNumbers = (slug: string, cost: number | null, power: number | null, ram: number | null): Card => ({
    ...card(slug, slug, null, 'Unit', null),
    cost,
    power,
    ram,
  });
  const numbered = [
    withNumbers('a', 1, 0, 1),
    withNumbers('b', 3, 4, 2),
    withNumbers('c', 9, 10, 4),
    withNumbers('d', 12, 15, 6),
    withNumbers('legend', null, null, 2),
  ];

  it('maps a value to its option, with one "N+" option from the cap up', () => {
    expect(numberOption(3, NUMBER_FILTER_CAPS.cost)).toBe('3');
    expect(numberOption(9, NUMBER_FILTER_CAPS.cost)).toBe('9+');
    expect(numberOption(15, NUMBER_FILTER_CAPS.power)).toBe('10+');
    expect(numberOption(0, NUMBER_FILTER_CAPS.power)).toBe('0');
  });

  it('lists the values found in the data in numeric order, and keeps a selected option', () => {
    expect(numberFilterOptions([3, null, 1, 12, 9, 3], 9)).toEqual(['1', '3', '9+']);
    expect(numberFilterOptions([10, 2, 0, 9], 10)).toEqual(['0', '2', '9', '10+']);
    expect(numberFilterOptions([1, 2], 4, ['7+', '3'])).toEqual(['1', '2', '3', '7+']);
    expect(numberFilterOptions([], 4)).toEqual([]);
  });

  it('matches exact values and "N+" ranges, never null, and everything with nothing selected', () => {
    expect(matchesNumberFilter(3, ['3'])).toBe(true);
    expect(matchesNumberFilter(4, ['3'])).toBe(false);
    expect(matchesNumberFilter(12, ['9+'])).toBe(true);
    expect(matchesNumberFilter(8, ['9+'])).toBe(false);
    expect(matchesNumberFilter(0, ['0', '5'])).toBe(true);
    expect(matchesNumberFilter(null, ['0'])).toBe(false);
    expect(matchesNumberFilter(null, [])).toBe(true);
  });

  it('filters by Cost, Power and RAM with OR inside a group and AND between groups', () => {
    const run = (criteria: Partial<CardFilterCriteria>) =>
      filterCards(numbered, { ...EMPTY_CRITERIA, ...criteria }).map((c) => c.slug);
    expect(run({ costs: ['1', '9+'] })).toEqual(['a', 'c', 'd']);
    expect(run({ powers: ['10+'] })).toEqual(['c', 'd']);
    expect(run({ rams: ['2'] })).toEqual(['b', 'legend']);
    expect(run({ costs: ['3', '9+'], rams: ['4+'] })).toEqual(['c', 'd']);
    // A card without Cost is dropped as soon as a Cost is selected.
    expect(run({ costs: ['1', '3', '9+'] })).not.toContain('legend');
    expect(run({})).toHaveLength(5);
  });

  it('gives the options of all three groups for a card list', () => {
    expect(numberFilterOptionsFor(numbered, { ...EMPTY_CRITERIA, costs: ['5'] })).toEqual({
      costs: ['1', '3', '5', '9+'],
      powers: ['0', '4', '10+'],
      rams: ['1', '2', '4+'],
    });
  });

  it('counts as an active filter when a value is selected', () => {
    expect(isFilterActive({ ...EMPTY_CRITERIA, costs: ['3'] })).toBe(true);
    expect(isFilterActive({ ...EMPTY_CRITERIA, powers: ['10+'] })).toBe(true);
    expect(isFilterActive({ ...EMPTY_CRITERIA, rams: ['1'] })).toBe(true);
  });
});
