import { describe, expect, it } from 'vitest';
import type { Card } from './card';
import type { Deck } from './deck';
import { deckUse, haveSourceOf, keptCount, tradeableWithRule } from './tradeRule';

function card(key: string, type = 'Unit'): Card {
  return { id: key, key, slug: key, name: key, subname: null, displayName: key, type, color: 'Red', cost: 1, power: null, ram: null, rarity: null };
}
const unit = card('unit');
const legend = card('legend', 'Legend');
const byKey = new Map([
  ['unit', unit],
  ['legend', legend],
]);
const deck = (cards: [string, number][]): Deck => ({
  id: 'd',
  name: 'd',
  createdAt: '',
  updatedAt: '',
  sections: [{ name: 'main', cards: cards.map(([key, count]) => ({ card: key, count })) }],
});

describe('trade rule (T-135)', () => {
  it('keeps a playset, one or nothing, and at least the deck copies when asked', () => {
    expect(keptCount(unit, { keep: 'playset', keepDeckCards: false, source: null })).toBe(3);
    expect(keptCount(legend, { keep: 'playset', keepDeckCards: false, source: null })).toBe(1);
    expect(keptCount(unit, { keep: 'one', keepDeckCards: false, source: null }, 4)).toBe(1);
    expect(keptCount(unit, { keep: 'none', keepDeckCards: true, source: null }, 2)).toBe(2);
    expect(keptCount(unit, { keep: 'playset', keepDeckCards: true, source: null }, 2)).toBe(3);
  });

  it('sums the deck copies over decks and gives the tradeable copies of known cards only', () => {
    const use = deckUse([deck([['unit', 2]]), deck([['unit', 3], ['legend', 1]])]);
    expect(use).toEqual(new Map([['unit', 5], ['legend', 1]]));
    const have = { entries: [{ card: 'unit', count: 6 }, { card: 'legend', count: 1 }, { card: 'gone', count: 9 }] };
    expect(tradeableWithRule(have, byKey, { keep: 'playset', keepDeckCards: false, source: null })).toEqual(new Map([['unit', 3]]));
    expect(tradeableWithRule(have, byKey, { keep: 'none', keepDeckCards: false, source: null })).toEqual(new Map([['unit', 6], ['legend', 1]]));
    expect(tradeableWithRule(have, byKey, { keep: 'one', keepDeckCards: true, source: null }, use)).toEqual(new Map([['unit', 1]]));
  });

  it('uses the chosen Have source, else an own list with cards, else a collection with cards, else the own list (T-143)', () => {
    const auto = { keep: 'playset' as const, keepDeckCards: false, source: null };
    expect(haveSourceOf(auto, 0, 0)).toBe('list');
    expect(haveSourceOf(auto, 0, 5)).toBe('collection');
    expect(haveSourceOf(auto, 2, 5)).toBe('list');
    expect(haveSourceOf({ ...auto, source: 'collection' }, 2, 0)).toBe('collection');
  });
});
