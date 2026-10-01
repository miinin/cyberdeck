import { MAX_COLLECTION_ENTRIES } from './collection';
import { MAX_DECK_DISTINCT_CARDS, MAX_DECKS, MAX_SECTIONS } from './deck';
import {
  cleanText,
  EPOCH_TIMESTAMP,
  isDeckId,
  parseCollection,
  parseDeck,
  parseDeckContent,
  parseDeckList,
} from './validate';

const ID = '3f2c8a10-0000-4000-8000-000000000001';
const TIME = '2026-10-01T12:00:00.000Z';

function deck(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: ID,
    name: 'Esimerkkipakka',
    sections: [{ name: 'Legends', cards: [{ card: 'v-streetkid', count: 1 }] }],
    createdAt: TIME,
    updatedAt: TIME,
    ...overrides,
  };
}

function expectNoPrototypePollution() {
  expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  expect(Object.prototype).not.toHaveProperty('polluted');
}

describe('cleanText', () => {
  it('trims and keeps ordinary text, including emoji and diacritics', () => {
    expect(cleanText('  Ääni 🔥 ', 1, 100)).toBe('Ääni 🔥');
  });

  it('removes control characters and line breaks', () => {
    expect(cleanText('Pakka\n// Units (99)\t\u0000\u007F\u0085x', 1, 100)).toBe('Pakka// Units (99)x');
  });

  it('removes bidirectional control characters', () => {
    expect(cleanText('abc\u202Edef\u2066g\u2069', 1, 100)).toBe('abcdefg');
  });

  it('removes invisible direction marks, line and paragraph separators and BOM (SEC-005)', () => {
    expect(cleanText('a‎b‏c؜d e f﻿g', 1, 100)).toBe('abcdefg');
    expect(cleanText('‏ ﻿', 1, 100)).toBeNull();
  });

  it('keeps zero-width joiners and non-joiners that emoji and scripts need', () => {
    const family = '\u{1F468}‍\u{1F469}‍\u{1F467}';
    expect(cleanText(family, 1, 100)).toBe(family);
    expect(cleanText('a‌b', 1, 100)).toBe('a‌b');
  });

  it('normalises to NFC', () => {
    const decomposed = 'A\u0308'; // A + combining diaeresis
    expect(cleanText(decomposed, 1, 100)).toBe('\u00C4');
  });

  it('checks the length after cleaning', () => {
    expect(cleanText('   ', 1, 100)).toBeNull();
    expect(cleanText('\u202E', 1, 100)).toBeNull();
    expect(cleanText('', 0, 50)).toBe('');
    expect(cleanText('a'.repeat(100), 1, 100)).toBe('a'.repeat(100));
    expect(cleanText('a'.repeat(101), 1, 100)).toBeNull();
  });

  it.each([null, undefined, 42, {}, ['a']])('returns null for a non-string (%s)', (value) => {
    expect(cleanText(value, 0, 100)).toBeNull();
  });
});

describe('isDeckId', () => {
  it('accepts a UUID and short ids', () => {
    expect(isDeckId(ID)).toBe(true);
    expect(isDeckId('a_b-C')).toBe(true);
  });

  it.each(['', 'a'.repeat(65), 'a b', 'a/b', '__proto__', 'constructor', 42, null])('rejects %s', (value) => {
    expect(isDeckId(value)).toBe(false);
  });
});

