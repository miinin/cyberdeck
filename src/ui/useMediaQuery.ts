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
