import { describe, expect, it } from 'vitest';
import type { Card } from './card';
import type { DeckContent } from './deck';
import { toCardsByKey } from './deckRules';
import { OPENING_HAND, canMulligan, drawCard, mulligan, shuffle, startHand } from './testHand';
import type { Rng } from './testHand';

/** Seeded linear congruential generator, 0 ≤ x < 1. */
function lcg(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function card(key: string, type = 'Unit'): Card {
  return {
    id: key,
    slug: key,
    name: key,
    subname: null,
    displayName: key,
    type,
    color: 'Red',
    cost: 1,
    power: 1,
    ram: 1,
    rarity: null,
    key,
  };
}
const legends = ['l1', 'l2', 'l3'].map((key) => card(key, 'Legend'));
const units = Array.from({ length: 14 }, (_, i) => card(`u${i}`));
const cardsByKey = toCardsByKey([...legends, ...units]);
const deck: DeckContent = {
  name: 'Testi',
  sections: [
    {
      name: '',
      cards: [...legends.map((c) => ({ card: c.key, count: 1 })), ...units.map((c) => ({ card: c.key, count: 3 }))],
    },
    { name: 'Sivu', cards: [{ card: 'unknown', count: 2 }] },
  ],
};
const MAIN = 14 * 3;

describe('shuffle', () => {
  it('keeps every item and does not change the input', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const copy = [...input];
    const result = shuffle(input, lcg(1));
    expect(input).toEqual(copy);
    expect([...result].sort((a, b) => a - b)).toEqual(copy);
    expect(result).not.toBe(input);
  });
});

describe('startHand', () => {
  it('deals a 6-card hand from the main deck and keeps Legends apart', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const state = startHand(deck, cardsByKey, lcg(seed));
      expect(state.hand).toHaveLength(OPENING_HAND);
      expect(state.hand.length + state.library.length).toBe(MAIN);
      expect(state.hand.some((c) => c.type === 'Legend')).toBe(false);
      expect(state.library.some((c) => c.type === 'Legend')).toBe(false);
      expect(state.legends.map((c) => c.key).sort()).toEqual(['l1', 'l2', 'l3']);
      expect(state.mulliganUsed).toBe(false);
    }
  });

  it('gives the same hand for the same seed', () => {
    const a = startHand(deck, cardsByKey, lcg(42));
    const b = startHand(deck, cardsByKey, lcg(42));
    expect(a.hand.map((c) => c.key)).toEqual(b.hand.map((c) => c.key));
    expect(a.legends.map((c) => c.key)).toEqual(b.legends.map((c) => c.key));
  });

  it('deals everything when the deck is smaller than a hand', () => {
    const small: DeckContent = {
      name: 'Pieni',
      sections: [
        {
          name: '',
          cards: [
            { card: 'u0', count: 3 },
            { card: 'l1', count: 1 },
          ],
        },
      ],
    };
    const state = startHand(small, cardsByKey, lcg(3));
    expect(state.hand).toHaveLength(3);
    expect(state.library).toHaveLength(0);
  });
});

describe('drawCard', () => {
  it('moves the top card to the end of the hand', () => {
    const state = startHand(deck, cardsByKey, lcg(7));
    const next = drawCard(state);
    expect(next.hand).toHaveLength(OPENING_HAND + 1);
    expect(next.hand.at(-1)).toBe(state.library[0]);
    expect(next.library).toHaveLength(state.library.length - 1);
    expect(next.drawnAfterOpening).toBe(1);
  });

  it('does nothing when the library is empty', () => {
    const empty = {
      library: [],
      hand: [card('u0')],
      legends: [],
      mulliganUsed: false,
      drawnAfterOpening: 0,
    };
    expect(drawCard(empty)).toBe(empty);
  });
});

describe('mulligan', () => {
  it('deals a new 6-card hand once', () => {
    const state = startHand(deck, cardsByKey, lcg(9));
    const after = mulligan(state, lcg(10));
    expect(after.mulliganUsed).toBe(true);
    expect(after.hand).toHaveLength(OPENING_HAND);
    expect(after.hand.length + after.library.length).toBe(MAIN);
    expect(after.legends).toBe(state.legends);
    expect(canMulligan(after)).toBe(false);
    expect(mulligan(after, lcg(11))).toBe(after);
  });

  it('is not allowed after a draw', () => {
    const drawn = drawCard(startHand(deck, cardsByKey, lcg(12)));
    expect(canMulligan(drawn)).toBe(false);
    expect(mulligan(drawn, lcg(13))).toBe(drawn);
  });
});
