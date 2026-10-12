import type { Card } from './card';
import { isCardKey } from './cardKey';
import type { CardKey } from './cardKey';
import { artsOf, ownedPerArt } from './arts';
import { countOf, MAX_COLLECTION_COUNT, MAX_COLLECTION_ENTRIES, withCount } from './collection';
import type { Collection, CollectionEntry } from './collection';
import { parseCollection } from './validate';
import type { Parsed } from './validate';

/*
 * Proxy sheets (T-102): the print queue laid out on A4 sheets, 3 x 3 cards of 63 x 88 mm. Pure functions only;
 * the pictures and the browser's print dialog are the UI's job. All positions are millimetres from the sheet's
 * top left corner.
 */

export const CARD_WIDTH_MM = 63;
export const CARD_HEIGHT_MM = 88;
export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;
export const COLUMNS = 3;
export const ROWS = 3;
export const CARDS_PER_SHEET = COLUMNS * ROWS;
/** The most copies in the queue and on the sheets, so the browser does not run out of memory (about 23 sheets). */
export const MAX_PROXY_CARDS = 200;

/** Space between the cards, in millimetres; a little helps when cutting. */
export const GAPS_MM = [0, 1, 2] as const;
export type GapMm = (typeof GAPS_MM)[number];

/** Cut marks sit outside the cards: this far from the card edge, and this long. */
export const CUT_MARK_OFFSET_MM = 1;
export const CUT_MARK_LENGTH_MM = 2.5;

export interface ProxyOptions {
  gapMm: GapMm;
  cutMarks: boolean;
}

export const DEFAULT_PROXY_OPTIONS: ProxyOptions = { gapMm: 0, cutMarks: true };

export interface PlacedCard<T> {
  card: T;
  xMm: number;
  yMm: number;
}

export interface CutMark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Sheet<T> {
  cards: PlacedCard<T>[];
  marks: CutMark[];
}

/** Rounds away floating point noise (0.1 + 0.2) so positions compare and print cleanly. */
function mm(value: number): number {
  return Math.round(value * 100) / 100;
}

/** The grid is centred on the sheet. */
export function gridOrigin(gapMm: number): { xMm: number; yMm: number } {
  return {
    xMm: mm((PAGE_WIDTH_MM - (COLUMNS * CARD_WIDTH_MM + (COLUMNS - 1) * gapMm)) / 2),
    yMm: mm((PAGE_HEIGHT_MM - (ROWS * CARD_HEIGHT_MM + (ROWS - 1) * gapMm)) / 2),
  };
}

export function sheetCount(cardCount: number): number {
  return Math.ceil(Math.min(Math.max(0, cardCount), MAX_PROXY_CARDS) / CARDS_PER_SHEET);
}

function marksFor(columns: number, rows: number, gapMm: number): CutMark[] {
  const { xMm, yMm } = gridOrigin(gapMm);
  const marks: CutMark[] = [];
  const left = (column: number) => mm(xMm + column * (CARD_WIDTH_MM + gapMm));
  const top = (row: number) => mm(yMm + row * (CARD_HEIGHT_MM + gapMm));
  const gridRight = left(columns - 1) + CARD_WIDTH_MM;
  const gridBottom = top(rows - 1) + CARD_HEIGHT_MM;
  const near = CUT_MARK_OFFSET_MM;
  const far = CUT_MARK_OFFSET_MM + CUT_MARK_LENGTH_MM;
  for (let column = 0; column < columns; column += 1) {
    for (const x of [left(column), mm(left(column) + CARD_WIDTH_MM)]) {
      marks.push({ x1: x, y1: mm(yMm - far), x2: x, y2: mm(yMm - near) });
      marks.push({ x1: x, y1: mm(gridBottom + near), x2: x, y2: mm(gridBottom + far) });
    }
  }
  for (let row = 0; row < rows; row += 1) {
    for (const y of [top(row), mm(top(row) + CARD_HEIGHT_MM)]) {
      marks.push({ x1: mm(xMm - far), y1: y, x2: mm(xMm - near), y2: y });
      marks.push({ x1: mm(gridRight + near), y1: y, x2: mm(gridRight + far), y2: y });
    }
  }
  return marks;
}

/**
 * Splits the cards (one entry per printed copy) into sheets of nine, row by row, and places them.
 * Cards beyond MAX_PROXY_CARDS are left out. Cut marks go around the used part of the grid only.
 */
