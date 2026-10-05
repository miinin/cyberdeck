import type { CollectionRepository } from '../storage';
import { useCollection } from './useCollection';

/**
 * The want list (D-018) has the collection's shape and rules, so it uses the same store and hook:
 * `useWants(repositories.wants)`. `snapshot.saved` is the want list, `store.setCount(card, count)` changes
 * it (count 0 removes the row). `repository` must be a stable reference.
 */
export const useWants: (repository: CollectionRepository) => ReturnType<typeof useCollection> = useCollection;
