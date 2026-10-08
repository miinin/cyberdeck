import { useEffect, useRef, useState } from 'react';
import type { PreferencesRepository, ScanMode } from '../storage';

/** The scanner mode (T-108): loaded once, saved when the user chooses. A failed save only means it is not remembered. */
export function useScanMode(preferences: PreferencesRepository): [ScanMode, (next: ScanMode) => void] {
  const [mode, setMode] = useState<ScanMode>('single');
  const chosen = useRef(false);

  useEffect(() => {
    preferences.loadScanMode().then(
      (saved) => {
        if (!chosen.current) setMode(saved);
      },
      () => undefined,
    );
  }, [preferences]);

  const choose = (next: ScanMode) => {
    chosen.current = true;
    setMode(next);
    preferences.saveScanMode(next).catch(() => undefined);
  };
  return [mode, choose];
}
