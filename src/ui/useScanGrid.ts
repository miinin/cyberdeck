import { useEffect, useRef, useState } from 'react';
import type { PreferencesRepository, ScanGrid } from '../storage';

/** The binder page grid of the scanner (T-179): loaded once, saved when the user chooses. A failed save only means it is not remembered. */
export function useScanGrid(preferences: PreferencesRepository): [ScanGrid, (next: ScanGrid) => void] {
  const [grid, setGrid] = useState<ScanGrid>('3x3');
  const chosen = useRef(false);

  useEffect(() => {
    preferences.loadScanGrid().then(
      (saved) => {
        if (!chosen.current) setGrid(saved);
      },
      () => undefined,
    );
  }, [preferences]);

  const choose = (next: ScanGrid) => {
    chosen.current = true;
    setGrid(next);
    preferences.saveScanGrid(next).catch(() => undefined);
  };
  return [grid, choose];
}
