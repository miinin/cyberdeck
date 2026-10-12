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
import { ProblemFlag, SectionFlag } from './DeckProblems';
import type { DeckProblems } from './DeckProblems';
import { pickGestures } from './pickGestures';
import { Stepper } from './Stepper';
import { colorNames, texts } from './texts';
import { SegmentedChoice } from './SegmentedChoice';

export type DeckView = 'list' | 'stacks' | 'cards';

/** The card image, or the dashed placeholder when there is none or it fails to load. */
const DECK_VIEW_OPTIONS = [
  ['list', deckTexts.deckViewList],
  ['stacks', deckTexts.deckViewStacks],
  ['cards', deckTexts.deckViewCards],
] as const;

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
  problems,
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
  /** Rows and section counts that break a rule (T-101). */
  problems?: DeckProblems;
}) {
  const problemsOf = (card: Card) => problems?.main.get(card.key);
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
        data-deck-row={card.key}
        data-deck-part="main"
        className={`deck-tile ${typeColorClass(card.color)}` + (missing > 0 ? ' is-missing' : '') + (problemsOf(card) !== undefined ? ' is-problem' : '')}
        onContextMenu={onContextMenu}
        onKeyDown={onKeyDown}
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
          // Only the name opens the bigger image (T-139): using the stepper or the notes of the row does not.
          {...hoverProps(card)}
        >
          <CardName card={card} muteSubname />
        </button>
        {(missing > 0 || problemsOf(card) !== undefined || ownedOf(card) !== null) && (
          <span className="deck-tile-notes">
            {ownership(row, 'deck-tile-missing')}
            {problemsOf(card) !== undefined && <ProblemFlag problems={problemsOf(card) ?? []} />}
          </span>
        )}
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

  /** `controls`: the stepper under the card, for the few cards shown side by side (Legends). */
  const renderStackCard = (row: DeckRow, controls = false) => {
    // In the cards view every card shows whole with its stepper under it (T-115).
    controls = controls || view === 'cards';
    const { card, count } = row;
    const { onContextMenu, onKeyDown } = pickGestures(count, (next) => onChange(card, next), false);
    return (
      <li
        key={card.key}
        data-deck-row={card.key}
        data-deck-part="main"
        className={'stack-card' + (missingOf(row) > 0 ? ' is-missing' : '') + (problemsOf(card) !== undefined ? ' is-problem' : '')}
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
        {controls && (
          <div className="stack-card-actions">
            <Stepper name={card.displayName} count={count} showCount={false} onChange={(next) => onChange(card, next)} />
          </div>
        )}
        {onMoveToSideboard !== undefined && card.type !== 'Legend' && (
          // The same action as the list row's button: the deck column always moves a copy (T-118, UX-118-24).
          <button
            type="button"
            className="tile-action"
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

  return (
    <>
      <div className="deck-section">
        <div className="deck-headline">
          <h2 className="deck-section-title">
            {deckTexts.legendsHeading} ({legendsCount}/{LEGEND_COUNT})
          </h2>
          <SectionFlag problem={problems?.legends ?? null} />
        </div>
        {view !== 'list' ? (
          // At most three cards, each with its own buttons: side by side like the sideboard.
          <div className="deck-stacks deck-stacks--spread">
            <div className="deck-group">
              <ul className={`stack-cards stack-cards--spread${view === 'cards' ? ' stack-cards--cards' : ''}`}>
                {grouped.legends.map((row) => renderStackCard(row, true))}
                {Array.from({ length: emptySlots }, (_, i) => (
                  <li key={`empty-${i}`} className="stack-card is-empty">
                    <span className="stack-card-empty">{deckTexts.legendSlotEmpty}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <ul className="deck-tiles">
            {grouped.legends.map(renderTile)}
            {Array.from({ length: emptySlots }, (_, i) => (
              <li key={`empty-${i}`} className="deck-tile is-empty">
                <span className="deck-tile-empty">{deckTexts.legendSlotEmpty}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="deck-section">
        <div className="deck-section-head">
          <div className="deck-headline">
            <h2 className="deck-section-title">
              {deckTexts.mainHeading} ({mainCount})
            </h2>
            <SectionFlag problem={problems?.mainSection ?? null} />
          </div>
          <SegmentedChoice
            legend={deckTexts.deckViewLegend}
            name="deck-view"
            value={view}
            options={DECK_VIEW_OPTIONS}
            onChange={onViewChange}
          />
        </div>
        {grouped.groups.length === 0 && grouped.unknown.length === 0 && <p className="hint">{deckTexts.deckEmpty}</p>}
        {view === 'cards' ? (
          <div className="deck-groups">
            {grouped.groups.map((group) => (
              <div key={group.type} className="deck-group">
                <h3 className="deck-group-title" lang="en">
                  {group.type} ({group.rows.reduce((sum, row) => sum + row.count, 0)})
                </h3>
                <ul className="stack-cards stack-cards--spread stack-cards--cards">{group.rows.map((row) => renderStackCard(row))}</ul>
              </div>
            ))}
          </div>
        ) : view === 'stacks' ? (
          // T-103: stacks by colour and type, the colour on the heading's edge.
          <div className="deck-stacks">
            {grouped.colorGroups.map((group) => (
              <div key={`${group.color ?? ''}|${group.type}`} className={`deck-group deck-group--color ${typeColorClass(group.color)}`}>
                <h3 className="deck-group-title deck-group-title--color" lang="en">
                  {group.color !== null ? `${colorNames.get(group.color) ?? group.color} · ` : ''}
                  {group.type} ({group.rows.reduce((sum, row) => sum + row.count, 0)})
                </h3>
                <ul className="stack-cards">{group.rows.map((row) => renderStackCard(row))}</ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="deck-groups">
            {grouped.groups.map((group) => (
              <div key={group.type} className="deck-group">
                <h3 className="deck-group-title" lang="en">
                  {group.type} ({group.rows.reduce((sum, row) => sum + row.count, 0)})
                </h3>
                <ul className="deck-tiles">{group.rows.map(renderTile)}</ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
