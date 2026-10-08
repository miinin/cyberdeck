import type { Ref } from 'react';
import type { Card } from '../domain/card';
import type { DeckRow } from '../domain/deckRules';
import { SIDEBOARD_SIZE } from '../domain/deck';
import type { HoverPreviewProps } from './CardHoverPreview';
import { CardName } from './CardName';
import { typeColorClass } from './CardColor';
import { CostGem, cardMeta } from './DeckPickTable';
import { DeckCardImage } from './DeckList';
import type { DeckView } from './DeckList';
import { ProblemFlag, SectionFlag } from './DeckProblems';
import type { DeckProblems } from './DeckProblems';
import { deckTexts } from './deckTexts';
import { pickGestures } from './pickGestures';
import { Stepper } from './Stepper';
import { texts } from './texts';

/**
 * The sideboard of the deck (T-058): optional, exactly SIDEBOARD_SIZE cards when used. Not part of the main deck rules.
 * Its rows are the main deck's rows (T-092): art, cost, name, copies, stepper and a small "→ main" button on one line.
 * In the "Pinot" view (T-101) the cards are stacks like the main deck's, with the same controls under each card.
 */
export function Sideboard({
  rows,
  size,
  view = 'list',
  onChange,
  onMoveToMain,
  onOpenImage,
  hoverProps,
  headingRef,
  problems,
}: {
  rows: readonly DeckRow[];
  size: number;
  view?: DeckView;
  onChange: (card: Card, count: number) => void;
  onMoveToMain: (card: Card) => void;
  onOpenImage: (card: Card) => void;
  hoverProps: (card: Card) => HoverPreviewProps;
  /** Focus target after the last row moved to the main deck (T-074). */
  headingRef?: Ref<HTMLHeadingElement>;
  /** Rows and the section count that break a rule (T-101). */
  problems?: DeckProblems;
}) {
  const problemsOf = (card: Card) => problems?.side.get(card.key);

  const controls = (card: Card, count: number) => (
    <Stepper
      name={card.displayName}
      count={count}
      showCount={false}
      addLabel={deckTexts.addToSideboard(card.displayName)}
      removeLabel={deckTexts.removeFromSideboard(card.displayName)}
      countLabel={deckTexts.inSideboard(count)}
      onChange={(next) => onChange(card, next)}
    />
  );

  const moveButton = (card: Card, className: string) => (
    <button
      type="button"
      className={className}
      aria-label={deckTexts.moveToMainNamed(card.displayName)}
      title={deckTexts.moveToMain}
      onClick={() => onMoveToMain(card)}
    >
      {deckTexts.moveToMainShort}
    </button>
  );

  const renderTile = ({ card, count }: DeckRow) => (
    <li
      key={card.key}
      data-deck-row={card.key}
      data-deck-part="side"
      className={`deck-tile has-move ${typeColorClass(card.color)}` + (problemsOf(card) !== undefined ? ' is-problem' : '')}
      {...hoverProps(card)}
    >
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
      {problemsOf(card) !== undefined && (
        <span className="deck-tile-notes">
          <ProblemFlag problems={problemsOf(card) ?? []} />
        </span>
      )}
      <span className="deck-tile-count" aria-hidden="true">
        {deckTexts.copies(count)}
      </span>
      {controls(card, count)}
      {moveButton(card, 'tile-action deck-tile-move')}
    </li>
  );

  const renderStackCard = ({ card, count }: DeckRow) => {
    const { onContextMenu, onKeyDown } = pickGestures(count, (next) => onChange(card, next), false);
    return (
      <li
        key={card.key}
        data-deck-row={card.key}
        data-deck-part="side"
        className={'stack-card' + (problemsOf(card) !== undefined ? ' is-problem' : '')}
        {...hoverProps(card)}
      >
        <button
          type="button"
          className="stack-card-button"
          aria-haspopup="dialog"
          aria-label={deckTexts.stackCard(card.displayName, count)}
          onClick={() => onOpenImage(card)}
          onContextMenu={onContextMenu}
          onKeyDown={onKeyDown}
        >
          <DeckCardImage card={card} className="stack-card-img" />
          <span className="stack-card-name" aria-hidden="true">
            {card.name}
          </span>
          <span className="stack-card-count" aria-hidden="true">
            {deckTexts.copies(count)}
          </span>
          {problemsOf(card) !== undefined && <ProblemFlag problems={problemsOf(card) ?? []} />}
        </button>
        <div className="stack-card-actions">
          {controls(card, count)}
          {moveButton(card, 'tile-action')}
        </div>
      </li>
    );
  };

  return (
    <div className="deck-section">
      <div className="deck-headline">
        <h2 className="deck-section-title" ref={headingRef} tabIndex={-1}>
          {deckTexts.sideboardHeading(size, SIDEBOARD_SIZE)}
        </h2>
        <SectionFlag problem={problems?.sideSection ?? null} />
      </div>
      {rows.length === 0 ? (
        <p className="hint">{deckTexts.sideboardEmpty(SIDEBOARD_SIZE)}</p>
      ) : view !== 'list' ? (
        // At most 7 cards, each with its own buttons: side by side, not overlapping (T-101), or the buttons hide under the next card.
        <div className="deck-stacks deck-stacks--spread">
          <div className="deck-group">
            <ul className={`stack-cards stack-cards--spread${view === 'cards' ? ' stack-cards--cards' : ''}`}>{rows.map(renderStackCard)}</ul>
          </div>
        </div>
      ) : (
        <ul className="deck-tiles">{rows.map(renderTile)}</ul>
      )}
    </div>
  );
}
