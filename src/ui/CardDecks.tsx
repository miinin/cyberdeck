import { deckTexts } from './deckTexts';

/** "Pakoissa: 2" under a card; the deck names are in the tooltip and spoken to screen readers. Nothing for 0 (T-013). */
export function CardDecks({ names }: { names: readonly string[] }) {
  if (names.length === 0) return null;
  return (
    <p className="card-decks" title={deckTexts.inDecksNames(names)}>
      <span aria-hidden="true">{deckTexts.inDecks(names.length)}</span>
      <span className="visually-hidden">{deckTexts.inDecksNames(names)}</span>
    </p>
  );
}
