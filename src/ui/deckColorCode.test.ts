import { describe, expect, it } from 'vitest';
import type { DeckGroups } from '../domain/deckRules';
import { deckColorCode } from './DecksView';

const legends = (...colors: (string | null)[]) =>
  ({ legends: colors.map((color) => ({ card: { color }, count: 1 })), groups: [] }) as unknown as DeckGroups;

describe('deckColorCode (T-117)', () => {
  it('writes one letter per Legend, the most common colour first', () => {
    expect(deckColorCode(legends('Red', 'Green', 'Green'), [])).toEqual(['Green', 'Green', 'Red']);
  });

  it('keeps Legend order on a tie', () => {
    expect(deckColorCode(legends('Blue', 'Yellow', 'Red'), [])).toEqual(['Blue', 'Yellow', 'Red']);
  });

  it('falls back to the main deck colours without Legends', () => {
    expect(deckColorCode(legends(), [{ color: 'Red', count: 20 }, { color: 'Blue', count: 10 }])).toEqual(['Red', 'Blue']);
  });
});
