import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';

/** The largest tilt from flat, in degrees, at an edge of the card (T-153). */
export const MAX_TILT_DEG = 6;

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

interface FlatRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * The card's box when flat. The tilt turns and moves the card back around its centre, so the centre of the transformed
 * box stays put and the layout size (offsetWidth/Height) is the flat size.
 */
function flatRect(element: HTMLElement): FlatRect | null {
  const box = element.getBoundingClientRect();
  const width = element.offsetWidth || box.width;
  const height = element.offsetHeight || box.height;
  if (width === 0 || height === 0) return null;
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  return { left: cx - width / 2, top: cy - height / 2, width, height };
}

/**
 * A card that tilts toward the mouse (T-153): the side under the pointer goes back, smoothly, and comes flat again when
 * the pointer leaves. Mouse and pen only (touch scrolls and swipes); nothing with reduced motion. The angles are CSS
 * variables set through the CSSOM (the content security policy allows no style attributes), the look is in styles.css.
 *
 * T-162: "leaves" means leaves the flat card. The tilted card is smaller and turned, so near an edge the pointer fell off
 * it, the card came flat under the pointer again and tilted again, many times a second. While tilting, the pointer is
 * followed on the window against the flat box.
 */
export function useTilt<T extends HTMLElement>() {
  const frame = useRef(0);
  const active = useRef<{ element: T; rect: FlatRect; stop: () => void } | null>(null);

  const reset = useCallback(() => {
    const session = active.current;
    if (session === null) return;
    active.current = null;
    session.stop();
    cancelAnimationFrame(frame.current);
    session.element.style.setProperty('--tilt-x', '0deg');
    session.element.style.setProperty('--tilt-y', '0deg');
    session.element.classList.remove('is-tilting');
  }, []);

  useEffect(() => () => {
    cancelAnimationFrame(frame.current);
    reset();
  }, [reset]);

  const follow = useCallback(
    (clientX: number, clientY: number) => {
      const session = active.current;
      if (session === null) return;
      const { element, rect } = session;
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) {
        reset();
        return;
      }
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        element.style.setProperty('--tilt-x', `${((0.5 - y) * 2 * MAX_TILT_DEG).toFixed(2)}deg`);
        element.style.setProperty('--tilt-y', `${((x - 0.5) * 2 * MAX_TILT_DEG).toFixed(2)}deg`);
        element.classList.add('is-tilting');
      });
    },
    [reset],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<T>) => {
      if (event.pointerType === 'touch' || window.matchMedia?.(REDUCED_MOTION).matches) return;
      if (active.current === null) {
        const element = event.currentTarget;
        const rect = flatRect(element);
        if (rect === null) return;
        const onMove = (e: globalThis.PointerEvent) => follow(e.clientX, e.clientY);
        const onOut = (e: globalThis.PointerEvent) => {
          // The pointer left the window.
          if (e.relatedTarget === null) reset();
        };
        window.addEventListener('pointermove', onMove);
        document.addEventListener('pointerout', onOut);
        window.addEventListener('blur', reset);
        window.addEventListener('scroll', reset, true);
        window.addEventListener('resize', reset);
        // The gallery shows the next card in the same element: its box may differ.
        element.addEventListener('load', reset);
        const stop = () => {
          window.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerout', onOut);
          window.removeEventListener('blur', reset);
          window.removeEventListener('scroll', reset, true);
          window.removeEventListener('resize', reset);
          element.removeEventListener('load', reset);
        };
        active.current = { element, rect, stop };
      }
      follow(event.clientX, event.clientY);
    },
    [follow, reset],
  );

  // No onPointerLeave: the tilted card can slip out from under a pointer that is still over the flat card.
  return { onPointerMove };
}
