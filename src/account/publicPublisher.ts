/*
 * Keeps the public copies of decks up to date (T-098, D-025). No React and no Firebase. Edits are not sent one
 * by one: the newest content waits PUBLIC_UPDATE_DELAY_MS (15 s) or until the editor is left (SR-34), and two
 * sends of one deck are never closer than MIN_GAP_MS, because the rules refuse updates less than 10 s apart.
 * Taking a deck private deletes the public copy first (SR-35).
 */
import { PUBLIC_UPDATE_DELAY_MS } from '../domain/publicDeck';
import type { PublicDeckInput } from '../domain/publicDeck';
import { CloudError, toCloudError } from './cloudError';
import type { CloudErrorKind } from './cloudError';
import type { PublicDeckStore } from './types';

/** A little above the 10 s of the rules, for clock differences between the client and the server. */
export const MIN_GAP_MS = 10_500;

export type PublishState =
  | { kind: 'idle' }
  /** A newer version waits for the delay or for leaving the editor. */
  | { kind: 'pending' }
  | { kind: 'sending' }
  /** `at` = ISO time of the last successful send, from this device's clock. */
  | { kind: 'done'; at: string }
  /** The newest version is kept and sent by the next `flush` or `schedule`. */
  | { kind: 'error'; error: CloudErrorKind };

const IDLE: PublishState = { kind: 'idle' };

export interface PublicDeckPublisher {
  /** Remembers the newest version of a public deck and sends it after the delay. */
  schedule(input: PublicDeckInput): void;
  /** Sends the waiting version now (after the minimum gap). Never rejects; the result is in `state`. */
  flush(deckId: string): Promise<void>;
  /** Forgets the waiting version of a deck without sending it. */
  cancel(deckId: string): void;
  /** Cancels what waits, then deletes the public copy (SR-35). Rejects with CloudError when the deletion fails. */
  unpublish(deckId: string): Promise<void>;
  state(deckId: string): PublishState;
  onChange(listener: () => void): () => void;
  /** Stops the timers without sending (the account changed). */
  dispose(): void;
}

interface Entry {
  input: PublicDeckInput | null;
  timer: ReturnType<typeof setTimeout> | null;
  lastSentAt: number | null;
  chain: Promise<void>;
  state: PublishState;
}

export function createPublicDeckPublisher(options: {
  store: PublicDeckStore;
  delayMs?: number;
  minGapMs?: number;
  now?: () => Date;
}): PublicDeckPublisher {
  const { store, delayMs = PUBLIC_UPDATE_DELAY_MS, minGapMs = MIN_GAP_MS, now = () => new Date() } = options;
  const entries = new Map<string, Entry>();
  const listeners = new Set<() => void>();
  let disposed = false;

  function entryOf(deckId: string): Entry {
    let entry = entries.get(deckId);
    if (entry === undefined) {
      entry = { input: null, timer: null, lastSentAt: null, chain: Promise.resolve(), state: IDLE };
      entries.set(deckId, entry);
    }
    return entry;
  }

  function setState(entry: Entry, state: PublishState) {
    entry.state = state;
    for (const listener of [...listeners]) listener();
  }

  function stopTimer(entry: Entry) {
    if (entry.timer !== null) clearTimeout(entry.timer);
    entry.timer = null;
  }

  function send(entry: Entry): Promise<void> {
    stopTimer(entry);
    entry.chain = entry.chain.then(async () => {
      const input = entry.input;
      if (input === null || disposed) return;
      entry.input = null;
      setState(entry, { kind: 'sending' });
      if (entry.lastSentAt !== null) {
        const wait = entry.lastSentAt + minGapMs - now().getTime();
        if (wait > 0) await new Promise<void>((resolve) => setTimeout(resolve, wait));
      }
      try {
        await store.publish(input);
        entry.lastSentAt = now().getTime();
        // A newer version arrived while sending: it keeps waiting for its own turn.
        setState(entry, entry.input === null ? { kind: 'done', at: now().toISOString() } : { kind: 'pending' });
      } catch (error) {
        // Keep the content unless a newer version has replaced it.
        entry.input ??= input;
        setState(entry, { kind: 'error', error: toCloudError(error).kind });
      }
    });
    return entry.chain;
  }

  return {
    schedule(input) {
      if (disposed) return;
      const entry = entryOf(input.deckId);
      entry.input = input;
      if (entry.state.kind !== 'sending') setState(entry, { kind: 'pending' });
      if (entry.timer === null) entry.timer = setTimeout(() => void send(entry), delayMs);
    },
    flush(deckId) {
      const entry = entries.get(deckId);
      return entry === undefined ? Promise.resolve() : send(entry);
    },
    cancel(deckId) {
      const entry = entries.get(deckId);
      if (entry === undefined) return;
      stopTimer(entry);
      entry.input = null;
      if (entry.state.kind === 'pending' || entry.state.kind === 'error') setState(entry, IDLE);
    },
    async unpublish(deckId) {
      const entry = entryOf(deckId);
      stopTimer(entry);
      entry.input = null;
      // Wait for a send in flight, so it cannot recreate the copy after the deletion.
      await entry.chain;
      try {
        await store.remove(deckId);
      } catch (error) {
        throw error instanceof CloudError ? error : toCloudError(error);
      }
      entry.lastSentAt = null;
      setState(entry, IDLE);
    },
    state: (deckId) => entries.get(deckId)?.state ?? IDLE,
    onChange(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      disposed = true;
      for (const entry of entries.values()) {
        stopTimer(entry);
        entry.input = null;
      }
    },
  };
}
