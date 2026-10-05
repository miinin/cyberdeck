import type { Card } from './card';
import { EMPTY_COLLECTION, countOf, setVersionCount, versionsOf, withCount } from './collection';
import type { Collection } from './collection';
import { editionPrinting, protectedCount, setCopiesByEdition, targetPrinting } from './edition';
import type { Printing } from './printing';

function p(setCode: string, number: string, rarity: string | null, language = 'en'): Printing {
  return { key: `${setCode}:${number.replace('β', '')}`, setCode, setName: setCode, number, rarity, language, artist: null, imageKey: '' };
}
const RETAIL = 'welcometonightcityretail:005a';
const BETA = 'welcometonightcitybeta:005a';
const FR = 'welcometonightcityretail-fr:005a';
const BETA_ICONIC = 'welcometonightcitybeta:144';
const NOVA = 'edgerunneropens1:013';

const v: Card = {
  id: 'v', slug: 'v', name: 'V', subname: null, displayName: 'V', type: 'Legend', color: null, cost: null, power: null, ram: null, rarity: 'Rare', key: 'v',
  printings: [
    p('welcometonightcityretail', '005b', 'Rare'),
    p('welcometonightcityretail', '005a', 'Rare'),
    p('welcometonightcitybeta', 'β144', 'Iconic Legend'),
    p('welcometonightcitybeta', 'β005b', 'Rare'),
    p('welcometonightcitybeta', 'β005a', 'Rare'),
    p('welcometonightcityretail-fr', '005a', 'Rare', 'fr'),
    p('edgerunneropens1', '013', 'Nova Rare'),
  ],
};
const promo: Card = { ...v, key: 'promo', printings: [p('set1promos', '001', 'Promo')] };
const betaOnly: Card = { ...v, key: 'beta-only', printings: [p('welcometonightcitybeta', 'β001', 'Common')] };

const set = (c: Collection, key: string, n: number) => setVersionCount(c, 'v', key, n);
const entry = (c: Collection) => c.entries[0];

describe('edition printings (D-022)', () => {
  it('picks the ordinary printing of an edition, the first by number, never an Iconic or FR one', () => {
    expect(editionPrinting(v, 'beta')?.key).toBe(BETA);
    expect(editionPrinting(v, 'retail')?.key).toBe(RETAIL);
    expect(editionPrinting(promo, 'beta')).toBeNull();
  });

  it('falls back to the other edition when the preferred one does not exist, else null', () => {
    expect(targetPrinting(betaOnly, 'retail')?.key).toBe('welcometonightcitybeta:001');
    expect(targetPrinting(promo, 'beta')).toBeNull();
  });
});

describe('setCopiesByEdition (D-022)', () => {
  it('+ adds to the default edition and the count follows', () => {
    const one = setCopiesByEdition(EMPTY_COLLECTION, v, 'beta', 1);
    expect(entry(one)).toEqual({ card: 'v', count: 1, versions: { [BETA]: 1 } });
    const retail = setCopiesByEdition(one, v, 'retail', 2);
    expect(entry(retail)).toEqual({ card: 'v', count: 2, versions: { [BETA]: 1, [RETAIL]: 1 } });
  });

  it('+ leaves the copies without a version as they are', () => {
    const next = setCopiesByEdition(withCount(EMPTY_COLLECTION, 'v', 2), v, 'beta', 3);
    expect(entry(next)).toEqual({ card: 'v', count: 3, versions: { [BETA]: 1 } });
  });

  it('− takes from the default edition first, then the unversioned copies, then the other ordinary printings', () => {
    let c = withCount(EMPTY_COLLECTION, 'v', 1); // one unversioned
    c = set(c, RETAIL, 2);
    c = set(c, BETA, 1);
    c = set(c, FR, 1);
    expect(countOf(c, 'v')).toBe(5);
    c = setCopiesByEdition(c, v, 'beta', 4);
    expect(versionsOf(c, 'v')).toEqual({ [RETAIL]: 2, [FR]: 1 });
    expect(countOf(c, 'v')).toBe(4);
    c = setCopiesByEdition(c, v, 'beta', 3); // unversioned goes before the other printings
    expect(entry(c)).toEqual({ card: 'v', count: 3, versions: { [RETAIL]: 2, [FR]: 1 } });
    c = setCopiesByEdition(c, v, 'beta', 2);
    expect(countOf(c, 'v')).toBe(2);
    expect(Object.values(versionsOf(c, 'v')).reduce((a, b) => a + b, 0)).toBe(2);
  });

  it('− with the default set to Retail takes from Retail first', () => {
    let c = set(set(EMPTY_COLLECTION, RETAIL, 1), BETA, 1);
    c = setCopiesByEdition(c, v, 'retail', 1);
    expect(entry(c)).toEqual({ card: 'v', count: 1, versions: { [BETA]: 1 } });
  });

  it('− never takes the special versions: it throws when only they are left', () => {
    const c = set(set(EMPTY_COLLECTION, BETA_ICONIC, 1), NOVA, 1);
    expect(protectedCount(c, v)).toBe(2);
    expect(() => setCopiesByEdition(c, v, 'beta', 1)).toThrow(RangeError);
    const withBeta = set(c, BETA, 1);
    expect(entry(setCopiesByEdition(withBeta, v, 'beta', 2))).toEqual({ card: 'v', count: 2, versions: { [BETA_ICONIC]: 1, [NOVA]: 1 } });
  });

  it('removes the card at 0', () => {
    expect(setCopiesByEdition(set(EMPTY_COLLECTION, BETA, 1), v, 'beta', 0).entries).toEqual([]);
  });

  it('throws for a card without a Welcome to Night City printing', () => {
    expect(() => setCopiesByEdition(EMPTY_COLLECTION, promo, 'beta', 1)).toThrow(RangeError);
  });

  it('protectedCount counts versions of keys the card does not list', () => {
    const c = setVersionCount(EMPTY_COLLECTION, 'v', 'mystery:1', 1);
    expect(protectedCount(c, v)).toBe(1);
  });
});
