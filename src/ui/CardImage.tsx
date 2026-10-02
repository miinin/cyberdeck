import { useState } from 'react';
import type { Card } from '../domain/card';
import { CARD_IMAGE_WIDTH, cardImageHeight } from '../domain/cardImage';
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
export function CardImage({ card, onOpen }: { card: Card; onOpen: (card: Card, opener: HTMLButtonElement) => void }) {
  const image = getCardImage(card.key);
  const [failed, setFailed] = useState(false);
  if (image === null || failed) return <Placeholder />;
  return (
    <button
      type="button"
      className="card-image-button"
      aria-haspopup="dialog"
      onClick={(event) => onOpen(card, event.currentTarget)}
    >
      <img
        className="card-image"
        src={image.small}
        width={CARD_IMAGE_WIDTH.sm}
        height={cardImageHeight('sm')}
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
