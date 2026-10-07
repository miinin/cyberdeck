import { useEffect, useRef, useState } from 'react';
import { DEFAULT_COLLECTION_PREFS } from '../storage';
import type { CollectionPrefs, PreferencesRepository } from '../storage';

/** The Collection page choices (T-109): loaded once, saved when the user changes one. A failed save only means they are not remembered. */
export function useCollectionPrefs(preferences: PreferencesRepository): [CollectionPrefs, (change: Partial<CollectionPrefs>) => void] {
  const [prefs, setPrefs] = useState<CollectionPrefs>(DEFAULT_COLLECTION_PREFS);
  const latest = useRef(prefs);
  const chosen = useRef(false);

  useEffect(() => {
    preferences.loadCollectionPrefs().then(
      (saved) => {
        if (chosen.current) return;
        latest.current = saved;
        setPrefs(saved);
      },
      () => undefined,
    );
  }, [preferences]);

  const change = (partial: Partial<CollectionPrefs>) => {
    chosen.current = true;
    const next = { ...latest.current, ...partial };
    latest.current = next;
    setPrefs(next);
    preferences.saveCollectionPrefs(next).catch(() => undefined);
  };
  return [prefs, change];
}
