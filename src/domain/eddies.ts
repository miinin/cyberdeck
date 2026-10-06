import type { DeckContent } from './deck';
import type { CardsByKey } from './deckRules';
import { deckCounts } from './deckRules';
import { DRAWS_PER_TURN, OPENING_HAND, averageCost, mainDeckSize } from './deckStats';

/*
 * Eddies (T-096). Game rules (official how-to-play): the Eddies area starts empty; once per turn you may sell
 * one card with the €$ tag from your hand, and it becomes 1 Eddie for good (Eddies ready again every turn).
 * So Eddies grow by at most one a turn, and only while there is a sellable card in hand. Legends can also be
 * spent for 1 Eddie each; that is left out here, so the numbers are on the careful side.
 */

/** Turns the Eddie curve covers. */
export const EDDIE_TURNS = 6;
/** Simulated games per estimate. Fixed seed: the same deck always gives the same numbers. */
export const EDDIE_RUNS = 4000;

export interface EddieCurve {
  /** Average Eddies at the end of turns 1 … EDDIE_TURNS. */
  readonly expected: readonly number[];
  /** Chance of having sold every turn up to and including turn t (Eddies = t). */
  readonly onCurve: readonly number[];
}

/** Small seeded generator (LCG): reproducible estimates, no Math.random in the domain. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

/**
 * Simulates selling one sellable card a turn, whenever the hand has one: an opening hand of OPENING_HAND,
 * DRAWS_PER_TURN draws every turn (also on turn 1, as the draw odds assume). Only how many sellable cards are
 * in hand matters, so each game is a shuffle of `sellable` marked cards among `deckSize`.
 */
export function eddieCurve(deckSize: number, sellable: number, turns = EDDIE_TURNS, runs = EDDIE_RUNS): EddieCurve {
  const expected = new Array<number>(turns).fill(0);
  const onCurve = new Array<number>(turns).fill(0);
  if (deckSize <= 0) return { expected, onCurve };
  const marks = Math.min(Math.max(sellable, 0), deckSize);
  const random = seeded(deckSize * 1009 + marks);
  const deck = new Array<boolean>(deckSize);
  for (let run = 0; run < runs; run++) {
    for (let i = 0; i < deckSize; i++) deck[i] = i < marks;
    // Only the first cards seen matter: shuffle that many positions (partial Fisher–Yates).
    const seen = Math.min(deckSize, OPENING_HAND + DRAWS_PER_TURN * turns);
    for (let i = 0; i < seen; i++) {
      const j = i + Math.floor(random() * (deckSize - i));
      const tmp = deck[i] as boolean;
      deck[i] = deck[j] as boolean;
      deck[j] = tmp;
    }
    let inHand = 0;
    for (let i = 0; i < Math.min(OPENING_HAND, deckSize); i++) if (deck[i]) inHand += 1;
    let next = Math.min(OPENING_HAND, deckSize);
    let eddies = 0;
    let streak = true;
    for (let turn = 0; turn < turns; turn++) {
      for (let d = 0; d < DRAWS_PER_TURN && next < deckSize; d++, next++) if (deck[next]) inHand += 1;
      if (inHand > 0) {
        inHand -= 1;
        eddies += 1;
      } else {
        streak = false;
      }
      expected[turn] = (expected[turn] ?? 0) + eddies;
      if (streak) onCurve[turn] = (onCurve[turn] ?? 0) + 1;
    }
  }
  return { expected: expected.map((sum) => sum / runs), onCurve: onCurve.map((hits) => hits / runs) };
}

/**
 * The turn the deck wants to reach on Eddies alone: its average Cost rounded up, 2 … EDDIE_TURNS.
 * A deck of 4-cost cards wants 4 Eddies by turn 4.
 */
export function eddieTargetTurn(avgCost: number | null): number {
  if (avgCost === null) return 3;
  return Math.min(EDDIE_TURNS, Math.max(2, Math.ceil(avgCost - 0.05)));
}

/** Target share of the main deck that is sellable (D-024, T-103): centre at an average Cost of 3, ± half the band. */
export const SELLABLE_SHARE_AT_COST_3 = 0.575;
export const SELLABLE_SHARE_PER_COST = 0.05;
export const SELLABLE_SHARE_MIN = 0.45;
export const SELLABLE_SHARE_MAX = 0.7;
export const SELLABLE_BAND = 0.025;

export interface SellableTarget {
  /** Target share of the main deck, e.g. 0.55 … 0.60. */
  readonly shareLow: number;
  readonly shareHigh: number;
  /** The same as copies of the deck, rounded: min … max. */
  readonly min: number;
  readonly max: number;
}

/**
 * Recommended sellable (€$) cards as a share of the main deck: 55–60 % at an average Cost of 3, more for a
 * pricier deck, fewer for a cheaper one. null for an empty deck.
 */
export function sellableTarget(deckSize: number, avgCost: number | null): SellableTarget | null {
  if (deckSize <= 0) return null;
  const centre = Math.min(
    SELLABLE_SHARE_MAX,
    Math.max(SELLABLE_SHARE_MIN, SELLABLE_SHARE_AT_COST_3 + ((avgCost ?? 3) - 3) * SELLABLE_SHARE_PER_COST),
  );
  const shareLow = centre - SELLABLE_BAND;
  const shareHigh = centre + SELLABLE_BAND;
  return { shareLow, shareHigh, min: Math.round(deckSize * shareLow), max: Math.round(deckSize * shareHigh) };
}

export interface EddieSummary {
  /** Sellable (€$) copies in the main deck, and how many of them per type. */
  readonly sellable: number;
  readonly byType: ReadonlyMap<string, number>;
  /** Copies whose sellability is unknown (old or test data). */
  readonly unknown: number;
  readonly deckSize: number;
  readonly targetTurn: number;
  /** Recommended range of sellable cards (D-024), null for an empty deck. */
  readonly target: SellableTarget | null;
  readonly curve: EddieCurve;
}

/** Sellable cards of the main deck (Legends are not in it), the Eddie curve and the recommended range. */
export function eddieSummary(deck: DeckContent, cardsByKey: CardsByKey): EddieSummary {
  let sellable = 0;
  let unknown = 0;
  const byType = new Map<string, number>();
  for (const [key, count] of deckCounts(deck)) {
    const card = cardsByKey.get(key);
    if (card === undefined || card.type === 'Legend' || count <= 0) continue;
    if (card.eddiable === true) {
      sellable += count;
      byType.set(card.type, (byType.get(card.type) ?? 0) + count);
    } else if (card.eddiable !== false) {
      unknown += count;
    }
  }
  const deckSize = mainDeckSize(deck, cardsByKey);
  const avgCost = averageCost(deck, cardsByKey);
  const targetTurn = eddieTargetTurn(avgCost);
  return {
    sellable,
    byType,
    unknown,
    deckSize,
    targetTurn,
    target: sellableTarget(deckSize, avgCost),
    curve: eddieCurve(deckSize, sellable),
  };
}
