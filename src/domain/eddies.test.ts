import { describe, expect, it } from 'vitest';
import type { Card } from './card';
import { toCardsByKey } from './deckRules';
import { eddieCurve, eddieSummary, eddieTargetTurn, sellableTarget } from './eddies';

describe('eddieCurve (T-096)', () => {
  it('gives nothing without sellable cards and one Eddie a turn with only sellable cards', () => {
    expect(eddieCurve(40, 0).expected).toEqual([0, 0, 0, 0, 0, 0]);
    const all = eddieCurve(40, 40);
    expect(all.expected).toEqual([1, 2, 3, 4, 5, 6]);
    expect(all.onCurve).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it('grows with more sellable cards and never beats one sale a turn', () => {
    const few = eddieCurve(40, 8);
    const many = eddieCurve(40, 20);
    for (let t = 0; t < 6; t++) {
      expect(many.expected[t]).toBeGreaterThan(few.expected[t] ?? 0);
      expect(many.expected[t]).toBeLessThanOrEqual(t + 1);
      expect(many.onCurve[t]).toBeGreaterThanOrEqual(few.onCurve[t] ?? 0);
    }
  });

  it('is the same every time for the same deck (seeded)', () => {
    expect(eddieCurve(45, 17)).toEqual(eddieCurve(45, 17));
  });
});

describe('recommendation', () => {
  it('takes the average Cost rounded up as the target turn, 2 … 6', () => {
    expect(eddieTargetTurn(null)).toBe(3);
    expect(eddieTargetTurn(1.2)).toBe(2);
    expect(eddieTargetTurn(3.4)).toBe(4);
    expect(eddieTargetTurn(4.0)).toBe(4);
    expect(eddieTargetTurn(8.5)).toBe(6);
  });

  it('recommends 55-60 % of the deck at an average Cost of 3', () => {
    expect(sellableTarget(42, 3)).toMatchObject({ min: 23, max: 25 });
    expect(sellableTarget(40, 3)).toMatchObject({ min: 22, max: 24 });
    const target = sellableTarget(40, 3);
    expect(target?.shareLow).toBeCloseTo(0.55);
    expect(target?.shareHigh).toBeCloseTo(0.6);
  });

  it('asks for more for a pricier deck and fewer for a cheaper one, centre kept within 45-70 %', () => {
    expect(sellableTarget(40, 4)?.min ?? 0).toBeGreaterThan(sellableTarget(40, 3)?.min ?? 99);
    expect(sellableTarget(40, 2)?.max ?? 99).toBeLessThan(sellableTarget(40, 3)?.max ?? 0);
    expect(sellableTarget(100, 20)?.shareHigh).toBeCloseTo(0.725);
    expect(sellableTarget(100, 20)?.shareLow).toBeCloseTo(0.675);
    expect(sellableTarget(100, 0)?.shareLow).toBeCloseTo(0.425);
  });

  it('uses the normal band without a known Cost and gives nothing for an empty deck', () => {
    expect(sellableTarget(40, null)).toEqual(sellableTarget(40, 3));
    expect(sellableTarget(0, 3)).toBeNull();
  });
});

describe('eddieSummary', () => {
  const card = (key: string, fields: Partial<Card>): Card => ({
    id: key, slug: key, name: key, subname: null, displayName: key, type: 'Unit', color: 'Red',
    cost: 3, power: 1, ram: 1, rarity: null, key, eddiable: false, ...fields,
  });
  const cards = toCardsByKey([
    card('legend', { type: 'Legend', eddiable: true, cost: null }),
    card('unit', {}),
    card('prog', { type: 'Program', eddiable: true }),
    card('gear', { type: 'Gear', eddiable: true }),
    card('old', { eddiable: null }),
  ]);

  it('counts sellable main deck copies by type, not Legends, and keeps unknowns apart', () => {
    const summary = eddieSummary(
      { name: 'x', sections: [{ name: '', cards: [{ card: 'legend', count: 1 }, { card: 'unit', count: 3 }, { card: 'prog', count: 3 }, { card: 'gear', count: 2 }, { card: 'old', count: 1 }] }] },
      cards,
    );
    expect(summary.sellable).toBe(5);
    expect([...summary.byType]).toEqual([['Program', 3], ['Gear', 2]]);
    expect(summary.unknown).toBe(1);
    expect(summary.deckSize).toBe(9);
    expect(summary.targetTurn).toBe(3);
    expect(summary.target).toMatchObject({ min: 5, max: 5 });
  });
});
