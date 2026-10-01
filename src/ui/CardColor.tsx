import { colorNames, texts } from './texts';

/** CSS class of the decorative swatch for a known color, or the bordered "unknown" swatch. */
function swatchClass(color: string): string {
  return colorNames.has(color) ? `color-swatch-${color.toLowerCase()}` : 'color-swatch-unknown';
}

/**
 * A card color as text with a decorative swatch (UX.md 3.1.1, 5.2). The color is never
 * conveyed by the swatch alone. Unknown API values are shown as such and marked English.
 * `null` is shown as a dash with "ei väriä" for screen readers.
 */
export function CardColor({ color }: { color: string | null }) {
  if (color === null) {
    return (
      <>
        <span aria-hidden="true">{texts.missingValue}</span>
        <span className="visually-hidden">{texts.noColor}</span>
      </>
    );
  }

  const finnishName = colorNames.get(color);
  return (
    <>
      <span className={`color-swatch ${swatchClass(color)}`} aria-hidden="true" />{' '}
      {finnishName === undefined ? <span lang="en">{color}</span> : finnishName}
    </>
  );
}
