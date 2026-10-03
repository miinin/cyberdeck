import type { Card } from './card';
import type { DeckContent } from './deck';
import { deckCounts } from './deckRules';
import type { CardsByKey } from './deckRules';

/**
 * More deck statistics (T-053): averages, Power, RAM and rarity distributions and draw odds. Pure
 * functions over the main deck: Legends are kept apart from the deck in the game, so they are never counted.
 */

/** Opening hand size, draws per turn and mulligans (T-053, beta rules, see the task card). One place to change. */
export const OPENING_HAND = 6;
export const DRAWS_PER_TURN = 1;
export const MULLIGANS = 1;

/** Turns shown in the draw odds table. The starting player also draws on turn 1. */
export const DRAW_TURNS = [1, 3, 5] as const;

/** Cards seen by the end of the draw of `turn` (0 = opening hand only). */
export function cardsSeen(turn: number): number {
  return OPENING_HAND + DRAWS_PER_TURN * turn;
}

/** Power values 0 … this value are their own bar; higher values share the last bar ("8+"). */
export const POWER_CURVE_LAST = 8;

/** Highest Cost that counts as a cheap opening card. */
export const CHEAP_COST = 2;

/** Main deck rows: known, non-Legend cards with a positive count. */
function mainRows(deck: DeckContent, cardsByKey: CardsByKey): { card: Card; count: number }[] {
  const rows: { card: Card; count: number }[] = [];
  for (const [key, count] of deckCounts(deck)) {
    const card = cardsByKey.get(key);
    if (card !== undefined && card.type !== 'Legend' && count > 0) rows.push({ card, count });
  }
  return rows;
}

/** Copies of the main deck, unknown cards included (they are in the deck, we just cannot name them). */
export function mainDeckSize(deck: DeckContent, cardsByKey: CardsByKey): number {
  let size = 0;
  for (const [key, count] of deckCounts(deck)) {
    if (count > 0 && cardsByKey.get(key)?.type !== 'Legend') size += count;
  }
  return size;
}

function weightedAverage(rows: readonly { value: number; count: number }[]): number | null {
  let sum = 0;
  let copies = 0;
  for (const { value, count } of rows) {
    sum += value * count;
    copies += count;
  }
  return copies === 0 ? null : sum / copies;
}

/** Average Cost of the main deck's cards that have a Cost, weighted by copies; null when there are none. */
export function averageCost(deck: DeckContent, cardsByKey: CardsByKey): number | null {
  return weightedAverage(
    mainRows(deck, cardsByKey).flatMap(({ card, count }) => (card.cost === null ? [] : [{ value: card.cost, count }])),
  );
}

/** Average Power of the main deck's Units that have a Power; null when there are none. */
export function averagePower(deck: DeckContent, cardsByKey: CardsByKey): number | null {
  return weightedAverage(
    mainRows(deck, cardsByKey).flatMap(({ card, count }) =>
      card.type !== 'Unit' || card.power === null ? [] : [{ value: card.power, count }],
    ),
  );
}

/** Units per Power, index 0 … POWER_CURVE_LAST (the last bar holds "8 or more"). */
export function powerCurve(deck: DeckContent, cardsByKey: CardsByKey): number[] {
  const bars = new Array<number>(POWER_CURVE_LAST + 1).fill(0);
  for (const { card, count } of mainRows(deck, cardsByKey)) {
    if (card.type !== 'Unit' || card.power === null) continue;
    const index = Math.min(Math.max(Math.trunc(card.power), 0), POWER_CURVE_LAST);
    bars[index] = (bars[index] ?? 0) + count;
  }
  return bars;
}

export interface ValueShare {
  readonly value: number;
  readonly count: number;
}

/** Main deck copies per RAM value, lowest first. Cards without RAM are not counted. */
export function ramDistribution(deck: DeckContent, cardsByKey: CardsByKey): ValueShare[] {
  const byRam = new Map<number, number>();
  for (const { card, count } of mainRows(deck, cardsByKey)) {
    if (card.ram === null) continue;
    byRam.set(card.ram, (byRam.get(card.ram) ?? 0) + count);
  }
  return [...byRam].map(([value, count]) => ({ value, count })).sort((a, b) => a.value - b.value);
}

const RARITY_ORDER = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

export interface RarityShare {
  /** null = unknown rarity. */
  readonly rarity: string | null;
  readonly count: number;
}

/** Main deck copies per rarity: Common … Legendary first, other rarities by name, unknown last. */
export function rarityDistribution(deck: DeckContent, cardsByKey: CardsByKey): RarityShare[] {
  const byRarity = new Map<string | null, number>();
  for (const { card, count } of mainRows(deck, cardsByKey)) {
    byRarity.set(card.rarity, (byRarity.get(card.rarity) ?? 0) + count);
  }
  const rank = (rarity: string | null): number => {
    if (rarity === null) return RARITY_ORDER.length + 1;
    const index = RARITY_ORDER.indexOf(rarity);
    return index === -1 ? RARITY_ORDER.length : index;
  };
  return [...byRarity]
    .map(([rarity, count]) => ({ rarity, count }))
    .sort((a, b) => rank(a.rarity) - rank(b.rarity) || (a.rarity ?? '').localeCompare(b.rarity ?? '', 'en'));
}

/**
 * Hypergeometric chance to see at least one of `copies` cards when `drawn` cards are drawn from a deck of
 * `deckSize`: 1 − C(N−K, n) / C(N, n), computed as a product so no big binomials are needed.
 */
export function atLeastOneProbability(deckSize: number, copies: number, drawn: number): number {
  const n = Math.max(0, Math.trunc(deckSize));
  const k = Math.min(Math.max(0, Math.trunc(copies)), n);
  const d = Math.max(0, Math.trunc(drawn));
  if (n === 0 || k === 0 || d === 0) return 0;
  if (d > n - k) return 1;
  // C(N−K, n) / C(N, n) = Π_{i=0}^{n−1} (N−K−i) / (N−i)
  let none = 1;
  for (let i = 0; i < d; i += 1) none *= (n - k - i) / (n - i);
  return 1 - none;
}

export interface DrawOddsRow {
  readonly card: Card;
  readonly count: number;
  /** One probability per entry of `drawCounts`, 0 … 1. */
  readonly odds: readonly number[];
}

/**
 * Chance to see at least one copy of each main deck card after each number of cards in `drawCounts`.
 * Unknown cards count towards the deck size but have no row. Most copies first, then by name.
 */
export function drawProbabilities(
  deck: DeckContent,
  cardsByKey: CardsByKey,
  drawCounts: readonly number[],
): DrawOddsRow[] {
  const size = mainDeckSize(deck, cardsByKey);
  return mainRows(deck, cardsByKey)
    .sort((a, b) => b.count - a.count || a.card.displayName.localeCompare(b.card.displayName, 'en'))
    .map(({ card, count }) => ({
      card,
      count,
      odds: drawCounts.map((drawn) => atLeastOneProbability(size, count, drawn)),
    }));
}

/** Chance that the opening hand has at least one main deck card with Cost ≤ CHEAP_COST. */
export function cheapOpeningProbability(deck: DeckContent, cardsByKey: CardsByKey): number {
  const cheap = mainRows(deck, cardsByKey).reduce(
    (sum, { card, count }) => sum + (card.cost !== null && card.cost <= CHEAP_COST ? count : 0),
    0,
  );
  return atLeastOneProbability(mainDeckSize(deck, cardsByKey), cheap, OPENING_HAND);
}
