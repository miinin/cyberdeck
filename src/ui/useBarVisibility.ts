import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/** How long a mouse user can be idle before the gallery bar fades (T-123). */
export const BAR_IDLE_MS = 2500;
/** Scrolling less than this many pixels does not hide or show the bar (touch). */
const SCROLL_STEP = 8;

function isHovered(element: HTMLElement): boolean {
  try {
    return element.matches(':hover');
  } catch {
    return false;
  }
}

/**
 * Whether the floating gallery bar is shown (T-123). It must never cover the pictures for good:
 * - with a mouse it fades after 2.5 s without movement unless the pointer or focus is on it or `pinned`, and returns on
 *   mouse movement, a key press or scrolling up;
 * - on touch screens it hides when the page is scrolled down and returns when scrolled up, like a browser's address bar.
 */
export function useBarVisibility(barRef: RefObject<HTMLElement | null>, touch: boolean, pinned: boolean): boolean {
  const [visible, setVisible] = useState(true);
  const pinnedRef = useRef(pinned);
  useEffect(() => {
    pinnedRef.current = pinned;
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastY = window.scrollY;
    const busy = () => {
      const bar = barRef.current;
      if (bar === null) return false;
      return isHovered(bar) || bar.contains(document.activeElement) || pinnedRef.current;
    };
    const arm = () => {
      clearTimeout(timer);
      if (touch) return;
      timer = setTimeout(() => {
        if (busy()) arm();
        else setVisible(false);
      }, BAR_IDLE_MS);
    };
    const wake = () => {
      setVisible(true);
      arm();
    };
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (Math.abs(delta) < SCROLL_STEP) return;
      lastY = y;
      if (delta < 0 || y <= 0) wake();
      else if (touch && !busy()) setVisible(false);
    };
    arm();
    window.addEventListener('scroll', onScroll, { passive: true });
    if (!touch) {
      window.addEventListener('mousemove', wake);
      window.addEventListener('keydown', wake);
      window.addEventListener('focusin', wake);
    }
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', wake);
      window.removeEventListener('keydown', wake);
      window.removeEventListener('focusin', wake);
    };
  }, [barRef, touch]);

  return visible;
}
