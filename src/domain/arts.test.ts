import type { Card } from './card';
import type { Collection } from './collection';
import { artsOf, ownedPerArt, setArtCount } from './arts';
import type { Printing } from './printing';

function p(setCode: string, setName: string, number: string, rarity: string | null, language = 'en'): Printing {
  return { key: `${setCode}:${number}`, setCode, setName, number, rarity, language, artist: null, imageKey: 'x' };
}
const retail = p('r', 'Night City — Retail', '005a', 'Rare');
const beta = p('b', 'Night City — Beta', '005a', 'Rare');
const fr = p('f', 'Night City — Retail — FR', '005a', 'Rare', 'fr');
const nova = p('r', 'Night City — Retail', '150', 'Nova Rare');
const legend = p('t', 'Tournament', '9', 'Iconic Legend');
const legend2 = p('u', 'Tournament Two', '10', 'Iconic Legend');

const card: Card = {
  id: '1', slug: 'v', name: 'V', subname: null, displayName: 'V', type: 'Legend', color: 'Red',
  cost: null, power: null, ram: null, rarity: null, key: 'v', printings: [beta, retail, fr, nova, legend, legend2],
};

const key = (n: number, versions?: Record<string, number>) => ({ card: 'v', count: n, ...(versions ? { versions } : {}) });
const col = (entry: ReturnType<typeof key>): Collection => ({ entries: [entry] });

describe('artsOf', () => {
  it('has the base art first and one art per special rarity', () => {
    const arts = artsOf(card);
    expect(arts.map((a) => a.artId)).toEqual(['v', 'v__iconic-legend', 'v__nova-rare']);
    expect(arts[0]?.printings).toHaveLength(3);
    expect(arts[1]?.printings).toHaveLength(2);
  });
  it('chooses Retail in English as the default printing', () => {
    expect(artsOf(card)[0]?.defaultPrinting).toBe(retail);
  });
  it('leaves a special rarity without a picture to the base art', () => {
    const arts = artsOf(card, (_k, rarity) => rarity === 'Nova Rare');
    expect(arts.map((a) => a.artId)).toEqual(['v', 'v__nova-rare']);
    expect(arts[0]?.printings).toContain(legend);
  });
  it('has no arts without printings', () => {
    expect(artsOf({ ...card, printings: undefined })).toEqual([]);
  });
});

describe('ownedPerArt', () => {
  it('gives special arts their versions and the base art the rest', () => {
    const owned = ownedPerArt(key(7, { [retail.key]: 2, [nova.key]: 1, [legend2.key]: 3 }), card);
    expect(owned.get('v__nova-rare')).toBe(1);
    expect(owned.get('v__iconic-legend')).toBe(3);
    expect(owned.get('v')).toBe(3);
  });
  it('is zero without an entry', () => {
    expect([...ownedPerArt(undefined, card).values()]).toEqual([0, 0, 0]);
  });
});

describe('setArtCount', () => {
  it('raises a special art on its default printing and the total with it', () => {
    const next = setArtCount(col(key(2)), card, 'v__nova-rare', 1);
    expect(next.entries[0]).toEqual({ card: 'v', count: 3, versions: { [nova.key]: 1 } });
  });
  it('raises the base art as copies without a version', () => {
    expect(setArtCount(col(key(2)), card, 'v', 3).entries[0]).toEqual({ card: 'v', count: 3 });
  });
  it('adds a missing entry', () => {
    expect(setArtCount({ entries: [] }, card, 'v', 1).entries[0]).toEqual({ card: 'v', count: 1 });
  });
  it('lowers the base art from the unknown copies first, then from the base printings', () => {
    const start = col(key(3, { [retail.key]: 2 }));
    const one = setArtCount(start, card, 'v', 2);
    expect(one.entries[0]).toEqual({ card: 'v', count: 2, versions: { [retail.key]: 2 } });
    const two = setArtCount(one, card, 'v', 1);
    expect(two.entries[0]).toEqual({ card: 'v', count: 1, versions: { [retail.key]: 1 } });
  });
  it('lowers a special art from the default printing, then the others', () => {
    const start = col(key(3, { [legend.key]: 1, [legend2.key]: 2 }));
    const next = setArtCount(start, card, 'v__iconic-legend', 1);
    expect(next.entries[0]).toEqual({ card: 'v', count: 1, versions: { [legend2.key]: 1 } });
  });
  it('removes the row at zero', () => {
    expect(setArtCount(col(key(1)), card, 'v', 0).entries).toEqual([]);
  });
  it('rejects an unknown art', () => {
    expect(() => setArtCount(col(key(1)), card, 'nope', 1)).toThrow(RangeError);
  });
});

import { entryChanges, matchedSpecialRarity } from './arts';

describe('matchedSpecialRarity', () => {
  it('is null without a filter', () => {
    expect(matchedSpecialRarity(card, [], null)).toBeNull();
  });
  it('finds the special rarity of a rarity filter', () => {
    expect(matchedSpecialRarity(card, ['Nova Rare'], null)).toBe('Nova Rare');
  });
  it('is null when an ordinary printing matches too', () => {
    expect(matchedSpecialRarity(card, [], 'night-city')).toBeNull();
  });
  it('is null for an ordinary rarity or a rarity without a picture', () => {
    expect(matchedSpecialRarity(card, ['Rare'], null)).toBeNull();
    expect(matchedSpecialRarity(card, ['Nova Rare'], null, () => false)).toBeNull();
  });
});

describe('entryChanges', () => {
  it('reports version moves, and the count only without one', () => {
    expect(entryChanges({ card: 'v', count: 1 }, { card: 'v', count: 2, versions: { a: 1 } })).toEqual({ versions: [['a', 1]], count: null });
    expect(entryChanges({ card: 'v', count: 1 }, { card: 'v', count: 2 })).toEqual({ versions: [], count: 2 });
    expect(entryChanges({ card: 'v', count: 1 }, undefined)).toEqual({ versions: [], count: 0 });
  });
});
