import { describe, expect, it } from 'vitest';
import { raritySlug } from '../domain/arts';
import { ART_REGION, FULL_REGION, HASH_COLUMNS, HASH_ROWS } from '../domain/cardFingerprint';
import { CARDS } from './cards';
import { getCardImage } from './cardImages';
import { loadFingerprintIndex, parseFingerprintFile } from './fingerprintIndex';
import { variantImageUrl } from './variantImages';

const hash = '0123456789abcdef'.repeat(12);
const file = () => ({
  version: 1,
  grid: { columns: HASH_COLUMNS, rows: HASH_ROWS, full: FULL_REGION, art: ART_REGION },
  entries: [{ id: 'a-card', full: hash, art: hash }],
});

describe('parseFingerprintFile', () => {
  it('accepts a file made with these settings', () => {
    expect(parseFingerprintFile(file())).toEqual([{ id: 'a-card', full: hash, art: hash }]);
  });

  it('rejects other settings, bad ids and bad hashes', () => {
    expect(parseFingerprintFile(null)).toBeNull();
    expect(parseFingerprintFile({ ...file(), version: 2 })).toBeNull();
    expect(parseFingerprintFile({ ...file(), grid: { ...file().grid, columns: 8 } })).toBeNull();
    expect(parseFingerprintFile({ ...file(), grid: { ...file().grid, art: FULL_REGION } })).toBeNull();
    expect(parseFingerprintFile({ ...file(), entries: [{ id: 'Bad Id', full: hash, art: hash }] })).toBeNull();
    expect(parseFingerprintFile({ ...file(), entries: [{ id: 'a', full: 'abc', art: hash }] })).toBeNull();
    expect(parseFingerprintFile({ ...file(), entries: [{ id: 'a', full: hash, art: hash }, { id: 'a', full: hash, art: hash }] })).toBeNull();
  });
});

describe('the committed fingerprint file', () => {
  it('is usable and has a fingerprint for every card picture and special art (run `npm run cards:fingerprints` after the pictures change)', async () => {
    const ids = new Set((await loadFingerprintIndex()).map((entry) => entry.id));
    const withPicture = CARDS.filter((card) => getCardImage(card.key) !== null);
    expect(withPicture.length).toBeGreaterThan(100);
    for (const card of withPicture) expect(ids.has(card.key), card.key).toBe(true);
    for (const card of CARDS) {
      for (const printing of card.printings ?? []) {
        if (printing.rarity !== null && variantImageUrl(card.key, printing.rarity) !== null) {
          expect(ids.has(`${card.key}__${raritySlug(printing.rarity)}`), `${card.key} ${printing.rarity}`).toBe(true);
        }
      }
    }
  });
});
