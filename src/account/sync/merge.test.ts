import type { Collection } from '../../domain/collection';
import type { Deck } from '../../domain/deck';
import { mergeCollection, mergeDecks, sameCollection } from './merge';

function deck(id: string, updatedAt: string, name = id, createdAt = '2026-10-01T00:00:00.000Z'): Deck {
  return { id, name, sections: [{ name: '', cards: [{ card: 'detonate', count: 1 }] }], createdAt, updatedAt };
}
const T1 = '2026-10-01T10:00:00.000Z';
const T2 = '2026-10-02T10:00:00.000Z';
const T3 = '2026-10-03T10:00:00.000Z';
const base = (...stamps: [string, string][]) => stamps.map(([id, updatedAt]) => ({ id, updatedAt }));

describe('mergeDecks', () => {
  it('keeps everything when nothing changed', () => {
    const d = deck('a', T1);
    const result = mergeDecks([d], [d], base(['a', T1]));
    expect(result).toEqual({ decks: [d], put: [], remove: [] });
  });

  it('takes the local change when only the device changed', () => {
    const mine = deck('a', T2, 'local');
    const result = mergeDecks([mine], [deck('a', T1)], base(['a', T1]));
    expect(result).toEqual({ decks: [mine], put: [mine], remove: [] });
  });

  it('takes the cloud change when only the cloud changed', () => {
    const theirs = deck('a', T2, 'cloud');
    const result = mergeDecks([deck('a', T1)], [theirs], base(['a', T1]));
    expect(result).toEqual({ decks: [theirs], put: [], remove: [] });
  });

  it('lets the later updatedAt win when both changed', () => {
    const mine = deck('a', T3, 'local');
    const theirs = deck('a', T2, 'cloud');
    expect(mergeDecks([mine], [theirs], base(['a', T1])).decks).toEqual([mine]);
    expect(mergeDecks([mine], [theirs], base(['a', T1])).put).toEqual([mine]);
    const later = deck('a', T3, 'cloud');
    expect(mergeDecks([deck('a', T2, 'local')], [later], base(['a', T1]))).toEqual({
      decks: [later],
      put: [],
      remove: [],
    });
  });

  it('gives a tie to the cloud', () => {
    const theirs = deck('a', T2, 'cloud');
    const result = mergeDecks([deck('a', T2, 'local')], [theirs], base(['a', T1]));
    expect(result).toEqual({ decks: [theirs], put: [], remove: [] });
  });

  it('applies a local deletion to the cloud and a cloud deletion to the device', () => {
    expect(mergeDecks([], [deck('a', T1)], base(['a', T1]))).toEqual({ decks: [], put: [], remove: ['a'] });
    expect(mergeDecks([deck('a', T1)], [], base(['a', T1]))).toEqual({ decks: [], put: [], remove: [] });
  });

  it('keeps the edited deck when the other side deleted it', () => {
    const edited = deck('a', T2, 'edited');
    expect(mergeDecks([edited], [], base(['a', T1]))).toEqual({ decks: [edited], put: [edited], remove: [] });
    expect(mergeDecks([], [edited], base(['a', T1]))).toEqual({ decks: [edited], put: [], remove: [] });
  });

  it('copies new decks both ways and orders cloud-only decks by creation time', () => {
    const mine = deck('m', T1);
    const c1 = deck('c1', T1, 'c1', '2026-10-02T00:00:00.000Z');
    const c2 = deck('c2', T1, 'c2', '2026-10-01T12:00:00.000Z');
    const result = mergeDecks([mine], [c1, c2], []);
    expect(result.decks.map((d) => d.id)).toEqual(['m', 'c2', 'c1']);
    expect(result.put).toEqual([mine]);
  });

  it('never treats an invalid cloud deck as deleted or overwrites it', () => {
    const mine = deck('a', T2);
    const result = mergeDecks([mine], [], base(['a', T1]), ['a']);
    expect(result).toEqual({ decks: [mine], put: [], remove: [] });
    expect(mergeDecks([], [], base(['a', T1]), ['a'])).toEqual({ decks: [], put: [], remove: [] });
  });

  it('drops a deck deleted on both sides', () => {
    expect(mergeDecks([], [], base(['a', T1]))).toEqual({ decks: [], put: [], remove: [] });
  });
});

