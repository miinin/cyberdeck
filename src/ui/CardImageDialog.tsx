import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTilt } from './useTilt';
import type { Card } from '../domain/card';
import { CARD_IMAGE_WIDTH, cardImageHeight } from '../domain/cardImage';
import { getCardImage } from '../data/cardImages';
import { CardName, cardNameText } from './CardName';
import { texts } from './texts';

/**
 * The enlarged card image in a native modal dialog (T-027 UX). Esc, the "×" button and a click on the
 * backdrop close it; every way ends in the dialog's close event, which calls `onClose`.
 *
 * T-188: with a detail panel this is the card dialog (the card on the left, the details on the right). A click on its picture opens
 * the card alone (a tilting card on its own layer inside the dialog); closing that layer returns to the picture button and the
 * card dialog, and Esc closes only the top layer. Without a detail panel the picture opens the full-screen zoom as before.
 */
export function CardImageDialog({
  card,
  onClose,
  details,
  artUrl = null,
  onTagClick,
  subline,
}: {
  card: Card | null;
  onClose: () => void;
  /** Optional detail panel (T-070): collection, want and decks, shown beside the image. */
  details?: ReactNode;
  /** A version's art shown instead of the card's base image. */
  artUrl?: string | null;
  /** T-152: the card's tags are buttons that show every card with the tag; without it they are plain text. */
  onTagClick?: (tag: string) => void;
  /** T-181: one line under the title beside the tags (where the card comes from). */
  subline?: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tilt = useTilt<HTMLImageElement>();
  const aloneTilt = useTilt<HTMLImageElement>();
  const [failedKey, setFailedKey] = useState<string | null>(null);
  // T-091: the whole card on the whole screen (phones show it smaller beside the counts).
  const [zoomed, setZoomed] = useState(false);
  /** The named button of the picture (the picture itself is a mouse shortcut): where focus returns. */
  const zoomOpenRef = useRef<HTMLButtonElement>(null);
  const hasDetails = details !== undefined;
  const openLayer = () => setZoomed(true);
  const unzoom = () => setZoomed(false);
  // Focus returns once the card dialog is live again (it is inert while the card alone is open).
  const wasZoomed = useRef(false);
  useEffect(() => {
    if (wasZoomed.current && !zoomed) zoomOpenRef.current?.focus();
    wasZoomed.current = zoomed;
  }, [zoomed]);
  const openLabel = hasDetails ? texts.cardViewOpen : texts.zoomImage;

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
      className={hasDetails ? 'card-dialog has-details' : 'card-dialog'}
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
        <div className="card-dialog-body" inert={zoomed && hasDetails ? true : undefined}>
          <div className="card-dialog-header">
            <h2 id="card-dialog-title" lang="en">
              <CardName card={card} />
            </h2>
            <button type="button" className="button-secondary dialog-close" aria-label={texts.closeDialog} onClick={close}>
              {texts.closeSymbol}
            </button>
          </div>
          <div className="card-dialog-meta">
          {(card.tags ?? []).length > 0 && (
            <ul className="card-tags" aria-label={texts.cardTagsLabel}>
              {(card.tags ?? []).map((tag) => (
                <li key={tag}>
                  {onTagClick === undefined ? (
                    <span className="card-tag" lang="en">
                      {tag}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="card-tag"
                      lang="en"
                      aria-label={texts.cardTagShow(tag)}
                      title={texts.cardTagShow(tag)}
                      onClick={() => onTagClick(tag)}
                    >
                      {tag}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {subline}
          </div>
          <div className="card-dialog-content">
          {imageSrc !== null && failedKey !== imageSrc ? (
            <img
              {...tilt}
              className="card-dialog-image card-tilt"
              src={imageSrc}
              width={CARD_IMAGE_WIDTH.lg}
              height={cardImageHeight('lg')}
              alt={cardNameText(card)}
              lang="en"
              loading="eager"
              onError={() => setFailedKey(imageSrc)}
              onClick={() => openLayer()}
            />
          ) : (
            <p role="alert">{texts.imageLoadError}</p>
          )}
            {imageSrc !== null && failedKey !== imageSrc && (
              <button type="button" ref={zoomOpenRef} className="button-secondary button-compact card-zoom-open"
                aria-label={openLabel}
                onClick={openLayer}
              >
                {hasDetails ? texts.cardViewOpenShort : texts.zoomImageShort}
              </button>
            )}
            {details !== undefined && <div className="card-dialog-details">{details}</div>}
          </div>
        </div>
      )}
      {card !== null && zoomed && hasDetails && imageSrc !== null && (
        <div
          className="card-viewer"
          onClick={(event) => {
            if (event.target === event.currentTarget) unzoom();
          }}
        >
          <div className="card-viewer-body" role="group" aria-labelledby="card-viewer-title">
            <div className="card-viewer-header">
              <h2 id="card-viewer-title" lang="en">
                <CardName card={card} />
              </h2>
              <button type="button" className="button-secondary dialog-close" aria-label={texts.cardViewClose} onClick={unzoom} autoFocus>
                {texts.closeSymbol}
              </button>
            </div>
            <img {...aloneTilt} className="card-viewer-image card-tilt" src={imageSrc} width={CARD_IMAGE_WIDTH.lg} height={cardImageHeight('lg')} alt={cardNameText(card)} lang="en" />
          </div>
        </div>
      )}
      {card !== null && zoomed && !hasDetails && imageSrc !== null && (
        <button type="button" className="card-zoom" aria-label={texts.zoomClose} onClick={unzoom} autoFocus>
          <img src={imageSrc} alt={cardNameText(card)} lang="en" />
        </button>
      )}
    </dialog>
  );
}
