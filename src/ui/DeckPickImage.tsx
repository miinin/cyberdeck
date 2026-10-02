import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Card } from '../domain/card';
import { CARD_IMAGE_WIDTH, cardImageHeight } from '../domain/cardImage';
import { getCardImage } from '../data/cardImages';
import type { HoverPreviewProps } from './CardHoverPreview';
import { CardName } from './CardName';
import { deckTexts } from './deckTexts';
import { pickGestures } from './pickGestures';

/**
 * One card of the image grid in the deck editor (T-045, T-050b). The image is a button that adds the card
 * (Shift+click removes); `children` is the −/count/+ control next to the name. Right click and the "+"
 * and "-" keys work on the whole card. The image is decorative, the button's name says what it does.
 */
export function DeckPickImage({
  card,
  count,
  onChange,
  dimmed,
  title,
  hint,
  badge,
  hoverProps,
  children,
}: {
  card: Card;
  count: number;
  onChange: (count: number) => void;
  dimmed: boolean;
  /** Visible reason shown when adding would break a rule. */
  hint: ReactNode;
  /** Short visible mark, e.g. "3 pakassa". */
  badge?: string | null;
  /** Full text of the reason, for the hover title. */
  title?: string;
  hoverProps?: HoverPreviewProps;
  children: ReactNode;
}) {
  const image = getCardImage(card.key);
  const [failed, setFailed] = useState(false);
  const showImage = image !== null && !failed;
  const { onContextMenu, onKeyDown } = pickGestures(count, onChange, false);
  return (
    <li
      className={'pick-image' + (dimmed ? ' is-dimmed' : '') + (count > 0 ? ' is-in-deck' : '')}
      title={title}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
      {...hoverProps}
    >
      <button
        type="button"
        className="pick-image-button"
        aria-label={deckTexts.addCard(card.displayName)}
        aria-keyshortcuts="+"
        onClick={(event) => {
          if (!event.shiftKey) onChange(count + 1);
          else if (count > 0) onChange(count - 1);
        }}
      >
        {showImage ? (
          <img
            className="card-image"
            src={image.medium}
            srcSet={`${image.medium} 1x, ${image.large} 2x`}
            width={CARD_IMAGE_WIDTH.md}
            height={cardImageHeight('md')}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="card-image card-image--missing" aria-hidden="true" />
        )}
        {badge ? (
          <span className="pick-badge" aria-hidden="true">
            {badge}
          </span>
        ) : null}
      </button>
      <div className="pick-image-foot">
        <span className="pick-image-name" aria-hidden="true" title={card.displayName}>
          <CardName card={card} />
        </span>
        {children}
      </div>
      {hint}
    </li>
  );
}
