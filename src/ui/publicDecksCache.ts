import type { PublicDeckCursor, PublicDeckStore } from '../account';
import type { PublicDeck } from '../domain/publicDeck';

/** The pages of the public list already read in this session (T-098, SR-33). */
export interface LoadedPublicDecks {
  items: PublicDeck[];
  next: PublicDeckCursor | null;
  dropped: number;
}

const cache = new WeakMap<PublicDeckStore, LoadedPublicDecks>();

export const cachedPublicDecks = (store: PublicDeckStore): LoadedPublicDecks | undefined => cache.get(store);

export const rememberPublicDecks = (store: PublicDeckStore, loaded: LoadedPublicDecks): void => {
  cache.set(store, loaded);
};

/** Called after this account published, updated or removed a public deck, so the list is read again next time. */
export function forgetPublicDecks(store: PublicDeckStore | null): void {
  if (store !== null) cache.delete(store);
}
