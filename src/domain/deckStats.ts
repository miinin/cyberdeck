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

/** Chance to see at least `atLeast` of `copies` cards in `drawn` cards from a deck of `deckSize` (T-075, hypergeometric). */
export function atLeastKProbability(deckSize: number, copies: number, drawn: number, atLeast: number): number {
  const n = Math.max(0, Math.trunc(deckSize));
  const k = Math.min(Math.max(0, Math.trunc(copies)), n);
  const d = Math.min(Math.max(0, Math.trunc(drawn)), n);
  const need = Math.trunc(atLeast);
  if (need <= 0) return 1;
  if (k < need || d < need) return 0;
  const lnFact = (x: number) => {
    let sum = 0;
    for (let i = 2; i <= x; i += 1) sum += Math.log(i);
    return sum;
  };
  const lnChoose = (a: number, b: number) => lnFact(a) - lnFact(b) - lnFact(a - b);
  let below = 0;
  for (let j = 0; j < need; j += 1) {
    if (j > d || d - j > n - k) continue;
    below += Math.exp(lnChoose(k, j) + lnChoose(n - k, d - j) - lnChoose(n, d));
  }
  return Math.min(1, Math.max(0, 1 - below));
}

/** A group of main deck cards for the odds calculator (T-075). */
export type CardGroup =
  | { kind: 'type'; value: string }
  | { kind: 'color'; value: string }
  | { kind: 'maxCost'; value: number };

export function inGroup(card: Card, group: CardGroup): boolean {
  if (group.kind === 'type') return card.type === group.value;
  if (group.kind === 'color') return card.color === group.value;
  return card.cost !== null && card.cost <= group.value;
}

export const GROUP_TURNS = [1, 2, 3, 4, 5, 6] as const;

export interface GroupOddsRow {
  readonly turn: number;
  readonly atLeast1: number;
  readonly atLeast2: number;
}

/** Copies of the group in the main deck and the chance of 1+ and 2+ of them by each turn. */
export function groupOdds(
  deck: DeckContent,
  cardsByKey: CardsByKey,
  group: CardGroup,
  turns: readonly number[] = GROUP_TURNS,
): { copies: number; rows: GroupOddsRow[] } {
  const size = mainDeckSize(deck, cardsByKey);
  const copies = mainRows(deck, cardsByKey).reduce((sum, { card, count }) => sum + (inGroup(card, group) ? count : 0), 0);
  return {
    copies,
    rows: turns.map((turn) => ({
      turn,
      atLeast1: atLeastKProbability(size, copies, cardsSeen(turn), 1),
      atLeast2: atLeastKProbability(size, copies, cardsSeen(turn), 2),
    })),
  };
}

/** The main deck types drawn as their own colour in the charts (T-093); anything else is "other". */
export const CHART_TYPES = ['Unit', 'Program', 'Gear'] as const;
export type ChartType = (typeof CHART_TYPES)[number] | 'other';

export function chartType(card: Card): ChartType {
  return (CHART_TYPES as readonly string[]).includes(card.type) ? (card.type as ChartType) : 'other';
}

export interface CostBucket {
  /** Cost of the bucket; the last one holds `last` and everything above it. */
  readonly cost: number;
  readonly total: number;
  readonly byType: Readonly<Record<ChartType, number>>;
  /** The cards of the bucket, most copies first, then by name. */
  readonly cards: readonly { card: Card; count: number }[];
}

/**
 * Cost curve split by type (T-093): copies per Cost 0 … `last` ("6+"), each bucket by Unit / Program / Gear,
 * with the cards in it. Same counting as costCurve: no Legends, no cards without a Cost.
 */
export function costCurveByType(deck: DeckContent, cardsByKey: CardsByKey, last: number): CostBucket[] {
  const buckets = Array.from({ length: last + 1 }, (_, cost) => ({
    cost,
    total: 0,
    byType: { Unit: 0, Program: 0, Gear: 0, other: 0 } as Record<ChartType, number>,
    cards: [] as { card: Card; count: number }[],
  }));
  for (const row of mainRows(deck, cardsByKey)) {
    if (row.card.cost === null) continue;
    const bucket = buckets[Math.min(Math.max(Math.trunc(row.card.cost), 0), last)];
    if (bucket === undefined) continue;
    bucket.total += row.count;
    bucket.byType[chartType(row.card)] += row.count;
    bucket.cards.push(row);
  }
  for (const bucket of buckets) {
    bucket.cards.sort((a, b) => b.count - a.count || a.card.displayName.localeCompare(b.card.displayName, 'en'));
  }
  return buckets;
}

export interface RamFit {
  readonly color: string;
  /** RAM the deck's Legends of this colour give (0 = none). */
  readonly available: number;
  /** Highest RAM a main deck card of this colour needs, or null when no card of the colour has RAM. */
  readonly needed: number | null;
  /** Main deck copies of this colour that need more RAM than there is. */
  readonly overCopies: number;
}

/**
 * RAM per colour (T-093): what the Legends give against what the main deck needs. The rule itself is in
 * validateDeck; this is the picture of it. Colours of the Legends and of the main deck, Legends' first.
 */
export function ramFit(deck: DeckContent, cardsByKey: CardsByKey, limits: ReadonlyMap<string, number>): RamFit[] {
  const needed = new Map<string, number>();
  const over = new Map<string, number>();
  for (const { card, count } of mainRows(deck, cardsByKey)) {
    if (card.color === null || card.ram === null) continue;
    needed.set(card.color, Math.max(needed.get(card.color) ?? 0, card.ram));
    if (card.ram > (limits.get(card.color) ?? 0)) over.set(card.color, (over.get(card.color) ?? 0) + count);
  }
  const colors = [...new Set([...limits.keys(), ...needed.keys()])];
  return colors.map((color) => ({
    color,
    available: limits.get(color) ?? 0,
    needed: needed.get(color) ?? null,
    overCopies: over.get(color) ?? 0,
  }));
}
