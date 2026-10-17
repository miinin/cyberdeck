import type { Card } from './card';
import type { DeckContent } from './deck';
import { deckCounts } from './deckRules';
import type { CardsByKey } from './deckRules';
import { OPENING_HAND } from './deckStats';
import { shuffle } from './testHand';
import type { Rng } from './testHand';

/**
 * Goldfish (T-172): play a deck alone. A pure state machine over the official solo-relevant rules (Printable
 * Gameplay Guide): set-up, mulligan once, ready/draw/Gig at the start of a turn, then sell once, play, invoke a
 * Legend once and attack. Card texts are not simulated. The random source is injected (tests are deterministic);
 * every action returns a new state or the reason it was refused. Nothing is stored.
 */

/** Turns of one game. */
export const GOLDFISH_TURNS = 7;
/** Gigs (dice in the Gig area or stolen) that win a game; only a gauge here, there is no opponent. */
export const GOLDFISH_WIN_GIGS = 7;
/** Fixer dice in the order the guide lists them; the d20 is always the last one chosen. */
export const GIG_DICE = [4, 6, 8, 10, 12, 20] as const;
const LAST_DIE = 20;
/** Legends that start spent for the player who goes first. */
const FIRST_PLAYER_SPENT_LEGENDS = 2;

export interface LegendSlot {
  readonly card: Card;
  readonly faceUp: boolean;
  /** Spent legends are tapped: they cost nothing to leave out and give back their $ when readied. */
  readonly spent: boolean;
  readonly gear: readonly Card[];
}

export interface FieldUnit {
  readonly id: number;
  readonly card: Card;
  /** Lag: just played, cannot attack yet. */
  readonly lag: boolean;
  readonly spent: boolean;
  readonly gear: readonly Card[];
}

/** What happened in one turn; the UI turns it into the turn log. */
export interface TurnLog {
  readonly turn: number;
  readonly drawn: Card | null;
  readonly gig: { readonly die: number; readonly value: number } | null;
  readonly sold: Card | null;
  readonly played: readonly { readonly card: Card; readonly cost: number }[];
  readonly invoked: Card | null;
  readonly stolen: number;
}

export type GoldfishPhase = 'mulligan' | 'playing' | 'over';
export type GoldfishEnd = 'turns' | 'deckout' | 'quit';

export interface GoldfishState {
  readonly phase: GoldfishPhase;
  readonly end: GoldfishEnd | null;
  readonly goFirst: boolean;
  readonly turn: number;
  readonly library: readonly Card[];
  readonly hand: readonly Card[];
  readonly trash: readonly Card[];
  readonly legends: readonly LegendSlot[];
  /** Cards sold for good; each is one Eddie. */
  readonly eddies: number;
  readonly eddiesSpent: number;
  readonly field: readonly FieldUnit[];
  /** Dice still in the fixer area. */
  readonly dice: readonly number[];
  /** Rolled values in the Gig area. */
  readonly gigs: readonly number[];
  /** True between the start of a turn and the die choice. */
  readonly gigPending: boolean;
  readonly mulliganUsed: boolean;
  readonly sold: boolean;
  readonly invoked: boolean;
  readonly stolen: number;
  readonly wasted: number;
  readonly played: readonly Card[];
  readonly firstUnitTurn: number | null;
  readonly log: readonly TurnLog[];
  readonly nextUnitId: number;
}

export type GoldfishError =
  | 'wrong-phase'
  | 'gig-pending'
  | 'no-gig-pending'
  | 'mulligan-used'
  | 'no-such-card'
  | 'not-sellable'
  | 'already-sold'
  | 'not-enough'
  | 'needs-target'
  | 'no-target'
  | 'bad-target'
  | 'no-such-unit'
  | 'unit-lag'
  | 'unit-spent'
  | 'already-invoked'
  | 'no-face-down-legend'
  | 'no-legends'
  | 'die-unavailable'
  | 'die-last';

export type GoldfishResult = { readonly ok: true; readonly state: GoldfishState } | { readonly ok: false; readonly reason: GoldfishError };

/** Where a Gear goes: a Unit on the field or one of the Legends. */
export type GearTarget = { readonly kind: 'unit'; readonly id: number } | { readonly kind: 'legend'; readonly index: number };

const fail = (reason: GoldfishError): GoldfishResult => ({ ok: false, reason });
const succeed = (state: GoldfishState): GoldfishResult => ({ ok: true, state });

/** Gigs a Unit steals when it attacks: 1 + floor(power / 10); no power, no Gig. */
export function gigsStolen(power: number | null): number {
  if (power === null || power <= 0) return 0;
  return 1 + Math.floor(power / 10);
}

