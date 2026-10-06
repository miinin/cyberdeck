import type { Card } from '../domain/card';
import { cardKey, isCardKey } from '../domain/cardKey';
import { imageKeyOf, isPrintingKey, MAX_PRINTINGS_PER_CARD, printingKey } from '../domain/printing';
import type { Printing } from '../domain/printing';
import type { NetdeckCardFields } from './netdeckTypes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** Highest game value (Cost, Power, RAM) accepted from the API; the game has far smaller values (B-009). */
export const MAX_GAME_VALUE = 99;

/** A game value: a whole number 0 … MAX_GAME_VALUE. Anything else (-5, 1.5, 1e308) is shown as missing (B-009, T-008). */
function gameValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_GAME_VALUE ? value : null;
}

const MAX_TEXT = 200;

function boundedString(value: unknown): string | null {
  const text = nonEmptyString(value);
  return text !== null && text.length <= MAX_TEXT ? text : null;
}

/** One raw printing -> Printing, or null when a required field is missing or malformed. Image URLs are dropped. */
function mapPrinting(raw: unknown, cardSlug: string): Printing | null {
  if (!isRecord(raw) || !isRecord(raw.set)) return null;
  const setCode = boundedString(raw.set.code);
  const setName = boundedString(raw.set.name);
  const number = boundedString(raw.collector_number);
  if (setCode === null || setName === null || number === null) return null;
  const key = printingKey(setCode, number);
  if (!isPrintingKey(key)) return null;
  return {
    key,
    setCode,
    setName,
    number,
    rarity: boundedString(raw.rarity),
    language: boundedString(raw.language) ?? 'en',
    artist: boundedString(raw.artist),
    imageKey: imageKeyOf(cardSlug, setName, number),
  };
}

/** Valid printings in source order; a repeated key keeps the first one. A bad printing is skipped, not the card. */
function mapPrintings(raw: unknown, cardSlug: string): Printing[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const printings: Printing[] = [];
  for (const item of raw.slice(0, MAX_PRINTINGS_PER_CARD)) {
    const printing = mapPrinting(item, cardSlug);
    if (printing === null || seen.has(printing.key)) continue;
    seen.add(printing.key);
    printings.push(printing);
  }
  return printings;
}

/**
 * Converts one raw Netdeck.gg card into the internal model, or returns null when a
 * required field is missing. Only whitelisted fields are copied: image URLs
 * and rules text never enter the model (SECURITY.md R-1, ARCHITECTURE.md 5.6).
 */
export function mapCard(raw: unknown): Card | null {
  if (!isRecord(raw)) return null;
  const fields = raw as Partial<NetdeckCardFields>;

  const id = nonEmptyString(fields.id);
  const slug = nonEmptyString(fields.slug);
  const name = nonEmptyString(fields.name);
  const type = nonEmptyString(fields.card_type);
  if (id === null || slug === null || name === null || type === null) return null;

  const subname = nonEmptyString(fields.subname);
  // D-008: a card whose name gives no valid key cannot be stored or referenced, so it is skipped.
  const key = cardKey(name, subname);
  if (!isCardKey(key)) return null;
  const displayName =
    nonEmptyString(fields.canonical_name) ?? (subname === null ? name : `${name} — ${subname}`);

  return {
    id,
    slug,
    name,
    subname,
    displayName,
    type,
    color: nonEmptyString(fields.color),
    cost: gameValue(fields.cost),
    power: gameValue(fields.power),
    ram: gameValue(fields.ram),
    rarity: nonEmptyString(fields.rarity),
    eddiable: typeof fields.is_eddiable === 'boolean' ? fields.is_eddiable : null,
    key,
    printings: mapPrintings(fields.printings, slug),
  };
}