const col = (...rows: [string, number][]): Collection => ({ entries: rows.map(([card, count]) => ({ card, count })) });

describe('mergeCollection', () => {
  it('takes the only side that changed, per card', () => {
    const result = mergeCollection(col(['a', 2], ['b', 1]), col(['a', 1], ['b', 5]), col(['a', 1], ['b', 1]));
    expect(result.collection).toEqual(col(['a', 2], ['b', 5]));
    expect(result.writeCloud).toBe(true);
  });

  it('prefers the local count when both changed the same card', () => {
    expect(mergeCollection(col(['a', 3]), col(['a', 4]), col(['a', 1])).collection).toEqual(col(['a', 3]));
  });

  it('applies removals from either side', () => {
    expect(mergeCollection(col(), col(['a', 1]), col(['a', 1])).collection).toEqual(col());
    expect(mergeCollection(col(['a', 1]), col(), col(['a', 1])).collection).toEqual(col());
    expect(mergeCollection(col(['a', 1]), col(), col(['a', 1])).writeCloud).toBe(false);
  });

  it('merges by card on the first sync (empty base) and sorts by key', () => {
    const result = mergeCollection(col(['b', 1]), col(['a', 2], ['b', 7]), col());
    expect(result.collection).toEqual(col(['a', 2], ['b', 1]));
  });

  it('does not write an unchanged collection', () => {
    expect(mergeCollection(col(['a', 1]), col(['a', 1]), col(['a', 1])).writeCloud).toBe(false);
  });

  it('never writes over an invalid cloud collection', () => {
    expect(mergeCollection(col(['a', 1]), null, col())).toEqual({ collection: col(['a', 1]), writeCloud: false });
  });
});

describe('mergeCollection versions (D-020)', () => {
  const A = 'set:001';
  const B = 'set:002';
  const withVersions = (card: string, count: number, versions: Record<string, number>): Collection => ({
    entries: [{ card, count, versions }],
  });

  it('takes the cloud breakdown when only the cloud changed it', () => {
    const result = mergeCollection(col(['a', 3]), withVersions('a', 3, { [A]: 2 }), col(['a', 3]));
    expect(result.collection).toEqual(withVersions('a', 3, { [A]: 2 }));
    expect(result.writeCloud).toBe(false);
  });

  it('merges per printing: the local change wins for its printing, the cloud change for the other', () => {
    const result = mergeCollection(
      withVersions('a', 4, { [A]: 2, [B]: 1 }),
      withVersions('a', 4, { [A]: 1, [B]: 3 }),
      withVersions('a', 4, { [A]: 1, [B]: 1 }),
    );
    // A: local changed (2). B: only the cloud changed (3). Count: only... local and cloud both 4 = base.
    expect(result.collection).toEqual(withVersions('a', 4, { [A]: 2, [B]: 2 }));
    expect(result.writeCloud).toBe(true);
  });

  it('cuts the sum down to the count', () => {
    const result = mergeCollection(col(['a', 1]), withVersions('a', 3, { [A]: 3 }), col(['a', 3]));
    expect(result.collection).toEqual(withVersions('a', 1, { [A]: 1 }));
  });

  it('treats a changed breakdown as a change when writing to the cloud', () => {
    const local = withVersions('a', 2, { [A]: 1 });
    const result = mergeCollection(local, col(['a', 2]), col(['a', 2]));
    expect(result.collection).toEqual(local);
    expect(result.writeCloud).toBe(true);
    expect(sameCollection(local, col(['a', 2]))).toBe(false);
  });
});
