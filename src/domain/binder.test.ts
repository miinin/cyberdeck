import { describe, expect, it } from 'vitest';
import {
  binderPockets,
  clampPage,
  compareCollectorNumbers,
  copiesInSet,
  ownedSpecialRarity,
  paginate,
  swipeDirection,
  turnPage,
  visiblePages,
} from './binder';
import type { Card } from './card';
import type { Collection } from './collection';
import { setFilterId } from './printing';
import type { Printing } from './printing';

const RETAIL = 'Welcome to Night City — Retail';
const BETA = 'Welcome to Night City — Beta';
function printing(setName: string, setCode: string, number: string, rarity: string | null = 'Common', language = 'en'): Printing {
  return { key: `${setCode}:${number.replace('β', '')}`, setCode, setName, number, rarity, language, artist: null, imageKey: `${setCode}-${number}` };
}
function card(key: string, printings: Printing[]): Card {
  return { id: key, key, slug: key, name: key, subname: null, displayName: key, type: 'Unit', color: 'Red', cost: 1, power: null, ram: null, rarity: 'Common', printings };
}
const retail = setFilterId(printing(RETAIL, 'wtnc', '1'));
const beta = setFilterId(printing(BETA, 'wtncb', '1'));
const own = (...entries: Collection['entries'][number][]): Collection => ({ entries });
const EMPTY: Collection = { entries: [] };

describe('compareCollectorNumbers', () => {
  it('orders by the number, then the suffix, and puts numberless last', () => {
    const sorted = ['10', '2b', '2', '2a', 'X'].sort(compareCollectorNumbers);
    expect(sorted).toEqual(['2', '2a', '2b', '10', 'X']);
    expect(compareCollectorNumbers('005β', '005')).toBeGreaterThan(0);
  });
});

describe('binderPockets', () => {
  const a = card('a', [printing(RETAIL, 'wtnc', '012'), printing(BETA, 'wtncb', '003β')]);
  const b = card('b', [printing(RETAIL, 'wtnc', '002')]);
  const c = card('c', [printing(BETA, 'wtncb', '001β')]);
  const cards = [a, b, c];

  it('holds the cards that have a printing in the set, in collector number order', () => {
    expect(binderPockets(cards, retail, EMPTY, 'base').map((p) => [p.card.key, p.number])).toEqual([['b', '002'], ['a', '012']]);
    expect(binderPockets(cards, beta, EMPTY, 'base').map((p) => [p.card.key, p.number])).toEqual([['c', '001β'], ['a', '003β']]);
  });

  it('keeps the catalog order for equal numbers', () => {
    const x = card('x', [printing(RETAIL, 'wtnc', '005')]);
    const y = card('y', [printing(RETAIL, 'wtnc', '005')]);
    expect(binderPockets([y, x], retail, EMPTY, 'base').map((p) => p.card.key)).toEqual(['y', 'x']);
  });

  it('counts copies from the recorded versions of this set only', () => {
    const collection = own({ card: 'a', count: 3, versions: { 'wtncb:003': 2, 'wtnc:012': 1 } });
    expect(copiesInSet(a, retail, collection)).toBe(1);
    expect(copiesInSet(a, beta, collection)).toBe(2);
    expect(binderPockets(cards, retail, collection, 'base').map((p) => p.copies)).toEqual([0, 1]);
  });

  it('counts copies without any recorded version as owned', () => {
    expect(copiesInSet(a, retail, own({ card: 'a', count: 2 }))).toBe(2);
    expect(copiesInSet(a, retail, EMPTY)).toBe(0);
  });

  it('shows an owned special art only in the owned-art mode', () => {
    const nova = card('n', [printing(RETAIL, 'wtnc', '020'), printing(RETAIL, 'wtnc', '120', 'Nova Rare')]);
    const collection = own({ card: 'n', count: 1, versions: { 'wtnc:120': 1 } });
    const hasArt = () => true;
    expect(ownedSpecialRarity(nova, retail, collection, hasArt)).toBe('Nova Rare');
    expect(ownedSpecialRarity(nova, retail, collection, () => false)).toBeNull();
    expect(binderPockets([nova], retail, collection, 'owned', hasArt)[0]?.artRarity).toBe('Nova Rare');
    expect(binderPockets([nova], retail, collection, 'base', hasArt)[0]?.artRarity).toBeNull();
    expect(binderPockets([nova], retail, EMPTY, 'owned', hasArt)[0]?.artRarity).toBeNull();
  });
});

describe('paging', () => {
  it('splits into pages of nine', () => {
    const pages = paginate(Array.from({ length: 20 }, (_, i) => i));
    expect(pages.map((p) => p.length)).toEqual([9, 9, 2]);
    expect(paginate([])).toEqual([]);
  });

  it('clamps the page', () => {
    expect(clampPage(5, 3)).toBe(2);
    expect(clampPage(-1, 3)).toBe(0);
    expect(clampPage(Number.NaN, 3)).toBe(0);
    expect(clampPage(2, 0)).toBe(0);
  });

  it('shows one page, or a spread starting on an even page', () => {
    expect(visiblePages(3, 9, 1)).toEqual([3]);
    expect(visiblePages(3, 9, 2)).toEqual([2, 3]);
    expect(visiblePages(8, 9, 2)).toEqual([8]);
    expect(visiblePages(0, 0, 2)).toEqual([]);
  });

  it('turns by a page or a spread and stops at the ends', () => {
    expect(turnPage(0, 1, 9, 1)).toBe(1);
    expect(turnPage(0, -1, 9, 1)).toBe(0);
    expect(turnPage(0, 1, 9, 2)).toBe(2);
    expect(turnPage(3, 1, 9, 2)).toBe(4);
    expect(turnPage(3, -1, 9, 2)).toBe(0);
    expect(turnPage(8, 1, 9, 2)).toBe(8);
    expect(turnPage(8, 1, 9, 1)).toBe(8);
  });

  it('reads a swipe: left goes forward, short or vertical moves do nothing', () => {
    expect(swipeDirection(-80, 5)).toBe(1);
    expect(swipeDirection(80, 5)).toBe(-1);
    expect(swipeDirection(-20, 0)).toBe(0);
    expect(swipeDirection(-80, 70)).toBe(0);
  });
});

describe('binderPockets with real-style numbers', () => {
  it('orders numerically with letter variants after their number, even when the catalog order is scrambled', () => {
    const numbers = ['010', '005b', '003', '144', '005a', '012', '001', '004', '009'];
    const cards = numbers.map((n) => card(`k${n}`, [printing(RETAIL, 'wtnc', n), printing(RETAIL, 'wtnc', n, 'Common', 'fr')]));
    expect(binderPockets(cards, retail, EMPTY, 'base').map((p) => p.number)).toEqual(['001', '003', '004', '005a', '005b', '009', '010', '012', '144']);
  });

  it('reads the number of the English printing, not a promo or other language', () => {
    const x = card('x', [printing(RETAIL, 'wtnc', '900', 'Common', 'fr'), printing(RETAIL, 'wtnc', '007'), printing(RETAIL, 'wtnc', '143', 'Iconic Legend')]);
    expect(binderPockets([x], retail, EMPTY, 'base')[0]?.number).toBe('007');
  });
});
