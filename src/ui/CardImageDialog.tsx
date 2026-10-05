import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Card } from '../domain/card';
import type { CardKey } from '../domain/cardKey';
import { CARD_IMAGE_WIDTH, cardImageHeight } from '../domain/cardImage';
import { getCardImage } from '../data/cardImages';
import { CardName, cardNameText } from './CardName';
import { texts } from './texts';

/**
 * The enlarged card image in a native modal dialog (T-027 UX). Esc, the "×" button and a click on the
 * backdrop close it; every way ends in the dialog's close event, which calls `onClose`.
 */
export function CardImageDialog({
  card,
  onClose,
  details,
}: {
  card: Card | null;
  onClose: () => void;
  /** Optional detail panel (T-070): collection, want and decks, shown beside the image. */
  details?: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [failedKey, setFailedKey] = useState<CardKey | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (card !== null && !dialog.open) dialog.showModal();
    else if (card === null && dialog.open) dialog.close();
  }, [card]);

  const close = () => dialogRef.current?.close();
  const image = card === null ? null : getCardImage(card.key);

  return (
    <dialog
      ref={dialogRef}
      className={details === undefined ? 'card-dialog' : 'card-dialog has-details'}
      aria-labelledby="card-dialog-title"
      onClose={onClose}
      // The dialog has no padding, so a click on the dialog element itself is a click on the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      {card !== null && (
        <div className="card-dialog-body">
          <div className="card-dialog-header">
            <h2 id="card-dialog-title" lang="en">
              <CardName card={card} />
            </h2>
            <button type="button" className="button-secondary dialog-close" aria-label={texts.closeDialog} onClick={close}>
              {texts.closeSymbol}
            </button>
          </div>
          <div className="card-dialog-content">
          {image !== null && failedKey !== card.key ? (
            <img
              className="card-dialog-image"
              src={image.large}
              width={CARD_IMAGE_WIDTH.lg}
              height={cardImageHeight('lg')}
              alt={cardNameText(card)}
              lang="en"
              loading="eager"
              onError={() => setFailedKey(card.key)}
            />
          ) : (
            <p role="alert">{texts.imageLoadError}</p>
          )}
            {details !== undefined && <div className="card-dialog-details">{details}</div>}
          </div>
        </div>
      )}
    </dialog>
  );
}
