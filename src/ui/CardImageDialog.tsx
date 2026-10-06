import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Card } from '../domain/card';
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
  artUrl = null,
}: {
  card: Card | null;
  onClose: () => void;
  /** Optional detail panel (T-070): collection, want and decks, shown beside the image. */
  details?: ReactNode;
  /** A version's art shown instead of the card's base image. */
  artUrl?: string | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  // T-091: the whole card on the whole screen (phones show it smaller beside the counts).
  const [zoomed, setZoomed] = useState(false);
  const zoomOpenRef = useRef<HTMLButtonElement>(null);
  const unzoom = () => {
    setZoomed(false);
    zoomOpenRef.current?.focus();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (card !== null && !dialog.open) dialog.showModal();
    else if (card === null && dialog.open) dialog.close();
    setZoomed(false);
  }, [card]);

  const close = () => dialogRef.current?.close();
  const base = card === null ? null : getCardImage(card.key);
  const imageSrc = artUrl ?? base?.large ?? null;

  return (
    <dialog
      ref={dialogRef}
      className={details === undefined ? 'card-dialog' : 'card-dialog has-details'}
      aria-labelledby="card-dialog-title"
      onClose={onClose}
      // Esc closes the full-screen image first, then the dialog.
      onCancel={(event) => {
        if (zoomed) {
          event.preventDefault();
          unzoom();
        }
      }}
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
          {imageSrc !== null && failedKey !== imageSrc ? (
            <img
              className="card-dialog-image"
              src={imageSrc}
              width={CARD_IMAGE_WIDTH.lg}
              height={cardImageHeight('lg')}
              alt={cardNameText(card)}
              lang="en"
              loading="eager"
              onError={() => setFailedKey(imageSrc)}
              onClick={() => setZoomed(true)}
            />
          ) : (
            <p role="alert">{texts.imageLoadError}</p>
          )}
            {imageSrc !== null && failedKey !== imageSrc && (
              <button type="button" ref={zoomOpenRef} className="button-secondary card-zoom-open" onClick={() => setZoomed(true)}>
                {texts.zoomImage}
              </button>
            )}
            {details !== undefined && <div className="card-dialog-details">{details}</div>}
          </div>
        </div>
      )}
      {card !== null && zoomed && imageSrc !== null && (
        <button type="button" className="card-zoom" aria-label={texts.zoomClose} onClick={unzoom} autoFocus>
          <img src={imageSrc} alt={cardNameText(card)} lang="en" />
        </button>
      )}
    </dialog>
  );
}
