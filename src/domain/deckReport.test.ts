import { describe, expect, it } from 'vitest';
import type { Card } from './card';
import type { Deck } from './deck';
import { buildImportReport } from './deckReport';
import { toCardsByKey } from './deckRules';

function card(key: string, type = 'Unit'): Card {
  return {
    id: key, slug: key, name: key, subname: null, displayName: key, type,
    color: 'Red', cost: 1, power: 1, ram: 1, rarity: null, key,
  };
}
const a = card('a');
const b = card('b');
const cardsByKey = toCardsByKey([a, b]);
const deck = (name: string, keys: string[]): Deck => ({
  id: name, name, createdAt: '', updatedAt: '',
  sections: [{ name: '', cards: keys.map((key) => ({ card: key, count: 1 })) }],
});

describe('buildImportReport', () => {
  const parsed = { name: 'Lista', rows: [{ card: a, count: 3 }, { card: b, count: 2 }], unrecognized: ['3 ???'] };

  it('counts owned and missing copies per card and in total', () => {
    const report = buildImportReport(parsed, new Map([['a', 1], ['b', 5]]), [], cardsByKey);
    expect(report.rows.map((row) => [row.card.key, row.needed, row.owned, row.missing])).toEqual([
      ['a', 3, 1, 2],
      ['b', 2, 5, 0],
    ]);
    expect(report.missingTotal).toBe(2);
    expect(report.missingRows.map((row) => row.card.key)).toEqual(['a']);
    expect(report.unrecognized).toEqual(['3 ???']);
  });

  it('lists the saved decks that contain each card', () => {
    const report = buildImportReport(parsed, new Map(), [deck('X', ['a']), deck('Y', ['a', 'b']), deck('Z', [])], cardsByKey);
    expect(report.rows[0]?.inDecks).toEqual(['X', 'Y']);
    expect(report.rows[1]?.inDecks).toEqual(['Y']);
  });

  it('validates the deck and names it from the list or by default', () => {
    const report = buildImportReport(parsed, new Map(), [], cardsByKey);
    expect(report.issues.some((issue) => issue.type === 'legend-count')).toBe(true);
    expect(report.content.name).toBe('Lista');
    expect(report.content.sections[0]?.cards).toEqual([{ card: 'a', count: 3 }, { card: 'b', count: 2 }]);
    expect(buildImportReport({ ...parsed, name: null }, new Map(), [], cardsByKey).content.name).toBe('Tuotu pakka');
  });
});
