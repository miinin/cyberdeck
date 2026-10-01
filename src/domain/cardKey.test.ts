import exampleDeck from '../../docs/examples/esimerkkipakka.txt?raw';
import { cardKey, isCardKey, MAX_CARD_KEY_LENGTH, normalizeCardName } from './cardKey';

// Name and subname of the 19 cards in docs/examples/esimerkkipakka.txt, as the card API returns them.
const exampleCards: readonly { name: string; subname: string | null }[] = [
  { name: 'Dum Dum', subname: 'Maelstrom Triggerman' },
  { name: 'Panam Palmer', subname: 'Nomad Cavalry' },
  { name: 'V', subname: 'Streetkid' },
  { name: 'Japantown Jonin', subname: null },
  { name: 'Ruthless Lowlife', subname: null },
  { name: 'La Llorona', subname: 'Ghost of the Past' },
  { name: 'Swordwise Huscle', subname: null },
  { name: '6th Street Recruits', subname: null },
  { name: 'Kerry Eurodyne', subname: 'The Last Rockerboy' },
  { name: 'Chrome Fang', subname: null },
  { name: 'Royce', subname: 'Don’t Call Me Simon' },
  { name: 'Wraith Marauders', subname: null },
  { name: 'Johnny Silverhand', subname: 'Never Stop Fighting' },
  { name: 'Trauma Team Operatives', subname: null },
  { name: 'Satori', subname: 'Sword of Saburo' },
  { name: 'Zetatech Faceplate', subname: null },
  { name: 'Detonate', subname: null },
  { name: 'Corporate Surveillance', subname: null },
  { name: 'We Gotta Live Together', subname: null },
];

describe('normalizeCardName and cardKey', () => {
  it('produces the documented keys', () => {
    expect(cardKey('V', 'Streetkid')).toBe('v-streetkid');
    expect(cardKey('Judy Álvarez', 'Braindance Maestro')).toBe('judy-alvarez-braindance-maestro');
    expect(cardKey('Royce', "Don't Call Me Simon")).toBe('royce-dont-call-me-simon');
  });

  it('treats the deck list separators the same as a separate subname', () => {
    const key = cardKey('Dum Dum', 'Maelstrom Triggerman');
    expect(normalizeCardName('Dum Dum - Maelstrom Triggerman')).toBe(key);
    expect(normalizeCardName('Dum Dum — Maelstrom Triggerman')).toBe(key);
  });

  it.each(["Don't", 'Don’t', 'Don‘t', 'Don`t'])('drops the apostrophe variant in %s', (text) => {
    expect(normalizeCardName(text)).toBe('dont');
  });

  it('ignores letter case and surrounding punctuation', () => {
    expect(normalizeCardName('  V -- STREETKID!! ')).toBe('v-streetkid');
  });

  it('uses only the name when there is no subname', () => {
    expect(cardKey('Detonate', null)).toBe('detonate');
    expect(cardKey('Detonate', '')).toBe('detonate');
  });

  it('turns whitespace or punctuation only into an empty string', () => {
    expect(normalizeCardName('  ')).toBe('');
    expect(normalizeCardName('—')).toBe('');
  });
});

describe('isCardKey', () => {
  it('accepts well-formed keys up to the length limit', () => {
    expect(isCardKey('v-streetkid')).toBe(true);
    expect(isCardKey('6th-street-recruits')).toBe(true);
    expect(isCardKey('a'.repeat(MAX_CARD_KEY_LENGTH))).toBe(true);
  });

  it.each([
    ['empty', ''],
    ['too long', 'a'.repeat(MAX_CARD_KEY_LENGTH + 1)],
    ['constructor', 'constructor'],
    ['prototype', 'prototype'],
    ['__proto__', '__proto__'],
    ['upper case', 'V-Streetkid'],
    ['leading dash', '-v'],
    ['double dash', 'v--streetkid'],
    ['space', 'v streetkid'],
  ])('rejects %s', (_label, value) => {
    expect(isCardKey(value)).toBe(false);
  });

  it.each([null, undefined, 42, {}, ['v']])('rejects a non-string (%s)', (value) => {
    expect(isCardKey(value)).toBe(false);
  });
});

describe('example deck', () => {
  const keys = exampleCards.map((card) => cardKey(card.name, card.subname));

  it('gives every fixture card a unique valid key', () => {
    expect(keys.every(isCardKey)).toBe(true);
    expect(new Set(keys).size).toBe(exampleCards.length);
  });

  it('matches every card line of the example deck list to a card key', () => {
    const cardLines = exampleDeck
      .split(/\r?\n/)
      .map((line) => /^\d+ (.+)$/.exec(line)?.[1])
      .filter((name): name is string => name !== undefined);

    expect(cardLines).toHaveLength(19);
    for (const line of cardLines) {
      expect(keys).toContain(normalizeCardName(line));
    }
  });
});
