import { useCallback, useEffect, useState } from 'react';
import type { Deck } from '../domain/deck';
import type { DeckRepository, LoadNotice } from '../storage';

export interface DecksState {
  phase: 'loading' | 'ready' | 'unavailable';
  decks: readonly Deck[];
  notices: readonly LoadNotice[];
}

const savesInFlight = new Set<Promise<unknown>>();

/** The editor registers its last writes here so the deck list never reads older data than they leave (B-017). */
export function trackDeckSave(save: Promise<unknown>): void {
  const done = save.then(
    () => undefined,
    () => undefined,
  );
  savesInFlight.add(done);
  void done.then(() => savesInFlight.delete(done));
}

async function fetchDecks(repository: DeckRepository): Promise<DecksState> {
  try {
    if (savesInFlight.size > 0) await Promise.all([...savesInFlight]);
    const { value, notices } = await repository.list();
    return { phase: 'ready', decks: value, notices };
  } catch {
    return { phase: 'unavailable', decks: [], notices: [] };
  }
}

/** The saved decks, reloaded when another tab changes them. `repository` must be a stable reference. */
export function useDecks(repository: DeckRepository): DecksState & { reload: () => Promise<void> } {
  const [state, setState] = useState<DecksState>({ phase: 'loading', decks: [], notices: [] });

  const reload = useCallback(async () => setState(await fetchDecks(repository)), [repository]);

  useEffect(() => {
    let active = true;
    const load = () => {
      void fetchDecks(repository).then((next) => active && setState(next));
    };
    load();
    const unsubscribe = repository.subscribe(load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [repository]);

  return { ...state, reload };
}
