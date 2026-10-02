import { parseCardFile } from '../domain/cardFile';
import { CARDS } from './cards';
import file from './cards.json';

describe('bundled card data', () => {
  it('passes the same validation as cards:update', () => {
    // Throws on an empty list, unknown or missing fields, a wrong key, duplicate keys or ids.
    expect(parseCardFile(file)).toEqual(CARDS);
  });

  it('is not empty and every key is unique', () => {
    expect(CARDS.length).toBeGreaterThan(0);
    expect(new Set(CARDS.map((card) => card.key)).size).toBe(CARDS.length);
  });
});
