import { describe, expect, it } from 'vitest';
import { parseHash, routeHash } from './useHashRoute';

describe('card route (T-081)', () => {
  it('parses #/kortti/<key> and round-trips', () => {
    expect(parseHash('#/kortti/welcome-to-night-city')).toEqual({ name: 'card', key: 'welcome-to-night-city' });
    expect(routeHash({ name: 'card', key: 'a b' })).toBe('#/kortti/a%20b');
    expect(parseHash('#/kortti/a%20b')).toEqual({ name: 'card', key: 'a b' });
  });

  it('falls back to the cards view without a key or with a bad escape', () => {
    expect(parseHash('#/kortti')).toEqual({ name: 'cards' });
    expect(parseHash('#/kortti/')).toEqual({ name: 'cards' });
    expect(parseHash('#/kortti/%E0%A4%A')).toEqual({ name: 'cards' });
  });
});
