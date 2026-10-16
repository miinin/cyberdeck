import type { Card } from './card';
import { SIDEBOARD_SECTION_NAME } from './deck';
import { tournamentList } from './tournamentList';

function card(key: string, type: string, name = key, subname: string | null = null): Card {
  return { id: key, slug: key, name, subname, displayName: name, type, color: 'Red', cost: 1, power: 1, ram: 1, rarity: 'Common', key } as Card;
}

const cards = new Map(
  [card('l1', 'Legend', 'V', 'Streetkid'), card('u2', 'Unit', 'Zed'), card('u1', 'Unit', 'Abe'), card('p1', 'Program'), card('g1', 'Gear'), card('t1', 'Token')].map((c) => [c.key, c]),
);

describe('tournamentList', () => {
  const deck = {
    name: 'Oma',
    sections: [
      { name: 'Main', cards: [{ card: 'u2', count: 3 }, { card: 'u1', count: 2 }, { card: 'l1', count: 1 }, { card: 'p1', count: 4 }, { card: 'g1', count: 1 }, { card: 't1', count: 2 }] },
      { name: SIDEBOARD_SECTION_NAME, cards: [{ card: 'u1', count: 1 }] },
    ],
  };

  it('groups by type in print order with sorted rows and totals', () => {
    const list = tournamentList(deck, cards);
    expect(list.groups.map((g) => g.id)).toEqual(['legend', 'unit', 'program', 'gear', 'other', 'sideboard']);
    expect(list.groups[0]?.rows).toEqual([{ count: 1, name: 'V - Streetkid' }]);
    expect(list.groups[1]?.rows.map((r) => r.name)).toEqual(['Abe', 'Zed']);
    expect(list.groups[1]?.total).toBe(5);
    expect(list.totals).toEqual({ main: 12, legends: 1, sideboard: 1 });
  });

  it('leaves out empty groups and shows unknown cards by key', () => {
    const list = tournamentList({ name: 'X', sections: [{ name: 'Main', cards: [{ card: 'nope', count: 2 }] }] }, cards);
    expect(list.groups).toEqual([{ id: 'other', total: 2, rows: [{ count: 2, name: 'nope' }] }]);
    expect(list.totals).toEqual({ main: 2, legends: 0, sideboard: 0 });
  });
});
