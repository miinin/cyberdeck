import { getCardImage } from './cardImages';

describe('getCardImage', () => {
  it('gives both sizes of an imported card as separate URLs', () => {
    const image = getCardImage('v-streetkid');
    expect(image?.small).toMatch(/v-streetkid.*\.webp$/);
    expect(image?.large).toMatch(/v-streetkid.*\.webp$/);
    expect(image?.small).not.toBe(image?.large);
  });

  it('returns null for unknown keys and object prototype names', () => {
    expect(getCardImage('no-such-card')).toBeNull();
    expect(getCardImage('__proto__')).toBeNull();
    expect(getCardImage('constructor')).toBeNull();
  });
});
