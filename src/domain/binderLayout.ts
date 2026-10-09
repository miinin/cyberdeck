import { isCardKey } from './cardKey';
import { POCKETS_PER_PAGE } from './binder';

/*
 * The own binder (T-120): which card sits in which pocket, as the user arranged it. Pure functions on the pocket list;
 * every one returns a new list (or the same one when nothing changes). The layout is stored on this device only.
 */

export const MAX_BINDER_POCKETS = 900;
export const MAX_BINDER_PAGES = MAX_BINDER_POCKETS / POCKETS_PER_PAGE;
export const MAX_BINDER_NAME = 40;

export interface BinderLayout {
  v: 1;
  /** The name on the front cover; empty = the default name of the language. */
  name: string;
  /** Card keys, null = an empty pocket. Always whole pages (a multiple of nine, at least one page). */
  pockets: (string | null)[];
}

export function cleanBinderName(name: string): string {
  return name.trim().slice(0, MAX_BINDER_NAME).trim();
}

/** Pads the pockets to whole pages, at least one. */
export function padToPages(pockets: readonly (string | null)[]): (string | null)[] {
  const pages = Math.max(1, Math.ceil(pockets.length / POCKETS_PER_PAGE));
  return [...pockets, ...Array.from({ length: pages * POCKETS_PER_PAGE - pockets.length }, () => null)];
}

/**
 * Reads a stored layout. Stored data is not trusted (SR-11): anything that is not exactly a layout, or that is too large,
 * is null (the caller then starts a new layout), never a partly read one.
 */
export function normalizeBinderLayout(value: unknown): BinderLayout | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const { v, name, pockets } = value as Record<string, unknown>;
  if (v !== 1 || typeof name !== 'string' || !Array.isArray(pockets) || pockets.length > MAX_BINDER_POCKETS) return null;
  const list: (string | null)[] = [];
  for (const entry of pockets as unknown[]) {
    if (entry !== null && !(typeof entry === 'string' && isCardKey(entry))) return null;
    list.push(entry);
  }
  return { v: 1, name: cleanBinderName(name), pockets: padToPages(list) };
}

/** The first layout: the given cards one to a pocket in order, the last page filled up with empty pockets. */
export function initialBinderLayout(cardKeys: readonly string[], name: string): BinderLayout {
  return { v: 1, name: cleanBinderName(name), pockets: padToPages(cardKeys.slice(0, MAX_BINDER_POCKETS)) };
}

export function layoutPageCount(pockets: readonly unknown[]): number {
  return Math.max(1, Math.ceil(pockets.length / POCKETS_PER_PAGE));
}

/** Tapping a pocket and then another: the cards swap, or the card moves when the target is empty. */
export function swapOrMovePocket(pockets: readonly (string | null)[], from: number, to: number): (string | null)[] {
  const a = pockets[from];
  const b = pockets[to];
  if (from === to || a === undefined || b === undefined) return [...pockets];
  const next = [...pockets];
  next[from] = b;
  next[to] = a;
  return next;
}

/** Puts a card in a pocket (null empties it). A position outside the book changes nothing. */
export function setPocket(pockets: readonly (string | null)[], index: number, key: string | null): (string | null)[] {
  if (!Number.isInteger(index) || index < 0 || index >= pockets.length) return [...pockets];
  const next = [...pockets];
  next[index] = key;
  return next;
}

/** A new empty page at the end; the book stops at the largest size that can be stored. */
export function addPage(pockets: readonly (string | null)[]): (string | null)[] {
  if (pockets.length + POCKETS_PER_PAGE > MAX_BINDER_POCKETS) return [...pockets];
  return [...pockets, ...Array.from({ length: POCKETS_PER_PAGE }, () => null)];
}

export function isPageEmpty(pockets: readonly (string | null)[], page: number): boolean {
  const slots = pockets.slice(page * POCKETS_PER_PAGE, (page + 1) * POCKETS_PER_PAGE);
  return slots.length > 0 && slots.every((slot) => slot === null);
}

/** A page can be removed only when it is empty (no card is lost by accident), and the last page stays. */
export function canRemovePage(pockets: readonly (string | null)[], page: number): boolean {
  return layoutPageCount(pockets) > 1 && isPageEmpty(pockets, page);
}

export function removePage(pockets: readonly (string | null)[], page: number): (string | null)[] {
  if (!canRemovePage(pockets, page)) return [...pockets];
  return [...pockets.slice(0, page * POCKETS_PER_PAGE), ...pockets.slice((page + 1) * POCKETS_PER_PAGE)];
}

/** How many pockets hold each card; `except` leaves one pocket out (the one whose card is being replaced). */
export function placedCounts(pockets: readonly (string | null)[], except: number | null = null): Map<string, number> {
  const counts = new Map<string, number>();
  pockets.forEach((key, index) => {
    if (key !== null && index !== except) counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
}

/** A card can go in another pocket while fewer pockets hold it than the user has copies. */
export function canPlaceCard(placed: number, copies: number): boolean {
  return placed < copies;
}

/**
 * For each pocket, whether its card is really there: a card in more pockets than the user has copies (or none) is a ghost
 * from its extra pockets on. Empty pockets are false. The pocket keeps its place either way.
 */
export function pocketsBacked(pockets: readonly (string | null)[], copiesOf: (key: string) => number): boolean[] {
  const used = new Map<string, number>();
  return pockets.map((key) => {
    if (key === null) return false;
    const n = (used.get(key) ?? 0) + 1;
    used.set(key, n);
    return n <= copiesOf(key);
  });
}
