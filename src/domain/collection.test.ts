import { countOf, EMPTY_COLLECTION, minCountOf, setVersionCount, toCountMap, trySetCount, unknownVersionCount, withCount } from './collection';
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

describe('versions (D-020)', () => {
  const A = 'welcometonightcityretail:005a';
  const B = 'welcometonightcitybeta:005a';

  it('raising a version raises the count, lowering it lowers the count, unknown copies stay', () => {
    let c = withCount(EMPTY_COLLECTION, 'detonate', 2); // 2 unknown
    c = setVersionCount(c, 'detonate', A, 1);
    expect(c.entries).toEqual([{ card: 'detonate', count: 3, versions: { [A]: 1 } }]);
    expect(unknownVersionCount(c, 'detonate')).toBe(2);
    c = setVersionCount(c, 'detonate', B, 2);
    expect(countOf(c, 'detonate')).toBe(5);
    c = setVersionCount(c, 'detonate', A, 0);
    expect(c.entries).toEqual([{ card: 'detonate', count: 4, versions: { [B]: 2 } }]);
    c = setVersionCount(c, 'detonate', B, 0);
    expect(c.entries).toEqual([{ card: 'detonate', count: 2 }]);
  });

  it('creates and removes a row through a version alone', () => {
    const c = setVersionCount(EMPTY_COLLECTION, 'detonate', A, 1);
    expect(c.entries).toEqual([{ card: 'detonate', count: 1, versions: { [A]: 1 } }]);
    expect(setVersionCount(c, 'detonate', A, 0).entries).toEqual([]);
  });

  it('does not change the input and keeps versions when only the count changes', () => {
    const c = setVersionCount(EMPTY_COLLECTION, 'detonate', A, 2);
    expect(withCount(c, 'detonate', 5).entries).toEqual([{ card: 'detonate', count: 5, versions: { [A]: 2 } }]);
    expect(c.entries).toEqual([{ card: 'detonate', count: 2, versions: { [A]: 2 } }]);
  });

  it('blocks a count below the sum of the versions and reports the minimum', () => {
    const c = setVersionCount(withCount(EMPTY_COLLECTION, 'detonate', 3), 'detonate', A, 2);
    expect(minCountOf(c, 'detonate')).toBe(2);
    expect(trySetCount(c, 'detonate', 1)).toEqual({ ok: false, minimum: 2 });
    expect(trySetCount(c, 'detonate', 0)).toEqual({ ok: false, minimum: 2 });
    expect(() => withCount(c, 'detonate', 1)).toThrow(RangeError);
    const ok = trySetCount(c, 'detonate', 2);
    expect(ok.ok && countOf(ok.collection, 'detonate')).toBe(2);
  });

  it('rejects invalid keys, numbers and totals over 999', () => {
    expect(() => setVersionCount(EMPTY_COLLECTION, 'detonate', 'nope', 1)).toThrow(RangeError);
    expect(() => setVersionCount(EMPTY_COLLECTION, 'detonate', A, -1)).toThrow(RangeError);
    expect(() => setVersionCount(EMPTY_COLLECTION, 'detonate', A, 1.5)).toThrow(RangeError);
    const full = withCount(EMPTY_COLLECTION, 'detonate', 999);
    expect(() => setVersionCount(full, 'detonate', A, 1)).toThrow(RangeError);
  });

  it('allows at most 32 printings per card', () => {
    let c: Collection = EMPTY_COLLECTION;
    for (let i = 0; i < 32; i += 1) c = setVersionCount(c, 'detonate', `s:${i}`, 1);
    expect(() => setVersionCount(c, 'detonate', 's:99', 1)).toThrow(RangeError);
  });
});
