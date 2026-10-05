import { useState } from 'react';
import type { Card } from '../domain/card';
import { CARD_IMAGE_SIZES, CARD_IMAGE_WIDTH, cardImageHeight, cardImageSrcSet } from '../domain/cardImage';
import { getCardImage } from '../data/cardImages';
import { CardName } from './CardName';
import { texts } from './texts';

/** Missing image or a failed load: a dashed frame with no text and no request (T-027 UX). */
function Placeholder() {
  return <span className="card-image card-image--missing" aria-hidden="true" />;
}

/**
 * List thumbnail (T-027 UX). The image itself is decorative (alt=""): the button's name says what it
 * does, "Suurenna kuva: <name>". Lazy loading keeps the 151-row list fast.
 */
export function CardImage({
  card,
  onOpen,
  artUrl = null,
}: {
  card: Card;
  onOpen: (card: Card, opener: HTMLButtonElement, artUrl?: string | null) => void;
  /** A special art to show in place of the card's own picture (D-021). */
  artUrl?: string | null;
}) {
  const image = getCardImage(card.key);
  const [failed, setFailed] = useState(false);
  if (artUrl === null && (image === null || failed)) return <Placeholder />;
  return (
    <button
      type="button"
      className="card-image-button"
      aria-haspopup="dialog"
      onClick={(event) => onOpen(card, event.currentTarget, artUrl)}
    >
      <img
        className="card-image"
        src={artUrl ?? image?.medium}
        srcSet={artUrl === null && image !== null ? cardImageSrcSet(image) : undefined}
        sizes={artUrl === null ? CARD_IMAGE_SIZES : undefined}
        width={CARD_IMAGE_WIDTH.md}
        height={cardImageHeight('md')}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
      <span className="visually-hidden">
        {texts.enlargeImage}
        <CardName card={card} />
      </span>
    </button>
  );
}
