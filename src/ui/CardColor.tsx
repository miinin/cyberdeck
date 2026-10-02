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
/** Badge class for a card type label coloured by the card colour (T-036). */
export function typeBadgeClass(color: string | null): string {
  return color !== null && colorNames.has(color) ? `type-badge type-badge-${color.toLowerCase()}` : 'type-badge';
}

export function CardColor({ color, swatchOnly = false }: { color: string | null; swatchOnly?: boolean }) {
  if (color === null) {
    return (
      <>
        <span aria-hidden="true">{texts.missingValue}</span>
        <span className="visually-hidden">{texts.noColor}</span>
      </>
    );
  }

  // Game terms are English (T-036).
  const name = colorNames.get(color) ?? color;
  if (swatchOnly) {
    // Swatch with a visually hidden name: filter chips show only the ball (T-045).
    return (
      <>
        <span className={`color-swatch ${swatchClass(color)}`} aria-hidden="true" />
        <span className="visually-hidden" lang="en">
          {name}
        </span>
      </>
    );
  }
  return (
    <>
      <span className={`color-swatch ${swatchClass(color)}`} aria-hidden="true" />{' '}
      <span lang="en">{name}</span>
    </>
  );
}

/** Class that only sets the colour variable of a card colour (`--badge-color`), for stripes and the like (T-049). */
export function typeColorClass(color: string | null): string {
  return color !== null && colorNames.has(color) ? `type-badge-${color.toLowerCase()}` : '';
}
