import type { Card } from './card';
import { cardKey, isCardKey } from './cardKey';

/*
 * The bundled card data file src/data/cards.json (D-013 osa 1, ARCHITECTURE.md 13.3).
 * Written by `npm run cards:update` and checked again by src/data/cards.test.ts.
 */

export const CARD_FILE_FORMAT = 'cyberdeck.cards';
export const CARD_FILE_VERSION = 1;
/** Upper bound for every text field, so a broken source cannot bloat the bundle. */
export const MAX_CARD_TEXT_LENGTH = 200;

export interface CardFile {
  format: typeof CARD_FILE_FORMAT;
  version: typeof CARD_FILE_VERSION;
  cards: Card[];
}

/** Card fields in model order. The file is written in this order, so the output is deterministic. */
const CARD_FIELDS = ['id', 'slug', 'name', 'subname', 'displayName', 'type', 'color', 'cost', 'power', 'ram', 'rarity', 'key'] as const;
const FILE_FIELDS = ['format', 'version', 'cards'] as const;

/** Builds the file object with a fixed key order (format, version, cards; Card fields in model order). */
export function toCardFile(cards: readonly Card[]): CardFile {
  return {
    format: CARD_FILE_FORMAT,
    version: CARD_FILE_VERSION,
    cards: cards.map((card) => ({
      id: card.id,
      slug: card.slug,
      name: card.name,
      subname: card.subname,
      displayName: card.displayName,
      type: card.type,
      color: card.color,
      cost: card.cost,
      power: card.power,
      ram: card.ram,
      rarity: card.rarity,
      key: card.key,
    })),
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Throws unless the object has exactly the given own keys. */
function requireExactKeys(value: Record<string, unknown>, fields: readonly string[], where: string): void {
  const keys = Object.keys(value);
  const extra = keys.filter((key) => !fields.includes(key));
  if (extra.length > 0) throw new Error(`${where}: unexpected field(s) ${extra.join(', ')}`);
  const missing = fields.filter((field) => !Object.hasOwn(value, field));
  if (missing.length > 0) throw new Error(`${where}: missing field(s) ${missing.join(', ')}`);
}

function requireText(value: unknown, field: string, where: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${where}: "${field}" must be a non-empty string`);
  }
  if (value.length > MAX_CARD_TEXT_LENGTH) {
    throw new Error(`${where}: "${field}" is longer than ${MAX_CARD_TEXT_LENGTH} characters`);
  }
  return value;
}

function requireTextOrNull(value: unknown, field: string, where: string): string | null {
  return value === null ? null : requireText(value, field, where);
}

function requireNumberOrNull(value: unknown, field: string, where: string): number | null {
  if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) {
    throw new Error(`${where}: "${field}" must be a finite number or null`);
  }
  return value;
}

function parseCard(value: unknown, index: number): Card {
  const where = `cards[${index}]`;
  if (!isPlainObject(value)) throw new Error(`${where}: not an object`);
  requireExactKeys(value, CARD_FIELDS, where);

  const name = requireText(value.name, 'name', where);
  const subname = requireTextOrNull(value.subname, 'subname', where);
  const cost = requireNumberOrNull(value.cost, 'cost', where);
  const power = requireNumberOrNull(value.power, 'power', where);
  const ram = requireNumberOrNull(value.ram, 'ram', where);
  const key = requireText(value.key, 'key', where);
  if (!isCardKey(key) || key !== cardKey(name, subname)) {
    throw new Error(`${where}: "key" ${JSON.stringify(key)} does not match cardKey(name, subname)`);
  }

  return {
    id: requireText(value.id, 'id', where),
    slug: requireText(value.slug, 'slug', where),
    name,
    subname,
    displayName: requireText(value.displayName, 'displayName', where),
    type: requireText(value.type, 'type', where),
    color: requireTextOrNull(value.color, 'color', where),
    cost,
    power,
    ram,
    rarity: requireTextOrNull(value.rarity, 'rarity', where),
    key,
  };
}

/**
 * Validates a parsed card file and returns the cards. Throws an Error with a developer
 * message on the first problem (ARCHITECTURE.md 13.3).
 */
export function parseCardFile(json: unknown): Card[] {
  if (!isPlainObject(json)) throw new Error('Card file: root is not an object');
  requireExactKeys(json, FILE_FIELDS, 'Card file');
  if (json.format !== CARD_FILE_FORMAT) throw new Error(`Card file: format must be "${CARD_FILE_FORMAT}"`);
  if (json.version !== CARD_FILE_VERSION) throw new Error(`Card file: version must be ${CARD_FILE_VERSION}`);
  if (!Array.isArray(json.cards)) throw new Error('Card file: "cards" is not an array');
  if (json.cards.length === 0) throw new Error('Card file: "cards" is empty');

  const cards = json.cards.map((value: unknown, index) => parseCard(value, index));
  const keys = new Set<string>();
  const ids = new Set<string>();
  cards.forEach((card, index) => {
    if (keys.has(card.key)) throw new Error(`cards[${index}]: duplicate key "${card.key}"`);
    if (ids.has(card.id)) throw new Error(`cards[${index}]: duplicate id "${card.id}"`);
    keys.add(card.key);
    ids.add(card.id);
  });
  return cards;
}
