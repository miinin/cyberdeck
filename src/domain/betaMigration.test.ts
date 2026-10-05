import type { Card } from './card';
import { betaPrintingKeys, migrateCollectionToBeta } from './betaMigration';
import { parseCollection } from './validate';
import type { Printing } from './printing';

const BETA = 'welcometonightcitybeta:005a';
const beta = new Map([['v-streetkid', BETA], ['detonate', 'welcometonightcitybeta:031']]);
const rows = (...entries: unknown[]) => ({ entries });

describe('migrateCollectionToBeta (D-022)', () => {
  it('records the unversioned copies as Beta and leaves the count alone', () => {
    expect(migrateCollectionToBeta(rows({ card: 'v-streetkid', count: 3 }), beta)).toEqual(
      rows({ card: 'v-streetkid', count: 3, versions: { [BETA]: 3 } }),
    );
  });

  it('adds only the unversioned part to a partly versioned card', () => {
    const retail = 'welcometonightcityretail:005a';
    expect(migrateCollectionToBeta(rows({ card: 'v-streetkid', count: 5, versions: { [retail]: 2 } }), beta)).toEqual(
      rows({ card: 'v-streetkid', count: 5, versions: { [retail]: 2, [BETA]: 3 } }),
    );
  });

  it('adds to an existing Beta count', () => {
    expect(migrateCollectionToBeta(rows({ card: 'v-streetkid', count: 4, versions: { [BETA]: 1 } }), beta)).toEqual(
      rows({ card: 'v-streetkid', count: 4, versions: { [BETA]: 4 } }),
    );
  });

  it('leaves a fully versioned card, a card without a Beta printing and Beta-less rows as they are', () => {
    const full = { card: 'v-streetkid', count: 2, versions: { 'welcometonightcityretail:005a': 2 } };
    const noBeta = { card: 'minotaur', count: 2 };
    expect(migrateCollectionToBeta(rows(full, noBeta), beta)).toEqual(rows(full, noBeta));
  });

  it('does not touch the Iconic copies: only the unversioned rest moves', () => {
    const iconic = 'welcometonightcitybeta:144';
    expect(migrateCollectionToBeta(rows({ card: 'v-streetkid', count: 3, versions: { [iconic]: 1 } }), beta)).toEqual(
      rows({ card: 'v-streetkid', count: 3, versions: { [iconic]: 1, [BETA]: 2 } }),
    );
  });

  it('keeps the sum at most the count, whatever the breakdown holds', () => {
    const result = migrateCollectionToBeta(
      rows({ card: 'v-streetkid', count: 7, versions: { 'a:1': 2, 'b:1': 1 } }, { card: 'detonate', count: 1 }),
      beta,
    );
    const parsed = parseCollection(result);
    expect(parsed?.dropped).toBe(0);
    for (const entry of parsed?.value.entries ?? []) {
      expect(Object.values(entry.versions ?? {}).reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(entry.count);
    }
    expect(parsed?.value.entries.map((e) => e.count)).toEqual([1, 7]);
  });

  it('leaves the card unversioned when it already has 32 other versions', () => {
    const versions = Object.fromEntries(Array.from({ length: 32 }, (_, i) => [`s:${i + 1}`, 1]));
    const row = { card: 'v-streetkid', count: 40, versions };
    expect(migrateCollectionToBeta(rows(row), beta)).toEqual(rows(row));
  });

  it('still adds to Beta when the card has 32 versions and Beta is one of them', () => {
    const versions = { ...Object.fromEntries(Array.from({ length: 31 }, (_, i) => [`s:${i + 1}`, 1])), [BETA]: 1 };
    const result = migrateCollectionToBeta(rows({ card: 'v-streetkid', count: 40, versions }), beta) as { entries: { versions: Record<string, number> }[] };
    expect(result.entries[0]?.versions[BETA]).toBe(9);
  });

  it('treats a broken breakdown like the parser does (dropped, so all copies unversioned)', () => {
    const tooMany = Object.fromEntries(Array.from({ length: 33 }, (_, i) => [`s:${i + 1}`, 1]));
    const over = { 'a:1': 5 };
    const result = migrateCollectionToBeta(
      rows({ card: 'v-streetkid', count: 3, versions: tooMany }, { card: 'detonate', count: 2, versions: over }),
      beta,
    );
    expect(result).toEqual(
      rows(
        { card: 'v-streetkid', count: 3, versions: { [BETA]: 3 } },
        { card: 'detonate', count: 2, versions: { 'welcometonightcitybeta:031': 2 } },
      ),
    );
  });

  it('passes invalid rows and wrong shapes on for the parser to judge', () => {
    const junk = [null, 'x', { card: 'Bad Key', count: 1 }, { card: 'v-streetkid', count: 0 }, { card: 'v-streetkid', count: 1.5 }, { card: 'v-streetkid', count: 1000 }];
    expect(migrateCollectionToBeta(rows(...junk), beta)).toEqual(rows(...junk));
    expect(migrateCollectionToBeta('x', beta)).toBe('x');
    expect(migrateCollectionToBeta({ entries: 'x' }, beta)).toEqual({ entries: 'x' });
    expect(migrateCollectionToBeta(null, beta)).toBeNull();
  });

  it('is idempotent on its own result', () => {
    const once = migrateCollectionToBeta(rows({ card: 'v-streetkid', count: 3 }, { card: 'minotaur', count: 2 }), beta);
    expect(migrateCollectionToBeta(once, beta)).toEqual(once);
  });

  it('does not change the input', () => {
    const input = rows({ card: 'v-streetkid', count: 3, versions: { 'a:1': 1 } });
    const copy = structuredClone(input);
    migrateCollectionToBeta(input, beta);
    expect(input).toEqual(copy);
  });
});

function printing(setCode: string, number: string, rarity: string | null): Printing {
  return { key: `${setCode}:${number.replace('β', '')}`, setCode, setName: setCode, number, rarity, language: 'en', artist: null, imageKey: '' };
}
function card(key: string, printings: Printing[]): Card {
  return { id: key, slug: key, name: key, subname: null, displayName: key, type: 'Unit', color: null, cost: null, power: null, ram: null, rarity: null, key, printings };
}

describe('betaPrintingKeys', () => {
  it('picks the ordinary Beta printing, the first by number, never an Iconic one', () => {
    const cards = [
      card('v', [printing('welcometonightcitybeta', 'β144', 'Iconic Legend'), printing('welcometonightcitybeta', 'β005b', 'Rare'), printing('welcometonightcitybeta', 'β005a', 'Rare')]),
      card('retail-only', [printing('welcometonightcityretail', '001', 'Common')]),
      card('iconic-only', [printing('welcometonightcitybeta', 'β144', 'Iconic Other')]),
    ];
    expect([...betaPrintingKeys(cards)]).toEqual([['v', 'welcometonightcitybeta:005a']]);
  });
});
