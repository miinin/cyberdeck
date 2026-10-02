import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import type { Card } from './card';
import { MAX_IMPORT_BYTES, parseDeckText } from './deckText';

const example = readFileSync('docs/examples/esimerkkipakka.txt', 'utf8');

function card(name: string, subname: string | null, type = 'Unit'): Card {
  const display = subname ? `${name} - ${subname}` : name;
  const key = display.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    id: key,
    slug: key,
    name,
    subname,
    displayName: display,
    type,
    color: 'Red',
    cost: 1,
    power: 1,
    ram: 1,
    rarity: null,
    key,
  };
}
const small = [
  card('Detonate', null, 'Program'),
  card('V', 'Streetkid', 'Legend'),
  card('V', 'Other', 'Legend'),
  card('Chrome Fang', null),
];

function parsed(text: string, cards: readonly Card[] = small) {
  const result = parseDeckText(text, cards);
  if (!result.ok) throw new Error(result.error);
  return result.deck;
}

describe('parseDeckText', () => {
  it('recognises every card of the reference example', () => {
    const deck = parsed(example, CARDS);
    expect(deck.unrecognized).toEqual([]);
    expect(deck.rows).toHaveLength(19);
    expect(deck.name).toBe('Esimerkkipakka');
  });

  it('accepts "3x", merges duplicate lines and ignores headings and blank lines', () => {
    const deck = parsed('// Programs (3)\n\n2x Detonate\n1 Detonate\n', small);
    expect(deck.rows.map((row) => [row.card.key, row.count])).toEqual([['detonate', 3]]);
  });

  it('matches a bare name only when one card has it', () => {
    const deck = parsed('1 V\n1 Chrome Fang\n1 V - Other', small);
    expect(deck.unrecognized).toEqual(['1 V']);
    expect(deck.rows.map((row) => row.card.key)).toEqual(['chrome-fang', 'v-other']);
  });

  it('rejects bad counts line by line', () => {
    const lines = ['0 Detonate', '100 Detonate', '-1 Detonate', '1.5 Detonate', 'x Detonate', 'Detonate'];
    const deck = parsed(lines.join('\n'));
    expect(deck.rows).toEqual([]);
    expect(deck.unrecognized).toHaveLength(6);
  });

  it('truncates unrecognized lines to 100 characters and keeps them as text', () => {
    const deck = parsed(`3 <img src=x onerror=alert(1)>${'a'.repeat(200)}`);
    expect(deck.unrecognized[0]).toHaveLength(100);
    expect(deck.unrecognized[0]?.startsWith('3 <img')).toBe(true);
  });

  it('strips BOM, normalises line breaks and removes control characters', () => {
    const deck = parsed('﻿# Pakka‮ X\r\n1 Detonate\r2 Chrome Fang\u0000');
    expect(deck.name).toBe('Pakka X');
    expect(deck.rows.map((row) => row.count)).toEqual([1, 2]);
  });

  it('uses only the first # line as the name and cuts a long name', () => {
    expect(parsed('# A\n# B\n1 Detonate').name).toBe('A');
    expect(parsed(`# ${'x'.repeat(250)}\n1 Detonate`).name).toHaveLength(100);
    expect(parsed('1 Detonate').name).toBeNull();
  });

  it('reports empty input', () => {
    expect(parseDeckText('', small)).toEqual({ ok: false, error: 'empty' });
    expect(parseDeckText(' \n// only a heading\n', small)).toEqual({ ok: false, error: 'empty' });
  });

  it('aborts the whole import on a limit, not partly', () => {
    expect(parseDeckText('1 Detonate\n'.repeat(300), small).ok).toBe(true);
    expect(parseDeckText('1 Detonate\n'.repeat(301), small)).toEqual({ ok: false, error: 'too-many-lines' });
    expect(parseDeckText(`1 ${'a'.repeat(298)}`, small).ok).toBe(true);
    expect(parseDeckText(`1 ${'a'.repeat(299)}`, small)).toEqual({ ok: false, error: 'line-too-long' });
    expect(parseDeckText(' '.repeat(MAX_IMPORT_BYTES + 1), small)).toEqual({ ok: false, error: 'too-long' });
  });

  it('parses worst-case lines quickly (ReDoS guard)', () => {
    const started = performance.now();
    parseDeckText(`1${' '.repeat(298)}`, CARDS);
    parseDeckText('1 '.repeat(150), CARDS);
    parseDeckText(Array.from({ length: 300 }, () => `3 ${'a - '.repeat(70)}`).join('\n'), CARDS);
    expect(performance.now() - started).toBeLessThan(100);
  });

  it('does not treat input as a pattern or as an object key', () => {
    const deck = parsed('1 (.*)+$\n1 __proto__\n1 constructor');
    expect(deck.rows).toEqual([]);
    expect(deck.unrecognized).toHaveLength(3);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
