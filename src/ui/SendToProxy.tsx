import { useEffect, useState } from 'react';
import { addToQueue, queueTotal } from '../domain/proxySheet';
import type { AddResult, QueueRow } from '../domain/proxySheet';
import type { CollectionRepository } from '../storage';
import { proxyTexts } from './proxyTexts';
import { useCollection } from './useCollection';

/** Fired on the window when a queue change has been saved, so the navigation badge can read the new count (T-116). */
const PROXY_SAVED_EVENT = 'cyberdeck:proxy-saved';

/**
 * The print queue (T-102) has the collection's shape and rules, so it uses the same store and hook:
 * `useProxyQueue(repositories.proxy)`. `snapshot.saved` is the queue, `store.setCount(card, count)` changes it.
 * `repository` must be a stable reference.
 */
export function useProxyQueue(repository: CollectionRepository): ReturnType<typeof useCollection> {
  const queue = useCollection(repository);
  useEffect(
    () =>
      queue.store.onEvent((event) => {
        if (event.type === 'idle') window.dispatchEvent(new Event(PROXY_SAVED_EVENT));
      }),
    [queue.store],
  );
  return queue;
}

/** The number of copies in the print queue, kept up to date for the navigation badge; 0 while loading or when storage fails. */
export function useProxyCount(repository: CollectionRepository, refreshKey: unknown): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    const refresh = () => {
      repository.load().then(
        (loaded) => alive && setCount(queueTotal(loaded.value)),
        () => alive && setCount(0),
      );
    };
    refresh();
    window.addEventListener(PROXY_SAVED_EVENT, refresh);
    const unsubscribe = repository.subscribe(refresh);
    return () => {
      alive = false;
      window.removeEventListener(PROXY_SAVED_EVENT, refresh);
      unsubscribe();
    };
  }, [repository, refreshKey]);
  return count;
}

/** The queue as `useProxyQueue` returns it. */
export type ProxyQueueHandle = ReturnType<typeof useProxyQueue>;

/** The queue as it looks on screen: the saved rows with the newest unsaved counts over them. */
export function shownQueue(queue: ProxyQueueHandle): { entries: { card: string; count: number }[] } {
  const shown = new Map(queue.snapshot.saved.entries.map((entry) => [entry.card, entry.count]));
  for (const [card, count] of queue.snapshot.targets) shown.set(card, count);
  return { entries: [...shown].filter(([, count]) => count > 0).map(([card, count]) => ({ card, count })) };
}

/** Returns a function that adds the rows to the queue (counts grow, the limit holds) and tells what happened. */
export function useSendToProxy(queue: ProxyQueueHandle): (rows: readonly QueueRow[]) => AddResult {
  return (rows) => {
    const before = shownQueue(queue);
    const result = addToQueue(before, rows);
    const was = new Map(before.entries.map((entry) => [entry.card, entry.count]));
    for (const { card, count } of result.queue.entries) {
      if (was.get(card) !== count) queue.store.setCount(card, count);
    }
    return result;
  };
}

function resultText({ added, skipped }: AddResult): string {
  if (added === 0) return skipped > 0 ? proxyTexts.sentFull : proxyTexts.sentNothing;
  return skipped > 0 ? proxyTexts.sentPartial(added, skipped) : proxyTexts.sentResult(added);
}

/** A button that sends cards to the print queue, with its own polite result and a link to the Proxy section. */
export function SendToProxyButton({
  rows,
  queue,
  label,
  name,
  className = 'button-secondary',
}: {
  rows: readonly QueueRow[];
  queue: ProxyQueueHandle;
  label: string;
  /** Accessible name, when several of these buttons are on one page. */
  name?: string;
  className?: string;
}) {
  const [result, setResult] = useState<{ text: string; added: number } | null>(null);
  const send = useSendToProxy(queue);
  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={name}
        disabled={queue.snapshot.phase !== 'ready' || rows.length === 0}
        onClick={() => {
          const outcome = send(rows);
          setResult({ text: resultText(outcome), added: outcome.added });
        }}
      >
        {label}
      </button>
      <span aria-live="polite" className="missing-result proxy-send-result">
        {result?.text}
        {result !== null && result.added > 0 && (
          <>
            {' '}
            <a href="#/proxy">{proxyTexts.openProxy}</a>
          </>
        )}
      </span>
    </>
  );
}
