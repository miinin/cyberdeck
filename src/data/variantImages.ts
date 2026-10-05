import manifest from './variantImages.json';

/*
 * Variant images (D-020): public/cards/variants/<imageKey>.webp for the printings that have their own picture.
 * The file list is written by `npm run cards:images`, so the app only requests images that exist.
 */
const available: ReadonlySet<string> = new Set(manifest);

/** The URL of a printing's own image on the app's origin, or null when there is none. */
export function variantImageUrl(imageKey: string): string | null {
  if (!available.has(imageKey)) return null;
  return `${import.meta.env.BASE_URL}cards/variants/${imageKey}.webp`;
}
