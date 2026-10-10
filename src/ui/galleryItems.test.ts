import { galleryItemsOf } from './galleryItems';
import type { CardListItem } from './CardList';
import type { Card } from '../domain/card';

const alpha: Card = { id: 'id-alpha', key: 'alpha', slug: 'alpha', name: 'Alpha', subname: 'Prime', displayName: 'Alpha', type: 'Unit', color: 'Red', cost: 1, power: 1, ram: null, rarity: 'Common' };

describe('galleryItemsOf (T-123)', () => {
  it('names a plain card after the card and keeps the special picture of a matched art', () => {
    const items: CardListItem[] = [
      { card: alpha, art: null, imageUrl: null, artCount: 1 },
      { card: alpha, art: null, imageUrl: '/art/alpha-alt.webp', artCount: 2 },
    ];
    const result = galleryItemsOf(items);
    expect(result.map((item) => item.label)).toEqual(['Alpha, Prime', 'Alpha, Prime']);
    expect(result.map((item) => item.version)).toEqual([null, null]);
    expect(result[0]?.artUrl).toBeNull();
    expect(result[0]?.src).toBeNull();
    expect(result[1]?.src).toBe('/art/alpha-alt.webp');
    expect(result[1]?.artUrl).toBe('/art/alpha-alt.webp');
  });

  it('names each art of the "all arts" mode and gives every one its own id', () => {
    const items: CardListItem[] = [
      { card: alpha, art: { artId: 'alpha#base', rarity: null, printings: [], label: 'x', defaultPrinting: null }, imageUrl: null, artCount: 2 },
      { card: alpha, art: { artId: 'alpha#Legendary', rarity: 'Legendary', printings: [], label: 'x', defaultPrinting: null }, imageUrl: '/art/l.webp', artCount: 2 },
    ];
    const result = galleryItemsOf(items);
    expect(new Set(result.map((item) => item.id)).size).toBe(2);
    expect(result[0]?.label).toBe('Alpha, Prime – Perus');
    expect(result[1]?.label).toBe('Alpha, Prime – Legendary');
    expect(result[1]?.version).toBe('Legendary');
  });
});
