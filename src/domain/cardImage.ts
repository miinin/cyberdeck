/**
 * Card image sizes (D-013 osa 4, ARCHITECTURE.md 13.8). The import script and the UI read the same
 * constants, so UX changes a size in one place. `md` is the grid image (T-034: about 360 px, 2× of a
 * 14–16rem box) and `lg` the enlarged image in the dialog.
 */
export const CARD_IMAGE_WIDTH = { md: 360, lg: 720 } as const;

export type CardImageSize = keyof typeof CARD_IMAGE_WIDTH;

/** Height / width. Measured from the user's image pack: 733 × 1024 px (T-027). */
export const CARD_IMAGE_ASPECT = 1024 / 733;

/** Rendered height in px for a size, used for the img width/height attributes (no layout shift). */
export function cardImageHeight(size: CardImageSize): number {
  return Math.round(CARD_IMAGE_WIDTH[size] * CARD_IMAGE_ASPECT);
}

/**
 * Both image files with their widths. With `sizes="auto"` (lazy images) the browser picks by the rendered
 * size, so the big "Iso" grid (25rem, T-052) gets the 720 px file and a table thumbnail the 360 px one.
 * Browsers without "auto" use 18rem.
 */
export function cardImageSrcSet(image: { medium: string; large: string }): string {
  return `${image.medium} ${CARD_IMAGE_WIDTH.md}w, ${image.large} ${CARD_IMAGE_WIDTH.lg}w`;
}

export const CARD_IMAGE_SIZES = 'auto, 18rem';
