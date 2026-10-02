import type { Card } from './card';
import type { DeckContent } from './deck';
import { checkDeckName, copyDeckName, uniqueDeckName, withDeckCount } from './deckEdit';
import { addBlocker, groupDeck, ramLimits, toCardsByKey, validateDeck } from './deckRules';

function card(key: string, overrides: Partial<Card> = {}): Card {
  return {
    id: key,
    slug: key,
    name: key,
    subname: null,
    displayName: key,
    type: 'Unit',
    color: 'Red',
    cost: 1,
    power: 1,
    ram: 1,
    rarity: 'Common',
    key,
    ...overrides,
  };
}

const legends = [
  card('l1', { name: 'L1', type: 'Legend', color: 'Red', ram: 2 }),
  card('l2', { name: 'L2', type: 'Legend', color: 'Red', ram: 2 }),
  card('l3', { name: 'L3', type: 'Legend', color: 'Blue', ram: 2 }),
];
const filler = Array.from({ length: 20 }, (_, i) => card(`u${i}`, { ram: 1 }));
const all = [
  ...legends,
  ...filler,
  card('big', { ram: 5 }),
  card('blue2', { color: 'Blue', ram: 2 }),
  card('green', { color: 'Green', ram: 1 }),
];
const byKey = toCardsByKey(all);

function deck(rows: [string, number][]): DeckContent {
  return { name: 'D', sections: [{ name: '', cards: rows.map(([key, count]) => ({ card: key, count })) }] };
}
const legendRows: [string, number][] = [
  ['l1', 1],
  ['l2', 1],
  ['l3', 1],
];
/** n main cards of up to 3 copies each. */
function mainRows(n: number): [string, number][] {
  const rows: [string, number][] = [];
  let left = n;
  for (let i = 0; left > 0; i += 1) {
    const count = Math.min(3, left);
    rows.push([`u${i}`, count]);
    left -= count;
  }
  return rows;
}
const types = (d: DeckContent) => validateDeck(d, byKey).map((issue) => issue.type);

describe('validateDeck', () => {
  it('accepts a legal deck', () => {
    expect(validateDeck(deck([...legendRows, ...mainRows(40)]), byKey)).toEqual([]);
  });

  it.each([
    [39, true],
    [40, false],
    [50, false],
    [51, true],
  ])('main deck size %i: breaks the rule = %s', (size, breaks) => {
    expect(types(deck([...legendRows, ...mainRows(size)])).includes('main-size')).toBe(breaks);
  });

  it('explains the main deck size in Finnish', () => {
    expect(validateDeck(deck([...legendRows, ...mainRows(38)]), byKey)[0]?.message).toBe(
      'Pääpakassa on 38 korttia, vähintään 40.',
    );
    expect(validateDeck(deck([...legendRows, ...mainRows(51)]), byKey)[0]?.message).toBe(
      'Pääpakassa on 51 korttia, enintään 50.',
    );
  });

  it.each([[0], [2], [4]])('needs exactly 3 Legends (%i)', (n) => {
    const rows = legendRows.slice(0, n);
    if (n === 4) rows.push(['l1', 1]);
    expect(types(deck([...rows, ...mainRows(40)]))).toContain('legend-count');
  });

  it('Legend names must be unique by name alone, not by subname', () => {
    const extra = [
      ...all,
      card('v-a', { name: 'V', subname: 'A', type: 'Legend', ram: 0 }),
      card('v-b', { name: 'V', subname: 'B', type: 'Legend', ram: 0 }),
    ];
    const issues = validateDeck(deck([['v-a', 1], ['v-b', 1], ['l1', 1], ...mainRows(40)]), toCardsByKey(extra));
    expect(issues.map((i) => i.type)).toEqual(['legend-duplicate']);
    expect(issues[0]?.cards).toEqual(['v-a', 'v-b']);
  });

  it('two copies of one Legend are a duplicate', () => {
    expect(types(deck([['l1', 2], ['l2', 1], ...mainRows(40)]))).toEqual(['legend-duplicate']);
  });

  it('allows 3 copies and rejects 4 of the same key', () => {
    const issues = validateDeck(deck([...legendRows, ['u0', 4], ...mainRows(40).slice(1)]), byKey);
    expect(issues.find((i) => i.type === 'copies')?.message).toBe('u0: 4 kopiota, enintään 3.');
    expect(types(deck([...legendRows, ...mainRows(40)]))).not.toContain('copies');
  });

  it('counts copies over several sections', () => {
    const d: DeckContent = {
      name: 'D',
      sections: [
        { name: '', cards: [...legendRows, ...mainRows(40)].map(([key, count]) => ({ card: key, count })) },
        { name: 'Extra', cards: [{ card: 'u0', count: 1 }] },
      ],
    };
    expect(validateDeck(d, byKey).map((i) => i.type)).toContain('copies');
  });

  it('RAM limit is per color: the sum of the RAM of that color Legends', () => {
    expect(Object.fromEntries(ramLimits(deck(legendRows), byKey))).toEqual({ Red: 4, Blue: 2 });
    const ram = validateDeck(deck([...legendRows, ['big', 1], ['blue2', 1], ...mainRows(40)]), byKey).filter(
      (i) => i.type === 'ram',
    );
    expect(ram).toHaveLength(1);
    expect(ram[0]?.cards).toEqual(['big']);
    expect(ram[0]?.message).toContain('Red-värin RAM-raja on 4');
  });

  it('RAM equal to the limit is fine', () => {
    const exact = [...all, card('four', { ram: 4 })];
    expect(validateDeck(deck([...legendRows, ['four', 1], ...mainRows(40)]), toCardsByKey(exact))).toEqual([]);
  });

  it('a color no Legend gives cannot be played', () => {
    const issues = validateDeck(deck([...legendRows, ['green', 1], ...mainRows(40)]), byKey);
    expect(issues.map((i) => i.type)).toEqual(['ram']);
    expect(issues[0]?.message).toContain('Legendeillä ei ole väriä Green');
  });

  it('ignores cards without color or RAM for the RAM rule', () => {
    const extra = [...all, card('nocolor', { color: null, ram: 9 }), card('noram', { ram: null })];
    const d = deck([...legendRows, ['nocolor', 1], ['noram', 1], ...mainRows(40)]);
    expect(validateDeck(d, toCardsByKey(extra))).toEqual([]);
  });

  it('warns about unknown cards without counting them', () => {
    const issues = validateDeck(deck([...legendRows, ['ghost', 2], ...mainRows(40)]), byKey);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ type: 'unknown-card', severity: 'warning', cards: ['ghost'] });
  });

  it('an empty deck breaks the count rules', () => {
    expect(types({ name: 'D', sections: [] })).toEqual(['legend-count', 'main-size']);
  });
});

