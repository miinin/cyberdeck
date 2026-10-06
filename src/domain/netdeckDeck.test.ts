import { describe, expect, it } from 'vitest';
import type { Card } from './card';
import { netdeckToParsedDeck, parseNetdeckDeck, parseNetdeckUrl } from './netdeckDeck';
import type { NetdeckDeck } from "./netdeckDeck";

const UUID = '40502c1f-1111-4222-8333-444455556666';

describe('parseNetdeckUrl', () => {
  it.each([
    [`https://netdeck.gg/decks/cyberpunk/${UUID}`],
    [`https://netdeck.gg/cyberpunk/decks/${UUID}`],
    [`https://www.netdeck.gg/decks/cyberpunk/${UUID}/`],
    [`  https://netdeck.gg/decks/cyberpunk/${UUID.toUpperCase()}?x=1#y `],
  ])('accepts %s', (url) => {
    expect(parseNetdeckUrl(url)).toBe(UUID);
  });

  it.each([
    [`https://netdeck.gg.evil.com/decks/cyberpunk/${UUID}`],
    [`https://evil.com/https://netdeck.gg/decks/cyberpunk/${UUID}`],
    [`https://netdeck.gg@evil.com/decks/cyberpunk/${UUID}`],
    [`http://netdeck.gg/decks/cyberpunk/${UUID}`],
    [`javascript:alert(1)//https://netdeck.gg/decks/cyberpunk/${UUID}`],
    [`https://netdeck.gg/decks/cyberpunk/${UUID}/${UUID}`],
    [`https://netdeck.gg/decks/cyberpunk/${UUID}x`],
    ['https://netdeck.gg/decks/cyberpunk/not-a-uuid'],
    [`https://netdeck.gg/decks/cyberpunk/${UUID}?${'a'.repeat(400)}`],
    [''],
  ])('rejects %s', (url) => {
    expect(parseNetdeckUrl(url)).toBeNull();
  });
});

const zone = (zone_code: string, cards: unknown[]) => ({ zone_code, cards });
const entry = (id: unknown, quantity: unknown, extra: object = {}) => ({ quantity, card: { id, ...extra } });
const valid = () => ({
  name: ' Testipakka ',
  owner: { display_name: 'Pelaaja' },
  zones: [zone('legends', [entry('id-l1', 1)]), zone('deck', [entry('id-u0', 3)]), zone('sideboard', [entry('id-u1', 2)])],
});

describe('parseNetdeckDeck', () => {
  it('reads the needed fields and cleans the name', () => {
    const deck = parseNetdeckDeck(valid());
    expect(deck?.name).toBe('Testipakka');
    expect(deck?.author).toBe('Pelaaja');
    expect(deck?.rows.map((row) => [row.zone, row.id, row.quantity])).toEqual([
      ['legends', 'id-l1', 1],
      ['deck', 'id-u0', 3],
      ['sideboard', 'id-u1', 2],
    ]);
  });

  it('ignores extra fields such as image_url', () => {
    const raw = valid();
    raw.zones[0] = zone('legends', [entry('id-l1', 1, { image_url: 'https://evil.example/x.png' })]);
    const deck = parseNetdeckDeck({ ...raw, extra: 1 });
    expect(JSON.stringify(deck)).not.toContain('evil.example');
  });

  it('removes control and bidirectional characters from names', () => {
    expect(parseNetdeckDeck({ ...valid(), name: 'A‮B\nC' })?.name).toBe('ABC');
  });

  it('allows a missing owner', () => {
    expect(parseNetdeckDeck({ ...valid(), owner: undefined })?.author).toBeNull();
  });

  it.each([
    ['not an object', 'x'],
    ['null', null],
    ['an array', []],
    ['missing name', { zones: [] }],
    ['empty name', { ...valid(), name: '   ' }],
    ['numeric name', { ...valid(), name: 5 }],
    ['name over the limit', { ...valid(), name: 'x'.repeat(200) }],
    ['zones not an array', { ...valid(), zones: {} }],
    ['4 zones', { ...valid(), zones: [zone('deck', []), zone('deck', []), zone('deck', []), zone('deck', [])] }],
    ['unknown zone', { ...valid(), zones: [zone('hand', [])] }],
    ['cards not an array', { ...valid(), zones: [{ zone_code: 'deck', cards: 'x' }] }],
    ['quantity 0', { ...valid(), zones: [zone('deck', [entry('a', 0)])] }],
    ['quantity 100', { ...valid(), zones: [zone('deck', [entry('a', 100)])] }],
    ['fractional quantity', { ...valid(), zones: [zone('deck', [entry('a', 1.5)])] }],
    ['string quantity', { ...valid(), zones: [zone('deck', [entry('a', '3')])] }],
    ['numeric id', { ...valid(), zones: [zone('deck', [entry(5, 1)])] }],
    ['empty id', { ...valid(), zones: [zone('deck', [entry('', 1)])] }],
    ['id over 64 characters', { ...valid(), zones: [zone('deck', [entry('x'.repeat(65), 1)])] }],
    ['entry without card', { ...valid(), zones: [zone('deck', [{ quantity: 1 }])] }],
    ['301 rows', { ...valid(), zones: [zone('deck', Array.from({ length: 301 }, (_, i) => entry(`c${i}`, 1)))] }],
  ])('rejects %s', (_label, raw) => {
    expect(parseNetdeckDeck(raw)).toBeNull();
  });

  it('accepts exactly 300 rows', () => {
    const raw = { ...valid(), zones: [zone('deck', Array.from({ length: 300 }, (_, i) => entry(`c${i}`, 1)))] };
    expect(parseNetdeckDeck(raw)?.rows).toHaveLength(300);
  });
});

