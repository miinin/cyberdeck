import { act, fireEvent, render, screen } from '@testing-library/react';
import { MAX_TILT_DEG, useTilt } from './useTilt';

function Card() {
  const tilt = useTilt<HTMLDivElement>();
  return <div {...tilt} data-testid="card" />;
}

const nextFrame = () => act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

describe('useTilt (T-153)', () => {
  it('tilts toward the mouse, comes flat when it leaves, and ignores touch', async () => {
    render(<Card />);
    const card = screen.getByTestId('card');
    card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 200, right: 100, bottom: 200, x: 0, y: 0, toJSON: () => ({}) });

    // Top right corner: the top and the right side go back as far as allowed.
    fireEvent.pointerMove(card, { pointerType: 'mouse', clientX: 100, clientY: 0 });
    await nextFrame();
    expect(card.style.getPropertyValue('--tilt-x')).toBe(`${MAX_TILT_DEG.toFixed(2)}deg`);
    expect(card.style.getPropertyValue('--tilt-y')).toBe(`${MAX_TILT_DEG.toFixed(2)}deg`);
    expect(card).toHaveClass('is-tilting');

    // The middle is flat.
    fireEvent.pointerMove(card, { pointerType: 'mouse', clientX: 50, clientY: 100 });
    await nextFrame();
    expect(card.style.getPropertyValue('--tilt-x')).toBe('0.00deg');

    // T-162: the pointer is followed on the window against the flat card, so a move just inside it keeps the tilt...
    fireEvent.pointerMove(window, { clientX: 99, clientY: 100 });
    await nextFrame();
    expect(card).toHaveClass('is-tilting');

    // ...and a move outside it brings the card flat.
    fireEvent.pointerMove(window, { clientX: 101, clientY: 100 });
    expect(card.style.getPropertyValue('--tilt-y')).toBe('0deg');
    expect(card).not.toHaveClass('is-tilting');
    fireEvent.pointerMove(window, { clientX: 50, clientY: 100 });
    await nextFrame();
    expect(card).not.toHaveClass('is-tilting');

    fireEvent.pointerMove(card, { pointerType: 'touch', clientX: 0, clientY: 0 });
    await nextFrame();
    expect(card).not.toHaveClass('is-tilting');
  });
});