/** Street Cred: the sum of the dice in the Gig area. */
export function streetCred(state: GoldfishState): number {
  return state.gigs.reduce((sum, value) => sum + value, 0);
}

/** Eddies of the Eddies area that are ready to spend. */
export function freeEddies(state: GoldfishState): number {
  return state.eddies - state.eddiesSpent;
}

/** $ available: free Eddies plus every ready Legend (1 $ each, face up or down). */
export function availableMoney(state: GoldfishState): number {
  return freeEddies(state) + state.legends.filter((slot) => !slot.spent).length;
}

/** Cost of a card; a card without cost is free. */
export function costOf(card: Card): number {
  return card.cost ?? 0;
}

function emptyTurn(turn: number): TurnLog {
  return { turn, drawn: null, gig: null, sold: null, played: [], invoked: null, stolen: 0 };
}

function withLog(state: GoldfishState, change: (entry: TurnLog) => TurnLog): GoldfishState {
  const last = state.log.at(-1);
  if (last === undefined) return state;
  return { ...state, log: [...state.log.slice(0, -1), change(last)] };
}

/** Pays an amount with Eddies first, then ready Legends from the left; null when there is not enough. */
function spend(state: GoldfishState, amount: number): GoldfishState | null {
  if (amount > availableMoney(state)) return null;
  const fromEddies = Math.min(freeEddies(state), amount);
  let rest = amount - fromEddies;
  const legends = state.legends.map((slot) => {
    if (rest > 0 && !slot.spent) {
      rest -= 1;
      return { ...slot, spent: true };
    }
    return slot;
  });
  return { ...state, eddiesSpent: state.eddiesSpent + fromEddies, legends };
}

/**
 * Sets up a game: the shuffled main deck, the Legends face down in random order (the player going first has
 * the two leftmost spent), and the opening hand. The game waits for keep or mulligan.
 */
export function start(deck: DeckContent, cardsByKey: CardsByKey, rng: Rng, goFirst: boolean): GoldfishState {
  const main: Card[] = [];
  const legendCards: Card[] = [];
  for (const [key, count] of deckCounts(deck)) {
    const card = cardsByKey.get(key);
    if (card === undefined) continue;
    for (let copy = 0; copy < count; copy += 1) (card.type === 'Legend' ? legendCards : main).push(card);
  }
  const shuffled = shuffle(main, rng);
  return {
    phase: 'mulligan',
    end: null,
    goFirst,
    turn: 0,
    library: shuffled.slice(OPENING_HAND),
    hand: shuffled.slice(0, OPENING_HAND),
    trash: [],
    legends: shuffle(legendCards, rng).map((card, index) => ({
      card,
      faceUp: false,
      spent: goFirst && index < FIRST_PLAYER_SPENT_LEGENDS,
      gear: [],
    })),
    eddies: 0,
    eddiesSpent: 0,
    field: [],
    dice: [...GIG_DICE],
    gigs: [],
    gigPending: false,
    mulliganUsed: false,
    sold: false,
    invoked: false,
    stolen: 0,
    wasted: 0,
    played: [],
    firstUnitTurn: null,
    log: [],
    nextUnitId: 1,
  };
}

/** True while the hand can still be mulliganed. */
export function canMulligan(state: GoldfishState): boolean {
  return state.phase === 'mulligan' && !state.mulliganUsed && state.hand.length + state.library.length > 0;
}

/** The whole hand back, shuffle, a new opening hand. Once per game. */
export function mulligan(state: GoldfishState, rng: Rng): GoldfishResult {
  if (state.phase !== 'mulligan') return fail('wrong-phase');
  if (state.mulliganUsed) return fail('mulligan-used');
  const shuffled = shuffle([...state.hand, ...state.library], rng);
  return succeed({ ...state, hand: shuffled.slice(0, OPENING_HAND), library: shuffled.slice(OPENING_HAND), mulliganUsed: true });
}

/** Begins a turn: everything is readied, one card is drawn (an empty library loses the game), the Gig is due. */
function beginTurn(state: GoldfishState, turn: number): GoldfishState {
  // The player going first keeps the two spent Legends through the first turn (they ready from turn 2).
  const keepSpent = turn === 1 && state.goFirst;
  const ready: GoldfishState = {
    ...state,
    turn,
    eddiesSpent: 0,
    legends: state.legends.map((slot, index) => ({
      ...slot,
      spent: keepSpent && index < FIRST_PLAYER_SPENT_LEGENDS ? slot.spent : false,
    })),
    field: state.field.map((unit) => ({ ...unit, lag: false, spent: false })),
    sold: false,
    invoked: false,
    log: [...state.log, emptyTurn(turn)],
  };
  const [top, ...rest] = ready.library;
  if (top === undefined) return { ...ready, phase: 'over', end: 'deckout' };
  return withLog(
    { ...ready, library: rest, hand: [...ready.hand, top], gigPending: ready.dice.length > 0 },
    (entry) => ({ ...entry, drawn: top }),
  );
}

