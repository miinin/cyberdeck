import type { Card } from './card';
import { normalizeCardName } from './cardKey';
import type { CardKey } from './cardKey';
import { MAX_DECK_CARD_COUNT, MAX_DECK_NAME_LENGTH } from './deck';
import { cleanText, UNSAFE_CHARACTERS } from './validate';

/**
 * Deck list text import (T-014, SR-17). The format is the reference format of D-007:
 *   # Deck name
 *   // Legends (3)        <- section headings are skipped, the type comes from the card
 *   3 Card name - Subname  (also "3x Card name", and a bare name when it is unambiguous)
 * Input is untrusted: every limit is checked before parsing and no pattern is built from the input.
 */
export const MAX_IMPORT_BYTES = 64 * 1024;
export const MAX_IMPORT_LINES = 300;
export const MAX_IMPORT_LINE_LENGTH = 300;
export const MAX_UNRECOGNIZED_LENGTH = 100;
export const DEFAULT_IMPORT_NAME = 'Tuotu pakka';

export type ImportError = 'empty' | 'too-long' | 'too-many-lines' | 'line-too-long';

export interface ImportedRow {
  readonly card: Card;
  readonly count: number;
}

export interface ParsedDeckText {
  /** Name from the first "# " line, cleaned and cut to the name limit, or null. */
  readonly name: string | null;
  /** Recognised cards in order of first appearance, duplicate lines merged. */
  readonly rows: readonly ImportedRow[];
  /** Lines that were not understood, cut to 100 characters (shown as text only, SR-14). */
  readonly unrecognized: readonly string[];
}

export type ParseDeckTextResult = { ok: true; deck: ParsedDeckText } | { ok: false; error: ImportError };

// Anchored and linear: one run of non-space, whitespace, then the rest of the line.
const LINE_PATTERN = /^(\S+)\s+(.+)$/;
const COUNT_PATTERN = /^\d{1,2}$/;
/** Looks cards up by their key, or by name alone when exactly one card has that name. */
function createLookup(cards: readonly Card[]): (normalized: string) => Card | undefined {
  const byKey = new Map<CardKey, Card>();
  const byName = new Map<string, Card[]>();
  for (const card of cards) {
    byKey.set(card.key, card);
    const name = normalizeCardName(card.name);
    byName.set(name, [...(byName.get(name) ?? []), card]);
  }
  return (normalized) => {
    const exact = byKey.get(normalized);
    if (exact !== undefined) return exact;
    const sameName = byName.get(normalized);
    return sameName?.length === 1 ? sameName[0] : undefined;
  };
}

/** "3" or "3x" gives 1-99, anything else gives null. */
function parseCount(token: string): number | null {
  const digits = /^\d+x$/i.test(token) ? token.slice(0, -1) : token;
  if (!COUNT_PATTERN.test(digits)) return null;
  const count = Number(digits);
  return count >= 1 && count <= MAX_DECK_CARD_COUNT ? count : null;
}

function shortened(line: string): string {
  return Array.from(line).slice(0, MAX_UNRECOGNIZED_LENGTH).join('');
}

export function parseDeckText(text: string, cards: readonly Card[]): ParseDeckTextResult {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: 'too-long' };
  const lines = text
    .replace(/^﻿/, '')
    .replace(/\r\n?/g, '\n')
    .normalize('NFC')
    .split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  if (lines.length > MAX_IMPORT_LINES) return { ok: false, error: 'too-many-lines' };
  if (lines.some((line) => line.length > MAX_IMPORT_LINE_LENGTH)) return { ok: false, error: 'line-too-long' };

  const find = createLookup(cards);
  const counts = new Map<CardKey, ImportedRow>();
  const unrecognized: string[] = [];
  let rawName: string | null = null;
  let seenContent = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(UNSAFE_CHARACTERS, '').trim();
    if (line === '' || line.startsWith('//')) continue;
    seenContent = true;
    if (line.startsWith('# ') && rawName === null) {
      rawName = line.slice(2);
      continue;
    }
    const match = LINE_PATTERN.exec(line);
    const count = match === null ? null : parseCount(match[1] ?? '');
    const card = match === null || count === null ? undefined : find(normalizeCardName(match[2] ?? ''));
    if (card === undefined || count === null) {
      unrecognized.push(shortened(line));
      continue;
    }
    const previous = counts.get(card.key);
    const total = Math.min(MAX_DECK_CARD_COUNT, (previous?.count ?? 0) + count);
    counts.set(card.key, { card, count: total });
  }

  if (!seenContent) return { ok: false, error: 'empty' };
  const cleaned = rawName === null ? null : cleanText(rawName, 1, Number.MAX_SAFE_INTEGER);
  const name = cleaned === null ? null : cleaned.slice(0, MAX_DECK_NAME_LENGTH).trimEnd();
  return { ok: true, deck: { name, rows: [...counts.values()], unrecognized } };
}
