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

/** The two Welcome to Night City editions a collection tells apart (D-022). */
export const BETA_SET_CODE = 'welcometonightcitybeta';
export const RETAIL_SET_CODE = 'welcometonightcityretail';
const WTNC_FAMILY = 'welcome-to-night-city';

/** The filter value of a printing that belongs to no set (T-160). */
export const NO_SET_FILTER = '';

/**
 * Printings the card data puts in Welcome to Night City although they do not come in its boosters (T-160, user
 * 2026-10-13): the Iconic Legend arts of V Streetkid. A set search, set achievements and the Beta binder leave them out.
 */
const NOT_IN_SET_BOOSTERS: ReadonlySet<PrintingKey> = new Set([
  'welcometonightcityretail:144',
  'welcometonightcitybeta:144',
  'welcometonightcityretail-fr:144',
]);

/**
 * The value of the "Set / Version" filter a printing belongs to (D-022): the set family, except that the Beta printings
 * of Welcome to Night City are a set of their own, apart from Retail (and FR). NO_SET_FILTER for a printing that is not
 * really in its set (T-160).
 */
export function setFilterId(printing: Pick<Printing, 'setName'> & Partial<Pick<Printing, 'key'>>): string {
  if (printing.key !== undefined && NOT_IN_SET_BOOSTERS.has(printing.key)) return NO_SET_FILTER;
  const family = setFamily(printing.setName);
  return family === WTNC_FAMILY && /\bBeta\b/.test(printing.setName) ? `${family}-beta` : family;
}

export function imageKeyOf(cardSlug: string, setName: string, number: string): string {
  return `${kebab(cardSlug)}__${setFamily(setName)}-${kebab(stripBeta(number))}`;
}
