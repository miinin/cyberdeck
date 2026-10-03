import type { Card } from './card';
import type { DeckContent } from './deck';
import { deckCounts } from './deckRules';
import type { CardsByKey } from './deckRules';
import { MULLIGANS, OPENING_HAND } from './deckStats';

export { MULLIGANS, OPENING_HAND };

/**
 * Test hand (T-053): an example opening hand from a deck. Pure functions; the random source is injected so
 * tests are deterministic. Legends are shuffled into their own row and never drawn (game rules, see the card).
 */

/** Random number 0 ≤ x < 1. The UI passes Math.random; tests pass a seeded generator. */
export type Rng = () => number;

export interface TestHandState {
  /** Top of the library is index 0. */
  readonly library: readonly Card[];
  /** Oldest first: the newest drawn card is last. */
  readonly hand: readonly Card[];
  /** Legends in their random order. */
  readonly legends: readonly Card[];
  readonly mulliganUsed: boolean;
  /** Cards drawn after the opening hand; a mulligan is only allowed before any. */
  readonly drawnAfterOpening: number;
}

/** Fisher–Yates shuffle into a new array; the input is not changed. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    const swap = result[i] as T;
    result[i] = result[j] as T;
    result[j] = swap;
  }
  return result;
}

function dealOpening(cards: readonly Card[], rng: Rng): { library: Card[]; hand: Card[] } {
  const shuffled = shuffle(cards, rng);
  return {
    hand: shuffled.slice(0, OPENING_HAND),
    library: shuffled.slice(OPENING_HAND),
  };
}

/** Shuffles the main deck (copies expanded, unknown cards left out) and deals the opening hand. */
export function startHand(deck: DeckContent, cardsByKey: CardsByKey, rng: Rng): TestHandState {
  const main: Card[] = [];
  const legends: Card[] = [];
  for (const [key, count] of deckCounts(deck)) {
    const card = cardsByKey.get(key);
    if (card === undefined) continue;
    for (let copy = 0; copy < count; copy += 1) (card.type === 'Legend' ? legends : main).push(card);
  }
  return {
    ...dealOpening(main, rng),
    legends: shuffle(legends, rng),
    mulliganUsed: false,
    drawnAfterOpening: 0,
  };
}

/** Moves the top card of the library to the hand. An empty library leaves the state as it is. */
export function drawCard(state: TestHandState): TestHandState {
  const [top, ...rest] = state.library;
  if (top === undefined) return state;
  return {
    ...state,
    library: rest,
    hand: [...state.hand, top],
    drawnAfterOpening: state.drawnAfterOpening + 1,
  };
}

/** True when a mulligan is still allowed: not used yet and nothing drawn after the opening hand. */
export function canMulligan(state: TestHandState): boolean {
  return !state.mulliganUsed && state.drawnAfterOpening === 0 && state.hand.length + state.library.length > 0;
}

/** The whole hand back, shuffle and a new opening hand. Allowed MULLIGANS (= 1) times; otherwise no change. */
export function mulligan(state: TestHandState, rng: Rng): TestHandState {
  if (!canMulligan(state)) return state;
  return {
    ...state,
    ...dealOpening([...state.hand, ...state.library], rng),
    mulliganUsed: true,
  };
}
