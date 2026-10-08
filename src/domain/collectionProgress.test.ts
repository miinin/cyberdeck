import { describe, expect, it } from 'vitest';
import type { Card } from './card';
import {
  collectionOverview,
  colorProgress,
  hasRecordedVersions,
  missingCards,
  rarityProgress,
  setProgress,
  specialArtProgress,
  typeProgress,
} from './collectionProgress';
import { EMPTY_COLLECTION } from './collection';
import type { Collection } from './collection';
import type { Printing } from './printing';

function printing(setName: string, key: string, rarity: string | null = 'Common'): Printing {
  return { key, setCode: key.split(':')[0] ?? key, setName, number: '1', rarity, language: 'en', artist: null, imageKey: key };
}
const RETAIL = 'Welcome to Night City — Retail';
const PROMO = 'Summer Promo';
function card(key: string, overrides: Partial<Card> = {}): Card {
  return {
    id: key, key, slug: key, name: key, subname: null, displayName: key, type: 'Unit', color: 'Red', cost: 1, power: null, ram: null,
    rarity: 'Common', printings: [printing(RETAIL, `wtnc:${key}`)], ...overrides,
  };
}
const alpha = card('alpha', { eddiable: true });
const beta = card('beta', { type: 'Legend', color: 'Blue', rarity: 'Epic', printings: [printing(RETAIL, 'wtnc:beta', 'Epic'), printing(PROMO, 'promo:beta', 'Epic')] });
const gamma = card('gamma', { color: null, rarity: 'Nova Rare', printings: [printing(RETAIL, 'wtnc:gamma', 'Common'), printing(RETAIL, 'wtnc:gammanova', 'Nova Rare')] });
const cards = [alpha, beta, gamma];
const own = (...entries: Collection['entries'][number][]): Collection => ({ entries });

describe('collectionOverview', () => {
  it('is all zero for an empty collection', () => {
    expect(collectionOverview(cards, EMPTY_COLLECTION)).toEqual({ distinct: 0, total: 3, copies: 0, playsets: 0 });
  });

  it('counts distinct cards, copies, playsets (1 for a Legend, 3 otherwise)', () => {
    const collection = own({ card: 'alpha', count: 2 }, { card: 'beta', count: 1 }, { card: 'gamma', count: 3 }, { card: 'not-a-card', count: 9 });
    expect(collectionOverview(cards, collection)).toEqual({ distinct: 3, total: 3, copies: 6, playsets: 2 });
  });
});

describe('setProgress', () => {
  it('counts cards with a recorded copy of a printing in the set', () => {
    const collection = own({ card: 'alpha', count: 1, versions: { 'wtnc:alpha': 1 } }, { card: 'beta', count: 2, versions: { 'promo:beta': 1 } });
    const rows = setProgress(cards, collection);
    expect(rows.map((row) => [row.family, row.group, row.owned, row.total])).toEqual([
      ['welcome-to-night-city', 'sets', 1, 3],
      ['summer-promo', 'other', 1, 1],
    ]);
  });

  it('does not count copies without a recorded version', () => {
    expect(setProgress(cards, own({ card: 'alpha', count: 3 })).every((row) => row.owned === 0)).toBe(true);
    expect(hasRecordedVersions(cards, own({ card: 'alpha', count: 3 }))).toBe(false);
    expect(hasRecordedVersions(cards, own({ card: 'alpha', count: 1, versions: { 'wtnc:alpha': 1 } }))).toBe(true);
  });
});

describe('rarityProgress and specialArtProgress', () => {
  it('lists official rarities in order with owned and total', () => {
    expect(rarityProgress(cards, own({ card: 'beta', count: 1 }))).toEqual([
      { rarity: 'Common', owned: 0, total: 1 },
      { rarity: 'Epic Rare', owned: 1, total: 1 },
      { rarity: 'Nova Rare', owned: 0, total: 1 },
    ]);
  });

  it('counts the special arts by the printing copies', () => {
    const collection = own({ card: 'gamma', count: 1, versions: { 'wtnc:gammanova': 1 } });
    expect(specialArtProgress(cards, collection)).toEqual([{ rarity: 'Nova Rare', owned: 1, total: 1 }]);
    expect(specialArtProgress(cards, own({ card: 'gamma', count: 1 }))).toEqual([{ rarity: 'Nova Rare', owned: 0, total: 1 }]);
  });

  it('leaves out arts without a picture', () => {
    expect(specialArtProgress(cards, EMPTY_COLLECTION, () => false)).toEqual([]);
  });
});

describe('colorProgress and typeProgress', () => {
  it('orders known values first and puts "no color" last', () => {
    const collection = own({ card: 'alpha', count: 1 });
    expect(colorProgress(cards, collection)).toEqual([
      { value: 'Red', owned: 1, total: 1 },
      { value: 'Blue', owned: 0, total: 1 },
      { value: null, owned: 0, total: 1 },
    ]);
    expect(typeProgress(cards, collection)).toEqual([
      { value: 'Legend', owned: 0, total: 1 },
      { value: 'Unit', owned: 1, total: 2 },
    ]);
  });
});

describe('missingCards', () => {
  const collection = own({ card: 'alpha', count: 1 });
  it('lists the cards with no copy, in order', () => {
    expect(missingCards(cards, collection).map((c) => c.key)).toEqual(['beta', 'gamma']);
  });

  it('narrows by set and by rarity', () => {
    expect(missingCards(cards, collection, { set: 'summer-promo', rarity: null }).map((c) => c.key)).toEqual(['beta']);
    expect(missingCards(cards, collection, { set: null, rarity: 'Nova Rare' }).map((c) => c.key)).toEqual(['gamma']);
    expect(missingCards(cards, collection, { set: 'summer-promo', rarity: 'Nova Rare' })).toEqual([]);
  });

  it('is empty when everything is owned', () => {
    expect(missingCards(cards, own({ card: 'alpha', count: 1 }, { card: 'beta', count: 1 }, { card: 'gamma', count: 1 }))).toEqual([]);
  });
});

describe('specialArtProgress names', () => {
  it('shows the Iconic kinds as one official "Iconic Rare" row (T-105)', () => {
    const card = (key: string, rarity: string): Card => ({
      id: key, slug: key, name: key, subname: null, displayName: key, type: 'Unit', color: 'Red', cost: 1, power: 1, ram: 1, rarity: 'Rare', key,
      printings: [
        { key: `${key}:1`, setCode: 's', setName: 'Welcome to Night City — Retail', number: '1', rarity: 'Rare', language: 'en', artist: null, imageKey: `${key}-1` },
        { key: `${key}:2`, setCode: 's', setName: 'Welcome to Night City — Retail', number: '2', rarity, language: 'en', artist: null, imageKey: `${key}-2` },
      ],
    });
    const cards = [card('a', 'Iconic Legend'), card('b', 'Iconic Other'), card('c', 'Nova Rare')];
    expect(specialArtProgress(cards, { entries: [] }).map((row) => [row.rarity, row.total])).toEqual([
      ['Iconic Rare', 2],
      ['Nova Rare', 1],
    ]);
  });
});
