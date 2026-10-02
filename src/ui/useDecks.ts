import { useCallback, useEffect, useState } from 'react';
import type { Deck } from '../domain/deck';
import type { DeckRepository, LoadNotice } from '../storage';

export interface DecksState {
  phase: 'loading' | 'ready' | 'unavailable';
  decks: readonly Deck[];
  notices: readonly LoadNotice[];
}

/** The saved decks, reloaded when another tab changes them. `repository` must be a stable reference. */
export function useDecks(repository: DeckRepository): DecksState & { reload: () => Promise<void> } {
  const [state, setState] = useState<DecksState>({ phase: 'loading', decks: [], notices: [] });

  const reload = useCallback(async () => {
    try {
      const { value, notices } = await repository.list();
      setState({ phase: 'ready', decks: value, notices });
    } catch {
      setState({ phase: 'unavailable', decks: [], notices: [] });
    }
  }, [repository]);

  useEffect(() => {
    void reload();
    return repository.subscribe(() => void reload());
  }, [repository, reload]);

  return { ...state, reload };
}
