import { cardOriginHash, cardOriginOpener, forgetCardOrigin, openCardPage } from './cardRoute';

describe('card dialog route (T-188)', () => {
  afterEach(() => {
    forgetCardOrigin();
    window.location.hash = '';
  });

  it('goes to the card dialog and remembers the view and the clicked element', () => {
    const button = document.createElement('button');
    document.body.append(button);
    button.focus();
    window.location.hash = '#/pakat/d1';
    openCardPage('v-streetkid');
    expect(window.location.hash).toBe('#/kortti/v-streetkid');
    expect(cardOriginHash('v-streetkid')).toBe('#/pakat/d1');
    expect(cardOriginOpener('v-streetkid')).toBe(button);
    button.remove();
  });

  it('knows nothing of another card, a direct link or a forgotten origin', () => {
    window.location.hash = '#/vaihto';
    openCardPage('a');
    expect(cardOriginHash('b')).toBeNull();
    forgetCardOrigin();
    expect(cardOriginHash('a')).toBeNull();
  });
});
