import type { Card } from '../domain/card';
import { cardKey, isCardKey } from '../domain/cardKey';
import type { NetdeckCardFields } from './netdeckTypes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Converts one raw Netdeck.gg card into the internal model, or returns null when a
 * required field is missing. Only whitelisted fields are copied: image URLs, printings
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
    cost: finiteNumber(fields.cost),
    power: finiteNumber(fields.power),
    ram: finiteNumber(fields.ram),
    rarity: nonEmptyString(fields.rarity),
    key,
  };
}
