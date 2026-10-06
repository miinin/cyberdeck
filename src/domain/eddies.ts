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
/** "On curve" is reached in this share of games or more. */
export const EDDIE_TARGET_CHANCE = 0.8;

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

/** Fewest sellable cards that reach the target turn on curve in EDDIE_TARGET_CHANCE of games; null if none does. */
const recommendations = new Map<string, number | null>();

export function recommendedSellable(deckSize: number, targetTurn: number): number | null {
  if (deckSize <= 0) return null;
  const id = deckSize + ':' + targetTurn;
  const known = recommendations.get(id);
  if (known !== undefined) return known;
  const found = searchSellable(deckSize, targetTurn);
  recommendations.set(id, found);
  return found;
}

function searchSellable(deckSize: number, targetTurn: number): number | null {
  for (let sellable = 0; sellable <= deckSize; sellable++) {
    const chance = eddieCurve(deckSize, sellable, targetTurn).onCurve[targetTurn - 1] ?? 0;
    if (chance >= EDDIE_TARGET_CHANCE) return sellable;
  }
  return null;
}

export interface EddieSummary {
  /** Sellable (€$) copies in the main deck, and how many of them per type. */
  readonly sellable: number;
  readonly byType: ReadonlyMap<string, number>;
  /** Copies whose sellability is unknown (old or test data). */
  readonly unknown: number;
  readonly deckSize: number;
  readonly targetTurn: number;
  readonly recommended: number | null;
  readonly curve: EddieCurve;
}

/** Sellable cards of the main deck (Legends are not in it), the Eddie curve and the recommendation. */
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
  const targetTurn = eddieTargetTurn(averageCost(deck, cardsByKey));
  return {
    sellable,
    byType,
    unknown,
    deckSize,
    targetTurn,
    recommended: recommendedSellable(deckSize, targetTurn),
    curve: eddieCurve(deckSize, sellable),
  };
}