export function layoutSheets<T>(cards: readonly T[], options: ProxyOptions = DEFAULT_PROXY_OPTIONS): Sheet<T>[] {
  const { gapMm, cutMarks } = options;
  const origin = gridOrigin(gapMm);
  const used = cards.slice(0, MAX_PROXY_CARDS);
  const sheets: Sheet<T>[] = [];
  for (let start = 0; start < used.length; start += CARDS_PER_SHEET) {
    const part = used.slice(start, start + CARDS_PER_SHEET);
    const placed = part.map((card, index): PlacedCard<T> => ({
      card,
      xMm: mm(origin.xMm + (index % COLUMNS) * (CARD_WIDTH_MM + gapMm)),
      yMm: mm(origin.yMm + Math.floor(index / COLUMNS) * (CARD_HEIGHT_MM + gapMm)),
    }));
    const rows = Math.ceil(part.length / COLUMNS);
    const columns = rows > 1 ? COLUMNS : part.length;
    sheets.push({ cards: placed, marks: cutMarks ? marksFor(columns, rows, gapMm) : [] });
  }
  return sheets;
}

/** One printed copy: the card and the picture of its art (null = the card's own picture). */
export interface ProxyCopy {
  key: CardKey;
  name: string;
  artUrl: string | null;
}

/** Copies in the queue, over all rows. */
export function queueTotal(queue: Collection): number {
  return queue.entries.reduce((sum, entry) => sum + entry.count, 0);
}

/**
 * The queue as printed copies, row by row. The art of a copy follows the queue's breakdown (a copy of a special
 * art gets that art's picture; the rest get the card's own). Cards the data does not know are skipped.
 * `artUrlOf` says where the picture of a special rarity is, or null when there is none (then it is no art).
 */
export function queueCopies(
  queue: Collection,
  cardsByKey: ReadonlyMap<CardKey, Card>,
  artUrlOf: (cardKey: CardKey, rarity: string) => string | null,
): ProxyCopy[] {
  const copies: ProxyCopy[] = [];
  for (const entry of queue.entries) {
    if (copies.length >= MAX_PROXY_CARDS) break;
    const card = cardsByKey.get(entry.card);
    if (card === undefined) continue;
    const arts = artsOf(card, (key, rarity) => artUrlOf(key, rarity) !== null);
    if (arts.length === 0) {
      for (let i = 0; i < entry.count && copies.length < MAX_PROXY_CARDS; i += 1) copies.push({ key: card.key, name: card.displayName, artUrl: null });
      continue;
    }
    const perArt = ownedPerArt(entry, card, arts);
    for (const art of arts) {
      const url = art.image === null ? null : artUrlOf(card.key, art.image);
      for (let i = 0; i < (perArt.get(art.artId) ?? 0) && copies.length < MAX_PROXY_CARDS; i += 1) copies.push({ key: card.key, name: card.displayName, artUrl: url });
    }
  }
  return copies;
}

/**
 * Reads a stored queue (SEC-102-1): the collection's validation, then the queue's own limit. A row over
 * MAX_PROXY_CARDS copies is dropped, and rows are kept only while the total stays within the limit.
 */
export function parseProxyQueue(raw: unknown): Parsed<Collection> | null {
  const parsed = parseCollection(raw);
  if (parsed === null) return null;
  let dropped = parsed.dropped;
  let total = 0;
  const entries: CollectionEntry[] = [];
  for (const entry of parsed.value.entries) {
    if (entry.count > MAX_PROXY_CARDS || total + entry.count > MAX_PROXY_CARDS) {
      dropped += 1;
      continue;
    }
    total += entry.count;
    entries.push(entry);
  }
  return { value: { entries }, dropped };
}

export interface QueueRow {
  card: CardKey;
  count: number;
}

export interface AddResult {
  queue: Collection;
  /** Copies added. */
  added: number;
  /** Copies left out because the queue is full. */
  skipped: number;
}

/**
 * Adds copies to the queue (a card's count grows by the row's count). The queue holds at most MAX_PROXY_CARDS
 * copies, 999 of one card and MAX_COLLECTION_ENTRIES cards; what does not fit is counted in `skipped`.
 * Invalid rows (bad key, not a positive whole count) are ignored. Returns the same queue when nothing was added.
 */
export function addToQueue(queue: Collection, rows: readonly QueueRow[]): AddResult {
  let next = queue;
  let total = queueTotal(queue);
  let added = 0;
  let skipped = 0;
  for (const { card, count } of rows) {
    if (!isCardKey(card) || !Number.isInteger(count) || count < 1) continue;
    const current = countOf(next, card);
    const room = Math.min(MAX_PROXY_CARDS - total, MAX_COLLECTION_COUNT - current);
    const take = current === 0 && next.entries.length >= MAX_COLLECTION_ENTRIES ? 0 : Math.max(0, Math.min(count, room));
    skipped += count - take;
    if (take === 0) continue;
    next = withCount(next, card, current + take);
    total += take;
    added += take;
  }
  return { queue: next, added, skipped };
}

/** Marks every 10 mm of the calibration ruler (0 to 100 mm). */
export const RULER_TICKS_MM: readonly number[] = Array.from({ length: 11 }, (_, i) => i * 10);
