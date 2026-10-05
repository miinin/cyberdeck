import type { Card } from './card';
import type { CardKey } from './cardKey';
import type { DeckContent } from './deck';
import { currentDeckMessages } from './deckMessages';

/** Deck rules (T-013). Sources: cyberpunktcg.com/gameplay-guide and ripperdeck.gg/rules, see the task card. */
export const LEGEND_COUNT = 3;
export const MIN_MAIN_DECK = 40;
export const MAX_MAIN_DECK = 50;
export const MAX_COPIES = 3;

export type DeckIssueType =
  | 'legend-count'
  | 'legend-duplicate'
  | 'main-size'
  | 'copies'
  | 'ram'
  | 'unknown-card';

export interface DeckIssue {
  readonly type: DeckIssueType;
  /** Unknown cards are a warning (the deck may still be legal); everything else breaks a rule. */
  readonly severity: 'error' | 'warning';
  /** Plain-language explanation (Finnish or English by UI language) for the player. Card names are shown as they are in the data. */
  readonly message: string;
  /** Cards the issue is about (empty for count rules). */
  readonly cards: readonly CardKey[];
}

export type CardsByKey = ReadonlyMap<CardKey, Card>;

export function toCardsByKey(cards: readonly Card[]): Map<CardKey, Card> {
  return new Map(cards.map((card) => [card.key, card]));
}

/** Copies of each card over all sections (a card may be in several sections). */
export function deckCounts(deck: DeckContent): Map<CardKey, number> {
  const counts = new Map<CardKey, number>();
  for (const section of deck.sections) {
    for (const { card, count } of section.cards) counts.set(card, (counts.get(card) ?? 0) + count);
  }
  return counts;
}

export interface DeckTotals {
  /** Legend cards, copies counted. */
  readonly legends: number;
  /** Everything that is known and not a Legend. */
  readonly main: number;
  readonly unknown: readonly CardKey[];
}

export function deckTotals(deck: DeckContent, cardsByKey: CardsByKey): DeckTotals {
  let legends = 0;
  let main = 0;
  const unknown: CardKey[] = [];
  for (const [key, count] of deckCounts(deck)) {
    const card = cardsByKey.get(key);
    if (card === undefined) unknown.push(key);
    else if (card.type === 'Legend') legends += count;
    else main += count;
  }
  return { legends, main, unknown };
}

/**
 * RAM limit per color: the sum of the RAM of the deck's Legends of that color. A color no Legend
 * gives has no entry, so nothing of that color can be played (the limit is 0).
 */
export function ramLimits(deck: DeckContent, cardsByKey: CardsByKey): Map<string, number> {
  const limits = new Map<string, number>();
  for (const [key, count] of deckCounts(deck)) {
    const card = cardsByKey.get(key);
    if (card === undefined || card.type !== 'Legend' || card.color === null) continue;
    limits.set(card.color, (limits.get(card.color) ?? 0) + (card.ram ?? 0) * count);
  }
  return limits;
}

function names(cards: readonly Card[]): string {
  return cards.map((card) => card.displayName).join(', ');
}

