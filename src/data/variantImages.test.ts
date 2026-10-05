import { raritySlug, variantImageUrl } from './variantImages';

describe('variantImageUrl', () => {
  it('is null for a card or rarity without art and for prototype names', () => {
    expect(variantImageUrl('no-such', 'Nova Rare')).toBeNull();
    expect(variantImageUrl('v-streetkid', null)).toBeNull();
    expect(variantImageUrl('__proto__', 'Rare')).toBeNull();
  });

  it('finds the committed art by card key and rarity', () => {
    expect(variantImageUrl('v-streetkid', 'Nova Rare')).toEqual(expect.stringContaining('.webp'));
  });
});

describe('raritySlug', () => {
  it('lower-cases and dashes the rarity', () => {
    expect(raritySlug('Iconic Legend')).toBe('iconic-legend');
    expect(raritySlug('Nova  Rare!')).toBe('nova-rare');
  });
});
