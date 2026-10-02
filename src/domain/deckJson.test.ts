import { describe, expect, it } from 'vitest';
import { CARDS } from './testCards';
import { deckToJson } from './deckExport';
import { MAX_JSON_IMPORT_BYTES, parseDeckJson } from './deckJson';
import { toCardsByKey } from './deckRules';
import type { DeckContent } from './deck';

const byKey = toCardsByKey(CARDS);

function file(deck: unknown, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({ format: 'cyberdeck.deck', version: 1, deck, ...extra });
}
const validDeck = { name: 'Testi', sections: [{ name: '', cards: [{ card: 'detonate', name: 'Whatever', count: 3 }] }] };

function ok(text: string) {
  const result = parseDeckJson(text, CARDS);
  if (!result.ok) throw new Error(result.error);
  return result.deck;
}

describe('parseDeckJson', () => {
  it.each(['Oma pakka', '// Legends (3)', '# x', 'Tulta 🔥👨‍👩‍👧 <b>"x"</b> \\ /'])('round trips the deck "%s"', (name) => {
    const content: DeckContent = {
      name,
      sections: [{ name: '', cards: [{ card: 'detonate', count: 3 }, { card: 'v-streetkid', count: 1 }] }],
    };
    const deck = ok(deckToJson(content, byKey));
    expect(deck.name).toBe(name);
    expect(deck.rows.map((row) => [row.card.key, row.count])).toEqual([['detonate', 3], ['v-streetkid', 1]]);
    expect(deck.unrecognized).toEqual([]);
  });

  it('takes the card name from the app data, not from the file', () => {
    expect(ok(file(validDeck)).rows[0]?.card.displayName).toBe('Detonate');
  });

  it('reports unknown cards as text and ignores extra fields such as id and urls', () => {
    const deck = ok(
      file(
        { ...validDeck, id: 'abc', image: 'https://evil.example/x.png', sections: [{ name: '', cards: [{ card: 'gone-card', count: 2 }] }] },
        { id: 'zzz' },
      ),
    );
    expect(deck.rows).toEqual([]);
    expect(deck.unrecognized).toEqual(['2 gone-card']);
  });

  it('merges a card that is in several sections', () => {
    const sections = [
      { name: 'a', cards: [{ card: 'detonate', count: 2 }] },
      { name: 'b', cards: [{ card: 'detonate', count: 3 }] },
    ];
    expect(ok(file({ name: 'X', sections })).rows[0]?.count).toBe(5);
  });

  it('rejects a file over 256 kB before parsing', () => {
    const big = file(validDeck) + ' '.repeat(MAX_JSON_IMPORT_BYTES);
    expect(parseDeckJson(big, CARDS)).toEqual({ ok: false, error: 'too-long' });
  });

  it.each(['', 'not json', '{"a":', '[]', 'null', '42'])('rejects non-deck input %j', (text) => {
    expect(parseDeckJson(text, CARDS).ok).toBe(false);
  });

  it('rejects a wrong or missing format or version', () => {
    for (const text of [
      JSON.stringify({ deck: validDeck }),
      JSON.stringify({ format: 'other', version: 1, deck: validDeck }),
      JSON.stringify({ format: 'cyberdeck.deck', version: 2, deck: validDeck }),
      JSON.stringify({ format: 'cyberdeck.deck', version: '1', deck: validDeck }),
    ]) {
      expect(parseDeckJson(text, CARDS)).toEqual({ ok: false, error: 'not-deck' });
    }
  });

  it('rejects an invalid deck (no name, no sections)', () => {
    expect(parseDeckJson(file({ sections: [] }), CARDS)).toEqual({ ok: false, error: 'not-deck' });
    expect(parseDeckJson(file({ name: 'X' }), CARDS)).toEqual({ ok: false, error: 'not-deck' });
    expect(parseDeckJson(file({ name: '   ', sections: [] }), CARDS)).toEqual({ ok: false, error: 'not-deck' });
  });

  it('drops invalid rows: bad counts, bad keys and reserved keys', () => {
    const cardsInput = [
      { card: 'detonate', count: 0 },
      { card: 'detonate', count: 100 },
      { card: 'detonate', count: 1.5 },
      { card: 'detonate', count: '3' },
      { card: 'Detonate!', count: 1 },
      { card: '__proto__', count: 1 },
      { card: 'constructor', count: 1 },
      { card: 'prototype', count: 1 },
      { card: 'chrome-fang', count: 2 },
    ];
    const deck = ok(file({ name: 'X', sections: [{ name: '', cards: cardsInput }] }));
    expect(deck.rows.map((row) => row.card.key)).toEqual(['chrome-fang']);
    expect(deck.unrecognized).toEqual([]);
  });

  it('does not let __proto__, constructor or prototype keys change anything', () => {
    const text =
      '{"__proto__":{"polluted":true},"format":"cyberdeck.deck","version":1,' +
      '"deck":{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},"name":"P",' +
      '"sections":[{"__proto__":{"polluted":true},"name":"","cards":[{"__proto__":{"polluted":true},"card":"detonate","count":1}]}]}}';
    const deck = ok(text);
    expect(deck.rows).toHaveLength(1);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.keys(deck)).toEqual(['name', 'rows', 'unrecognized']);
  });
});
