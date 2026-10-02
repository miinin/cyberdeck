import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Card } from '../domain/card';
import { CARD_IMAGE_WIDTH, cardImageHeight } from '../domain/cardImage';
import { getCardImage } from '../data/cardImages';
import { CardName } from './CardName';
import { deckTexts } from './deckTexts';

/**
 * One card of the image grid in the deck editor (T-045). The image is a button that adds the card;
 * `children` is the −/count/+ control under it. The image is decorative, the button's name says what it does.
 */
export function DeckPickImage({
  card,
  dimmed,
  hint,
  onAdd,
  children,
}: {
  card: Card;
  dimmed: boolean;
  /** Visible reason shown when adding would break a rule. */
  hint: ReactNode;
  onAdd: () => void;
  children: ReactNode;
}) {
  const image = getCardImage(card.key);
  const [failed, setFailed] = useState(false);
  const showImage = image !== null && !failed;
  return (
    <li className={'pick-image' + (dimmed ? ' is-dimmed' : '')}>
      <button type="button" className="pick-image-button" aria-label={deckTexts.addCard(card.displayName)} onClick={onAdd}>
        {showImage ? (
          <img
            className="card-image"
            src={image.medium}
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
      </button>
      <span className="pick-image-name" aria-hidden="true">
        <CardName card={card} />
      </span>
      {hint}
      {children}
    </li>
  );
}
