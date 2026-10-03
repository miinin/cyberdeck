import { useCallback, useSyncExternalStore } from 'react';

/**
 * Whether a media query matches, kept up to date (T-050). Used where the DOM must follow the layout
 * (for example `aria-expanded` on the filter toggle), so CSS alone is not enough.
 * Without `matchMedia` (jsdom, very old browsers) the `fallback` is used.
 */
export function useMediaQuery(query: string, fallback: boolean): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== 'function') return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  const getSnapshot = () => (typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : fallback);
  return useSyncExternalStore(subscribe, getSnapshot, () => fallback);
}

/** The L breakpoint (docs/tasks/T-050): filters as a side panel from here up. */
export const WIDE_QUERY = '(min-width: 64rem)';

/** The XL breakpoint (docs/tasks/T-050): the deck editor shows the filters as a side panel from here up. */
export const EDITOR_WIDE_QUERY = '(min-width: 100rem)';

/** A mouse or a pen: a click on a result row adds a card only there, so scrolling by touch never adds (T-050b). */
export const FINE_POINTER_QUERY = '(pointer: fine)';

/** A pointer that can hover: the hover preview is shown only there (T-050b). */
export const HOVER_QUERY = '(hover: hover) and (pointer: fine)';
