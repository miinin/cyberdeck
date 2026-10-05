import type { Card } from './card';
import { findSubstitutes } from './substitutes';

const mk = (key: string, cost: number | null, over: Partial<Card> = {}): Card => ({
  id: key, key, slug: key, name: key, subname: null, displayName: key, type: 'Unit', color: 'Red',
  cost, power: null, ram: null, rarity: null, ...over,
});
const owned = (map: Record<string, number>) => (k: string) => map[k] ?? 0;
const none = () => 0;

describe('findSubstitutes', () => {
  const want = mk('want', 3);
  it('picks an owned card with the same colour and type and Cost within one', () => {
    const cards = [want, mk('near', 4), mk('far', 6), mk('blue', 3, { color: 'Blue' }), mk('gear', 3, { type: 'Gear' })];
    const result = findSubstitutes([want], cards, owned({ near: 2, far: 3, blue: 3, gear: 3 }), none);
    expect(result.get('want')).toEqual({ card: cards[1], owned: 2 });
  });
  it('prefers the closest Cost, then more spare copies', () => {
    const cards = [want, mk('a', 4), mk('b', 3), mk('c', 2)];
    expect(findSubstitutes([want], cards, owned({ a: 3, b: 1, c: 3 }), none).get('want')?.card.key).toBe('b');
    expect(findSubstitutes([want], cards, owned({ a: 1, c: 3 }), none).get('want')?.card.key).toBe('c');
  });
  it('skips cards already used up in the deck', () => {
    const cards = [want, mk('a', 3), mk('b', 3)];
    const deckCount = (k: string) => (k === 'a' ? 3 : 0);
    expect(findSubstitutes([want], cards, owned({ a: 3, b: 1 }), deckCount).get('want')?.card.key).toBe('b');
    expect(findSubstitutes([want], [want, cards[1] as Card], owned({ a: 2 }), (k) => (k === 'a' ? 2 : 0)).size).toBe(0);
  });
  it('does not offer the same spare copy twice and ignores cards without Cost', () => {
    const w2 = mk('w2', 3);
    const cards = [want, w2, mk('a', 3)];
    const result = findSubstitutes([want, w2], cards, owned({ a: 1 }), none);
    expect(result.size).toBe(1);
    expect(findSubstitutes([mk('nc', null)], [mk('a', 3)], owned({ a: 1 }), none).size).toBe(0);
  });
});
