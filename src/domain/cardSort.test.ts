import { describe, expect, it } from 'vitest';
import type { Card } from './card';
import { sortCards } from './cardSort';

function c(name: string, over: Partial<Card> = {}): Card {
  return {
    id: name, slug: name, name, subname: null, displayName: name, type: 'Unit', color: null,
    cost: null, power: null, ram: null, rarity: null, key: name, ...over,
  };
}
const names = (cards: readonly Card[]) => cards.map((x) => x.name);

describe('sortCards', () => {
  const list = [c('B', { power: 3 }), c('A', { power: 1 }), c('N'), c('C', { power: 3 })];

  it('keeps or reverses the catalog order for number (T-060)', () => {
    expect(names(sortCards(list, 'number', 'asc'))).toEqual(['B', 'A', 'N', 'C']);
    expect(names(sortCards(list, 'number', 'desc'))).toEqual(['C', 'N', 'A', 'B']);
    expect(names(list)).toEqual(['B', 'A', 'N', 'C']);
  });

  it('sorts ascending with missing values last', () => {
    expect(names(sortCards(list, 'power', 'asc'))).toEqual(['A', 'B', 'C', 'N']);
  });
  it('sorts descending with missing values still last', () => {
    expect(names(sortCards(list, 'power', 'desc'))).toEqual(['B', 'C', 'A', 'N']);
  });
  it('breaks ties by name in both directions', () => {
    expect(names(sortCards([c('Z', { cost: 1 }), c('A', { cost: 1 })], 'cost', 'desc'))).toEqual(['A', 'Z']);
  });
  it('sorts text case-insensitively', () => {
    expect(names(sortCards([c('b'), c('A'), c('C')], 'name', 'asc'))).toEqual(['A', 'b', 'C']);
    expect(names(sortCards([c('b'), c('A'), c('C')], 'name', 'desc'))).toEqual(['C', 'b', 'A']);
  });
  it('sorts by rarity with null last and does not mutate the input', () => {
    const input = [c('X', { rarity: 'Rare' }), c('Y'), c('W', { rarity: 'Common' }), c('V', { rarity: 'Epic' })];
    expect(names(sortCards(input, 'rarity', 'asc'))).toEqual(['W', 'X', 'V', 'Y']);
    expect(names(input)).toEqual(['X', 'Y', 'W', 'V']);
  });
});
