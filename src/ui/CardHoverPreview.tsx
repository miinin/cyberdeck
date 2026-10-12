import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Card } from '../domain/card';
import { CARD_IMAGE_ASPECT, CARD_IMAGE_WIDTH, cardImageHeight } from '../domain/cardImage';
import { getCardImage } from '../data/cardImages';
import { HOVER_QUERY, useMediaQuery } from './useMediaQuery';

/** The mouse rests this long, still, on a row before the bigger image appears (T-050b, T-139). */
export const PREVIEW_DELAY_MS = 450;

/** Moving more than this many px restarts the wait: passing over the list never opens the image (T-139). */
const REST_TOLERANCE = 4;

/** Space between the trigger (or the pointer) and the image, in px. */
const GAP = 12;

export interface Shown {
  card: Card;
  /** Where the trigger was when the image was asked for. */
  rect: DOMRect;
  /** Pointer x, used when there is no room beside the whole trigger (a full-width row). */
  x: number;
}

export interface HoverPreviewProps {
  onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove?: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: () => void;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

/** A trigger wider than this (a full-width result row) gets the image next to the pointer, not at its end. */
const BESIDE_MAX_WIDTH = 640;

/**
 * Left and top of the preview: beside a narrow trigger (a deck row) where there is room, right first.
 * For a wide row the image floats next to the pointer, above or below the row (where there is more
 * room), so the row itself is never covered and the eye does not travel far (WCAG 1.4.13, T-052).
 */
export function place({ rect, x }: Shown, width: number, height: number): { left: number; top: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const centred = clamp(rect.top + rect.height / 2 - height / 2, GAP, Math.max(GAP, vh - height - GAP));
  if (rect.width <= BESIDE_MAX_WIDTH) {
    if (rect.right + GAP + width <= vw) return { left: rect.right + GAP, top: centred };
    if (rect.left - GAP - width >= 0) return { left: rect.left - GAP - width, top: centred };
  }
  const left = x + 2 * GAP + width <= vw ? x + 2 * GAP : clamp(x - 2 * GAP - width, GAP, Math.max(GAP, vw - width - GAP));
  const roomAbove = rect.top - GAP;
  const roomBelow = vh - rect.bottom - GAP;
  const top = roomAbove >= roomBelow ? Math.max(GAP, rect.top - GAP - height) : rect.bottom + GAP;
  return { left, top };
}

/** The shared bigger image. Decorative: the same card is on the row as text and opens in the image dialog. */
function CardHoverPreview({ shown }: { shown: Shown | null }) {
  const ref = useRef<HTMLImageElement>(null);
  const image = shown === null ? null : getCardImage(shown.card.key);

  // Set through the CSSOM: the content security policy does not allow style attributes.
  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null || shown === null) return;
    // 288 px = 18rem, the smallest CSS width, in case layout is not measured yet.
    const width = element.offsetWidth || 288;
    const { left, top } = place(shown, width, width * CARD_IMAGE_ASPECT);
    element.style.setProperty('left', `${Math.round(left)}px`);
    element.style.setProperty('top', `${Math.round(top)}px`);
  }, [shown]);

  if (shown === null || image === null) return null;
  return (
    <img
      ref={ref}
      key={shown.card.key}
      className="card-hover-preview"
      src={image.large}
      width={CARD_IMAGE_WIDTH.lg}
      height={cardImageHeight('lg')}
      alt=""
      aria-hidden="true"
      decoding="async"
    />
  );
}

/**
 * Hover preview for result rows and deck rows (T-050b, T-139). Only a mouse that rests still for 450 ms opens it (moving
 * restarts the wait, so sweeping over a list opens nothing); leaving,
 * scrolling, Esc or opening the image dialog (`hide`) closes it. Touch and keyboard never open it.
 */
export function useCardHoverPreview() {
  const canHover = useMediaQuery(HOVER_QUERY, true);
  const [shown, setShown] = useState<Shown | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Latest pointer x over the trigger: the image opens next to where the pointer rests, not where it entered. */
  const pointerX = useRef(0);
  const restAt = useRef({ x: 0, y: 0 });

  const shownRef = useRef<Shown | null>(null);
  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setShown(null);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (shown === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide();
    };
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', hide, { capture: true, passive: true });
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', hide, { capture: true });
    };
  }, [shown, hide]);

  const bind = useCallback(
    (card: Card): HoverPreviewProps => {
      if (!canHover) return {};
      return {
        onPointerEnter: (event) => {
          if (event.pointerType !== 'mouse') return;
          const trigger = event.currentTarget;
          pointerX.current = event.clientX;
          restAt.current = { x: event.clientX, y: event.clientY };
          clearTimeout(timer.current);
          timer.current = setTimeout(
            () => setShown({ card, rect: trigger.getBoundingClientRect(), x: pointerX.current }),
            PREVIEW_DELAY_MS,
          );
        },
        onPointerMove: (event) => {
          if (event.pointerType !== 'mouse') return;
          pointerX.current = event.clientX;
          // Still waiting and the mouse moves on: wait again from here. An open image stays while the mouse is on the row.
          const moved = Math.abs(event.clientX - restAt.current.x) + Math.abs(event.clientY - restAt.current.y);
          if (shownRef.current === null && moved > REST_TOLERANCE) {
            restAt.current = { x: event.clientX, y: event.clientY };
            const trigger = event.currentTarget;
            clearTimeout(timer.current);
            timer.current = setTimeout(
              () => setShown({ card, rect: trigger.getBoundingClientRect(), x: pointerX.current }),
              PREVIEW_DELAY_MS,
            );
          }
        },
        onPointerLeave: hide,
      };
    },
    [canHover, hide],
  );

  return { bind, hide, preview: <CardHoverPreview shown={shown} /> };
}
