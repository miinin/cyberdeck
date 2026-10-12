import type { Card } from './card';
import type { Collection } from './collection';
import { artsInSet, artsOf, ownedPerArt, setArtCount } from './arts';
import { setFilterId } from './printing';
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

describe('arts of their own: an alternate base art and a Beta special art (T-148)', () => {
  const ra = p('welcometonightcityretail', 'Welcome to Night City — Retail', '005a', 'Rare');
  const rb = p('welcometonightcityretail', 'Welcome to Night City — Retail', '005b', 'Rare');
  const bb = p('welcometonightcitybeta', 'Welcome to Night City — Beta', 'β005b', 'Rare');
  const ri = p('welcometonightcityretail', 'Welcome to Night City — Retail', '144', 'Iconic Legend');
  const bi = p('welcometonightcitybeta', 'Welcome to Night City — Beta', 'β144', 'Iconic Legend');
  const v: Card = { ...card, printings: [ra, rb, bb, ri, bi] };
  const pictures = new Set(['Iconic Legend', 'Iconic Legend Beta', 'Alt b']);
  const arts = artsOf(v, (_key, name) => pictures.has(name));

  it('splits 005b and the Beta Iconic into arts of their own when they have pictures', () => {
    expect(arts.map((a) => [a.artId, a.image])).toEqual([
      ['v', null],
      ['v__alt-b', 'Alt b'],
      ['v__iconic-legend', 'Iconic Legend'],
      ['v__iconic-legend-beta', 'Iconic Legend Beta'],
    ]);
    expect(arts[1]?.printings).toEqual([rb, bb]);
    expect(arts[3]?.defaultPrinting).toBe(bi);
  });

  it('keeps them in the base and the rarity art without pictures', () => {
    expect(artsOf(v, (_key, name) => name === 'Iconic Legend').map((a) => a.artId)).toEqual(['v', 'v__iconic-legend']);
  });

  it('counts the alternate art by its printings, and the base art takes the copies without a version', () => {
    const owned = ownedPerArt({ card: 'v', count: 5, versions: { [rb.key]: 2, [bi.key]: 1 } }, v, arts);
    expect(Object.fromEntries(owned)).toEqual({ v: 2, 'v__alt-b': 2, 'v__iconic-legend': 0, 'v__iconic-legend-beta': 1 });
    const added = setArtCount({ entries: [] }, v, 'v__alt-b', 1, arts);
    expect(added.entries).toEqual([{ card: 'v', count: 1, versions: { [rb.key]: 1 } }]);
  });
});

describe('artsInSet (T-146)', () => {
  it('keeps only the arts printed in the chosen set, all arts without a set or when none is printed in it', () => {
    const arts = artsOf(card);
    expect(artsInSet(arts, setFilterId(legend)).map((a) => a.artId)).toEqual(['v__iconic-legend']);
    expect(artsInSet(arts, setFilterId(retail)).map((a) => a.artId)).toEqual(['v', 'v__nova-rare']);
    expect(artsInSet(arts, null)).toBe(arts);
    expect(artsInSet(arts, 'no-such-set')).toBe(arts);
  });
});

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

import { artRarity, entryChanges, matchedSpecialRarity } from './arts';

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

describe('a card whose printings are all special (Rebecca, all Nova Rare)', () => {
  const nova1 = p('s', 'Set 1 Promos', '005', 'Nova Rare');
  const nova2 = p('s', 'Set 1 Promos', '007', 'Nova Rare');
  const only: Card = { ...card, key: 'v', rarity: 'Nova Rare', printings: [nova1, nova2] };

  it('has no empty base art, only the Nova art', () => {
    const arts = artsOf(only);
    expect(arts.map((a) => a.artId)).toEqual(['v__nova-rare']);
    expect(arts[0]?.printings).toHaveLength(2);
  });
  it('falls back to a base art when there is no picture for the special rarity', () => {
    const arts = artsOf(only, () => false);
    expect(arts.map((a) => a.artId)).toEqual(['v']);
    expect(arts[0]?.printings).toHaveLength(2);
  });
  it('counts the copies without a version in the only art', () => {
    const owned = ownedPerArt(key(5, { [nova1.key]: 2 }), only);
    expect(owned.get('v__nova-rare')).toBe(5);
  });
  it('raises on the default printing and lowers the copies without a version first', () => {
    const raised = setArtCount(col(key(2)), only, 'v__nova-rare', 3);
    expect(raised.entries[0]).toEqual({ card: 'v', count: 3, versions: { [nova1.key]: 1 } });
    const lowered = setArtCount(col(key(4, { [nova1.key]: 1 })), only, 'v__nova-rare', 2);
    expect(lowered.entries[0]).toEqual({ card: 'v', count: 2, versions: { [nova1.key]: 1 } });
  });
});

describe('artRarity', () => {
  const secret = p('r', 'Night City — Retail', '003', 'Secret');
  const iconic = p('b', 'Night City — Beta', '168', 'Iconic Secret');
  const johnny: Card = { ...card, key: 'j', rarity: 'Secret', printings: [secret, iconic] };

  it('is the special rarity for a special art and the printings rarity for the base art', () => {
    const [base, special] = artsOf(johnny);
    expect(base && artRarity(johnny, base)).toBe('Secret');
    expect(special && artRarity(johnny, special)).toBe('Iconic Secret');
  });
  it('falls back to the card rarity when the base art has no printing rarity', () => {
    const bare = { ...johnny, printings: [p('r', 'Night City — Retail', '003', null)] };
    const [base] = artsOf(bare);
    expect(base && artRarity(bare, base)).toBe('Secret');
  });
});
