import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';

/** The largest tilt from flat, in degrees, at an edge of the card (T-153). */
export const MAX_TILT_DEG = 6;

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * A card that tilts toward the mouse (T-153): the side under the pointer goes back, smoothly, and comes flat again when
 * the pointer leaves. Mouse and pen only (touch scrolls and swipes); nothing with reduced motion. The angles are CSS
 * variables set through the CSSOM (the content security policy allows no style attributes), the look is in styles.css.
 */
export function useTilt<T extends HTMLElement>() {
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onPointerMove = useCallback((event: PointerEvent<T>) => {
    if (event.pointerType === 'touch' || window.matchMedia?.(REDUCED_MOTION).matches) return;
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      element.style.setProperty('--tilt-x', `${((0.5 - y) * 2 * MAX_TILT_DEG).toFixed(2)}deg`);
      element.style.setProperty('--tilt-y', `${((x - 0.5) * 2 * MAX_TILT_DEG).toFixed(2)}deg`);
      element.classList.add('is-tilting');
    });
  }, []);

  const onPointerLeave = useCallback((event: PointerEvent<T>) => {
    const element = event.currentTarget;
    cancelAnimationFrame(frame.current);
    element.style.setProperty('--tilt-x', '0deg');
    element.style.setProperty('--tilt-y', '0deg');
    element.classList.remove('is-tilting');
  }, []);

  return { onPointerMove, onPointerLeave };
}
