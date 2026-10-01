import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { CollectionRepository } from '../storage';
import { createCollectionStore } from './collectionStore';
import type { CollectionEvent, CollectionSnapshot, CollectionStore } from './collectionStore';

/**
 * Connects the collection store to React. `repository` must be a stable reference (created once
 * in App); `onEvent` may change on every render. Loading starts on mount, unmount stops listening.
 */
export function useCollection(
  repository: CollectionRepository,
  onEvent: (event: CollectionEvent) => void,
): { snapshot: CollectionSnapshot; store: CollectionStore } {
  const [store] = useState(() => createCollectionStore(repository));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    const stopEvents = store.onEvent((event) => onEventRef.current(event));
    store.start();
    return () => {
      stopEvents();
      store.dispose();
    };
  }, [store]);

  return { snapshot, store };
}
