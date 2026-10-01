import type { Card } from './card';
import {
  EMPTY_CRITERIA,
  KNOWN_CARD_COLORS,
  KNOWN_CARD_TYPES,
  filterCards,
  filterOptions,
  isFilterActive,
  normalizeForSearch,
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
    expect(slugs(filterCards(cards, { ...EMPTY_CRITERIA, colors: ['Blue', 'Yellow'] }))).toEqual([
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
    expect(search('johnny', { types: ['Unit', 'Legend'], colors: ['Red'] })).toEqual([
      'johnny-renegade',
      'johnny-fighting',
    ]);
    expect(search('v', { types: ['Legend'], colors: ['Blue'] })).toEqual(['v-streetkid']);
    expect(search('johnny', { colors: ['Blue'] })).toEqual([]);
  });

  it('does not change the input list', () => {
    const copy = [...cards];
    filterCards(cards, { query: 'johnny', types: ['Unit'], colors: ['Red'] });
    expect(cards).toEqual(copy);
  });
});

describe('isFilterActive', () => {
  it('is active when search text, a type or a color is used', () => {
    expect(isFilterActive(EMPTY_CRITERIA)).toBe(false);
    expect(isFilterActive({ ...EMPTY_CRITERIA, query: 'v' })).toBe(true);
    expect(isFilterActive({ ...EMPTY_CRITERIA, types: ['Unit'] })).toBe(true);
    expect(isFilterActive({ ...EMPTY_CRITERIA, colors: ['Red'] })).toBe(true);
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
