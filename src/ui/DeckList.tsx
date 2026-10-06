import { useState } from 'react';
import type { Card } from '../domain/card';
import { CARD_IMAGE_WIDTH, cardImageHeight } from '../domain/cardImage';
import { LEGEND_COUNT } from '../domain/deckRules';
import type { DeckGroups, DeckRow } from '../domain/deckRules';
import { getCardImage } from '../data/cardImages';
import type { HoverPreviewProps } from './CardHoverPreview';
import { CardName } from './CardName';
import { typeColorClass } from './CardColor';
import { CostGem, cardMeta } from './DeckPickTable';
import { deckTexts } from './deckTexts';
import { pickGestures } from './pickGestures';
import { Stepper } from './Stepper';
import { texts } from './texts';

export type DeckView = 'list' | 'stacks';

/** The card image, or the dashed placeholder when there is none or it fails to load. */
export function DeckCardImage({ card, className }: { card: Card; className: string }) {
  const image = getCardImage(card.key);
  const [failed, setFailed] = useState(false);
  if (image === null || failed) return <span className={`${className} card-image--missing`} aria-hidden="true" />;
  return (
    <img
      className={className}
      src={image.medium}
      srcSet={`${image.medium} 1x, ${image.large} 2x`}
      width={CARD_IMAGE_WIDTH.md}
      height={cardImageHeight('md')}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * The cards of the deck in the editor's deck column (T-050c): Legends as three image slots, then the main
 * deck by type as tiles ("Lista") or overlapping card stacks ("Pinot").
 */
export function DeckList({
  grouped,
  view,
  onViewChange,
  mainCount,
  legendsCount,
  ownedOf,
  onChange,
  onOpenImage,
  hoverProps,
  onMoveToSideboard,
  onAddToSideboard,
}: {
  grouped: DeckGroups;
  view: DeckView;
  onViewChange: (view: DeckView) => void;
  mainCount: number;
  legendsCount: number;
  /** Copies in the collection, or null when the collection cannot be compared. */
  ownedOf: (card: Card) => number | null;
  onChange: (card: Card, count: number) => void;
  onOpenImage: (card: Card) => void;
  hoverProps: (card: Card) => HoverPreviewProps;
  /** Moves one copy to the sideboard (T-058). */
  onMoveToSideboard?: (card: Card) => void;
  /** Stacks view: add a copy to the sideboard straight from the stack (T-074). */
  onAddToSideboard?: (card: Card) => void;
}) {
  const missingOf = (row: DeckRow) => {
    const have = ownedOf(row.card);
    return have === null ? 0 : Math.max(0, row.count - have);
  };

  /** "omistat 1/3" for screen readers and the visible "puuttuu 2". */
  const ownership = (row: DeckRow, className: string) => {
    const have = ownedOf(row.card);
    const missing = missingOf(row);
    return (
      <>
        {have !== null && <span className="visually-hidden">{deckTexts.owned(have, row.count)}</span>}
        {missing > 0 && <span className={className}>{deckTexts.missingCount(missing)}</span>}
      </>
    );
  };

  const emptySlots = Math.max(0, LEGEND_COUNT - legendsCount);

  const renderTile = (row: DeckRow) => {
    const { card, count } = row;
    const missing = missingOf(row);
    const { onContextMenu, onKeyDown } = pickGestures(count, (next) => onChange(card, next), false);
    return (
      <li
        key={card.key}
        className={`deck-tile ${typeColorClass(card.color)}` + (missing > 0 ? ' is-missing' : '') + (onMoveToSideboard !== undefined && card.type !== 'Legend' ? ' has-move' : '')}
        onContextMenu={onContextMenu}
        onKeyDown={onKeyDown}
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
        {ownership(row, 'deck-tile-missing')}
        <span className="deck-tile-count" aria-hidden="true">
          {deckTexts.copies(count)}
        </span>
        <Stepper name={card.displayName} count={count} showCount={false} onChange={(next) => onChange(card, next)} />
        {onMoveToSideboard !== undefined && card.type !== 'Legend' && (
          <button
            type="button"
            className="tile-action deck-tile-move"
            aria-label={deckTexts.moveToSideboard(card.displayName)}
            title={deckTexts.moveToSideboardTitle}
            onClick={() => onMoveToSideboard(card)}
          >
            {deckTexts.moveToSideboardShort}
          </button>
        )}
      </li>
    );
  };

  const renderStackCard = (row: DeckRow) => {
    const { card, count } = row;
    const { onContextMenu, onKeyDown } = pickGestures(count, (next) => onChange(card, next), false);
    return (
      <li key={card.key} className={'stack-card' + (missingOf(row) > 0 ? ' is-missing' : '')} {...hoverProps(card)}>
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
        </button>
        {onAddToSideboard !== undefined && card.type !== 'Legend' && (
          <button
            type="button"
            className="tile-action"
            aria-label={deckTexts.addToSideboard(card.displayName)}
            title={deckTexts.addToSideboardTitle}
            onClick={() => onAddToSideboard(card)}
          >
            {deckTexts.addToSideboardShort}
          </button>
        )}
      </li>
    );
  };

  return (
    <>
      <div className="deck-section">
        <h2 className="deck-section-title">
          {deckTexts.legendsHeading} ({legendsCount}/{LEGEND_COUNT})
        </h2>
        <ul className="legend-slots">
          {grouped.legends.map((row) => (
            <li
              key={row.card.key}
              className={'legend-slot' + (missingOf(row) > 0 ? ' is-missing' : '')}
              {...hoverProps(row.card)}
            >
              <button
                type="button"
                className="legend-slot-image"
                aria-haspopup="dialog"
                aria-label={`${texts.enlargeImage}${row.card.displayName}`}
                onClick={() => onOpenImage(row.card)}
              >
                <DeckCardImage card={row.card} className="legend-slot-img" />
                {row.count > 1 && (
                  <span className="stack-card-count" aria-hidden="true">
                    {deckTexts.copies(row.count)}
                  </span>
                )}
              </button>
              <div className="legend-slot-foot">
                <span className="legend-slot-name" title={row.card.displayName}>
                  <span lang="en">{row.card.name}</span>
                </span>
                <button
                  type="button"
                  className="legend-slot-remove"
                  aria-label={deckTexts.removeCard(row.card.displayName)}
                  onClick={() => onChange(row.card, row.count - 1)}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              {ownership(row, 'legend-slot-missing')}
            </li>
          ))}
          {Array.from({ length: emptySlots }, (_, i) => (
            <li key={`empty-${i}`} className="legend-slot is-empty">
              <span className="legend-slot-empty">{deckTexts.legendSlotEmpty}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="deck-section">
        <div className="deck-section-head">
          <h2 className="deck-section-title">
            {deckTexts.mainHeading} ({mainCount})
          </h2>
          <fieldset className="view-select deck-view">
            <legend className="visually-hidden">{deckTexts.deckViewLegend}</legend>
            <div className="options">
              {(
                [
                  ['list', deckTexts.deckViewList],
                  ['stacks', deckTexts.deckViewStacks],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="option">
                  <input
                    type="radio"
                    name="deck-view"
                    value={value}
                    checked={view === value}
                    onChange={() => onViewChange(value)}
                  />{' '}
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        {grouped.groups.length === 0 && grouped.unknown.length === 0 && <p className="hint">{deckTexts.deckEmpty}</p>}
        <div className={view === 'stacks' ? 'deck-stacks' : 'deck-groups'}>
          {grouped.groups.map((group) => (
            <div key={group.type} className="deck-group">
              <h3 className="deck-group-title" lang="en">
                {group.type} ({group.rows.reduce((sum, row) => sum + row.count, 0)})
              </h3>
              <ul className={view === 'stacks' ? 'stack-cards' : 'deck-tiles'}>
                {group.rows.map(view === 'stacks' ? renderStackCard : renderTile)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