describe('addBlocker', () => {
  const start = deck(legendRows);
  it('explains RAM and copy limits and a full Legend slot', () => {
    expect(addBlocker(byKey.get('big')!, start, byKey)).toBe('RAM 5 ylittää Red-värin rajan 4.');
    expect(addBlocker(byKey.get('u0')!, deck([...legendRows, ['u0', 3]]), byKey)).toBe('Pakassa on jo 3 kopiota.');
    expect(addBlocker(byKey.get('u0')!, start, byKey)).toBeNull();
    expect(addBlocker(legends[0]!, start, byKey)).toBe('Pakassa on jo 3 Legendiä.');
  });
  it('blocks a second Legend with the same name', () => {
    const dupe = card('l1b', { name: 'L1', type: 'Legend' });
    expect(addBlocker(dupe, deck([['l1', 1]]), toCardsByKey([...all, dupe]))).toBe('Pakassa on jo Legend L1.');
  });
});

describe('deck editing helpers', () => {
  it('names: trims, requires 1–100 characters', () => {
    expect(checkDeckName('  Oma pakka ')).toEqual({ ok: true, name: 'Oma pakka' });
    expect(checkDeckName('   ')).toEqual({ ok: false, error: 'empty' });
    expect(checkDeckName('x'.repeat(100))).toMatchObject({ ok: true });
    expect(checkDeckName('x'.repeat(101))).toEqual({ ok: false, error: 'too-long' });
  });

  it('numbers duplicate default names', () => {
    expect(uniqueDeckName([])).toBe('Uusi pakka');
    expect(uniqueDeckName(['Uusi pakka'])).toBe('Uusi pakka 2');
    expect(uniqueDeckName(['Uusi pakka', 'Uusi pakka 2'])).toBe('Uusi pakka 3');
    expect(copyDeckName('Oma', ['Oma'])).toBe('Oma (kopio)');
    expect(copyDeckName('x'.repeat(100), []).length).toBeLessThanOrEqual(100);
  });

  it('withDeckCount adds, changes and removes a card', () => {
    let d = withDeckCount({ name: 'D', sections: [] }, 'a', 2);
    expect(d.sections[0]?.cards).toEqual([{ card: 'a', count: 2 }]);
    d = withDeckCount(d, 'a', 3);
    expect(d.sections[0]?.cards).toEqual([{ card: 'a', count: 3 }]);
    expect(withDeckCount(d, 'a', 500).sections[0]?.cards[0]?.count).toBe(99);
    d = withDeckCount(d, 'a', 0);
    expect(d.sections[0]?.cards).toEqual([]);
  });
});

describe('groupDeck', () => {
  it('groups the main deck by type in Cost order and keeps Legends and unknown cards apart', () => {
    const cards = [
      card('l1', { type: 'Legend', name: 'L1', ram: 2 }),
      card('unit-b', { cost: 3 }),
      card('unit-a', { cost: 1 }),
      card('prog', { type: 'Program', cost: 2 }),
      card('gear', { type: 'Gear', cost: 2 }),
      card('odd', { type: 'Weird', cost: 0 }),
    ];
    const grouped = groupDeck(
      deck([['unit-b', 1], ['l1', 1], ['prog', 1], ['unit-a', 2], ['gear', 1], ['odd', 1], ['ghost', 3]]),
      toCardsByKey(cards),
    );
    expect(grouped.legends.map((row) => row.card.key)).toEqual(['l1']);
    expect(grouped.groups.map((group) => group.type)).toEqual(['Unit', 'Gear', 'Program', 'Weird']);
    expect(grouped.groups[0]?.rows.map((row) => row.card.key)).toEqual(['unit-a', 'unit-b']);
    expect(grouped.unknown).toEqual([{ key: 'ghost', count: 3 }]);
  });
});
