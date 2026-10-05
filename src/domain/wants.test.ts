import { MAX_COLLECTION_ENTRIES } from './collection';
import type { Collection } from './collection';
import { addMissingToWants, EMPTY_WANTS } from './wants';

const wants = (...rows: [string, number][]): Collection => ({ entries: rows.map(([card, count]) => ({ card, count })) });

describe('addMissingToWants', () => {
  it('adds missing cards to an empty list, ordered by key', () => {
    expect(
      addMissingToWants(EMPTY_WANTS, [
        { card: 'v-streetkid', missing: 2 },
        { card: 'detonate', missing: 1 },
      ]),
    ).toEqual(wants(['detonate', 1], ['v-streetkid', 2]));
  });

  it('uses the larger of the current want and the missing count, never the sum', () => {
    const current = wants(['detonate', 2], ['overclock', 3]);
    const next = addMissingToWants(current, [
      { card: 'detonate', missing: 3 },
      { card: 'overclock', missing: 1 },
    ]);
    expect(next).toEqual(wants(['detonate', 3], ['overclock', 3]));
  });

  it('is idempotent and returns the same object when nothing changes', () => {
    const current = wants(['detonate', 2]);
    expect(addMissingToWants(current, [{ card: 'detonate', missing: 2 }])).toBe(current);
    expect(addMissingToWants(current, [{ card: 'detonate', missing: 1 }])).toBe(current);
    expect(addMissingToWants(current, [])).toBe(current);
    const once = addMissingToWants(current, [{ card: 'overclock', missing: 1 }]);
    expect(addMissingToWants(once, [{ card: 'overclock', missing: 1 }])).toBe(once);
  });

  it('takes the largest of repeated rows for one card', () => {
    expect(
      addMissingToWants(EMPTY_WANTS, [
        { card: 'detonate', missing: 1 },
        { card: 'detonate', missing: 4 },
        { card: 'detonate', missing: 2 },
      ]),
    ).toEqual(wants(['detonate', 4]));
  });

  it('caps the count at 999', () => {
    expect(addMissingToWants(EMPTY_WANTS, [{ card: 'detonate', missing: 5000 }])).toEqual(wants(['detonate', 999]));
  });

  it('skips invalid rows without throwing', () => {
    const next = addMissingToWants(EMPTY_WANTS, [
      { card: 'Detonate', missing: 1 },
      { card: '__proto__', missing: 1 },
      { card: 'detonate', missing: 0 },
      { card: 'detonate', missing: -2 },
      { card: 'detonate', missing: 1.5 },
      { card: 'detonate', missing: Number.NaN },
      { card: 'overclock', missing: 2 },
    ]);
    expect(next).toEqual(wants(['overclock', 2]));
  });

  it('does not add a new card to a full list, but still raises existing ones', () => {
    const full: Collection = {
      entries: Array.from({ length: MAX_COLLECTION_ENTRIES }, (_, index) => ({
        card: `card-${String(index).padStart(5, '0')}`,
        count: 1,
      })),
    };
    const next = addMissingToWants(full, [
      { card: 'detonate', missing: 1 },
      { card: 'card-00001', missing: 3 },
    ]);
    expect(next.entries).toHaveLength(MAX_COLLECTION_ENTRIES);
    expect(next.entries.find((entry) => entry.card === 'card-00001')?.count).toBe(3);
    expect(next.entries.some((entry) => entry.card === 'detonate')).toBe(false);
  });

  it('does not change its input', () => {
    const current = wants(['detonate', 1]);
    addMissingToWants(current, [{ card: 'detonate', missing: 3 }]);
    expect(current).toEqual(wants(['detonate', 1]));
  });
});
