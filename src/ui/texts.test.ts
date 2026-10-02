import { cardCount } from './texts';

// T-024: the Finnish number format is tested on the formatter itself. Rendering 1 024 table rows
// only to read one status line timed out under full-suite load.
describe('cardCount', () => {
  it('formats large counts the Finnish way', () => {
    // Intl uses a non-breaking space as the thousands separator in fi-FI.
    expect(cardCount(1024).replace(/\s/g, ' ')).toBe('1 024 korttia');
  });

  it('inflects "kortti" for one', () => {
    expect(cardCount(1)).toBe('1 kortti');
    expect(cardCount(0)).toBe('0 korttia');
  });
});
