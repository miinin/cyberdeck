import { describe, expect, it } from 'vitest';
import type { Card } from './card';
import type { DeckContent } from './deck';
import { toCardsByKey } from './deckRules';
import {
  atLeastOneProbability,
  averageCost,
  averagePower,
  cheapOpeningProbability,
  drawProbabilities,
  mainDeckSize,
  powerCurve,
  ramDistribution,
  rarityDistribution,
} from './deckStats';

function card(key: string, fields: Partial<Card> = {}): Card {
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
    ...fields,
  };
}
const cards = [
  card('legend', {
    type: 'Legend',
    cost: null,
    power: 9,
    ram: 3,
    rarity: 'Legendary',
  }),
  card('unit2', { cost: 2, power: 3, ram: 1, rarity: 'Rare' }),
  card('unit5', { cost: 5, power: 11, ram: 2, rarity: 'Epic' }),
  card('gear', { type: 'Gear', cost: 1, power: null, ram: null, rarity: null }),
  card('prog', {
    type: 'Program',
    cost: null,
    power: 4,
    ram: 2,
    rarity: 'Mythic',
  }),
];
const cardsByKey = toCardsByKey(cards);
const deck = (rows: [string, number][]): DeckContent => ({
  name: 'Testi',
  sections: [{ name: '', cards: rows.map(([key, count]) => ({ card: key, count })) }],
});
const sample = deck([
  ['legend', 1],
  ['unit2', 3],
  ['unit5', 1],
  ['gear', 2],
  ['prog', 2],
  ['unknown', 4],
]);

describe('averages', () => {
  it('weights Cost by copies and leaves out Legends, unknown cards and cards without Cost', () => {
    // (2·3 + 5·1 + 1·2) / 6
    expect(averageCost(sample, cardsByKey)).toBeCloseTo(13 / 6, 10);
  });

  it('averages Power of Units only', () => {
    // (3·3 + 11·1) / 4
    expect(averagePower(sample, cardsByKey)).toBeCloseTo(5, 10);
  });

  it('returns null for an empty deck', () => {
    expect(averageCost(deck([]), cardsByKey)).toBeNull();
    expect(averagePower(deck([['gear', 3]]), cardsByKey)).toBeNull();
  });
});

describe('distributions', () => {
  it('puts Unit Power into 0 … 7 and 8+', () => {
    const curve = powerCurve(sample, cardsByKey);
    expect(curve).toHaveLength(9);
    expect(curve[3]).toBe(3);
    expect(curve[8]).toBe(1);
    expect(curve.reduce((sum, n) => sum + n, 0)).toBe(4);
  });

  it('counts RAM copies per value, lowest first, without Legends', () => {
    expect(ramDistribution(sample, cardsByKey)).toEqual([
      { value: 1, count: 3 },
      { value: 2, count: 3 },
    ]);
  });

  it('orders rarities Common … Legendary, then others by name, unknown last', () => {
    const rows = rarityDistribution(
      deck([
        ['gear', 1],
        ['prog', 1],
        ['unit5', 2],
        ['unit2', 3],
        ['legend', 1],
      ]),
      cardsByKey,
    );
    expect(rows).toEqual([
      { rarity: 'Rare', count: 3 },
      { rarity: 'Epic', count: 2 },
      { rarity: 'Mythic', count: 1 },
      { rarity: null, count: 1 },
    ]);
  });
});

describe('atLeastOneProbability', () => {
  it('matches the hypergeometric reference values', () => {
    expect(atLeastOneProbability(40, 3, 6)).toBeCloseTo(0.3943, 4);
    expect(atLeastOneProbability(40, 3, 7)).toBeCloseTo(0.4478, 4);
    expect(atLeastOneProbability(40, 1, 6)).toBeCloseTo(6 / 40, 10);
  });

  it('handles the edges', () => {
    expect(atLeastOneProbability(0, 0, 6)).toBe(0);
    expect(atLeastOneProbability(40, 0, 6)).toBe(0);
    expect(atLeastOneProbability(40, 3, 0)).toBe(0);
    expect(atLeastOneProbability(5, 1, 6)).toBe(1);
    expect(atLeastOneProbability(6, 2, 6)).toBe(1);
    // Drawing more than the non-copies guarantees a copy.
    expect(atLeastOneProbability(10, 5, 6)).toBe(1);
  });

  it('grows with the number of cards drawn', () => {
    const values = [6, 7, 9, 11].map((n) => atLeastOneProbability(45, 2, n));
    expect([...values].sort((a, b) => a - b)).toEqual(values);
  });
});

describe('drawProbabilities', () => {
  it('has a row per known main deck card, most copies first, unknown cards in the deck size', () => {
    expect(mainDeckSize(sample, cardsByKey)).toBe(12);
    const rows = drawProbabilities(sample, cardsByKey, [6, 7]);
    expect(rows.map((row) => [row.card.key, row.count])).toEqual([
      ['unit2', 3],
      ['gear', 2],
      ['prog', 2],
      ['unit5', 1],
    ]);
    expect(rows[3]?.odds[0]).toBeCloseTo(6 / 12, 10);
    expect(rows[3]?.odds[1]).toBeCloseTo(7 / 12, 10);
  });

  it('gives the cheap opening chance from cards with Cost ≤ 2', () => {
    // 5 cheap copies (unit2 ×3, gear ×2) in 12 cards.
    expect(cheapOpeningProbability(sample, cardsByKey)).toBeCloseTo(atLeastOneProbability(12, 5, 6), 10);
    expect(cheapOpeningProbability(deck([]), cardsByKey)).toBe(0);
  });
});

describe('atLeastKProbability and groupOdds (T-075)', () => {
  it('matches the one-card formula for k = 1 and handles edges', async () => {
    const { atLeastKProbability, atLeastOneProbability } = await import('./deckStats');
    expect(atLeastKProbability(40, 5, 7, 1)).toBeCloseTo(atLeastOneProbability(40, 5, 7), 10);
    expect(atLeastKProbability(40, 1, 7, 2)).toBe(0);
    expect(atLeastKProbability(40, 5, 7, 0)).toBe(1);
    expect(atLeastKProbability(10, 10, 5, 2)).toBeCloseTo(1, 10);
  });
  it('computes at least two with the hypergeometric sum', async () => {
    const { atLeastKProbability } = await import('./deckStats');
    // N=4, K=2, n=2: P(2) = 1/6
    expect(atLeastKProbability(4, 2, 2, 2)).toBeCloseTo(1 / 6, 10);
  });
});
