import { countOf, EMPTY_COLLECTION, toCountMap, withCount } from './collection';
import type { Collection } from './collection';

describe('withCount', () => {
  it('adds, updates and removes rows', () => {
    const added = withCount(EMPTY_COLLECTION, 'v-streetkid', 2);
    expect(added.entries).toEqual([{ card: 'v-streetkid', count: 2 }]);

    const updated = withCount(added, 'v-streetkid', 5);
    expect(updated.entries).toEqual([{ card: 'v-streetkid', count: 5 }]);

    expect(withCount(updated, 'v-streetkid', 0).entries).toEqual([]);
  });

  it('removing a card that is not there leaves the collection empty', () => {
    expect(withCount(EMPTY_COLLECTION, 'detonate', 0).entries).toEqual([]);
  });

  it('keeps the rows ordered by key', () => {
    let collection: Collection = EMPTY_COLLECTION;
    for (const key of ['v-streetkid', 'chrome-fang', 'detonate', '6th-street-recruits']) {
      collection = withCount(collection, key, 1);
    }
    expect(collection.entries.map((entry) => entry.card)).toEqual([
      '6th-street-recruits',
      'chrome-fang',
      'detonate',
      'v-streetkid',
    ]);
  });

  it('does not change the original collection', () => {
    const original = withCount(EMPTY_COLLECTION, 'detonate', 1);
    const snapshot = JSON.stringify(original);
    withCount(original, 'detonate', 3);
    withCount(original, 'chrome-fang', 1);
    expect(JSON.stringify(original)).toBe(snapshot);
    expect(EMPTY_COLLECTION.entries).toEqual([]);
  });

  it.each([-1, 1.5, Number.NaN, 1000, Number.POSITIVE_INFINITY])('throws RangeError for count %s', (count) => {
    expect(() => withCount(EMPTY_COLLECTION, 'detonate', count)).toThrow(RangeError);
  });

  it.each(['', 'Detonate', 'constructor', '__proto__'])('throws RangeError for key "%s"', (key) => {
    expect(() => withCount(EMPTY_COLLECTION, key, 1)).toThrow(RangeError);
  });

  it('accepts the upper limit 999', () => {
    expect(countOf(withCount(EMPTY_COLLECTION, 'detonate', 999), 'detonate')).toBe(999);
  });
});

describe('countOf and toCountMap', () => {
  const collection = withCount(withCount(EMPTY_COLLECTION, 'detonate', 3), 'chrome-fang', 1);

  it('returns the count, or 0 for a missing card', () => {
    expect(countOf(collection, 'detonate')).toBe(3);
    expect(countOf(collection, 'v-streetkid')).toBe(0);
  });

  it('builds a Map lookup', () => {
    const map = toCountMap(collection);
    expect(map).toBeInstanceOf(Map);
    expect(map.get('detonate')).toBe(3);
    expect(map.get('constructor')).toBeUndefined();
    expect(map.size).toBe(2);
  });
});
