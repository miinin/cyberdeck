import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SealedRun } from '../domain/sealed';
import { StorageError } from '../storage';
import type { LoadNotice, SealedRepository, StorageErrorKind } from '../storage';

export interface SealedState {
  /** 'locked' = saved by a newer version: shown as none, no changes (like the other aggregates). */
  phase: 'loading' | 'ready' | 'locked' | 'unavailable';
  run: SealedRun | null;
  notices: readonly LoadNotice[];
}

/** null = done; otherwise why the change was not saved. */
export type SealedChangeResult = StorageErrorKind | 'unknown' | null;

export interface SealedHandle extends SealedState {
  /** Replaces the run with what `change` makes of the current one (shown at once, then saved). A run that is not saved is read back. */
  update(change: (run: SealedRun) => SealedRun): Promise<SealedChangeResult>;
  /** Starts from the given run, whatever was there. */
  replace(run: SealedRun): Promise<SealedChangeResult>;
  clear(): Promise<SealedChangeResult>;
}

async function fetchRun(repository: SealedRepository): Promise<SealedState> {
  try {
    const { value, notices } = await repository.load();
    const locked = notices.some((notice) => notice.kind === 'newer-version');
    return { phase: locked ? 'locked' : 'ready', run: value, notices };
  } catch {
    return { phase: 'unavailable', run: null, notices: [] };
  }
}

/** The running sealed (T-173): loaded on mount and again when another tab changes it. `repository` must be a stable reference. */
export function useSealed(repository: SealedRepository): SealedHandle {
  const [state, setState] = useState<SealedState>({ phase: 'loading', run: null, notices: [] });
  // The newest run, so two quick taps in a row build on each other.
  const latest = useRef<SealedRun | null>(null);

  const show = useCallback((next: SealedState) => {
    latest.current = next.run;
    setState(next);
  }, []);

  useEffect(() => {
    let active = true;
    const load = () => {
      void fetchRun(repository).then((next) => active && show(next));
    };
    load();
    const unsubscribe = repository.subscribe(load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [repository, show]);

  const persist = useCallback(
    async (next: SealedRun | null): Promise<SealedChangeResult> => {
      latest.current = next;
      setState((current) => ({ ...current, run: next }));
      try {
        if (next === null) await repository.clear();
        else await repository.save(next);
      } catch (error) {
        show(await fetchRun(repository));
        return error instanceof StorageError ? error.kind : 'unknown';
      }
      return null;
    },
    [repository, show],
  );

  return useMemo(
    () => ({
      ...state,
      update: (change) => {
        const current = latest.current;
        if (current === null) return Promise.resolve(null);
        const next = change(current);
        return next === current ? Promise.resolve(null) : persist(next);
      },
      replace: (run) => persist(run),
      clear: () => persist(null),
    }),
    [state, persist],
  );
}
