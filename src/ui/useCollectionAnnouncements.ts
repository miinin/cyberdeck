import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Card } from '../domain/card';
import type { CardKey } from '../domain/cardKey';
import { cardNameText } from './CardName';
import { saveErrorLive } from './CollectionNotices';
import type { CollectionEvent, CollectionStore, SaveErrorKind } from './collectionStore';
import { texts } from './texts';
import type { useDelayedAnnouncement } from './useDelayedAnnouncement';

/** Delay after the last saved change before the count is announced (UX.md 6.9, A6). */
export const COUNT_ANNOUNCE_DELAY_MS = 500;
/** Delay after the loaded message before the collection's notices are announced (UX.md 6.8). */
export const NOTICE_ANNOUNCE_DELAY_MS = 1500;

type Announcer = ReturnType<typeof useDelayedAnnouncement>;

/** Saved changes of one card that have not been announced yet. */
interface Burst {
  card: CardKey;
  /** Count before the first change of the burst. */
  from: number;
  /** Count after the latest saved change. */
  to: number;
  /** Announcer token when the burst was last touched: a different token means something else spoke. */
  token: number;
}

/** The live text for a count change from start to end, or null when nothing changed (UX.md 6.9). */
export function describeCountChange(name: string, from: number, to: number): string | null {
  if (from === to) return null;
  if (to === 0) return texts.removedLive(name);
  if (from === 0) return texts.addedLive(name, to);
  return texts.countLive(name, to);
}

/**
 * Live region messages for the collection (UX.md 6.8, 6.9). Only saved counts are announced, after
 * 500 ms without a new save; a burst of presses is told as one change from start to end, and only
 * for the card changed last. Errors and the 999 limit are announced at once.
 */
export function useCollectionAnnouncements(
  announcer: Announcer,
  store: CollectionStore,
  cards: readonly Card[],
  saveError: SaveErrorKind | null,
) {
  const names = useMemo(() => new Map(cards.map((card) => [card.key, cardNameText(card)])), [cards]);
  // Event callbacks run outside rendering; they read the latest values from here. `saveError` is
  // the value of the last render, i.e. whether an error box was already shown.
  const latest = useRef({ announcer, names, saveError });
  useEffect(() => {
    latest.current = { announcer, names, saveError };
  });
  const burst = useRef<Burst | null>(null);
  const sequence = useRef(0);
  const nextKey = () => {
    sequence.current += 1;
    return `collection:${sequence.current}`;
  };

  const onEvent = useCallback(
    (event: CollectionEvent) => {
      const current = latest.current;
      switch (event.type) {
        case 'saved': {
          const open = burst.current;
          if (open !== null && open.card === event.card && open.token === current.announcer.token()) {
            open.to = event.to;
          } else {
            burst.current = { card: event.card, from: event.from, to: event.to, token: current.announcer.token() };
          }
          break;
        }
        case 'idle': {
          const open = burst.current;
          if (open === null) break;
          current.announcer.announceLater(() => {
            // A new save started meanwhile: its 'idle' schedules the message again.
            if (store.isSaving()) return null;
            const done = burst.current;
            burst.current = null;
            const name = done === null ? undefined : latest.current.names.get(done.card);
            const text = done === null || name === undefined ? null : describeCountChange(name, done.from, done.to);
            return text === null ? null : { key: nextKey(), text };
          }, COUNT_ANNOUNCE_DELAY_MS);
          open.token = current.announcer.token();
          break;
        }
        case 'save-failed':
          burst.current = null;
          // One box: announce only when the kind changes or the box was not shown (UX.md 6.8).
          if (event.kind === 'newer-version' || current.saveError !== event.kind) {
            current.announcer.announceNow({ key: nextKey(), text: saveErrorLive(event.kind) }, true);
          }
          break;
        case 'external':
          current.announcer.announceLater({ key: nextKey(), text: texts.externalChangeLive });
          break;
      }
    },
    [store],
  );

  useEffect(() => store.onEvent(onEvent), [store, onEvent]);

  const announceLimit = (card: Card) => {
    burst.current = null;
    announcer.announceNow({ key: nextKey(), text: texts.maxReachedLive(cardNameText(card)) }, true);
  };

  const announce = (text: string) => announcer.announceNow({ key: nextKey(), text }, true);

  return { announceLimit, announce };
}

/**
 * Announces the collection's notice boxes once per load, 1.5 s after the card list's own loaded
 * message, all in one message so the first does not overwrite the next (UX.md 6.8).
 */
export function useLoadNoticeAnnouncement(announcer: Announcer, owner: unknown, loadCount: number, text: string) {
  const announced = useRef<{ owner: unknown; loadCount: number } | null>(null);
  const { announceLater } = announcer;
  useEffect(() => {
    if (text === '') return;
    const last = announced.current;
    if (last !== null && last.owner === owner && last.loadCount === loadCount) return;
    announced.current = { owner, loadCount };
    announceLater({ key: `notices:${loadCount}`, text }, NOTICE_ANNOUNCE_DELAY_MS);
  }, [announceLater, owner, loadCount, text]);
}
