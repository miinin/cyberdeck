import type { Card } from './card';
import { toCardsByKey } from './deckRules';
import type { Collection } from './collection';
import { compareTrade, tradeableCount, tradeableOf } from './tradeCompare';

const col = (...rows: [string, number][]): Collection => ({
  entries: rows.map(([c, count]) => ({ card: c, count })),
});
const card = (key: string, type = 'Unit') => ({ key, type }) as Card;
const cards = toCardsByKey([card('unit'), card('unit2'), card('legend', 'Legend')]);

describe('tradeable counts (T-063)', () => {
  it.each([
    ['Unit', 0, 0],
    ['Unit', 3, 0],
    ['Unit', 4, 1],
    ['Unit', 9, 6],
    ['Legend', 1, 0],
    ['Legend', 2, 1],
  ])('%s owned %i -> %i', (type, owned, expected) => {
    expect(tradeableCount(owned, { type })).toBe(expected);
  });

  it('collects tradeable copies and counts unknown cards', () => {
    const { counts, unknown } = tradeableOf(col(['unit', 5], ['unit2', 3], ['legend', 1], ['nope', 9]), cards);
    expect([...counts]).toEqual([['unit', 2]]);
    expect(unknown).toBe(1);
  });
});

describe('compareTrade', () => {
  it('uses min(tradeable, wanted) on both sides', () => {
    const result = compareTrade(
      col(['unit', 5], ['unit2', 3]),
      col(['legend', 1]),
      col(['legend', 4], ['unit', 8]),
      col(['unit', 1], ['unit2', 2]),
      cards,
    );
    // Mine: unit tradeable 2, they want 1 -> 1; unit2 not tradeable. Theirs: legend tradeable 3, I want 1 -> 1.
    expect(result.iCanGive).toEqual([{ card: 'unit', count: 1 }]);
    expect(result.theyCanGive).toEqual([{ card: 'legend', count: 1 }]);
  });

  it('is empty when nothing matches, cards are unknown or nothing exceeds a playset', () => {
    expect(compareTrade(col(['unit', 3]), col(), col(['nope', 9]), col(['unit', 1]), cards)).toEqual({
      iCanGive: [],
      theyCanGive: [],
    });
  });
});
