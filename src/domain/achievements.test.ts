import { describe, expect, it } from 'vitest';
import { achievements, nextAchievements } from './achievements';
import type { Achievement } from './achievements';
import type { Card } from './card';
import { EMPTY_COLLECTION } from './collection';
import type { Collection } from './collection';

function card(key: string, overrides: Partial<Card> = {}): Card {
  return {
    id: key, key, slug: key, name: key, subname: null, displayName: key, type: 'Unit', color: 'Red', cost: 1, power: null, ram: null,
    rarity: 'Common', printings: [], ...overrides,
  };
}
const cards = [card('a'), card('b', { color: 'Blue', type: 'Legend' }), card('c', { color: null })];
const own = (...entries: Collection['entries'][number][]): Collection => ({ entries });
const byId = (list: Achievement[], id: string) => list.find((item) => item.id === id);

describe('achievements', () => {
  it('has nothing earned for an empty collection, and leaves out goals above the card count', () => {
    const list = achievements(cards, EMPTY_COLLECTION);
    expect(list.every((item) => !item.done)).toBe(true);
    expect(byId(list, 'distinct-1')).toMatchObject({ owned: 0, total: 1 });
    expect(byId(list, 'distinct-25')).toBeUndefined();
    expect(byId(list, 'all')).toMatchObject({ owned: 0, total: 3 });
  });

  it('earns the milestones, a complete color and type, and caps progress at the goal', () => {
    const list = achievements(cards, own({ card: 'a', count: 3 }, { card: 'b', count: 1 }));
    expect(byId(list, 'distinct-1')).toMatchObject({ owned: 1, total: 1, done: true });
    expect(byId(list, 'all')).toMatchObject({ owned: 2, total: 3, done: false });
    expect(byId(list, 'copies-100')).toMatchObject({ owned: 4, done: false });
    // Both are playsets: 3 of a Unit, 1 of a Legend.
    expect(byId(list, 'playsets')).toMatchObject({ owned: 2, total: 3 });
    expect(byId(list, 'color-Red')).toMatchObject({ owned: 1, total: 1, done: true });
    expect(byId(list, 'color-Blue')?.done).toBe(true);
    expect(byId(list, 'type-Legend')?.done).toBe(true);
    expect(byId(list, 'type-Unit')).toMatchObject({ owned: 1, total: 2, done: false });
    // A card without a color is no color goal.
    expect(list.some((item) => item.id === 'color-null')).toBe(false);
  });
});

describe('nextAchievements', () => {
  it('lists open goals closest to done first, then fewest missing, then in order', () => {
    const goal = (id: string, owned: number, total: number): Achievement => ({ id, kind: 'type', subject: id, owned, total, done: owned >= total });
    const list = [goal('half', 1, 2), goal('done', 2, 2), goal('far', 1, 10), goal('half-big', 5, 10), goal('half-2', 2, 4)];
    expect(nextAchievements(list, 3).map((item) => item.id)).toEqual(['half', 'half-2', 'half-big']);
  });
});