function card(key: string, name = key, subname: string | null = null): Card {
  return {
    id: `id-${key}`, slug: key, name, subname, displayName: name, type: 'Unit', color: 'Red',
    cost: 1, power: 1, ram: 1, rarity: null, key,
  };
}

describe('netdeckToParsedDeck', () => {
  const cards = [card('u0'), card('u1'), card('l1'), card('v-streetkid', 'V', 'Streetkid')];

  it('matches by id and keeps the sideboard apart', () => {
    const parsed = netdeckToParsedDeck(parseNetdeckDeck(valid()) as NetdeckDeck, cards);
    expect(parsed.rows.map((row) => [row.card.key, row.count])).toEqual([['l1', 1], ['u0', 3]]);
    expect(parsed.sideboard?.map((row) => [row.card.key, row.count])).toEqual([['u1', 2]]);
    expect(parsed.name).toBe('Testipakka');
    expect(parsed.source).toEqual({ name: 'Testipakka', author: 'Pelaaja' });
  });

  it('falls back to name and subname when the id is unknown', () => {
    const raw = { ...valid(), zones: [zone('deck', [entry('other-id', 2, { name: 'V', subname: 'Streetkid' })])] };
    const parsed = netdeckToParsedDeck(parseNetdeckDeck(raw) as NetdeckDeck, cards);
    expect(parsed.rows.map((row) => row.card.key)).toEqual(['v-streetkid']);
  });

  it('lists unknown cards as unrecognized and merges repeated rows', () => {
    const raw = {
      ...valid(),
      zones: [zone('deck', [entry('id-u0', 2), entry('id-u0', 2), entry('nope', 3), entry('nope2', 1, { name: 'Ghost' })])],
    };
    const parsed = netdeckToParsedDeck(parseNetdeckDeck(raw) as NetdeckDeck, cards);
    expect(parsed.rows.map((row) => [row.card.key, row.count])).toEqual([['u0', 4]]);
    expect(parsed.unrecognized).toEqual(['3 nope', '1 Ghost']);
  });

  // SEC-024 (T-047): an id shown in place of a missing name is cleaned of control and bidi characters.
  it('cleans an unknown id before showing it', () => {
    const raw = { ...valid(), zones: [zone('deck', [entry('‮abc\u0007', 1)])] };
    const parsed = netdeckToParsedDeck(parseNetdeckDeck(raw) as NetdeckDeck, cards);
    expect(parsed.unrecognized).toEqual(['1 abc']);
  });
});
