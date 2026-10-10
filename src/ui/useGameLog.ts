import { useCallback, useEffect, useMemo, useState } from 'react';
import { EMPTY_GAME_LOG } from '../domain/games';
import type { GameInput, GameLog } from '../domain/games';
import { StorageError } from '../storage';
import type { GameLogRepository, LoadNotice, StorageErrorKind } from '../storage';

export interface GameLogState {
  /** 'locked' = the log was saved by a newer version: shown empty, no changes (like the other aggregates). */
  phase: 'loading' | 'ready' | 'locked' | 'unavailable';
  log: GameLog;
  notices: readonly LoadNotice[];
}

/** null = done; otherwise why the change was not saved. */
export type GameChangeResult = StorageErrorKind | 'unknown' | null;

export interface GameLogHandle extends GameLogState {
  add(input: GameInput): Promise<GameChangeResult>;
  update(id: string, input: GameInput): Promise<GameChangeResult>;
  remove(id: string): Promise<GameChangeResult>;
}

async function fetchLog(repository: GameLogRepository): Promise<GameLogState> {
  try {
    const { value, notices } = await repository.load();
    const locked = notices.some((notice) => notice.kind === 'newer-version');
    return { phase: locked ? 'locked' : 'ready', log: value, notices };
  } catch {
    return { phase: 'unavailable', log: EMPTY_GAME_LOG, notices: [] };
  }
}

/**
 * The game log (T-122): loaded on mount and again when another tab changes it. Every change goes through the
 * repository (which validates and enforces the limits) and then reloads. `repository` must be a stable reference.
 */
export function useGameLog(repository: GameLogRepository): GameLogHandle {
  const [state, setState] = useState<GameLogState>({ phase: 'loading', log: EMPTY_GAME_LOG, notices: [] });

  useEffect(() => {
    let active = true;
    const load = () => {
      void fetchLog(repository).then((next) => active && setState(next));
    };
    load();
    const unsubscribe = repository.subscribe(load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [repository]);

  const change = useCallback(
    async (run: () => Promise<unknown>): Promise<GameChangeResult> => {
      try {
        await run();
      } catch (error) {
        return error instanceof StorageError ? error.kind : 'unknown';
      }
      setState(await fetchLog(repository));
      return null;
    },
    [repository],
  );

  return useMemo(
    () => ({
      ...state,
      add: (input) => change(() => repository.add(input)),
      update: (id, input) => change(() => repository.update(id, input)),
      remove: (id) => change(() => repository.remove(id)),
    }),
    [state, change, repository],
  );
}
