/*
 * Removes the public copy of a deck that stopped being public elsewhere (T-098, SEC-098b-2, R-22): when sync
 * brings a deletion or a switch to private from another device, `remove` is called for it. The call is
 * idempotent, and the rules allow deleting a missing document.
 */
import type { DeckId } from '../domain/deck';
import type { DeckRepository } from '../storage';
import type { PublicDeckStore } from './types';

export function watchPublicDecks(decks: DeckRepository, store: PublicDeckStore): () => void {
  let known: Set<DeckId> | null = null;
  let active = true;
  const check = () => {
    void decks.list().then(
      ({ value }) => {
        if (!active) return;
        const now = new Set(value.filter((deck) => deck.publish?.public === true).map((deck) => deck.id));
        const gone = known === null ? [] : [...known].filter((id) => !now.has(id));
        known = now;
        for (const id of gone) void store.remove(id).catch(() => undefined);
      },
      () => undefined,
    );
  };
  check();
  const unsubscribe = decks.subscribe(check);
  return () => {
    active = false;
    unsubscribe();
  };
}
