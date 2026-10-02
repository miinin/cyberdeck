import { describe, expect, it } from 'vitest';
import type { Card } from './card';
import { deckToJson, deckToText, exportFileName } from './deckExport';
import { toCardsByKey } from './deckRules';
import { parseDeckText } from './deckText';
import type { DeckContent } from './deck';

function card(name: string, subname: string | null, type = 'Unit'): Card {
  const display = subname ? `${name} — ${subname}` : name;
  const key = `${name} ${subname ?? ''}`.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return { id: key, slug: key, name, subname, displayName: display, type, color: 'Red', cost: 1, power: 1, ram: 1, rarity: null, key };
}

export const CARDS = [
  card('V', 'Streetkid', 'Legend'),
  card('Panam Palmer', 'Nomad Cavalry', 'Legend'),
  card('Detonate', null, 'Program'),
  card('Chrome Fang', null),
];
const byKey = toCardsByKey(CARDS);

function deck(name: string): DeckContent {
  return {
    name,
    sections: [
      {
        name: '',
        cards: [
          { card: 'detonate', count: 3 },
          { card: 'v-streetkid', count: 1 },
          { card: 'chrome-fang', count: 2 },
        ],
      },
    ],
  };
}

const NAMES = ['Oma pakka', '// Legends (3)', '# Hash # tag', 'Tulta 🔥👨‍👩‍👧 ja <b>"x"</b> & \ / : *'];

describe('deckToText', () => {
  it('writes the reference format with Legends first', () => {
    expect(deckToText(deck('Oma pakka'), byKey)).toBe(
      '# Oma pakka\n// Legends (1)\n1 V - Streetkid\n// Main deck (5)\n3 Detonate\n2 Chrome Fang\n',
    );
  });

  it.each(NAMES)('round trips the deck with the name %s', (name) => {
    const result = parseDeckText(deckToText(deck(name), byKey), CARDS);
    if (!result.ok) throw new Error(result.error);
    expect(result.deck.name).toBe(name);
    expect(result.deck.unrecognized).toEqual([]);
    expect(result.deck.rows.map((row) => [row.card.key, row.count]).sort()).toEqual(
      [['chrome-fang', 2], ['detonate', 3], ['v-streetkid', 1]],
    );
  });

  it('cannot gain lines or headings from a name with line breaks or control characters', () => {
    const text = deckToText(deck('Nimi\n// Legends (3)\r\n1 Detonate\u0000‮'), byKey);
    expect(text.split('\n')).toHaveLength(7);
    expect(text.split('\n')[0]).toBe('# Nimi// Legends (3)1 Detonate');
  });

  it('writes a card that is not in the catalogue by its key', () => {
    const content: DeckContent = { name: 'X', sections: [{ name: '', cards: [{ card: 'gone-card', count: 2 }] }] };
    expect(deckToText(content, byKey)).toContain('2 gone-card');
  });
});

describe('deckToJson', () => {
  it('follows the exchange format without id or timestamps', () => {
    const file = JSON.parse(deckToJson(deck('Oma pakka'), byKey)) as unknown;
    expect(file).toEqual({
      format: 'cyberdeck.deck',
      version: 1,
      deck: {
        name: 'Oma pakka',
        sections: [
          {
            name: '',
            cards: [
              { card: 'detonate', name: 'Detonate', count: 3 },
              { card: 'v-streetkid', name: 'V — Streetkid', count: 1 },
              { card: 'chrome-fang', name: 'Chrome Fang', count: 2 },
            ],
          },
        ],
      },
    });
  });

  it('does not export fields beyond the deck content', () => {
    const withExtras = { ...deck('A'), id: 'secret', createdAt: 'x', updatedAt: 'y' };
    const text = deckToJson(withExtras, byKey);
    expect(text).not.toMatch(/secret|createdAt|updatedAt/);
  });
});

describe('exportFileName', () => {
  it('removes forbidden characters, control and direction characters', () => {
    expect(exportFileName('a/b\c:d*e?f"g<h>i|j\u0000k‮l', 'json')).toBe('abcdefghijkl.json');
  });
  it('uses the default name for an empty or dots-only name', () => {
    expect(exportFileName('///', 'txt')).toBe('pakka.txt');
    expect(exportFileName('..', 'json')).toBe('pakka.json');
  });
  it('cuts to 60 characters by code point', () => {
    const name = exportFileName('🔥'.repeat(80), 'txt');
    expect(Array.from(name.slice(0, -4))).toHaveLength(60);
  });
});
