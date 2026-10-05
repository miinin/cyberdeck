import type { Card } from './card';
import type { CardFile } from './cardFile';
import { CARD_FILE_FORMAT, CARD_FILE_VERSION, MAX_CARD_TEXT_LENGTH, parseCardFile, toCardFile } from './cardFile';

const streetkid: Card = {
  id: 'id-1',
  slug: 'v-streetkid',
  name: 'V',
  subname: 'Streetkid',
  displayName: 'V — Streetkid',
  type: 'Legend',
  color: 'Red',
  cost: null,
  power: null,
  ram: null, rarity: null,
  key: 'v-streetkid',
  printings: [
    {
      key: 'welcometonightcitybeta:005a',
      setCode: 'welcometonightcitybeta',
      setName: 'Welcome to Night City — Beta',
      number: 'β005a',
      rarity: 'Rare',
      language: 'en',
      artist: null,
      imageKey: 'v-streetkid__welcome-to-night-city-005a',
    },
  ],
};

const solo: Card = {
  id: 'id-2',
  slug: 'solo',
  name: 'Solo',
  subname: null,
  displayName: 'Solo',
  type: 'Unit',
  color: null,
  cost: 0,
  power: null,
  ram: null, rarity: null,
  key: 'solo',
  printings: [],
};

/** A valid file as plain JSON data, with one card changed by `override`. */
function fileWith(override: Record<string, unknown> = {}, root: Record<string, unknown> = {}): unknown {
  const file = { ...toCardFile([streetkid, solo]), ...root };
  if (Array.isArray(file.cards) && file.cards.length > 0) file.cards[0] = { ...file.cards[0], ...override } as Card;
  return JSON.parse(JSON.stringify(file));
}

describe('toCardFile', () => {
  it('writes the root and card fields in a fixed order', () => {
    const shuffled = {
      key: solo.key,
      cost: solo.cost,
      power: null,
      ram: null, rarity: null,
      color: solo.color,
      type: solo.type,
      displayName: solo.displayName,
      subname: solo.subname,
      name: solo.name,
      slug: solo.slug,
      id: solo.id,
      printings: solo.printings,
    };
    const file = toCardFile([shuffled]);
    expect(Object.keys(file)).toEqual(['format', 'version', 'cards']);
    expect(Object.keys(file.cards[0] ?? {})).toEqual([
      'id',
      'slug',
      'name',
      'subname',
      'displayName',
      'type',
      'color',
      'cost',
      'power',
      'ram',
      'rarity',
      'key',
      'printings',
    ]);
  });

  it('drops fields that are not in the model', () => {
    const file = toCardFile([{ ...solo, imageUrl: 'https://example.invalid/x.png' } as Card]);
    expect(file.cards[0]).toEqual(solo);
  });
});

