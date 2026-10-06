import { describe, expect, it } from 'vitest';
import type { Card } from './card';
import { toCardsByKey } from './deckRules';
import { EDDIE_TARGET_CHANCE, eddieCurve, eddieSummary, eddieTargetTurn, recommendedSellable } from './eddies';

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

  it('asks for more sellable cards for a pricier deck, and the number reaches the target chance', () => {
    const cheap = recommendedSellable(40, 2) ?? 99;
    const pricey = recommendedSellable(40, 5) ?? 99;
    expect(pricey).toBeGreaterThan(cheap);
    expect(eddieCurve(40, pricey, 5).onCurve[4]).toBeGreaterThanOrEqual(EDDIE_TARGET_CHANCE);
    expect(eddieCurve(40, pricey - 1, 5).onCurve[4]).toBeLessThan(EDDIE_TARGET_CHANCE);
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
  });
});