/** Keeps the opening hand and starts turn 1. */
export function keepHand(state: GoldfishState): GoldfishResult {
  if (state.phase !== 'mulligan') return fail('wrong-phase');
  return succeed(beginTurn({ ...state, phase: 'playing' }, 1));
}

/** True when the dice can be chosen: any of d4–d12, or the d20 once it is the only one left. */
export function selectableDice(state: GoldfishState): number[] {
  const others = state.dice.filter((die) => die !== LAST_DIE);
  return others.length > 0 ? others : [...state.dice];
}

/** The Gig step: roll a chosen die from the fixer area and move it to the Gig area. */
export function chooseGig(state: GoldfishState, die: number, rng: Rng): GoldfishResult {
  if (state.phase !== 'playing') return fail('wrong-phase');
  if (!state.gigPending) return fail('no-gig-pending');
  if (!state.dice.includes(die)) return fail('die-unavailable');
  if (die === LAST_DIE && state.dice.length > 1) return fail('die-last');
  const value = Math.min(die, Math.floor(rng() * die) + 1);
  const index = state.dice.indexOf(die);
  return succeed(
    withLog(
      {
        ...state,
        dice: [...state.dice.slice(0, index), ...state.dice.slice(index + 1)],
        gigs: [...state.gigs, value],
        gigPending: false,
      },
      (entry) => ({ ...entry, gig: { die, value } }),
    ),
  );
}

function mainPhase(state: GoldfishState): GoldfishError | null {
  if (state.phase !== 'playing') return 'wrong-phase';
  return state.gigPending ? 'gig-pending' : null;
}

/** Why the hand card cannot be sold now, or null. */
export function sellProblem(state: GoldfishState, handIndex: number): GoldfishError | null {
  const blocked = mainPhase(state);
  if (blocked !== null) return blocked;
  const card = state.hand[handIndex];
  if (card === undefined) return 'no-such-card';
  if (state.sold) return 'already-sold';
  return card.eddiable === true ? null : 'not-sellable';
}

/** Sells a card with the sale mark: it becomes 1 Eddie for good. Once per turn. */
export function sell(state: GoldfishState, handIndex: number): GoldfishResult {
  const problem = sellProblem(state, handIndex);
  if (problem !== null) return fail(problem);
  const card = state.hand[handIndex] as Card;
  return succeed(
    withLog(
      {
        ...state,
        hand: state.hand.filter((_, index) => index !== handIndex),
        eddies: state.eddies + 1,
        sold: true,
      },
      (entry) => ({ ...entry, sold: card }),
    ),
  );
}

/** Whether a Gear needs a target when played (always, it is attached to a Unit or Legend). */
export const needsTarget = (card: Card): boolean => card.type === 'Gear';

/** Why the hand card cannot be played now (a Gear needs a target), or null. */
export function playProblem(state: GoldfishState, handIndex: number, target?: GearTarget): GoldfishError | null {
  const blocked = mainPhase(state);
  if (blocked !== null) return blocked;
  const card = state.hand[handIndex];
  if (card === undefined) return 'no-such-card';
  if (costOf(card) > availableMoney(state)) return 'not-enough';
  if (needsTarget(card) && target === undefined) {
    return state.field.length + state.legends.length === 0 ? 'no-target' : 'needs-target';
  }
  if (needsTarget(card) && target !== undefined) {
    if (target.kind === 'unit' && !state.field.some((unit) => unit.id === target.id)) return 'bad-target';
    if (target.kind === 'legend' && state.legends[target.index] === undefined) return 'bad-target';
  }
  return null;
}

/**
 * Plays a card by paying its cost with Eddies and Legends. A Unit enters the field in Lag, a Program goes to
 * the trash at once, a Gear is attached to the chosen Unit or Legend.
 */
