import { openCardPage, takeCardReturnHash } from './cardRoute';

describe('card dialog route (T-188)', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('goes to the card dialog and remembers the view it came from', () => {
    window.location.hash = '#/vaihto';
    openCardPage('v-streetkid');
    expect(window.location.hash).toBe('#/kortti/v-streetkid');
    expect(takeCardReturnHash('v-streetkid')).toBe('#/vaihto');
  });

  it('returns to Cards for a direct link, and never uses a stale address', () => {
    window.location.hash = '#/vaihto';
    openCardPage('a');
    expect(takeCardReturnHash('b')).toBe('#/');
    expect(takeCardReturnHash('a')).toBe('#/');
  });
});
