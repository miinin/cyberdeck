import { useCallback, useEffect, useRef, useState } from 'react';

/** Delay after the last change before a filter result is announced (UX.md 5.6). */
export const ANNOUNCE_DELAY_MS = 750;

export interface Announcement {
  /** Identifies the result (e.g. state and count). The same key is never announced twice in a row. */
  key: string;
  text: string;
}

interface Current extends Announcement {
  owner: unknown;
}

/**
 * Announcements for the polite live region that belong to one `owner` (the loaded catalog).
 * When the owner changes (retry, new data) pending announcements are cancelled and earlier
 * ones are dropped, so a stale result never overwrites the loading message. `baseline` is
 * the key of what the owner's own message already said, to avoid repeating it.
 */
export function useDelayedAnnouncement(owner: unknown, baseline: string | null) {
  const [current, setCurrent] = useState<Current | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  // A new owner or unmount cancels anything pending.
  useEffect(() => cancel, [owner, cancel]);

  /** `force` skips the repeat check, for an explicit user action such as clearing the filters. */
  const announceNow = useCallback(
    (announcement: Announcement, force = false) => {
      cancel();
      setCurrent((previous) => {
        const lastKey = previous !== null && previous.owner === owner ? previous.key : baseline;
        return !force && lastKey === announcement.key ? previous : { ...announcement, owner };
      });
    },
    [owner, baseline, cancel],
  );

  const announceLater = useCallback(
    (announcement: Announcement) => {
      cancel();
      timer.current = setTimeout(() => announceNow(announcement), ANNOUNCE_DELAY_MS);
    },
    [announceNow, cancel],
  );

  /** Text announced for the current owner, or null when the owner's own message stands. */
  const text = current !== null && current.owner === owner ? current.text : null;

  return { text, announceNow, announceLater, cancel };
}
