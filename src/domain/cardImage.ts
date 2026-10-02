/**
 * Card image sizes (D-013 osa 4, ARCHITECTURE.md 13.8). The import script and the UI read the same
 * constants, so UX changes a size in one place. `sm` is the list thumbnail (UX: 160 px, 2× of about
 * 3.5rem) and `lg` the enlarged image in the dialog.
 */
export const CARD_IMAGE_WIDTH = { sm: 160, lg: 720 } as const;

export type CardImageSize = keyof typeof CARD_IMAGE_WIDTH;

/** Height / width. Measured from the user's image pack: 733 × 1024 px (T-027). */
export const CARD_IMAGE_ASPECT = 1024 / 733;

/** Rendered height in px for a size, used for the img width/height attributes (no layout shift). */
export function cardImageHeight(size: CardImageSize): number {
  return Math.round(CARD_IMAGE_WIDTH[size] * CARD_IMAGE_ASPECT);
}
