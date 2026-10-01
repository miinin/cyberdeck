/** The app's own card identifier, derived from name and subname (D-008 kohta 2). */
export type CardKey = string;

export const MAX_CARD_KEY_LENGTH = 100;

const CARD_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_KEYS: ReadonlySet<string> = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Turns any card name into its comparison form. The same function produces stored keys
 * and matches imported deck list lines (T-014). All patterns are linear (SR-17).
 */
export function normalizeCardName(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['‘’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function cardKey(name: string, subname: string | null): CardKey {
  return normalizeCardName(subname ? `${name} ${subname}` : name);
}

/** True for a well-formed key of 1–100 characters that is not a reserved object key (SR-11). */
export function isCardKey(value: unknown): value is CardKey {
  return (
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= MAX_CARD_KEY_LENGTH &&
    CARD_KEY_PATTERN.test(value) &&
    !RESERVED_KEYS.has(value)
  );
}
