/*
 * Collection state for the card list (docs/UX.md 6.4.2, 6.8, 6.9). Plain TypeScript so the
 * save rules can be tested without React; useCollection.ts connects it to the view.
 *
 * Rules:
 * - The count on screen is the newest target count of each card (`targets`), or the saved count.
 * - Saves run one at a time. While one is running, only the newest target of each card waits;
 *   values in between are never saved, and an older answer never overwrites a newer target.
 * - A failed save drops every waiting target, so the screen falls back to the last saved
 *   collection: it never shows a count that was not saved.
 * - A change from another tab reloads the collection only when no own save is running.
 */
import type { CardKey } from '../domain/cardKey';
import { EMPTY_COLLECTION, countOf, versionsOf } from '../domain/collection';
import type { Collection } from '../domain/collection';
import type { PrintingKey } from '../domain/printing';
import { StorageError } from '../storage';
import type { CollectionRepository, LoadNotice, StorageErrorKind } from '../storage';

export type CollectionPhase =
  /** load() is running. */
  | 'loading'
  /** Counts can be changed. */
  | 'ready'
  /** Stored data has a newer schema version: shown empty, no controls (UX.md 6.8 LUKITTU). */
  | 'locked'
  /** load() failed (UX.md 6.8 EI SAATAVILLA). */
  | 'unavailable';

/** A save error kind, or 'unknown' for anything that is not a StorageError. */
export type SaveErrorKind = StorageErrorKind | 'unknown';

/** Notices the user sees. `migrated` is never shown (UX.md 6.8). */
export type CollectionNotice = Exclude<LoadNotice, { kind: 'migrated' }>;

export interface CollectionSnapshot {
  readonly phase: CollectionPhase;
  /** Last saved (or loaded) collection. The summary is counted from this (UX.md 6.4.2). */
  readonly saved: Collection;
  /** Counts not saved yet. Shown instead of the saved count. */
  readonly targets: ReadonlyMap<CardKey, number>;
  /** Version counts not saved yet, by versionTargetKey(card, printing) (D-020). */
  readonly versionTargets: ReadonlyMap<string, number>;
  readonly notices: readonly CollectionNotice[];
  /** Kind of the last failed save; null after a successful save or when dismissed. */
  readonly saveError: SaveErrorKind | null;
  /** Number of finished loads, so notices of one load are announced once. */
  readonly loadCount: number;
}

export type CollectionEvent =
  /** One save finished. `from` is the count saved before it. */
  | { type: 'saved'; card: CardKey; from: number; to: number }
  | { type: 'save-failed'; kind: SaveErrorKind }
  /** The last waiting save finished successfully and nothing is running. */
  | { type: 'idle' }
  /** The collection was reloaded after a change in another tab. */
  | { type: 'external' };

export interface CollectionStore {
  getSnapshot(): CollectionSnapshot;
  /** For useSyncExternalStore. */
  subscribe(listener: () => void): () => void;
  onEvent(listener: (event: CollectionEvent) => void): () => void;
  /** Loads the collection and listens to other tabs. Safe to call again after dispose(). */
  start(): void;
  dispose(): void;
  /** Loads again (the "Lue kokoelma uudelleen" button). Keeps dismissed notices hidden. */
  reload(): void;
  /** Shows `count` for `card` at once and saves it in turn. Ignored unless the phase is 'ready'. */
  setCount(card: CardKey, count: number): void;
  /** Same for the copies of one printing; the total count moves with it (D-020). */
  setVersionCount(card: CardKey, printing: PrintingKey, count: number): void;
  /** True while a save is running or waiting. */
  isSaving(): boolean;
  dismissNotice(kind: 'reset' | 'repaired'): void;
  dismissSaveError(): void;
}

export function countIn(snapshot: CollectionSnapshot, card: CardKey): number {
  return snapshot.targets.get(card) ?? countOf(snapshot.saved, card);
}

export function versionTargetKey(card: CardKey, printing: PrintingKey): string {
  return `${card}|${printing}`;
}

/** The copies of one printing on screen: the newest unsaved target, or the saved number. */
export function versionCountIn(snapshot: CollectionSnapshot, card: CardKey, printing: PrintingKey): number {
  return snapshot.versionTargets.get(versionTargetKey(card, printing)) ?? versionsOf(snapshot.saved, card)[printing] ?? 0;
}

function visibleNotices(notices: readonly LoadNotice[]): CollectionNotice[] {
  return notices.filter((notice): notice is CollectionNotice => notice.kind !== 'migrated');
}

