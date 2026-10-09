import { useCallback, useEffect, useRef, useState } from 'react';
import type { BinderLayout } from '../domain/binderLayout';
import type { PreferencesRepository } from '../storage';

/**
 * The own binder's layout (T-120): read once when the own binder is first shown (a new one is made from `makeInitial`
 * when none is saved, and saved right away), saved after every change. A failed save keeps the layout for the session
 * and sets `saveFailed`. `layout` is null while it is loading.
 */
export function useBinderLayout(
  preferences: PreferencesRepository,
  enabled: boolean,
  makeInitial: () => BinderLayout,
): { layout: BinderLayout | null; update: (change: (layout: BinderLayout) => BinderLayout) => void; saveFailed: boolean } {
  const [layout, setLayout] = useState<BinderLayout | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const latest = useRef<BinderLayout | null>(null);
  const initial = useRef(makeInitial);
  useEffect(() => {
    initial.current = makeInitial;
  });

  const persist = useCallback(
    (next: BinderLayout) => {
      preferences.saveBinderLayout(next).then(
        () => setSaveFailed(false),
        () => setSaveFailed(true),
      );
    },
    [preferences],
  );

  useEffect(() => {
    if (!enabled || latest.current !== null) return;
    let active = true;
    preferences.loadBinderLayout().then(
      (saved) => {
        if (!active || latest.current !== null) return;
        const next = saved ?? initial.current();
        latest.current = next;
        setLayout(next);
        if (saved === null) persist(next);
      },
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [enabled, preferences, persist]);

  const update = useCallback(
    (change: (current: BinderLayout) => BinderLayout) => {
      const current = latest.current;
      if (current === null) return;
      const next = change(current);
      if (next === current) return;
      latest.current = next;
      setLayout(next);
      persist(next);
    },
    [persist],
  );

  return { layout, update, saveFailed };
}
