import { decodeDeckShare, encodeDeckShare, MAX_SHARE_DATA_LENGTH } from './deckShare';
import { toCardsByKey } from './deckRules';
import { parseDeckText } from './deckText';
import type { Card } from './card';

function card(key: string, name: string, type = 'Unit'): Card {
  return {
    id: key,
    slug: key,
    name,
    subname: null,
    displayName: name,
    type,
    color: 'Red',
    cost: 1,
    power: 1,
    ram: 1,
    rarity: null,
    key,
  };
}

const cards = [card('l1', 'L1', 'Legend'), card('u0', 'Unit 0'), card('ae', 'Äläkää Öö')];
const deck = {
  name: 'Pääkkö ÄÖ',
  sections: [
    {
      name: 'Main',
      cards: [
        { card: 'l1', count: 1 },
        { card: 'u0', count: 3 },
        { card: 'ae', count: 2 },
      ],
    },
  ],
};

describe('deck share data', () => {
  it('round-trips through the text parser, with umlauts and without comment lines', () => {
    const data = encodeDeckShare(deck, toCardsByKey(cards));
    expect(data).toMatch(/^[A-Za-z0-9_-]+$/);
    const text = decodeDeckShare(data);
    expect(text).toBe('# Pääkkö ÄÖ\n1 L1\n3 Unit 0\n2 Äläkää Öö');
    const parsed = parseDeckText(text ?? '', cards);
    expect(parsed.ok && parsed.deck.name).toBe('Pääkkö ÄÖ');
    expect(parsed.ok && parsed.deck.rows.map((r) => [r.card.key, r.count])).toEqual([
      ['l1', 1],
      ['u0', 3],
      ['ae', 2],
    ]);
  });

  it('rejects broken base64, wrong characters, invalid UTF-8, empty and too long data', () => {
    expect(decodeDeckShare('')).toBeNull();
    expect(decodeDeckShare('a')).toBeNull();
    expect(decodeDeckShare('abc+/=')).toBeNull();
    expect(decodeDeckShare('<script>')).toBeNull();
    expect(decodeDeckShare('_w')).toBeNull(); // 0xFF is not UTF-8
    expect(decodeDeckShare('A'.repeat(MAX_SHARE_DATA_LENGTH + 1))).toBeNull();
  });
});