/** Returns every rule the deck breaks, in a fixed order. No errors means the deck is legal. */
export function validateDeck(deck: DeckContent, cardsByKey: CardsByKey): DeckIssue[] {
  const issues: DeckIssue[] = [];
  const counts = deckCounts(deck);
  const totals = deckTotals(deck, cardsByKey);
  const limits = ramLimits(deck, cardsByKey);

  if (totals.legends !== LEGEND_COUNT) {
    issues.push({
      type: 'legend-count',
      severity: 'error',
      message: currentDeckMessages().legendCount(totals.legends, LEGEND_COUNT),
      cards: [],
    });
  }

  // Legend names are unique by name alone: the subname does not make two "V" cards different.
  const legendsByName = new Map<string, { keys: CardKey[]; copies: number }>();
  for (const [key, count] of counts) {
    const card = cardsByKey.get(key);
    if (card === undefined || card.type !== 'Legend') continue;
    const entry = legendsByName.get(card.name) ?? { keys: [], copies: 0 };
    entry.keys.push(key);
    entry.copies += count;
    legendsByName.set(card.name, entry);
  }
  for (const [name, entry] of legendsByName) {
    if (entry.copies > 1) {
      issues.push({
        type: 'legend-duplicate',
        severity: 'error',
        message: currentDeckMessages().legendDuplicate(name, entry.copies),
        cards: entry.keys,
      });
    }
  }

  if (totals.main < MIN_MAIN_DECK || totals.main > MAX_MAIN_DECK) {
    issues.push({
      type: 'main-size',
      severity: 'error',
      message: currentDeckMessages().mainSize(totals.main, MIN_MAIN_DECK, MAX_MAIN_DECK),
      cards: [],
    });
  }

  for (const [key, count] of counts) {
    const card = cardsByKey.get(key);
    if (card === undefined || card.type === 'Legend' || count <= MAX_COPIES) continue;
    issues.push({
      type: 'copies',
      severity: 'error',
      message: currentDeckMessages().copies(card.displayName, count, MAX_COPIES),
      cards: [key],
    });
  }

  // Without a Legend there are no RAM limits to break; the Legend count issue already says so (B-020).
  const overRam = new Map<string, Card[]>();
  for (const key of totals.legends === 0 ? [] : counts.keys()) {
    const card = cardsByKey.get(key);
    if (card === undefined || card.type === 'Legend' || card.color === null || card.ram === null) continue;
    if (card.ram > (limits.get(card.color) ?? 0)) {
      overRam.set(card.color, [...(overRam.get(card.color) ?? []), card]);
    }
  }
  for (const [color, cards] of overRam) {
    const limit = limits.get(color) ?? 0;
    issues.push({
      type: 'ram',
      severity: 'error',
      message: currentDeckMessages().ram(color, limit, names(cards)),
      cards: cards.map((card) => card.key),
    });
  }

  if (totals.unknown.length > 0) {
    issues.push({
      type: 'unknown-card',
      severity: 'warning',
      message: currentDeckMessages().unknownCards(totals.unknown.length, totals.unknown),
      cards: totals.unknown,
    });
  }

  return issues;
}

/** Issues that break a rule (a deck without these is legal). */
export function errorsOf(issues: readonly DeckIssue[]): DeckIssue[] {
  return issues.filter((issue) => issue.severity === 'error');
}

/**
 * Why adding one more copy of `card` would break a rule, or null when it would not. Adding is still
 * allowed so an unfinished deck can be built; this only explains the dimmed state (T-013).
 */
export function addBlocker(card: Card, deck: DeckContent, cardsByKey: CardsByKey): string | null {
  const counts = deckCounts(deck);
  if (card.type === 'Legend') {
    const totals = deckTotals(deck, cardsByKey);
    if (totals.legends >= LEGEND_COUNT) return currentDeckMessages().legendsFull(LEGEND_COUNT);
    for (const [key, count] of counts) {
      const other = cardsByKey.get(key);
      if (count > 0 && other?.type === 'Legend' && other.name === card.name) {
        return currentDeckMessages().legendInDeck(card.name);
      }
    }
    return null;
  }
  if ((counts.get(card.key) ?? 0) >= MAX_COPIES) return currentDeckMessages().copiesFull(MAX_COPIES);
  // Without a Legend there are no RAM limits yet; the Legend count issue covers it (B-020, T-052).
  if (card.color !== null && card.ram !== null && deckTotals(deck, cardsByKey).legends > 0) {
    const limit = ramLimits(deck, cardsByKey).get(card.color) ?? 0;
    if (card.ram > limit) return currentDeckMessages().ramOver(card.ram, card.color, limit);
  }
  return null;
}

export interface DeckRow {
  readonly card: Card;
  readonly count: number;
}