export function play(state: GoldfishState, handIndex: number, target?: GearTarget): GoldfishResult {
  const problem = playProblem(state, handIndex, target);
  if (problem !== null) return fail(problem);
  const card = state.hand[handIndex] as Card;
  const paid = spend(state, costOf(card));
  if (paid === null) return fail('not-enough');
  let next: GoldfishState = {
    ...paid,
    hand: paid.hand.filter((_, index) => index !== handIndex),
    played: [...paid.played, card],
  };
  if (card.type === 'Unit') {
    next = {
      ...next,
      field: [...next.field, { id: next.nextUnitId, card, lag: true, spent: false, gear: [] }],
      nextUnitId: next.nextUnitId + 1,
      firstUnitTurn: next.firstUnitTurn ?? next.turn,
    };
  } else if (card.type === 'Gear' && target !== undefined) {
    next =
      target.kind === 'unit'
        ? { ...next, field: next.field.map((unit) => (unit.id === target.id ? { ...unit, gear: [...unit.gear, card] } : unit)) }
        : { ...next, legends: next.legends.map((slot, index) => (index === target.index ? { ...slot, gear: [...slot.gear, card] } : slot)) };
  } else {
    next = { ...next, trash: [...next.trash, card] };
  }
  return succeed(withLog(next, (entry) => ({ ...entry, played: [...entry.played, { card, cost: costOf(card) }] })));
}

/** Why a Legend cannot be invoked now, or null. */
export function invokeProblem(state: GoldfishState): GoldfishError | null {
  const blocked = mainPhase(state);
  if (blocked !== null) return blocked;
  if (state.legends.length === 0) return 'no-legends';
  if (state.invoked) return 'already-invoked';
  if (!state.legends.some((slot) => !slot.faceUp)) return 'no-face-down-legend';
  return availableMoney(state) >= 1 ? null : 'not-enough';
}

/** Invoke a Legend: pay 1 $ and turn a random face-down Legend face up. Once per turn. */
export function invokeLegend(state: GoldfishState, rng: Rng): GoldfishResult {
  const problem = invokeProblem(state);
  if (problem !== null) return fail(problem);
  const paid = spend(state, 1) as GoldfishState;
  const down = paid.legends.map((slot, index) => (slot.faceUp ? -1 : index)).filter((index) => index >= 0);
  const pick = down[Math.min(down.length - 1, Math.floor(rng() * down.length))] as number;
  const card = (paid.legends[pick] as LegendSlot).card;
  return succeed(
    withLog(
      { ...paid, invoked: true, legends: paid.legends.map((slot, index) => (index === pick ? { ...slot, faceUp: true } : slot)) },
      (entry) => ({ ...entry, invoked: card }),
    ),
  );
}

/** Why the Unit cannot attack now, or null. */
export function attackProblem(state: GoldfishState, unitId: number): GoldfishError | null {
  const blocked = mainPhase(state);
  if (blocked !== null) return blocked;
  const unit = state.field.find((candidate) => candidate.id === unitId);
  if (unit === undefined) return 'no-such-unit';
  if (unit.lag) return 'unit-lag';
  return unit.spent ? 'unit-spent' : null;
}

/** A ready Unit not in Lag attacks. Without an opponent the attack goes to the Gig area: stolen Gigs add up. */
export function attack(state: GoldfishState, unitId: number): GoldfishResult {
  const problem = attackProblem(state, unitId);
  if (problem !== null) return fail(problem);
  const unit = state.field.find((candidate) => candidate.id === unitId) as FieldUnit;
  const gigs = gigsStolen(unit.card.power);
  return succeed(
    withLog(
      {
        ...state,
        field: state.field.map((candidate) => (candidate.id === unitId ? { ...candidate, spent: true } : candidate)),
        stolen: state.stolen + gigs,
      },
      (entry) => ({ ...entry, stolen: entry.stolen + gigs }),
    ),
  );
}

/** Ends the turn: unspent $ are counted as wasted; after the last turn the game is over. */
export function endTurn(state: GoldfishState): GoldfishResult {
  const blocked = mainPhase(state);
  if (blocked !== null) return fail(blocked);
  const counted: GoldfishState = { ...state, wasted: state.wasted + availableMoney(state) };
  if (state.turn >= GOLDFISH_TURNS) return succeed({ ...counted, phase: 'over', end: 'turns' });
  return succeed(beginTurn(counted, state.turn + 1));
}

/** Stops the game at once ("Lopeta peli"); the current turn's unspent $ count as wasted. */
export function endGame(state: GoldfishState): GoldfishState {
  if (state.phase === 'over') return state;
  return { ...state, phase: 'over', end: 'quit', wasted: state.phase === 'playing' ? state.wasted + availableMoney(state) : state.wasted };
}

/** Running totals for the Gig gauge: Gigs in the Gig area plus stolen ones. */
export function totalGigs(state: GoldfishState): number {
  return state.gigs.length + state.stolen;
}
