import type { Card } from './card';
import type { CardKey } from './cardKey';
import { MAX_DECK_CARD_COUNT } from './deck';
import { DECK_FORMAT, DECK_FORMAT_VERSION } from './deckExport';
import { MAX_UNRECOGNIZED_LENGTH } from './deckText';
import type { ImportedRow, ParsedDeckText } from './deckText';
import { isRecord, parseDeckContent } from './validate';

/**
 * .json deck import (T-015, SR-18). The file is untrusted: size is limited before parsing, the
 * result is built from whitelisted fields by parseDeckContent (SR-11), the file's id and any extra
 * fields are never used, and card names always come from the app's own card data (SR-14).
 */
export const MAX_JSON_IMPORT_BYTES = 256 * 1024;

export type JsonImportError = 'too-long' | 'not-json' | 'not-deck';

export type ParseDeckJsonResult = { ok: true; deck: ParsedDeckText } | { ok: false; error: JsonImportError };

export function parseDeckJson(text: string, cards: readonly Card[]): ParseDeckJsonResult {
  if (text.length > MAX_JSON_IMPORT_BYTES) return { ok: false, error: 'too-long' };
  let raw: unknown;
  try {
    // No reviver: the parsed value is only ever read through whitelisting validators.
    raw = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
  } catch {
    return { ok: false, error: 'not-json' };
  }
  if (!isRecord(raw) || raw.format !== DECK_FORMAT || raw.version !== DECK_FORMAT_VERSION) {
    return { ok: false, error: 'not-deck' };
  }
  const content = parseDeckContent(raw.deck);
  if (content === null) return { ok: false, error: 'not-deck' };

  const byKey = new Map(cards.map((card) => [card.key, card]));
  const totals = new Map<CardKey, number>();
  for (const section of content.value.sections) {
    for (const { card, count } of section.cards) {
      totals.set(card, Math.min(MAX_DECK_CARD_COUNT, (totals.get(card) ?? 0) + count));
    }
  }
  const rows: ImportedRow[] = [];
  const unrecognized: string[] = [];
  for (const [key, count] of totals) {
    const card = byKey.get(key);
    if (card === undefined) unrecognized.push(Array.from(`${count} ${key}`).slice(0, MAX_UNRECOGNIZED_LENGTH).join(''));
    else rows.push({ card, count });
  }
  return { ok: true, deck: { name: content.value.name, rows, unrecognized } };
}
