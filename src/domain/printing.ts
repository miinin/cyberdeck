/*
 * Printings (D-020): the versions of one card (set, collector number). A collection may say how many
 * copies of each printing the user owns. Keys are readable and independent of Netdeck's UUIDs (D-008).
 */

/** `<set code>:<collector number without the beta sign>`, e.g. "welcometonightcitybeta:005a". */
export type PrintingKey = string;

export const PRINTING_KEY_PATTERN = /^[A-Za-z0-9-]{1,64}:[A-Za-z0-9]{1,12}$/;
/** Upper bound for printings read per card from the source. */
export const MAX_PRINTINGS_PER_CARD = 100;
/** At most this many printings per card in a collection entry (D-020). */
export const MAX_VERSIONS_PER_CARD = 32;

export function isPrintingKey(value: unknown): value is PrintingKey {
  return typeof value === 'string' && PRINTING_KEY_PATTERN.test(value);
}

/** The collector number with the beta sign (β) removed. */
export function stripBeta(number: string): string {
  return number.replace(/β/g, '');
}

export function printingKey(setCode: string, number: string): string {
  return `${setCode}:${stripBeta(number)}`;
}

/** One printing of a card. No image URLs are stored (SECURITY.md R-1). */
export interface Printing {
  key: PrintingKey;
  setCode: string;
  setName: string;
  /** The collector number as printed, β kept for display. */
  number: string;
  rarity: string | null;
  /** "en", "fr" and so on. */
  language: string;
  artist: string | null;
  /** `<card slug>__<set family>-<number>`: file name of the optional variant image (docs/card-variant-images.md). */
  imageKey: string;
}

function kebab(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Readable name of the set family: "Embracing Power — Retail Starter Deck" -> "Embracing Power Starter Deck". */
export function setFamilyName(setName: string): string {
  return setName
    .replace(/\s+—\s+FR$/, '')
    .replace(/\s+—\s+(Retail|Beta)\s+(Starter Deck)$/, ' $2')
    .replace(/\s+—\s+(Retail|Beta)$/, '')
    .replace(/\s+(Retail|Beta)$/, '');
}

/** "Embracing Power — Retail Starter Deck" -> "embracing-power-starter-deck", "Pre-Release Beta" -> "pre-release". */
export function setFamily(setName: string): string {
  return kebab(setFamilyName(setName));
}

export function imageKeyOf(cardSlug: string, setName: string, number: string): string {
  return `${kebab(cardSlug)}__${setFamily(setName)}-${kebab(stripBeta(number))}`;
}
