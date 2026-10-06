import type { Ref } from 'react';
import type { Card } from '../domain/card';
import type { DeckRow } from '../domain/deckRules';
import { SIDEBOARD_SIZE } from '../domain/deck';
import type { HoverPreviewProps } from './CardHoverPreview';
import { CardName } from './CardName';
import { typeColorClass } from './CardColor';
import { CostGem, cardMeta } from './DeckPickTable';
import { DeckCardImage } from './DeckList';
import { deckTexts } from './deckTexts';
import { Stepper } from './Stepper';
import { texts } from './texts';

/**
 * The sideboard of the deck (T-058): optional, exactly SIDEBOARD_SIZE cards when used. Not part of the main deck rules.
 * Its rows are the main deck's rows (T-092): art, cost, name, copies, stepper and a small "→ main" button on one line.
 */
export function Sideboard({
  rows,
  size,
  onChange,
  onMoveToMain,
  onOpenImage,
  hoverProps,
  headingRef,
}: {
  rows: readonly DeckRow[];
  size: number;
  onChange: (card: Card, count: number) => void;
  onMoveToMain: (card: Card) => void;
  onOpenImage: (card: Card) => void;
  hoverProps: (card: Card) => HoverPreviewProps;
  /** Focus target after the last row moved to the main deck (T-074). */
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="deck-section">
      <h2 className="deck-section-title" ref={headingRef} tabIndex={-1}>{deckTexts.sideboardHeading(size, SIDEBOARD_SIZE)}</h2>
      {rows.length === 0 ? (
        <p className="hint">{deckTexts.sideboardEmpty(SIDEBOARD_SIZE)}</p>
      ) : (
        <ul className="deck-tiles">
          {rows.map(({ card, count }) => (
            <li key={card.key} className={`deck-tile has-move ${typeColorClass(card.color)}`} {...hoverProps(card)}>
              <span className="deck-tile-art" aria-hidden="true">
                <DeckCardImage card={card} className="deck-tile-img" />
              </span>
              <span className="deck-tile-gem">
                <CostGem card={card} />
              </span>
              <button
                type="button"
                className="deck-tile-name"
                aria-haspopup="dialog"
                aria-label={`${texts.enlargeImage}${card.displayName}`}
                title={cardMeta(card)}
                onClick={() => onOpenImage(card)}
              >
                <CardName card={card} muteSubname />
              </button>
              <span className="deck-tile-count" aria-hidden="true">
                {deckTexts.copies(count)}
              </span>
              <Stepper
                name={card.displayName}
                count={count}
                showCount={false}
                addLabel={deckTexts.addToSideboard(card.displayName)}
                removeLabel={deckTexts.removeFromSideboard(card.displayName)}
                countLabel={deckTexts.inSideboard(count)}
                onChange={(next) => onChange(card, next)}
              />
              <button
                type="button"
                className="tile-action deck-tile-move"
                aria-label={deckTexts.moveToMainNamed(card.displayName)}
                title={deckTexts.moveToMain}
                onClick={() => onMoveToMain(card)}
              >
                {deckTexts.moveToMainShort}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
