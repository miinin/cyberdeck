import type { Card } from '../domain/card';
import type { DeckRow } from '../domain/deckRules';
import { SIDEBOARD_SIZE } from '../domain/deck';
import type { HoverPreviewProps } from './CardHoverPreview';
import { CardName } from './CardName';
import { deckTexts } from './deckTexts';
import { Stepper } from './Stepper';

/** The sideboard of the deck (T-058): optional, exactly SIDEBOARD_SIZE cards when used. Not part of the main deck rules. */
export function Sideboard({
  rows,
  size,
  onChange,
  onMoveToMain,
  hoverProps,
}: {
  rows: readonly DeckRow[];
  size: number;
  onChange: (card: Card, count: number) => void;
  onMoveToMain: (card: Card) => void;
  hoverProps: (card: Card) => HoverPreviewProps;
}) {
  return (
    <div className="deck-section">
      <h2 className="deck-section-title">{deckTexts.sideboardHeading(size, SIDEBOARD_SIZE)}</h2>
      {rows.length === 0 ? (
        <p className="hint">{deckTexts.sideboardEmpty(SIDEBOARD_SIZE)}</p>
      ) : (
        <ul className="deck-tiles">
          {rows.map(({ card, count }) => (
            <li key={card.key} className="deck-tile" {...hoverProps(card)}>
              <span className="deck-tile-name">
                <CardName card={card} muteSubname />
              </span>
              <span className="deck-tile-count" aria-hidden="true">
                {deckTexts.copies(count)}
              </span>
              <Stepper name={card.displayName} count={count} showCount={false} onChange={(next) => onChange(card, next)} />
              <button type="button" className="button-secondary" onClick={() => onMoveToMain(card)}>
                {deckTexts.moveToMain}
                <span className="visually-hidden"> {card.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
