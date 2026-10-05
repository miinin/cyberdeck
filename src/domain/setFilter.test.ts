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
      { family: 'welcome-to-night-city', label: 'Welcome to Night City' },
      { family: 'edgerunner-open-s-1', label: 'Edgerunner Open S 1' },
    ]);
  });

  it('matches cards by any printing in the family', () => {
    expect(hasSetPrinting(a, 'welcome-to-night-city')).toBe(true);
    expect(hasSetPrinting(b, 'welcome-to-night-city')).toBe(false);
    expect(hasSetPrinting(c, 'welcome-to-night-city')).toBe(false);
  });

  it('owns a set version only when that printing is recorded', () => {
    let collection = withCount(EMPTY_COLLECTION, 'a', 3);
    expect(ownsSetVersion(a, 'welcome-to-night-city', collection)).toBe(false);
    collection = setVersionCount(collection, 'a', 'wb:1', 2);
    expect(ownsSetVersion(a, 'welcome-to-night-city', collection)).toBe(true);
    expect(ownsSetVersion(a, 'edgerunner-open-s-1', collection)).toBe(false);
  });

  it('totals the recorded versions per set', () => {
    let collection = withCount(withCount(EMPTY_COLLECTION, 'a', 3), 'b', 1);
    collection = setVersionCount(setVersionCount(collection, 'a', 'wb:1', 2), 'a', 'wr:1', 1);
    expect(versionsBySet([a, b], collection)).toEqual([{ label: 'Welcome to Night City', count: 3 }]);
  });
});
