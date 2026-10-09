import { useEffect, useRef, useState } from 'react';
import type { Card } from '../domain/card';
import type { PublicDeck } from '../domain/publicDeck';
import type { Repositories } from '../storage';
import { deckTexts } from './deckTexts';
import { usePublicDecks } from './PublicDecksContext';
import { SharedDeckView } from './SharedDeckView';
import { useNoIndex } from './useNoIndex';

type Load = { phase: 'loading' } | { phase: 'ready'; deck: PublicDeck } | { phase: 'missing' } | { phase: 'error' };

/**
 * One public deck (T-098, D-025): the same read-only view as a shared link, with the publisher's nickname or
 * "Nimetön". The document is validated by the store and the deck text by the share parser (SR-37). Saving
 * always creates a new private deck (SR-39: DeckImport creates decks without publishing settings). Not indexed
 * by search engines (SR-41).
 */
export function PublicDeckView({
  pubId,
  cards,
  repositories,
  onOpen,
}: {
  pubId: string;
  cards: readonly Card[];
  repositories: Repositories;
  onOpen: (id: string) => void;
}) {
  useNoIndex();
  const { store } = usePublicDecks();
  // Without a store (no account layer) there is nothing to read: the error state is the starting state.
  const [load, setLoad] = useState<Load>(store === null ? { phase: 'error' } : { phase: 'loading' });
  /** Counts the tries; "Yritä uudelleen" starts the next one. */
  const [attempt, setAttempt] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (store === null) return;
    let active = true;
    store.get(pubId).then(
      (deck) => active && setLoad(deck === null ? { phase: 'missing' } : { phase: 'ready', deck }),
      () => active && setLoad({ phase: 'error' }),
    );
    return () => {
      active = false;
    };
  }, [store, pubId, attempt]);

  useEffect(() => {
    if (load.phase === 'missing' || load.phase === 'error') headingRef.current?.focus();
  }, [load.phase]);

  if (load.phase === 'loading') {
    return (
      <>
        <h1>{deckTexts.publicViewHeading}</h1>
        <p className="status-line" role="status">
          {deckTexts.publicViewLoading}
        </p>
      </>
    );
  }
  if (load.phase === 'missing' || load.phase === 'error') {
    return (
      <>
        <h1 ref={headingRef} tabIndex={-1}>
          {load.phase === 'missing' ? deckTexts.publicViewMissingHeading : deckTexts.publicViewHeading}
        </h1>
        <div className="notice notice-danger" role="alert">
          <p>{load.phase === 'missing' ? deckTexts.publicViewMissing : deckTexts.publicViewError}</p>
        </div>
        {load.phase === 'error' && (
          <p>
            <button type="button" className="button-secondary" onClick={() => {
                setLoad({ phase: 'loading' });
                setAttempt((n) => n + 1);
              }}>
              {deckTexts.publicRetry}
            </button>
          </p>
        )}
        <p>
          <a className="text-link" href="#/pakat/julkiset">
            {deckTexts.publicBack}
          </a>
        </p>
      </>
    );
  }
  const { deck } = load;
  // Plain text only: the nickname and the name are rendered as React text, never as markup or a link (SR-37).
  const by = deckTexts.publicViewBy(deck.nickname ?? deckTexts.publicAnonymous);
  return (
    <SharedDeckView
      data={deck.deck}
      cards={cards}
      repositories={repositories}
      onOpen={onOpen}
      name={deck.name}
      heading={deck.name}
      intro={`${by}. ${deckTexts.publicViewIntro}`}
      backHash="#/pakat/julkiset"
      backLabel={deckTexts.publicBack}
    />
  );
}
