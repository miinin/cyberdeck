import type { Card } from './card';
import type { Collection } from './collection';
import { countOf, versionsOf } from './collection';
import { isSpecialRarity } from './arts';
import { setFilterId } from './printing';
import type { Printing } from './printing';
import { isMainSetPrinting } from './setFilter';

/*
 * The collection binder (T-109, T-116): the cards of the one set (Retail and Beta together) as pocket pages,
 * nine to a page, in collector number order. Pure functions; the view only draws what they return.
 */

export const POCKETS_PER_PAGE = 9;

export interface Pocket {
  card: Card;
  /** The collector number as printed (Retail's if the card has one, else Beta's, e.g. "012" or "005β"); "" when unknown. */
  number: string;
  /** Copies owned in the two main sets together (0 = missing). */
  copies: number;
  /** The special rarity whose picture to show: the one the user owns (first, English first), else null. */
  artRarity: string | null;
  /** Owned, and only as the Beta edition (no Retail copy): shown with a quiet "Beta" mark. */
  betaOnly: boolean;
}

/** Sort key of a collector number: its leading digits, then the rest as text ("5" < "5a" < "6"). */
function numberKey(number: string): [number, string] {
  const match = /(\d+)(.*)$/.exec(number);
  return match === null ? [Number.POSITIVE_INFINITY, number] : [Number(match[1]), (match[2] ?? '').toLowerCase()];
}

export function compareCollectorNumbers(a: string, b: string): number {
  const [x, xs] = numberKey(a);
  const [y, ys] = numberKey(b);
  if (x !== y) return x < y ? -1 : 1;
  return xs < ys ? -1 : xs > ys ? 1 : 0;
}

const BETA_FAMILY = 'welcome-to-night-city-beta';
const isBeta = (printing: Printing) => setFilterId(printing) === BETA_FAMILY;

/** The printings of a card in the two main sets (Retail and Beta, D-022): English first, Retail before Beta, then by collector number. */
function mainPrintings(card: Card): Printing[] {
  return (card.printings ?? [])
    .filter(isMainSetPrinting)
    .sort(
      (a, b) =>
        Number(b.language === 'en') - Number(a.language === 'en') ||
        Number(isBeta(a)) - Number(isBeta(b)) ||
        compareCollectorNumbers(a.number, b.number),
    );
}

/**
 * Copies of a card in the main sets: the recorded versions of its printings there. A card with no recorded
 * versions at all counts with its total, since nothing says it is from elsewhere.
 */
export function copiesInMainSets(card: Card, collection: Collection): number {
  const versions = versionsOf(collection, card.key);
  if (Object.keys(versions).length === 0) return countOf(collection, card.key);
  return mainPrintings(card).reduce((sum, printing) => sum + (versions[printing.key] ?? 0), 0);
}

/** The special rarity the user owns in the main sets and that has a picture, or null. */
export function ownedSpecialRarity(card: Card, collection: Collection, hasArt: (cardKey: string, rarity: string) => boolean): string | null {
  const versions = versionsOf(collection, card.key);
  for (const printing of mainPrintings(card)) {
    const rarity = printing.rarity;
    if (isSpecialRarity(rarity) && (versions[printing.key] ?? 0) > 0 && hasArt(card.key, rarity)) return rarity;
  }
  return null;
}

/** Only the Beta edition is owned: some Beta copy is recorded and no Retail copy. Without recorded versions nothing says Beta. */
export function ownsOnlyBeta(card: Card, collection: Collection): boolean {
  const versions = versionsOf(collection, card.key);
  let beta = 0;
  let retail = 0;
  for (const printing of mainPrintings(card)) {
    const n = versions[printing.key] ?? 0;
    if (isBeta(printing)) beta += n;
    else retail += n;
  }
  return beta > 0 && retail === 0;
}

/** All pockets of the one binder set (every card of Retail and Beta once) in collector number order (the catalog order breaks ties). */
export function binderPockets(
  cards: readonly Card[],
  collection: Collection,
  hasArt: (cardKey: string, rarity: string) => boolean = () => true,
): Pocket[] {
  const pockets: { pocket: Pocket; index: number }[] = [];
  cards.forEach((card, index) => {
    const inSets = mainPrintings(card);
    if (inSets.length === 0) return;
    const copies = copiesInMainSets(card, collection);
    pockets.push({
      index,
      pocket: {
        card,
        number: inSets[0]?.number ?? '',
        copies,
        artRarity: copies > 0 ? ownedSpecialRarity(card, collection, hasArt) : null,
        betaOnly: copies > 0 && ownsOnlyBeta(card, collection),
      },
    });
  });
  pockets.sort((a, b) => compareCollectorNumbers(a.pocket.number, b.pocket.number) || a.index - b.index);
  return pockets.map((entry) => entry.pocket);
}

/** Pockets in pages of `size`. An empty list has no pages. */
export function paginate<T>(items: readonly T[], size: number = POCKETS_PER_PAGE): T[][] {
  const pages: T[][] = [];
  for (let start = 0; start < items.length; start += size) pages.push(items.slice(start, start + size));
  return pages;
}

export function clampPage(page: number, pageCount: number): number {
  if (pageCount <= 0 || !Number.isFinite(page)) return 0;
  return Math.min(Math.max(0, Math.trunc(page)), pageCount - 1);
}

/** The page indexes on screen: one, or a spread of two that starts on an even page (0-1, 2-3 …). */
export function visiblePages(page: number, pageCount: number, columns: 1 | 2): number[] {
  if (pageCount <= 0) return [];
  const current = clampPage(page, pageCount);
  const first = columns === 2 ? current - (current % 2) : current;
  return [first, ...(columns === 2 && first + 1 < pageCount ? [first + 1] : [])];
}

/** Turning a page: forward (+1) or back (-1), by a whole spread on a wide screen; stays within the book. */
export function turnPage(page: number, direction: 1 | -1, pageCount: number, columns: 1 | 2): number {
  const first = visiblePages(page, pageCount, columns)[0] ?? 0;
  return clampPage(first + direction * columns, pageCount);
}

/** A horizontal swipe turns the page: a left swipe goes forward. Short or mostly vertical moves are scrolling. */
export function swipeDirection(dx: number, dy: number, threshold = 48): 1 | -1 | 0 {
  if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.5) return 0;
  return dx < 0 ? 1 : -1;
}

/** "Page 3 / 9" or, for a spread, "Pages 3–4 / 9" (1-based). */
export function pageNumbers(shown: readonly number[]): { first: number; last: number } {
  const first = (shown[0] ?? 0) + 1;
  return { first, last: (shown[shown.length - 1] ?? 0) + 1 };
}