export function createCollectionStore(repository: CollectionRepository): CollectionStore {
  let snapshot: CollectionSnapshot = {
    phase: 'loading',
    saved: EMPTY_COLLECTION,
    targets: new Map(),
    versionTargets: new Map(),
    notices: [],
    saveError: null,
    loadCount: 0,
  };
  const listeners = new Set<() => void>();
  const eventListeners = new Set<(event: CollectionEvent) => void>();
  /** Newest unsaved target per card. The running save is not in here. */
  const queue = new Map<CardKey, number>();
  /** Newest unsaved version target per card and printing. */
  const versionQueue = new Map<string, { card: CardKey; printing: PrintingKey; count: number }>();
  const dismissed = new Set<CollectionNotice['kind']>();
  let running = false;
  let externalPending = false;
  /** Changes on start, dispose and every load, so late answers of an old load are ignored. */
  let generation = 0;
  /** Changes on every setCount, so a reload that overlapped a click is not applied. */
  let changeCount = 0;
  let unsubscribeRepository: (() => void) | null = null;

  function update(next: Partial<CollectionSnapshot>) {
    snapshot = { ...snapshot, ...next };
    for (const listener of listeners) listener();
  }

  function emit(event: CollectionEvent) {
    for (const listener of eventListeners) listener(event);
  }

  function noticesFrom(loaded: readonly LoadNotice[]): CollectionNotice[] {
    return visibleNotices(loaded).filter((notice) => !dismissed.has(notice.kind));
  }

  function load() {
    generation += 1;
    const own = generation;
    update({ phase: 'loading', targets: new Map(), versionTargets: new Map(), saveError: null });
    repository.load().then(
      ({ value, notices }) => {
        if (own !== generation) return;
        const locked = notices.some((notice) => notice.kind === 'newer-version');
        update({
          phase: locked ? 'locked' : 'ready',
          saved: locked ? EMPTY_COLLECTION : value,
          notices: noticesFrom(notices),
          loadCount: snapshot.loadCount + 1,
        });
      },
      (error: unknown) => {
        if (own !== generation) return;
        // Technical details only to the console (UX.md 6.8).
        console.error('Reading the collection failed', error);
        update({ phase: 'unavailable', saved: EMPTY_COLLECTION, notices: [], loadCount: snapshot.loadCount + 1 });
      },
    );
  }

  /** Reload after another tab changed the data. Notices other than newer-version are not shown again. */
  function reloadQuietly() {
    externalPending = false;
    const own = generation;
    const changesAtStart = changeCount;
    repository.load().then(
      ({ value, notices }) => {
        if (own !== generation) return;
        if (running || changeCount !== changesAtStart) {
          externalPending = true; // an own change started meanwhile: try again after it
          return;
        }
        const newer = notices.find((notice) => notice.kind === 'newer-version');
        if (newer !== undefined) {
          lock(newer);
        } else if (snapshot.phase === 'ready') {
          update({ saved: value });
        }
        emit({ type: 'external' });
      },
      (error: unknown) => {
        if (own !== generation) return;
        console.error('Reading the collection failed', error);
      },
    );
  }

  function lock(notice: CollectionNotice) {
    queue.clear();
    versionQueue.clear();
    const notices = snapshot.notices.some((current) => current.kind === 'newer-version')
      ? snapshot.notices
      : [notice, ...snapshot.notices];
    update({ phase: 'locked', saved: EMPTY_COLLECTION, targets: new Map(), versionTargets: new Map(), notices, saveError: null });
  }

  async function drain() {
    if (running) return;
    running = true;
    const own = generation;
    let failed = false;
    while (queue.size > 0 || versionQueue.size > 0) {
      let card: CardKey;
      let versionKey: string | null = null;
      try {
        let saved: Collection;
        let before: number;
        if (queue.size > 0) {
          const [nextCard, count] = queue.entries().next().value as [CardKey, number];
          card = nextCard;
          queue.delete(card);
          before = countOf(snapshot.saved, card);
          saved = await repository.setCount(card, count);
        } else {
          const [key, change] = versionQueue.entries().next().value as [string, { card: CardKey; printing: PrintingKey; count: number }];
          versionQueue.delete(key);
          versionKey = key;
          card = change.card;
          before = countOf(snapshot.saved, card);
          saved = await repository.setVersionCount(card, change.printing, change.count);
        }
        if (own !== generation) return;
        const targets = new Map(snapshot.targets);
        if (versionKey === null && !queue.has(card)) targets.delete(card);
        const versionTargets = new Map(snapshot.versionTargets);
        if (versionKey !== null && !versionQueue.has(versionKey)) versionTargets.delete(versionKey);
        update({ saved, targets, versionTargets, saveError: null });
        emit({ type: 'saved', card, from: before, to: countOf(saved, card) });
      } catch (error) {
        if (own !== generation) return;
        console.error('Saving the collection failed', error);
        failed = true;
        queue.clear();
        versionQueue.clear();
        const kind: SaveErrorKind = error instanceof StorageError ? error.kind : 'unknown';
        if (kind === 'newer-version') {
          // The version is never shown to the user (UX.md 6.8), so it is not known or needed here.
          lock({ kind: 'newer-version', version: 0 });
        } else {
          update({ targets: new Map(), versionTargets: new Map(), saveError: kind });
        }
        emit({ type: 'save-failed', kind });
      }
    }
    running = false;
    if (!failed) emit({ type: 'idle' });
    if (externalPending) reloadQuietly();
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    onEvent(listener) {
      eventListeners.add(listener);
      return () => eventListeners.delete(listener);
    },
    start() {
      unsubscribeRepository?.();
      unsubscribeRepository = repository.subscribe(() => {
        if (snapshot.phase !== 'ready' && snapshot.phase !== 'locked') return;
        if (running) externalPending = true;
        else reloadQuietly();
      });
      load();
    },
    dispose() {
      generation += 1;
      queue.clear();
      versionQueue.clear();
      running = false;
      externalPending = false;
      unsubscribeRepository?.();
      unsubscribeRepository = null;
    },
    reload: load,
    setCount(card, count) {
      if (snapshot.phase !== 'ready') return;
      changeCount += 1;
      queue.set(card, count);
      update({ targets: new Map(snapshot.targets).set(card, count) });
      void drain();
    },
    setVersionCount(card, printing, count) {
      if (snapshot.phase !== 'ready') return;
      changeCount += 1;
      const key = versionTargetKey(card, printing);
      versionQueue.set(key, { card, printing, count });
      update({ versionTargets: new Map(snapshot.versionTargets).set(key, count) });
      void drain();
    },
    isSaving: () => running || queue.size > 0 || versionQueue.size > 0,
    dismissNotice(kind) {
      dismissed.add(kind);
      update({ notices: snapshot.notices.filter((notice) => notice.kind !== kind) });
    },
    dismissSaveError() {
      update({ saveError: null });
    },
  };
}