export interface DeckGroups {
  readonly legends: readonly DeckRow[];
  /** Main deck by type (Unit, Gear, Program, then other types), each ordered by Cost, then name. */
  readonly groups: readonly { readonly type: string; readonly rows: readonly DeckRow[] }[];
  /** Keys not found in the card data, with their copies. */
  readonly unknown: readonly { readonly key: CardKey; readonly count: number }[];
}

const MAIN_TYPE_ORDER = ['Unit', 'Gear', 'Program'];

function byCostThenName(a: DeckRow, b: DeckRow): number {
  const cost = (a.card.cost ?? Number.MAX_SAFE_INTEGER) - (b.card.cost ?? Number.MAX_SAFE_INTEGER);
  return cost !== 0 ? cost : a.card.displayName.localeCompare(b.card.displayName, 'en');
}

/** The deck as the editor shows it: Legends, then the main deck grouped by type in Cost order. */
export function groupDeck(deck: DeckContent, cardsByKey: CardsByKey): DeckGroups {
  const legends: DeckRow[] = [];
  const byType = new Map<string, DeckRow[]>();
  const unknown: { key: CardKey; count: number }[] = [];
  for (const [key, count] of deckCounts(deck)) {
    const card = cardsByKey.get(key);
    if (card === undefined) unknown.push({ key, count });
    else if (card.type === 'Legend') legends.push({ card, count });
    else byType.set(card.type, [...(byType.get(card.type) ?? []), { card, count }]);
  }
  const otherTypes = [...byType.keys()].filter((type) => !MAIN_TYPE_ORDER.includes(type));
  const groups = [...MAIN_TYPE_ORDER, ...otherTypes]
    .filter((type) => byType.has(type))
    .map((type) => ({ type, rows: [...(byType.get(type) ?? [])].sort(byCostThenName) }));
  return { legends: legends.sort(byCostThenName), groups, unknown };
}

/**
 * True when `card` is a Legend and the deck already has a Legend with the same name (the subname
 * does not matter, T-013). The editor refuses to add such a Legend (T-045).
 */
export function hasSameNameLegend(card: Card, deck: DeckContent, cardsByKey: CardsByKey): boolean {
  if (card.type !== 'Legend') return false;
  for (const [key, count] of deckCounts(deck)) {
    const other = cardsByKey.get(key);
    if (count > 0 && other?.type === 'Legend' && other.name === card.name) return true;
  }
  return false;
}

/** Cost values 0 … this value are their own bar of the cost curve; higher costs share the last bar. */
export const COST_CURVE_LAST = 6;

/**
 * Cost curve of the main deck (T-049): copies per Cost, index 0 … COST_CURVE_LAST (the last bar holds
 * "6 or more"). Legends, unknown cards and cards without a Cost are not counted.
 */
export function costCurve(deck: DeckContent, cardsByKey: CardsByKey): number[] {
  const bars = new Array<number>(COST_CURVE_LAST + 1).fill(0);
  for (const [key, count] of deckCounts(deck)) {
    const card = cardsByKey.get(key);
    if (card === undefined || card.type === 'Legend' || card.cost === null) continue;
    const index = Math.min(Math.max(Math.trunc(card.cost), 0), COST_CURVE_LAST);
    bars[index] = (bars[index] ?? 0) + count;
  }
  return bars;
}

export interface ColorShare {
  readonly color: string;
  readonly count: number;
}

/**
 * Main deck copies per card color (T-050c), most first, then by name. Legends, unknown cards and cards
 * without a color are not counted.
 */
export function colorDistribution(deck: DeckContent, cardsByKey: CardsByKey): ColorShare[] {
  const byColor = new Map<string, number>();
  for (const [key, count] of deckCounts(deck)) {
    const card = cardsByKey.get(key);
    if (card === undefined || card.type === 'Legend' || card.color === null || count <= 0) continue;
    byColor.set(card.color, (byColor.get(card.color) ?? 0) + count);
  }
  return [...byColor]
    .map(([color, count]) => ({ color, count }))
    .sort((a, b) => b.count - a.count || a.color.localeCompare(b.color, 'en'));
}
