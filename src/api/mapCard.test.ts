import { rawCard, realShapeCard } from './__fixtures__/netdeckPages';
import { mapCard } from './mapCard';

describe('mapCard', () => {
  it('maps a card in the real API shape', () => {
    expect(mapCard(realShapeCard)).toEqual({
      id: realShapeCard.id,
      slug: 'v-streetkid',
      name: 'V',
      subname: 'Streetkid',
      displayName: 'V — Streetkid',
      type: 'Legend',
      color: 'Red',
      cost: null,
    });
  });

  it('keeps a numeric cost, including 0', () => {
    expect(mapCard(rawCard(1, { cost: 3 }))?.cost).toBe(3);
    expect(mapCard(rawCard(1, { cost: 0 }))?.cost).toBe(0);
  });

  it.each([null, undefined, '3', Number.NaN, Number.POSITIVE_INFINITY])('maps cost %s to null', (cost) => {
    expect(mapCard(rawCard(1, { cost }))?.cost).toBeNull();
  });

  it('maps a missing or empty subname to null', () => {
    expect(mapCard(rawCard(1, { subname: null }))?.subname).toBeNull();
    expect(mapCard(rawCard(1, { subname: '  ' }))?.subname).toBeNull();
  });

  it('builds displayName from name and subname when canonical_name is missing', () => {
    expect(mapCard(rawCard(1, { name: 'V', subname: 'Streetkid', canonical_name: undefined }))?.displayName).toBe(
      'V — Streetkid',
    );
    expect(mapCard(rawCard(1, { name: 'Solo', subname: null, canonical_name: '' }))?.displayName).toBe('Solo');
  });

  it.each(['id', 'slug', 'name', 'card_type'])('returns null when required field %s is missing', (field) => {
    expect(mapCard(rawCard(1, { [field]: undefined }))).toBeNull();
    expect(mapCard(rawCard(1, { [field]: '' }))).toBeNull();
    expect(mapCard(rawCard(1, { [field]: 42 }))).toBeNull();
  });

  it.each([null, undefined, 'card', 7, [], [realShapeCard]])('returns null for a non-object (%s)', (raw) => {
    expect(mapCard(raw)).toBeNull();
  });

  it('does not copy image URLs, printings, rules text or unknown fields', () => {
    const card = mapCard({ ...realShapeCard, extra: 'x' });

    expect(card).not.toBeNull();
    const keys = Object.keys(card ?? {});
    expect(keys).not.toContain('image_url');
    expect(keys).not.toContain('printings');
    expect(keys).not.toContain('rules_text');
    expect(keys).not.toContain('extra');
    expect(JSON.stringify(card)).not.toContain('Signature');
  });
});
