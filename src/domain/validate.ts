/*
 * Runtime validation of stored and imported data (SR-11, SR-18). Input is always `unknown`.
 * These functions never throw, never copy input objects (no spread, Object.assign or merge)
 * and build every result from whitelisted fields only.
 */
import { isCardKey, RESERVED_OBJECT_KEYS } from './cardKey';
import type { CardKey } from './cardKey';
import { compareCardKeys, MAX_COLLECTION_COUNT, MAX_COLLECTION_ENTRIES } from './collection';
import type { Collection, CollectionEntry } from './collection';
import {
  MAX_DECK_CARD_COUNT,
  MAX_DECK_DISTINCT_CARDS,
  MAX_DECK_NAME_LENGTH,
  MAX_DECKS,
  MAX_SECTION_NAME_LENGTH,
  MAX_SECTIONS,
} from './deck';
import type { Deck, DeckCard, DeckContent, DeckId, DeckSection } from './deck';

/** A validated value and the number of rows, sections or decks that were left out. */
export interface Parsed<T> {
  value: T;
  dropped: number;
}

export const EPOCH_TIMESTAMP = '1970-01-01T00:00:00.000Z';

const DECK_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
// C0 and C1 control characters (including line breaks and DEL), bidirectional controls and marks
// (ALM, LRM, RLM), line and paragraph separators and BOM. ZWJ and ZWNJ stay: emoji sequences and
// some scripts need them. Matching control characters is the purpose of this pattern (SR-11, SEC-005).
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARACTERS = /[\u0000-\u001F\u007F-\u009F\u061C\u200E\u200F\u2028\u2029\u202A-\u202E\u2066-\u2069\uFEFF]/g;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isDeckId(value: unknown): value is DeckId {
  return typeof value === 'string' && DECK_ID_PATTERN.test(value) && !RESERVED_OBJECT_KEYS.has(value);
}

/**
 * NFC-normalises text, removes control and bidirectional control characters and trims it.
 * Returns null when the value is not a string or the cleaned length is not min–max.
 */
export function cleanText(value: unknown, minLength: number, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.normalize('NFC').replace(UNSAFE_CHARACTERS, '').trim();
  return cleaned.length >= minLength && cleaned.length <= maxLength ? cleaned : null;
}

function isCount(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function parseTimestamp(value: unknown): string {
  if (typeof value !== 'string' || !ISO_TIMESTAMP_PATTERN.test(value)) return EPOCH_TIMESTAMP;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : EPOCH_TIMESTAMP;
}

/** `{ entries: [{ card, count }] }`. Returns null when the root shape is wrong. */
export function parseCollection(raw: unknown): Parsed<Collection> | null {
  if (!isRecord(raw) || !Array.isArray(raw.entries)) return null;
  const input: unknown[] = raw.entries;
  let dropped = Math.max(0, input.length - MAX_COLLECTION_ENTRIES);
  const seen = new Set<CardKey>();
  const entries: CollectionEntry[] = [];

  for (const item of input.slice(0, MAX_COLLECTION_ENTRIES)) {
    if (
      !isRecord(item) ||
      !isCardKey(item.card) ||
      !isCount(item.count, 1, MAX_COLLECTION_COUNT) ||
      seen.has(item.card)
    ) {
      dropped += 1;
      continue;
    }
    seen.add(item.card);
    entries.push({ card: item.card, count: item.count });
  }

  entries.sort((a, b) => compareCardKeys(a.card, b.card));
  return { value: { entries }, dropped };
}

/** `{ name, sections: [{ name, cards: [{ card, count }] }] }`. Null when the name or sections are invalid. */
export function parseDeckContent(raw: unknown): Parsed<DeckContent> | null {
  if (!isRecord(raw) || !Array.isArray(raw.sections)) return null;
  const name = cleanText(raw.name, 1, MAX_DECK_NAME_LENGTH);
  if (name === null) return null;

  const input: unknown[] = raw.sections;
  let dropped = Math.max(0, input.length - MAX_SECTIONS);
  let rowBudget = MAX_DECK_DISTINCT_CARDS;
  const sections: DeckSection[] = [];

  for (const item of input.slice(0, MAX_SECTIONS)) {
    const sectionName = isRecord(item) ? cleanText(item.name, 0, MAX_SECTION_NAME_LENGTH) : null;
    if (!isRecord(item) || sectionName === null || !Array.isArray(item.cards)) {
      dropped += 1;
      continue;
    }
    const cardsInput: unknown[] = item.cards;
    const seen = new Set<CardKey>();
    const cards: DeckCard[] = [];
    let index = 0;
    for (; index < cardsInput.length && cards.length < rowBudget; index += 1) {
      const card = cardsInput[index];
      if (!isRecord(card) || !isCardKey(card.card) || !isCount(card.count, 1, MAX_DECK_CARD_COUNT) || seen.has(card.card)) {
        dropped += 1;
        continue;
      }
      seen.add(card.card);
      cards.push({ card: card.card, count: card.count });
    }
    dropped += cardsInput.length - index; // rows over the deck-wide limit
    rowBudget -= cards.length;
    sections.push({ name: sectionName, cards });
  }

  return { value: { name, sections }, dropped };
}

/** A stored deck: deck content plus id and timestamps. An invalid timestamp becomes the epoch. */
export function parseDeck(raw: unknown): Parsed<Deck> | null {
  if (!isRecord(raw) || !isDeckId(raw.id)) return null;
  const content = parseDeckContent(raw);
  if (content === null) return null;
  return {
    value: {
      id: raw.id,
      name: content.value.name,
      sections: content.value.sections,
      createdAt: parseTimestamp(raw.createdAt),
      updatedAt: parseTimestamp(raw.updatedAt),
    },
    dropped: content.dropped,
  };
}

/** `{ decks: [...] }`. Invalid decks and repeated ids (first one wins) are dropped. */
export function parseDeckList(raw: unknown): Parsed<Deck[]> | null {
  if (!isRecord(raw) || !Array.isArray(raw.decks)) return null;
  const input: unknown[] = raw.decks;
  let dropped = Math.max(0, input.length - MAX_DECKS);
  const seen = new Set<DeckId>();
  const decks: Deck[] = [];

  for (const item of input.slice(0, MAX_DECKS)) {
    const parsed = parseDeck(item);
    if (parsed === null || seen.has(parsed.value.id)) {
      dropped += 1;
      continue;
    }
    seen.add(parsed.value.id);
    decks.push(parsed.value);
    dropped += parsed.dropped;
  }

  return { value: decks, dropped };
}
