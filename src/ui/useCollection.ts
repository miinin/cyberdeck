import { useEffect, useState, useSyncExternalStore } from 'react';
import type { CollectionRepository } from '../storage';
import { createCollectionStore } from './collectionStore';
import type { CollectionSnapshot, CollectionStore } from './collectionStore';

/**
 * Connects the collection store to React. `repository` must be a stable reference (created once
 * in App). Loading starts on mount; unmount stops listening to other tabs.
 */
export function useCollection(repository: CollectionRepository): {
  snapshot: CollectionSnapshot;
  store: CollectionStore;
} {
  const [store] = useState(() => createCollectionStore(repository));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);

  useEffect(() => {
    store.start();
    return () => store.dispose();
  }, [store]);

  return { snapshot, store };
}
