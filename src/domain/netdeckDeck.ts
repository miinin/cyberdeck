import type { Card } from './card';
import { cardKey } from './cardKey';
import type { CardKey } from './cardKey';
import { MAX_DECK_CARD_COUNT, MAX_DECK_NAME_LENGTH } from './deck';
import { MAX_UNRECOGNIZED_LENGTH } from './deckText';
import type { ImportedRow, ParsedDeckText } from './deckText';
import { cleanText, isRecord } from './validate';

/**
 * A deck fetched from a Netdeck.gg link (T-046). The response is untrusted (SR-11): only the
 * fields below are read, every limit is checked, and nothing from the response is copied as is.
 */
export const MAX_NETDECK_ZONES = 3;
export const MAX_NETDECK_ROWS = 300;
export const MAX_NETDECK_ID_LENGTH = 64;
const MAX_NETDECK_CARD_NAME_LENGTH = 200;
const MAX_NETDECK_AUTHOR_LENGTH = 60;

export type NetdeckZone = 'legends' | 'deck' | 'sideboard';
const ZONES: readonly string[] = ['legends', 'deck', 'sideboard'];

export interface NetdeckCardRow {
  readonly zone: NetdeckZone;
  readonly quantity: number;
  readonly id: string;
  /** Only used as a fallback match when the id is unknown to us. */
  readonly name: string | null;
  readonly subname: string | null;
}

export interface NetdeckDeck {
  readonly name: string;
  readonly author: string | null;
  readonly rows: readonly NetdeckCardRow[];
}

// Anchored host, then a path that holds exactly one UUID segment after "decks". Linear, no input-built patterns.
const URL_PATTERN =
  /^https:\/\/(?:www\.)?netdeck\.gg\/(?:decks\/cyberpunk|cyberpunk\/decks)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?(?:[?#].*)?$/i;
const MAX_URL_LENGTH = 300;

/** The deck UUID (lower case) from a Netdeck deck page address, or null for anything else. */
export function parseNetdeckUrl(input: string): string | null {
  const text = input.trim();
  if (text.length > MAX_URL_LENGTH) return null;
  const match = URL_PATTERN.exec(text);
  return match === null ? null : (match[1] ?? '').toLowerCase();
}

function optionalText(value: unknown, maxLength: number): string | null {
  return cleanText(value, 1, maxLength);
}

/** Validates a deck response. Returns null when the shape or any limit is wrong. */
export function parseNetdeckDeck(raw: unknown): NetdeckDeck | null {
  if (!isRecord(raw) || !Array.isArray(raw.zones) || raw.zones.length > MAX_NETDECK_ZONES) return null;
  const name = cleanText(raw.name, 1, MAX_DECK_NAME_LENGTH);
  if (name === null) return null;
  const author = isRecord(raw.owner) ? optionalText(raw.owner.display_name, MAX_NETDECK_AUTHOR_LENGTH) : null;

  const rows: NetdeckCardRow[] = [];
  for (const zone of raw.zones as unknown[]) {
    if (!isRecord(zone) || typeof zone.zone_code !== 'string' || !ZONES.includes(zone.zone_code)) return null;
    if (!Array.isArray(zone.cards)) return null;
    for (const entry of zone.cards as unknown[]) {
      if (rows.length >= MAX_NETDECK_ROWS || !isRecord(entry) || !isRecord(entry.card)) return null;
      const { quantity } = entry;
      const { id } = entry.card;
      if (
        typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_DECK_CARD_COUNT ||
        typeof id !== 'string' || id.length < 1 || id.length > MAX_NETDECK_ID_LENGTH
      ) {
        return null;
      }
      rows.push({
        zone: zone.zone_code as NetdeckZone,
        quantity,
        id,
        name: optionalText(entry.card.name, MAX_NETDECK_CARD_NAME_LENGTH),
        subname: optionalText(entry.card.subname, MAX_NETDECK_CARD_NAME_LENGTH),
      });
    }
  }
  return { name, author, rows };
}

function shortened(text: string): string {
  return Array.from(text).slice(0, MAX_UNRECOGNIZED_LENGTH).join('');
}

/** Matches the rows to our cards (by id, then by name) and shapes them like a parsed text list. */
export function netdeckToParsedDeck(deck: NetdeckDeck, cards: readonly Card[]): ParsedDeckText {
  const byId = new Map<string, Card>(cards.map((card) => [card.id, card]));
  const byKey = new Map<CardKey, Card>(cards.map((card) => [card.key, card]));
  const main = new Map<CardKey, ImportedRow>();
  const side = new Map<CardKey, ImportedRow>();
  const unrecognized: string[] = [];

  for (const row of deck.rows) {
    const card = byId.get(row.id) ?? (row.name === null ? undefined : byKey.get(cardKey(row.name, row.subname)));
    if (card === undefined) {
      const label = row.name === null ? row.id : row.subname === null ? row.name : `${row.name} - ${row.subname}`;
      unrecognized.push(shortened(`${row.quantity} ${label}${row.zone === 'sideboard' ? ' (sideboard)' : ''}`));
      continue;
    }
    const target = row.zone === 'sideboard' ? side : main;
    const total = Math.min(MAX_DECK_CARD_COUNT, (target.get(card.key)?.count ?? 0) + row.quantity);
    target.set(card.key, { card, count: total });
  }
  return {
    name: deck.name,
    rows: [...main.values()],
    unrecognized,
    sideboard: [...side.values()],
    source: { name: deck.name, author: deck.author },
  };
}
