import { place } from './CardHoverPreview';
import type { Shown } from './CardHoverPreview';
import { card } from './deckTestUtils';

// T-052: where the hover preview floats. Window 1920 × 1080, image 288 × 402.
const W = 288;
const H = 402;

function shown(left: number, top: number, width: number, height: number, x: number): Shown {
  return { card: card('a'), rect: new DOMRect(left, top, width, height), x };
}

beforeEach(() => {
  window.innerWidth = 1920;
  window.innerHeight = 1080;
});

describe('hover preview placement', () => {
  it('puts the image beside a narrow deck row, to the left when there is no room on the right', () => {
    const { left, top } = place(shown(1400, 500, 480, 40, 1500), W, H);
    expect(left).toBe(1400 - 12 - W);
    expect(top).toBeGreaterThanOrEqual(12);
  });

  it('floats next to the pointer above a wide row, never covering the row', () => {
    const row = shown(330, 700, 1000, 76, 400);
    const { left, top } = place(row, W, H);
    expect(left).toBe(400 + 24);
    expect(top + H).toBeLessThanOrEqual(700);
  });

  it('goes below a wide row near the top, and left of the pointer at the right edge', () => {
    const { left, top } = place(shown(330, 120, 1500, 76, 1800), W, H);
    expect(top).toBe(120 + 76 + 12);
    expect(left + W).toBeLessThanOrEqual(1800);
  });
});
