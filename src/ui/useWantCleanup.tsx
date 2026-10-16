import { useEffect, useRef, useState } from 'react';
import type { Card } from '../domain/card';
import type { CardKey } from '../domain/cardKey';
import { countOf } from '../domain/collection';
import { cardNameText } from './CardName';
import { countIn } from './collectionStore';
import type { CollectionStore } from './collectionStore';
import { texts } from './texts';
import type { WantsHandle } from './useWants';

const SHOWN_NAMES = 3;
const DONE_MS = 4000;

/** Collects the user's own additions of cards that are on the Want list; returns them for the bar. */
export function useWantCleanup(store: CollectionStore, wants: WantsHandle, cards: readonly Card[]) {
  const [added, setAdded] = useState<ReadonlyMap<CardKey, number>>(new Map());
  const [done, setDone] = useState<string | null>(null);
  const latest = useRef(wants);
  useEffect(() => {
    latest.current = wants;
  });

  useEffect(
    () =>
      store.onEvent((event) => {
        // Only the user's own saves; reloads and other tabs are 'external' or no 'saved' at all.
        if (event.type !== 'saved' || event.to <= event.from) return;
        const handle = latest.current;
        if (handle.snapshot.phase !== 'ready' || countOf(handle.snapshot.saved, event.card) === 0) return;
        setAdded((was) => new Map(was).set(event.card, (was.get(event.card) ?? 0) + event.to - event.from));
      }),
    [store],
  );

  useEffect(() => {
    if (done === null) return;
    const id = setTimeout(() => setDone(null), DONE_MS);
    return () => clearTimeout(id);
  }, [done]);

  const names = new Map(cards.map((card) => [card.key, cardNameText(card)]));
  const entries = [...added].map(([key, n]) => ({ key, n, name: names.get(key) ?? key }));
  const clear = () => setAdded(new Map());
  const remove = () => {
    // Read the want counts now: the store clamps at zero, and a count of 0 removes the row.
    for (const { key, n } of entries) {
      wants.store.setCount(key, Math.max(0, countIn(wants.snapshot, key) - n));
    }
    setDone(texts.wantCleanupDone(entries.length));
    clear();
  };
  return { entries, done, remove, keep: clear };
}

/** Non-modal bar (toast style) asking whether the added cards come off the Want list. */
export function WantCleanupBar({ cleanup }: { cleanup: ReturnType<typeof useWantCleanup> }) {
  const { entries, done, remove, keep } = cleanup;
  const label = (entry: (typeof entries)[number]) => (entry.n > 1 ? `${entry.name} (×${entry.n})` : entry.name);
  if (entries.length === 0 && done === null) return null;
  return (
    <div className="toast-slot">
      {entries.length > 0 ? (
        <p role="status" className="toast want-cleanup">
          <span>{texts.wantCleanupQuestion(entries.slice(0, SHOWN_NAMES).map(label).join(', '), Math.max(0, entries.length - SHOWN_NAMES))}</span>
          <span className="want-cleanup-actions">
            <button type="button" className="button-primary" onClick={remove}>
              {texts.wantCleanupRemove}
            </button>
            <button type="button" className="button-secondary" onClick={keep}>
              {texts.wantCleanupKeep}
            </button>
          </span>
        </p>
      ) : (
        done !== null && (
          <p role="status" className="toast">
            <span>{done}</span>
          </p>
        )
      )}
    </div>
  );
}