describe('parseCardFile', () => {
  it('returns the cards of a valid file in file order', () => {
    expect(parseCardFile(fileWith())).toEqual([streetkid, solo]);
  });

  it('accepts null subname, color and cost and a cost of 0', () => {
    expect(parseCardFile(fileWith({ subname: null, key: 'v', displayName: 'V', color: null, cost: 0 }))[0]).toEqual({
      ...streetkid,
      subname: null,
      key: 'v',
      displayName: 'V',
      color: null,
      cost: 0,
      power: null,
      ram: null, rarity: null,
    });
  });

  it.each<[string, unknown]>([
    ['null', null],
    ['an array', []],
    ['a string', 'cards'],
  ])('rejects a root that is %s', (_label, json) => {
    expect(() => parseCardFile(json)).toThrow(/root is not an object/);
  });

  it('rejects a wrong format or version', () => {
    expect(() => parseCardFile(fileWith({}, { format: 'netdeck' }))).toThrow(/format/);
    expect(() => parseCardFile(fileWith({}, { version: 1 }))).toThrow(/version/);
    expect(() => parseCardFile(fileWith({}, { version: '2' }))).toThrow(/version/);
  });

  it('rejects an extra or missing root field', () => {
    expect(() => parseCardFile(fileWith({}, { updatedAt: '2026-10-02' }))).toThrow(/unexpected field\(s\) updatedAt/);
    const noCards: Partial<CardFile> = toCardFile([solo]);
    delete noCards.cards;
    expect(() => parseCardFile(noCards)).toThrow(/missing field\(s\) cards/);
  });

  it('rejects an empty card list and a list that is not an array', () => {
    expect(() => parseCardFile(fileWith({}, { cards: [] }))).toThrow(/empty/);
    expect(() => parseCardFile(fileWith({}, { cards: {} }))).toThrow(/not an array/);
  });

  it('rejects a card with an extra field', () => {
    expect(() => parseCardFile(fileWith({ imageUrl: 'https://example.invalid/x.png' }))).toThrow(
      /cards\[0\]: unexpected field\(s\) imageUrl/,
    );
  });

  it('rejects a card with a missing field', () => {
    const json = fileWith() as { cards: Record<string, unknown>[] };
    delete json.cards[1]?.cost;
    expect(() => parseCardFile(json)).toThrow(/cards\[1\]: missing field\(s\) cost/);
  });

  it('rejects a card that is not an object', () => {
    expect(() => parseCardFile({ ...toCardFile([solo]), cards: [null] })).toThrow(/cards\[0\]: not an object/);
  });

  it.each<[string, Record<string, unknown>]>([
    ['id is a number', { id: 1 }],
    ['id is empty', { id: '' }],
    ['slug is null', { slug: null }],
    ['displayName is missing a value', { displayName: '' }],
    ['type is null', { type: null }],
    ['subname is empty', { subname: '' }],
    ['color is a number', { color: 3 }],
  ])('rejects a card whose %s', (_label, override) => {
    expect(() => parseCardFile(fileWith(override))).toThrow(/cards\[0\]: ".+" must be a non-empty string/);
  });

  it.each<[string, unknown]>([
    ['a string', '3'],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('rejects a cost, power or RAM that is %s', (_label, bad) => {
    // JSON cannot hold NaN or Infinity, so these are given as an object, not via JSON.parse.
    for (const field of ['cost', 'power', 'ram']) {
      const json = { ...toCardFile([streetkid]), cards: [{ ...streetkid, [field]: bad }] };
      expect(() => parseCardFile(json)).toThrow(new RegExp(`"${field}" must be a finite number or null`));
    }
  });

  it('rejects text longer than the limit and accepts text at the limit', () => {
    const atLimit = 'x'.repeat(MAX_CARD_TEXT_LENGTH);
    expect(parseCardFile(fileWith({ displayName: atLimit }))[0]?.displayName).toBe(atLimit);
    expect(() => parseCardFile(fileWith({ displayName: `${atLimit}x` }))).toThrow(/longer than 200/);
  });

  it('rejects a key that does not match cardKey(name, subname)', () => {
    expect(() => parseCardFile(fileWith({ key: 'v-streetkid-2' }))).toThrow(/does not match cardKey/);
    expect(() => parseCardFile(fileWith({ subname: 'Corpo' }))).toThrow(/does not match cardKey/);
  });

  it('rejects invalid printings', () => {
    const printing = { ...streetkid.printings?.[0] };
    const bad = (override: Record<string, unknown>) => fileWith({ printings: [{ ...printing, ...override }] });
    expect(() => parseCardFile(bad({ key: 'welcometonightcitybeta:005b' }))).toThrow(/does not match setCode and number/);
    expect(() => parseCardFile(bad({ imageKey: 'x__y-1' }))).toThrow(/imageKey/);
    expect(() => parseCardFile(bad({ imageUrl: 'https://example.invalid/x.webp' }))).toThrow(/unexpected field/);
    expect(() => parseCardFile(bad({ language: '' }))).toThrow(/language/);
    expect(() => parseCardFile(fileWith({ printings: [printing, printing] }))).toThrow(/duplicate key/);
    expect(() => parseCardFile(fileWith({ printings: 'x' }))).toThrow(/not an array/);
  });

  it('rejects a duplicate key', () => {
    const json = { ...toCardFile([streetkid, { ...streetkid, id: 'id-3' }]) };
    expect(() => parseCardFile(json)).toThrow(/cards\[1\]: duplicate key "v-streetkid"/);
  });

  it('rejects a duplicate id', () => {
    const json = { ...toCardFile([streetkid, { ...solo, id: streetkid.id }]) };
    expect(() => parseCardFile(json)).toThrow(/cards\[1\]: duplicate id "id-1"/);
  });

  it('round-trips toCardFile output through JSON', () => {
    const file = toCardFile([streetkid, solo]);
    expect(file.format).toBe(CARD_FILE_FORMAT);
    expect(file.version).toBe(CARD_FILE_VERSION);
    expect(parseCardFile(JSON.parse(JSON.stringify(file)))).toEqual([streetkid, solo]);
  });
});
