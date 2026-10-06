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
      power: null,
      ram: null,
      rarity: 'Rare',
      eddiable: null,
      key: 'v-streetkid',
      printings: [
        {
          key: 'welcometonightcityretail:005a',
          setCode: 'welcometonightcityretail',
          setName: 'Welcome to Night City — Retail',
          number: '005a',
          rarity: 'Rare',
          language: 'en',
          artist: 'Olgierd Ciszak',
          imageKey: 'v-streetkid__welcome-to-night-city-005a',
        },
        {
          key: 'welcometonightcitybeta:005a',
          setCode: 'welcometonightcitybeta',
          setName: 'Welcome to Night City — Beta',
          number: 'β005a',
          rarity: 'Rare',
          language: 'en',
          artist: 'Olgierd Ciszak',
          imageKey: 'v-streetkid__welcome-to-night-city-005a',
        },
      ],
    });
  });

  describe('printings', () => {
    const base = { collector_number: '001', set: { code: 'abc', name: 'Set' } };
    const printingsOf = (raw: unknown) => mapCard(rawCard(1, { printings: raw }))?.printings;

    it('is empty when the source has no printings array', () => {
      expect(printingsOf(undefined)).toEqual([]);
      expect(printingsOf('x')).toEqual([]);
    });

    it('defaults the language to en and the optional fields to null', () => {
      expect(printingsOf([base])).toEqual([
        { key: 'abc:001', setCode: 'abc', setName: 'Set', number: '001', rarity: null, language: 'en', artist: null, imageKey: 'card-1__set-001' },
      ]);
    });

    it('skips malformed printings and keeps the first of a repeated key', () => {
      const list = [
        base,
        { ...base, artist: 'Other' },
        { ...base, collector_number: 'bad number' },
        { ...base, set: { code: 'a:b', name: 'Set' } },
        { ...base, set: { code: 'abc' } },
        { ...base, collector_number: '1234567890123' },
        null,
        'x',
      ];
      expect(printingsOf(list)?.map((printing) => printing.key)).toEqual(['abc:001']);
      expect(printingsOf(list)?.[0]?.artist).toBeNull();
    });

    it('builds the image key from the set family', () => {
      const set = (name: string) => printingsOf([{ ...base, collector_number: 'β012', set: { code: 'x', name } }])?.[0]?.imageKey;
      expect(set('Embracing Power — Beta Starter Deck')).toBe('card-1__embracing-power-starter-deck-012');
      expect(set('Welcome to Night City — Retail — FR')).toBe('card-1__welcome-to-night-city-012');
      expect(set('Pre-Release Retail')).toBe('card-1__pre-release-012');
      expect(set('Night City Showdown S1')).toBe('card-1__night-city-showdown-s1-012');
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

  it('derives the card key from name and subname, not from the slug', () => {
    expect(mapCard(rawCard(1, { name: 'Judy Álvarez', subname: 'Braindance Maestro', slug: 'judy-a-lvarez' }))?.key).toBe(
      'judy-alvarez-braindance-maestro',
    );
    expect(mapCard(rawCard(1, { name: 'Detonate', subname: null }))?.key).toBe('detonate');
  });

  it.each([
    ['has no latin letters or digits', '—', null],
    ['gives a reserved key', 'Constructor', null],
    ['gives a key over 100 characters', 'a'.repeat(101), null],
  ])('returns null when the name %s', (_label, name, subname) => {
    expect(mapCard(rawCard(1, { name, subname }))).toBeNull();
  });

  it.each(['id', 'slug', 'name', 'card_type'])('returns null when required field %s is missing', (field) => {
    expect(mapCard(rawCard(1, { [field]: undefined }))).toBeNull();
    expect(mapCard(rawCard(1, { [field]: '' }))).toBeNull();
    expect(mapCard(rawCard(1, { [field]: 42 }))).toBeNull();
  });

  it.each([null, undefined, 'card', 7, [], [realShapeCard]])('returns null for a non-object (%s)', (raw) => {
    expect(mapCard(raw)).toBeNull();
  });

  it('does not copy image URLs, rules text or unknown fields', () => {
    const card = mapCard({ ...realShapeCard, extra: 'x' });

    expect(card).not.toBeNull();
    const keys = Object.keys(card ?? {});
    expect(keys).not.toContain('image_url');
    expect(keys).not.toContain('rules_text');
    expect(keys).not.toContain('extra');
    expect(JSON.stringify(card)).not.toContain('Signature');
    expect(JSON.stringify(card)).not.toContain('image_url');
  });
});

describe('mapCard power and RAM', () => {
  it('keeps numeric power and RAM, including 0', () => {
    expect(mapCard(rawCard(1, { power: 12, ram: 0 }))).toMatchObject({ power: 12, ram: 0 });
  });

  // B-009 (T-008): only whole numbers 0 … 99 are game values; the rest are shown as missing.
  it.each([-5, 1.5, 1e308, 9999999999999999, 100])('maps the out-of-range value %s to null', (value) => {
    expect(mapCard(rawCard(1, { cost: value, power: value, ram: value }))).toMatchObject({ cost: null, power: null, ram: null });
  });

  it.each([null, undefined, '3', Number.NaN])('maps power and RAM %s to null', (value) => {
    expect(mapCard(rawCard(1, { power: value, ram: value }))).toMatchObject({ power: null, ram: null });
  });
});

describe('mapCard: rarity', () => {
  it('copies a rarity string and uses null when it is missing or blank', () => {
    expect(mapCard(rawCard(1, { rarity: 'Rare' }))).toMatchObject({ rarity: 'Rare' });
    expect(mapCard(rawCard(1, { rarity: '  ' }))).toMatchObject({ rarity: null });
    expect(mapCard(rawCard(1, { rarity: 5 }))).toMatchObject({ rarity: null });
  });
});

describe('mapCard: eddiable', () => {
  it('copies is_eddiable only when it is a boolean', () => {
    expect(mapCard(rawCard(1, { is_eddiable: true }))).toMatchObject({ eddiable: true });
    expect(mapCard(rawCard(1, { is_eddiable: false }))).toMatchObject({ eddiable: false });
    expect(mapCard(rawCard(1, { is_eddiable: 'true' }))).toMatchObject({ eddiable: null });
    expect(mapCard(rawCard(1, {}))).toMatchObject({ eddiable: null });
  });
});
