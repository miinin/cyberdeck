import { useEffect, useRef } from 'react';
import type { Card } from '../domain/card';
import { decodeDeckShare } from '../domain/deckShare';
import { parseDeckText } from '../domain/deckText';
import type { Repositories } from '../storage';
import { DeckImport } from './DeckImport';
import { deckTexts } from './deckTexts';
import { useDecks } from './useDecks';

/**
 * A deck opened from a share link (T-056). Read only: the report of the text import is shown, and the
 * deck is saved only when the player presses the button. The data is untrusted and goes through the
 * same checks as a pasted list (SR-17).
 */
export function SharedDeckView({
  data,
  cards,
  repositories,
  onOpen,
  name,
  heading,
  intro,
  backHash = '#/pakat',
  backLabel,
}: {
  data: string;
  cards: readonly Card[];
  repositories: Repositories;
  onOpen: (id: string) => void;
  /** Start name of the saved deck (a public deck's name, T-098). */
  name?: string;
  heading?: string;
  intro?: string;
  /** Where "back" goes and what it says; a public deck goes back to the public list. */
  backHash?: string;
  backLabel?: string;
}) {
  const { decks, phase } = useDecks(repositories.decks);
  const errorRef = useRef<HTMLHeadingElement>(null);
  const text = decodeDeckShare(data);
  const valid = text !== null && parseDeckText(text, cards).ok;
  useEffect(() => {
    if (!valid) errorRef.current?.focus();
  }, [valid]);

  if (text === null || !valid) {
    return (
      <>
        <h1 ref={errorRef} tabIndex={-1}>
          {deckTexts.shareInvalidHeading}
        </h1>
        <p role="alert">{deckTexts.shareInvalid}</p>
        <p>
          <a href={backHash}>{backLabel ?? deckTexts.shareToDecks}</a>
        </p>
      </>
    );
  }
  if (phase === 'loading') return null;
  return (
    <DeckImport
      key={data}
      cards={cards}
      repositories={repositories}
      decks={decks}
      sharedText={text}
      sharedName={name}
      sharedHeading={heading}
      sharedIntro={intro}
      closeLabel={backLabel}
      onOpen={onOpen}
      onClose={() => {
        window.location.hash = backHash;
      }}
    />
  );
}
