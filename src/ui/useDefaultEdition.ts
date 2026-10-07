import { useEffect, useRef, useState } from 'react';
import type { DefaultEdition, Repositories } from '../storage';

/** The default edition (D-022) outside the Cards view: loaded once, saved when the user chooses (T-106). */
export function useDefaultEdition(repositories: Repositories): [DefaultEdition, (next: DefaultEdition) => void] {
  const [edition, setEdition] = useState<DefaultEdition>('beta');
  const chosen = useRef(false);

  useEffect(() => {
    repositories.preferences.loadDefaultEdition().then(
      (saved) => {
        if (!chosen.current) setEdition(saved);
      },
      () => undefined,
    );
  }, [repositories]);

  const choose = (next: DefaultEdition) => {
    chosen.current = true;
    setEdition(next);
    // A failed save only means the choice is not remembered; the scanner keeps working.
    repositories.preferences.saveDefaultEdition(next).catch(() => undefined);
  };
  return [edition, choose];
}
