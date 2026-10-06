/*
 * Public decks (T-098, D-025, SEC-098). The public document holds the deck as a share-link string, a few
 * display fields and an optional nickname. It never holds the owner's uid: the document id is
 * hex(sha256(uid + ':' + deckId)) (SR-30). Everything read back is untrusted and goes through parsePublicDeck.
 */
import { MAX_DECK_NAME_LENGTH } from './deck';
import type { DeckContent, DeckId } from './deck';
import { encodeDeckShare, MAX_SHARE_DATA_LENGTH } from './deckShare';
import { deckTotals, groupDeck } from './deckRules';
import type { CardsByKey } from './deckRules';
import { cleanNickname, cleanText, isDeckId, isRecord } from './validate';

export const PUBLIC_DECK_SCHEMA_VERSION = 1;
/** Rules allow 300 characters; the names of two Legends are far below it. */
export const MAX_LEGENDS_TEXT_LENGTH = 300;
/** At most 99 copies in 500 rows; the rules cap the same number (SR-31). */
export const MAX_PUBLIC_CARD_COUNT = 49500;
/** SR-34: a public update is sent at most this often; the rules require at least 10 s. */
export const PUBLIC_UPDATE_DELAY_MS = 15_000;
/** Public decks per page (SR-33). */
export const PUBLIC_PAGE_SIZE = 24;

const PUB_ID = /^[0-9a-f]{64}$/;
const BASE64URL = /^[A-Za-z0-9_-]+$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

/** The fields the app writes to `publicDecks/{pubId}`; the store adds the schema version and the server times. */
export interface PublicDeckInput {
  readonly deckId: DeckId;
  readonly name: string;
  readonly legends: string;
  readonly cardCount: number;
  /** encodeDeckShare output (SR-32). */
  readonly deck: string;
  readonly nickname: string | null;
}

/** A public deck after validation. */
export interface PublicDeck extends PublicDeckInput {
  readonly pubId: string;
  /** ISO 8601, from the server time. */
  readonly publishedAt: string;
  readonly updatedAt: string;
}

export function isPubId(value: unknown): value is string {
  return typeof value === 'string' && PUB_ID.test(value);
}

/** pubId = lowercase hex of sha256(uid + ':' + deckId), the same value the rules compute (SR-30). */
export async function publicDeckId(uid: string, deckId: DeckId): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${uid}:${deckId}`));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** The Legends' names as one line, for the list row. */
export function legendsText(deck: DeckContent, cardsByKey: CardsByKey): string {
  const names = groupDeck(deck, cardsByKey).legends.map((row) =>
    row.card.subname === null ? row.card.name : `${row.card.name}, ${row.card.subname}`,
  );
  const joined = names.join(' / ');
  return Array.from(joined).slice(0, MAX_LEGENDS_TEXT_LENGTH).join('');
}

export type PublicInputResult = { ok: true; input: PublicDeckInput } | { ok: false; error: 'empty' | 'too-large' };

/** Builds what is published. An empty deck is not published; a deck whose link would exceed the limit is not either (SR-32). */
export function buildPublicDeckInput(
  deckId: DeckId,
  content: DeckContent,
  cardsByKey: CardsByKey,
  nickname: string | null,
): PublicInputResult {
  const totals = deckTotals(content, cardsByKey);
  const cardCount = totals.legends + totals.main;
  if (cardCount === 0) return { ok: false, error: 'empty' };
  const deck = encodeDeckShare(content, cardsByKey);
  if (deck === '') return { ok: false, error: 'empty' };
  if (deck.length > MAX_SHARE_DATA_LENGTH) return { ok: false, error: 'too-large' };
  const name = cleanText(content.name, 1, MAX_DECK_NAME_LENGTH);
  if (name === null || !isDeckId(deckId)) return { ok: false, error: 'empty' };
  return {
    ok: true,
    input: {
      deckId,
      name,
      legends: legendsText(content, cardsByKey),
      cardCount: Math.min(cardCount, MAX_PUBLIC_CARD_COUNT),
      deck,
      nickname: nickname === null ? null : cleanNickname(nickname),
    },
  };
}

function isInt(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isoOrNull(value: unknown): string | null {
  if (typeof value !== 'string' || !ISO_TIMESTAMP.test(value)) return null;
  return Number.isFinite(Date.parse(value)) ? value : null;
}

/**
 * Validates a document read from `publicDecks/{pubId}` (SR-37). `raw.publishedAt` and `raw.updatedAt` are
 * ISO strings (the store converts the server timestamps). Null = the document is ignored. Builds the result
 * from whitelisted fields only, so nothing extra reaches the UI.
 */
export function parsePublicDeck(pubId: unknown, raw: unknown): PublicDeck | null {
  if (!isPubId(pubId) || !isRecord(raw)) return null;
  if (!isInt(raw.schemaVersion, 1, PUBLIC_DECK_SCHEMA_VERSION)) return null;
  if (!isDeckId(raw.deckId)) return null;
  const name = cleanText(raw.name, 1, MAX_DECK_NAME_LENGTH);
  const legends = cleanText(raw.legends, 0, MAX_LEGENDS_TEXT_LENGTH);
  if (name === null || legends === null || !isInt(raw.cardCount, 0, MAX_PUBLIC_CARD_COUNT)) return null;
  if (typeof raw.deck !== 'string' || raw.deck === '' || raw.deck.length > MAX_SHARE_DATA_LENGTH || !BASE64URL.test(raw.deck)) {
    return null;
  }
  const nickname = raw.nickname === null ? null : cleanNickname(raw.nickname);
  if (raw.nickname !== null && nickname === null) return null;
  const publishedAt = isoOrNull(raw.publishedAt);
  const updatedAt = isoOrNull(raw.updatedAt);
  if (publishedAt === null || updatedAt === null) return null;
  return { pubId, deckId: raw.deckId, name, legends, cardCount: raw.cardCount, deck: raw.deck, nickname, publishedAt, updatedAt };
}
