import type { Card } from './card';
import type { DeckContent } from './deck';
import { allDeckCounts, deckCounts, toCardsByKey, validateDeck } from './deckRules';
import { applySubstitutes, findSubstitutes, playability } from './substitutes';

const mk = (key: string, cost: number | null, over: Partial<Card> = {}): Card => ({
  id: key, key, slug: key, name: key, subname: null, displayName: key, type: 'Unit', color: 'Red',
  cost, power: null, ram: null, rarity: null, ...over,
});
const owned = (map: Record<string, number>) => (k: string) => map[k] ?? 0;
const none = () => 0;
const row = (card: Card, missing = 1) => ({ card, missing });

describe('findSubstitutes', () => {
  const want = mk('want', 3);
  it('picks an owned card with the same colour and type and Cost within one', () => {
    const cards = [want, mk('near', 4), mk('far', 6), mk('blue', 3, { color: 'Blue' }), mk('gear', 3, { type: 'Gear' })];
    const result = findSubstitutes([row(want)], cards, owned({ near: 2, far: 3, blue: 3, gear: 3 }), none);
    expect(result.get('want')).toEqual([{ card: cards[1], copies: 1, owned: 2 }]);
  });
  it('prefers the closest Cost, then more spare copies', () => {
    const cards = [want, mk('a', 4), mk('b', 3), mk('c', 2)];
    expect(findSubstitutes([row(want)], cards, owned({ a: 3, b: 1, c: 3 }), none).get('want')?.[0]?.card.key).toBe('b');
    expect(findSubstitutes([row(want)], cards, owned({ a: 1, c: 3 }), none).get('want')?.[0]?.card.key).toBe('c');
  });
  it('skips cards already used up in the deck', () => {
    const cards = [want, mk('a', 3), mk('b', 3)];
    const deckCount = (k: string) => (k === 'a' ? 3 : 0);
    expect(findSubstitutes([row(want)], cards, owned({ a: 3, b: 1 }), deckCount).get('want')?.[0]?.card.key).toBe('b');
    expect(findSubstitutes([row(want)], [want, cards[1] as Card], owned({ a: 2 }), (k) => (k === 'a' ? 2 : 0)).size).toBe(0);
  });
  it('does not offer the same spare copy twice and ignores cards without Cost', () => {
    const w2 = mk('w2', 3);
    const cards = [want, w2, mk('a', 3)];
    const result = findSubstitutes([row(want), row(w2)], cards, owned({ a: 1 }), none);
    expect(result.size).toBe(1);
    expect(findSubstitutes([row(mk('nc', null))], [mk('a', 3)], owned({ a: 1 }), none).size).toBe(0);
  });
  it('covers every missing copy of a row, with several stand-ins when one runs out', () => {
    const cards = [want, mk('a', 3), mk('b', 4)];
    const result = findSubstitutes([row(want, 3)], cards, owned({ a: 2, b: 5 }), none);
    expect(result.get('want')?.map((s) => [s.card.key, s.copies])).toEqual([['a', 2], ['b', 1]]);
  });
  it('keeps deck copies plus stand-ins within the playset limit and leaves the rest uncovered', () => {
    const cards = [want, mk('a', 3)];
    const result = findSubstitutes([row(want, 3)], cards, owned({ a: 9 }), (k) => (k === 'a' ? 1 : 0));
    expect(result.get('want')).toEqual([{ card: cards[1], copies: 2, owned: 9 }]);
  });
});

describe('applySubstitutes and playability', () => {
  const legend = mk('leg', null, { type: 'Legend' });
  const want = mk('want', 3);
  const a = mk('a', 3);
  const b = mk('b', 4);
  const side = mk('side', 3);
  const cards = [legend, want, a, b, side];
  const byKey = toCardsByKey(cards);
  const deck: DeckContent = {
    name: 'D',
    sections: [
      { name: '', cards: [{ card: 'leg', count: 1 }, { card: 'want', count: 3 }, { card: 'side', count: 1 }] },
      { name: 'Sideboard', cards: [{ card: 'side', count: 1 }] },
    ],
  };
  const have = owned({ want: 1, a: 2, b: 5, side: 0 });
  const subs = findSubstitutes(
    [row(want, 2), row(side, 1)],
    cards,
    have,
    (k) => allDeckCounts(deck).get(k) ?? 0,
  );

  it('swaps the missing main-deck copies, keeps Legends and sideboard, and leaves the original deck alone', () => {
    const before = JSON.stringify(deck);
    const copy = applySubstitutes(deck, byKey, have, subs);
    expect(JSON.stringify(deck)).toBe(before);
    expect(deckCounts(copy).get('want')).toBe(1);
    expect(deckCounts(copy).get('a')).toBe(2);
    expect(deckCounts(copy).get('leg')).toBe(1);
    expect(copy.sections.find((s) => s.name === 'Sideboard')).toEqual(deck.sections[1]);
    expect(validateDeck(copy, byKey).filter((i) => i.type === 'copies')).toEqual([]);
  });
  it('counts own and covered copies of the main deck without Legends', () => {
    // Main non-Legend: want 3 (1 owned), side 1 (0 owned, wants 'a' or 'b' stand-in).
    const result = playability(deck, byKey, have, subs);
    expect(result.total).toBe(4);
    expect(result.own).toBe(1);
    expect(result.withSubstitutes).toBe(4);
  });
  it('without stand-ins both numbers are the owned copies', () => {
    expect(playability(deck, byKey, have, new Map())).toEqual({ total: 4, own: 1, withSubstitutes: 1 });
  });
});
