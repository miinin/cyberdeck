import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { CARD_IMAGE_WIDTH, cardImageHeight } from '../domain/cardImage';
import { Chevron } from './Chevron';
import { CardName, cardNameText } from './CardName';
import type { GalleryItem } from './galleryItems';
import { texts } from './texts';
import { useTilt } from './useTilt';

/** A swipe shorter than this many pixels is a tap, not a step. */
const SWIPE_MIN = 48;

/**
 * Full-screen viewer of the gallery (T-123, extends the full-screen image of T-091): one card at a time with the
 * previous and next card (arrow keys, buttons, swipe), a link to the card's details and a close button. A native
 * modal dialog, so Esc, the focus trap and the inert page behind it come for free.
 */
export function GalleryViewer({
  items,
  index,
  onIndexChange,
  onClose,
  onDetails,
}: {
  items: readonly GalleryItem[];
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
  onDetails: (index: number) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tilt = useTilt<HTMLImageElement>();
  const swipeStart = useRef<number | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const item = items[index];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog !== null && !dialog.open) dialog.showModal();
  }, []);

  // The neighbours load while the card is looked at, so a step shows the picture at once.
  useEffect(() => {
    for (const neighbour of [items[index - 1], items[index + 1]]) {
      const src = neighbour?.src;
      if (src) new Image().src = src;
    }
  }, [items, index]);

  if (item === undefined) return null;
  const step = (delta: number) => {
    const next = index + delta;
    if (next >= 0 && next < items.length) onIndexChange(next);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    }
  };
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (start === null) return;
    const dx = event.clientX - start;
    if (Math.abs(dx) >= SWIPE_MIN) step(dx < 0 ? 1 : -1);
  };

  return (
    <dialog
      ref={dialogRef}
      className="gallery-viewer"
      aria-labelledby="gallery-viewer-title"
      onClose={onClose}
      onKeyDown={handleKeyDown}
    >
      <h2 id="gallery-viewer-title" className="visually-hidden" lang="en">
        <CardName card={item.card} />
      </h2>
      <div className="gallery-viewer-top">
        <p className="gallery-viewer-position" aria-live="polite">
          {texts.viewerPosition(index + 1, items.length)}
          <span className="visually-hidden">
            {' '}
            – <span lang="en">{cardNameText(item.card)}</span>
            {item.version !== null && <> ({item.version})</>}
          </span>
        </p>
        <button type="button" className="gallery-btn gallery-viewer-close" aria-label={texts.viewerClose} onClick={() => dialogRef.current?.close()}>
          <span aria-hidden="true">{texts.closeSymbol}</span>
        </button>
      </div>
      <div
        className="gallery-viewer-stage"
        onPointerDown={(event) => {
          swipeStart.current = event.clientX;
        }}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          swipeStart.current = null;
        }}
      >
        {item.src !== null && failedSrc !== item.src ? (
          <img
            {...tilt}
            key={item.id}
            className="gallery-viewer-image card-tilt"
            src={item.src}
            width={CARD_IMAGE_WIDTH.lg}
            height={cardImageHeight('lg')}
            alt={item.label}
            lang="en"
            draggable={false}
            onError={() => setFailedSrc(item.src)}
          />
        ) : (
          <p className="gallery-viewer-missing" lang="en">
            {cardNameText(item.card)}
          </p>
        )}
      </div>
      <button
        type="button"
        className="gallery-btn gallery-viewer-step gallery-viewer-step--prev"
        aria-label={texts.viewerPrev}
        disabled={index === 0}
        onClick={() => step(-1)}
      >
        <Chevron direction="left" size={24} />
      </button>
      <button
        type="button"
        className="gallery-btn gallery-viewer-step gallery-viewer-step--next"
        aria-label={texts.viewerNext}
        disabled={index === items.length - 1}
        onClick={() => step(1)}
      >
        <Chevron direction="right" size={24} />
      </button>
      <div className="gallery-viewer-foot">
        <button type="button" className="gallery-viewer-details" onClick={() => onDetails(index)}>
          {texts.viewerDetails}
        </button>
      </div>
    </dialog>
  );
}
