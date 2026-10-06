import { toCardsByKey } from './deckRules';
import { decodeDeckShare, encodeDeckShare } from './deckShare';
import { parseDeckText } from './deckText';
import { buildPublicDeckInput, parsePublicDeck, publicDeckId } from './publicDeck';
import { CARDS } from './testCards';
import { parseDeck, parseDeckPublish } from './validate';

const byKey = toCardsByKey(CARDS);
const content = {
  name: 'Julkinen pakka',
  sections: [
    {
      name: '',
      cards: [
        { card: 'v-streetkid', count: 1 },
        { card: 'detonate', count: 3 },
        { card: 'chrome-fang', count: 2 },
      ],
    },
  ],
};

const valid = {
  schemaVersion: 1,
  deckId: 'deck-1',
  name: 'Pakka',
  legends: 'V, Streetkid',
  cardCount: 6,
  deck: 'QQ',
  nickname: null,
  publishedAt: '2026-10-06T10:00:00.000Z',
  updatedAt: '2026-10-06T11:00:00.000Z',
};
const PUB_ID = 'a'.repeat(64);

describe('publicDeckId (SR-30)', () => {
  it('is the lowercase hex sha256 of "uid:deckId" and does not contain the uid', async () => {
    const { createHash } = await import('node:crypto');
    const id = await publicDeckId('user123', 'deck-1');
    expect(id).toBe(createHash('sha256').update('user123:deck-1').digest('hex'));
    expect(id).toMatch(/^[0-9a-f]{64}$/);
    expect(id).not.toContain('user123');
  });

  it('differs when the uid or the deck changes', async () => {
    const id = await publicDeckId('abc', 'def');
    expect(await publicDeckId('abd', 'def')).not.toBe(id);
    expect(await publicDeckId('abc', 'deg')).not.toBe(id);
  });
});

describe('buildPublicDeckInput', () => {
  it('builds the share-link string, the Legends text and the card count (SR-32)', () => {
    const result = buildPublicDeckInput('deck-1', content, byKey, 'Pelaaja');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input).toMatchObject({
      deckId: 'deck-1',
      name: 'Julkinen pakka',
      legends: 'V, Streetkid',
      cardCount: 6,
      nickname: 'Pelaaja',
    });
    expect(result.input.deck).toBe(encodeDeckShare(content, byKey));
    const text = decodeDeckShare(result.input.deck);
    expect(text !== null && parseDeckText(text, CARDS).ok).toBe(true);
  });

  it('cleans the nickname and treats an invalid one as anonymous', () => {
    const cleaned = buildPublicDeckInput('deck-1', content, byKey, '  Pelaaja\n ');
    expect(cleaned.ok && cleaned.input.nickname).toBe('Pelaaja');
    const tooLong = buildPublicDeckInput('deck-1', content, byKey, 'x'.repeat(31));
    expect(tooLong.ok && tooLong.input.nickname).toBeNull();
  });

  it('does not publish an empty deck', () => {
    expect(buildPublicDeckInput('deck-1', { name: 'Tyhjä', sections: [{ name: '', cards: [] }] }, byKey, null)).toEqual({
      ok: false,
      error: 'empty',
    });
  });
});

describe('parsePublicDeck (SR-37)', () => {
  it('accepts a valid document and returns only whitelisted fields', () => {
    const parsed = parsePublicDeck(PUB_ID, { ...valid, ownerUid: 'secret', extra: 1 });
    // toEqual ignores the undefined schemaVersion: the parsed deck has no such field.
    expect(parsed).toEqual({ pubId: PUB_ID, ...valid, schemaVersion: undefined });
    expect(parsed).not.toHaveProperty('schemaVersion');
    expect(parsed).not.toHaveProperty('ownerUid');
  });

  it('rejects a bad id, a newer schema and broken fields', () => {
    expect(parsePublicDeck('nope', valid)).toBeNull();
    expect(parsePublicDeck('A'.repeat(64), valid)).toBeNull();
    expect(parsePublicDeck(PUB_ID, null)).toBeNull();
    expect(parsePublicDeck(PUB_ID, { ...valid, schemaVersion: 2 })).toBeNull();
    expect(parsePublicDeck(PUB_ID, { ...valid, deckId: '../x' })).toBeNull();
    expect(parsePublicDeck(PUB_ID, { ...valid, name: '' })).toBeNull();
    expect(parsePublicDeck(PUB_ID, { ...valid, legends: 'x'.repeat(301) })).toBeNull();
    expect(parsePublicDeck(PUB_ID, { ...valid, cardCount: -1 })).toBeNull();
    expect(parsePublicDeck(PUB_ID, { ...valid, cardCount: 1.5 })).toBeNull();
    expect(parsePublicDeck(PUB_ID, { ...valid, deck: '' })).toBeNull();
    expect(parsePublicDeck(PUB_ID, { ...valid, deck: 'not base64!' })).toBeNull();
    expect(parsePublicDeck(PUB_ID, { ...valid, deck: 'A'.repeat(16001) })).toBeNull();
    expect(parsePublicDeck(PUB_ID, { ...valid, nickname: 'x'.repeat(31) })).toBeNull();
    expect(parsePublicDeck(PUB_ID, { ...valid, nickname: 5 })).toBeNull();
    expect(parsePublicDeck(PUB_ID, { ...valid, updatedAt: 'yesterday' })).toBeNull();
    expect(parsePublicDeck(PUB_ID, { ...valid, publishedAt: undefined })).toBeNull();
  });

  it('cleans control characters from text fields and keeps a nickname as plain text', () => {
    const parsed = parsePublicDeck(PUB_ID, { ...valid, name: ' Pak‮a ', nickname: '<b>Nick</b>' });
    expect(parsed?.name).toBe('Paka');
    expect(parsed?.nickname).toBe('<b>Nick</b>');
  });
});

describe('deck publish settings', () => {
  it('parses { public, nickname } and rejects other shapes', () => {
    expect(parseDeckPublish({ public: true, nickname: ' Nick ' })).toEqual({ public: true, nickname: 'Nick' });
    expect(parseDeckPublish({ public: false, nickname: null })).toEqual({ public: false, nickname: null });
    expect(parseDeckPublish({ public: false })).toEqual({ public: false, nickname: null });
    expect(parseDeckPublish({ public: 'yes', nickname: null })).toBeNull();
    expect(parseDeckPublish({ public: true, nickname: 'x'.repeat(31) })).toBeNull();
    expect(parseDeckPublish('public')).toBeNull();
  });

  it('keeps decks without settings private and makes a deck with broken settings private', () => {
    const base = { id: 'd1', ...content, createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z' };
    expect(parseDeck(base)?.value.publish).toBeUndefined();
    expect(parseDeck({ ...base, publish: { public: true, nickname: 'Nick' } })?.value.publish).toEqual({
      public: true,
      nickname: 'Nick',
    });
    const broken = parseDeck({ ...base, publish: { public: 'yes' } });
    expect(broken?.value.publish).toBeUndefined();
    expect(broken?.dropped).toBe(1);
  });
});