describe('parseCollection', () => {
  it('accepts a valid collection and orders it by key', () => {
    expect(
      parseCollection({
        entries: [
          { card: 'v-streetkid', count: 2 },
          { card: 'detonate', count: 999 },
        ],
      }),
    ).toEqual({
      value: {
        entries: [
          { card: 'detonate', count: 999 },
          { card: 'v-streetkid', count: 2 },
        ],
      },
      dropped: 0,
    });
  });

  it('accepts an empty collection', () => {
    expect(parseCollection({ entries: [] })).toEqual({ value: { entries: [] }, dropped: 0 });
  });

  it.each([null, undefined, 'x', 42, [], [{ entries: [] }], {}, { entries: 'x' }, { entries: {} }])(
    'returns null for a wrong root (%s)',
    (raw) => {
      expect(parseCollection(raw)).toBeNull();
    },
  );

  it.each([-1, 0, 1.5, Number.NaN, 1000, '2', null, Number.POSITIVE_INFINITY])('drops a row with count %s', (count) => {
    expect(parseCollection({ entries: [{ card: 'detonate', count }] })).toEqual({
      value: { entries: [] },
      dropped: 1,
    });
  });

  it.each([42, null, '', 'Detonate', 'constructor', 'prototype', '__proto__', 'a'.repeat(101)])(
    'drops a row with card %s',
    (card) => {
      expect(parseCollection({ entries: [{ card, count: 1 }] })?.dropped).toBe(1);
    },
  );

  it('drops rows that are not objects', () => {
    expect(parseCollection({ entries: [null, 'detonate', 3, ['detonate', 1]] })).toEqual({
      value: { entries: [] },
      dropped: 4,
    });
  });

  it('keeps the first of repeated keys', () => {
    expect(
      parseCollection({
        entries: [
          { card: 'detonate', count: 1 },
          { card: 'detonate', count: 3 },
        ],
      }),
    ).toEqual({ value: { entries: [{ card: 'detonate', count: 1 }] }, dropped: 1 });
  });

  it('keeps the intact part of partly broken data', () => {
    const result = parseCollection({
      entries: [{ card: 'detonate', count: 3 }, { card: 'chrome-fang', count: -5 }, 'junk', { card: 'v-streetkid', count: 1 }],
    });
    expect(result?.value.entries.map((entry) => entry.card)).toEqual(['detonate', 'v-streetkid']);
    expect(result?.dropped).toBe(2);
  });

  it('does not copy unknown fields', () => {
    const result = parseCollection({ entries: [{ card: 'detonate', count: 1, html: '<img>' }], extra: 1 });
    expect(result?.value).toEqual({ entries: [{ card: 'detonate', count: 1 }] });
    expect(Object.keys(result?.value ?? {})).toEqual(['entries']);
    expect(Object.keys(result?.value.entries[0] ?? {})).toEqual(['card', 'count']);
  });

  it('is not affected by __proto__ or constructor keys', () => {
    const raw: unknown = JSON.parse(
      '{"__proto__":{"polluted":1},"constructor":{"prototype":{"polluted":1}},"entries":[{"__proto__":{"polluted":1},"card":"detonate","count":1},{"card":"__proto__","count":1},{"card":"constructor","count":2}]}',
    );
    const result = parseCollection(raw);
    expect(result).toEqual({ value: { entries: [{ card: 'detonate', count: 1 }] }, dropped: 2 });
    expectNoPrototypePollution();
  });

  it('reads at most MAX_COLLECTION_ENTRIES rows and counts the rest as dropped', () => {
    const entries = Array.from({ length: MAX_COLLECTION_ENTRIES + 3 }, (_, index) => ({ card: `card-${index}`, count: 1 }));
    const result = parseCollection({ entries });
    expect(result?.value.entries).toHaveLength(MAX_COLLECTION_ENTRIES);
    expect(result?.dropped).toBe(3);
  });
});

