import { deckTexts } from './deckTexts';

/**
 * "Pakoissa: 2" under a card; the deck names are in the tooltip and spoken to screen readers. Nothing for 0 (T-013).
 * `compact` (the card grid, T-181): a deck icon and the number in the data strip, spoken as "2 pakassa: names"; 'number': the number only (the list column has the title).
 */
export function CardDecks({ names, compact = false }: { names: readonly string[]; compact?: boolean | 'number' }) {
  if (names.length === 0) return null;
  if (compact) {
    return (
      <p className="card-decks card-decks--compact" title={deckTexts.inDecksNames(names)}>
        <span aria-hidden="true">{compact === 'number' ? names.length : `◧ ${names.length}`}</span>
        <span className="visually-hidden">{deckTexts.inDecksCompact(names)}</span>
      </p>
    );
  }
  return (
    <p className="card-decks" title={deckTexts.inDecksNames(names)}>
      <span aria-hidden="true">{deckTexts.inDecks(names.length)}</span>
      <span className="visually-hidden">{deckTexts.inDecksNames(names)}</span>
    </p>
  );
}
