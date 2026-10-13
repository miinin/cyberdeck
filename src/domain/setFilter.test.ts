import type { Card } from './card';
import { EMPTY_COLLECTION, setVersionCount, withCount } from './collection';
import type { Printing } from './printing';
import { hasSetPrinting, ownsSetVersion, setOptions, versionsBySet } from './setFilter';

function printing(setName: string, key: string): Printing {
  return {
    key,
    setCode: key.split(':')[0] ?? key,
    setName,
    number: '1',
    rarity: null,
    language: 'en',
    artist: null,
    imageKey: key,
  };
}
function card(key: string, printings: Printing[]): Card {
  return {
    id: key,
    key,
    slug: key,
    name: key,
    subname: null,
    displayName: key,
    type: 'Unit',
    color: null,
    cost: 1,
    power: null,
    ram: null,
    rarity: null,
    printings,
  };
}

const a = card('a', [
  printing('Welcome to Night City — Retail', 'wr:1'),
  printing('Welcome to Night City — Beta', 'wb:1'),
]);
const b = card('b', [printing('Edgerunner Open S 1', 'eo:2')]);
const c = card('c', []);

describe('set filter', () => {
  it('derives one option per set family', () => {
    expect(setOptions([a, b, c])).toEqual([
      { family: 'welcome-to-night-city', label: 'Welcome to Night City', group: 'sets' },
      { family: 'welcome-to-night-city-beta', label: 'Welcome to Night City (Beta)', group: 'sets' },
      { family: 'edgerunner-open-s-1', label: 'Edgerunner Open S 1', group: 'other' },
    ]);
  });

  it('puts the sets first and the other products after them, FR with Retail (D-022)', () => {
    const fr = card('fr', [printing('Welcome to Night City — Retail — FR', 'wrfr:1')]);
    const promo = card('p', [printing('Set 1 Promos', 'prm:1')]);
    expect(setOptions([promo, b, fr, a]).map((o) => [o.family, o.group])).toEqual([
      ['welcome-to-night-city', 'sets'],
      ['welcome-to-night-city-beta', 'sets'],
      ['set-1-promos', 'other'],
      ['edgerunner-open-s-1', 'other'],
    ]);
    expect(hasSetPrinting(fr, 'welcome-to-night-city')).toBe(true);
    expect(hasSetPrinting(fr, 'welcome-to-night-city-beta')).toBe(false);
  });

  it('leaves the V Streetkid Iconic Legend arts out of the Welcome to Night City sets (T-160)', () => {
    const v = card('v-streetkid', [
      printing('Welcome to Night City — Retail', 'welcometonightcityretail:005a'),
      printing('Welcome to Night City — Retail', 'welcometonightcityretail:144'),
      printing('Welcome to Night City — Beta', 'welcometonightcitybeta:144'),
    ]);
    expect(setOptions([v]).map((o) => o.family)).toEqual(['welcome-to-night-city']);
    expect(hasSetPrinting(v, 'welcome-to-night-city-beta')).toBe(false);
    let collection = setVersionCount(EMPTY_COLLECTION, 'v-streetkid', 'welcometonightcitybeta:144', 1);
    expect(ownsSetVersion(v, 'welcome-to-night-city-beta', collection)).toBe(false);
    collection = setVersionCount(collection, 'v-streetkid', 'welcometonightcityretail:005a', 2);
    expect(versionsBySet([v], collection)).toEqual([{ label: 'Welcome to Night City', count: 2 }]);
  });

  it('matches cards by any printing in the family', () => {
    expect(hasSetPrinting(a, 'welcome-to-night-city')).toBe(true);
    expect(hasSetPrinting(b, 'welcome-to-night-city')).toBe(false);
    expect(hasSetPrinting(c, 'welcome-to-night-city')).toBe(false);
  });

  it('owns a set version only when that printing is recorded', () => {
    let collection = withCount(EMPTY_COLLECTION, 'a', 3);
    expect(ownsSetVersion(a, 'welcome-to-night-city-beta', collection)).toBe(false);
    collection = setVersionCount(collection, 'a', 'wb:1', 2);
    expect(ownsSetVersion(a, 'welcome-to-night-city-beta', collection)).toBe(true);
    expect(ownsSetVersion(a, 'welcome-to-night-city', collection)).toBe(false);
    expect(ownsSetVersion(a, 'edgerunner-open-s-1', collection)).toBe(false);
  });

  it('totals the recorded versions per set', () => {
    let collection = withCount(withCount(EMPTY_COLLECTION, 'a', 3), 'b', 1);
    collection = setVersionCount(setVersionCount(collection, 'a', 'wb:1', 2), 'a', 'wr:1', 1);
    expect(versionsBySet([a, b], collection)).toEqual([
      { label: 'Welcome to Night City', count: 1 },
      { label: 'Welcome to Night City (Beta)', count: 2 },
    ]);
  });
});