describe('parseDeckContent', () => {
  it('accepts valid content and drops unknown fields', () => {
    const result = parseDeckContent({
      name: 'Pakka',
      id: 'ignored',
      sections: [
        { name: '', cards: [{ card: 'detonate', count: 3, extra: 1 }], extra: 1 },
        { name: 'Sideboard', cards: [{ card: 'detonate', count: 1 }] },
      ],
    });
    expect(result).toEqual({
      value: {
        name: 'Pakka',
        sections: [
          { name: '', cards: [{ card: 'detonate', count: 3 }] },
          { name: 'Sideboard', cards: [{ card: 'detonate', count: 1 }] },
        ],
      },
      dropped: 0,
    });
    expect(Object.keys(result?.value ?? {})).toEqual(['name', 'sections']);
  });

  it('cleans the deck and section names', () => {
    const result = parseDeckContent({ name: ' Pakka\n// Units (99) ', sections: [{ name: 'Le\u202Egends', cards: [] }] });
    expect(result?.value.name).toBe('Pakka// Units (99)');
    expect(result?.value.sections[0]?.name).toBe('Legends');
  });

  it.each([
    ['missing name', { sections: [] }],
    ['empty name', { name: '  ', sections: [] }],
    ['too long name', { name: 'a'.repeat(101), sections: [] }],
    ['name not a string', { name: 42, sections: [] }],
    ['missing sections', { name: 'Pakka' }],
    ['sections not an array', { name: 'Pakka', sections: {} }],
    ['not an object', 'Pakka'],
  ])('returns null for %s', (_label, raw) => {
    expect(parseDeckContent(raw)).toBeNull();
  });

  it('accepts a deck name of exactly 100 characters', () => {
    expect(parseDeckContent({ name: 'a'.repeat(100), sections: [] })?.value.name).toHaveLength(100);
  });

  it.each([-1, 0, 1.5, Number.NaN, 100, '3'])('drops a deck row with count %s', (count) => {
    expect(parseDeckContent({ name: 'P', sections: [{ name: '', cards: [{ card: 'detonate', count }] }] })).toEqual({
      value: { name: 'P', sections: [{ name: '', cards: [] }] },
      dropped: 1,
    });
  });

  it('drops invalid sections and repeated cards within a section', () => {
    const result = parseDeckContent({
      name: 'P',
      sections: [
        null,
        { name: 'a'.repeat(51), cards: [] },
        { name: 'No cards' },
        {
          name: 'Main',
          cards: [
            { card: 'detonate', count: 3 },
            { card: 'detonate', count: 1 },
            { card: 'v-streetkid', count: 1 },
          ],
        },
      ],
    });
    expect(result).toEqual({
      value: {
        name: 'P',
        sections: [
          {
            name: 'Main',
            cards: [
              { card: 'detonate', count: 3 },
              { card: 'v-streetkid', count: 1 },
            ],
          },
        ],
      },
      dropped: 4,
    });
  });

  it('limits the number of sections', () => {
    const sections = Array.from({ length: MAX_SECTIONS + 2 }, (_, index) => ({ name: `S${index}`, cards: [] }));
    const result = parseDeckContent({ name: 'P', sections });
    expect(result?.value.sections).toHaveLength(MAX_SECTIONS);
    expect(result?.dropped).toBe(2);
  });

  it('limits the rows over all sections', () => {
    const cards = (prefix: string, count: number) =>
      Array.from({ length: count }, (_, index) => ({ card: `${prefix}-${index}`, count: 1 }));
    const result = parseDeckContent({
      name: 'P',
      sections: [
        { name: 'A', cards: cards('a', MAX_DECK_DISTINCT_CARDS - 1) },
        { name: 'B', cards: cards('b', 3) },
        { name: 'C', cards: cards('c', 2) },
      ],
    });
    const rows = result?.value.sections.reduce((sum, section) => sum + section.cards.length, 0);
    expect(rows).toBe(MAX_DECK_DISTINCT_CARDS);
    expect(result?.value.sections.map((section) => section.cards.length)).toEqual([MAX_DECK_DISTINCT_CARDS - 1, 1, 0]);
    expect(result?.dropped).toBe(4);
  });

  it('is not affected by __proto__ keys', () => {
    const raw: unknown = JSON.parse(
      '{"__proto__":{"polluted":1},"name":"P","sections":[{"__proto__":{"polluted":1},"name":"S","cards":[{"card":"prototype","count":1}]}]}',
    );
    expect(parseDeckContent(raw)).toEqual({ value: { name: 'P', sections: [{ name: 'S', cards: [] }] }, dropped: 1 });
    expectNoPrototypePollution();
  });
});

describe('parseDeck', () => {
  it('accepts a valid deck', () => {
    expect(parseDeck(deck())).toEqual({
      value: {
        id: ID,
        name: 'Esimerkkipakka',
        sections: [{ name: 'Legends', cards: [{ card: 'v-streetkid', count: 1 }] }],
        createdAt: TIME,
        updatedAt: TIME,
      },
      dropped: 0,
    });
  });

  it.each([undefined, '', '__proto__', 'a b', 42])('returns null for id %s', (id) => {
    expect(parseDeck(deck({ id }))).toBeNull();
  });

  it.each([undefined, 'yesterday', '2026-13-45T99:99:99Z', 1759320000000, '2026-10-01'])(
    'replaces timestamp %s with the epoch',
    (createdAt) => {
      expect(parseDeck(deck({ createdAt }))?.value.createdAt).toBe(EPOCH_TIMESTAMP);
    },
  );
});

describe('parseDeckList', () => {
  it('accepts an empty list', () => {
    expect(parseDeckList({ decks: [] })).toEqual({ value: [], dropped: 0 });
  });

  it.each([null, [], {}, { decks: 'x' }])('returns null for a wrong root (%s)', (raw) => {
    expect(parseDeckList(raw)).toBeNull();
  });

  it('drops invalid decks and repeated ids and adds up dropped rows', () => {
    const result = parseDeckList({
      decks: [
        deck(),
        deck({ name: 'Copy' }),
        deck({ id: 'second', sections: [{ name: '', cards: [{ card: 'detonate', count: 0 }] }] }),
        deck({ id: 'third', name: '' }),
        'junk',
      ],
    });
    expect(result?.value.map((item) => item.id)).toEqual([ID, 'second']);
    expect(result?.value[0]?.name).toBe('Esimerkkipakka');
    expect(result?.dropped).toBe(4);
  });

  it('reads at most MAX_DECKS decks', () => {
    const decks = Array.from({ length: MAX_DECKS + 1 }, (_, index) => deck({ id: `deck-${index}` }));
    const result = parseDeckList({ decks });
    expect(result?.value).toHaveLength(MAX_DECKS);
    expect(result?.dropped).toBe(1);
  });
});
