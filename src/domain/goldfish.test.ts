import { describe, expect, it } from 'vitest';
import type { Card } from './card';
import type { DeckContent } from './deck';
import { toCardsByKey } from './deckRules';
import {
  attack,
  availableMoney,
  canMulligan,
  chooseGig,
  endGame,
  endTurn,
  freeEddies,
  gigsStolen,
  invokeLegend,
  invokeProblem,
  keepHand,
  mulligan,
  play,
  playProblem,
  sell,
  selectableDice,
  start,
  streetCred,
  totalGigs,
} from './goldfish';
import type { GoldfishError, GoldfishResult, GoldfishState } from './goldfish';
import type { Rng } from './testHand';

function card(key: string, overrides: Partial<Card> = {}): Card {
  return {
    id: `id-${key}`,
    slug: key,
    name: key,
    subname: null,
    displayName: key,
    type: 'Unit',
    color: 'Red',
    cost: 1,
    power: 5,
    ram: 1,
    rarity: 'Common',
    eddiable: false,
    key,
    ...overrides,
  };
}

function lcg(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

const legends = ['l1', 'l2', 'l3'].map((key) => card(key, { type: 'Legend', cost: null, power: 0 }));
const fillers = Array.from({ length: 20 }, (_, i) => card(`f${i}`, { eddiable: true, cost: 2, power: 0 }));

function setup(extra: Card[] = [], goFirst = true, filler = 3) {
  const cards = [...legends, ...fillers, ...extra];
  const deck: DeckContent = {
    name: 'T',
    sections: [
      {
        name: '',
        cards: [...legends.map((c) => ({ card: c.key, count: 1 })), ...fillers.slice(0, filler * 3).map((c) => ({ card: c.key, count: 1 })), ...extra.map((c) => ({ card: c.key, count: 1 }))],
      },
    ],
  };
  return { cardsByKey: toCardsByKey(cards), deck, goFirst };
}

function ok(result: GoldfishResult): GoldfishState {
  if (!result.ok) throw new Error(`expected ok, got ${result.reason}`);
  return result.state;
}
function reason(result: GoldfishResult): GoldfishError {
  if (result.ok) throw new Error('expected a failure');
  return result.reason;
}

/** A started game on turn 1 with a given hand put on top of the shuffled one. */
function playing(hand: Card[], opts: { goFirst?: boolean; library?: Card[] } = {}): GoldfishState {
  const { deck, cardsByKey } = setup();
  const base = start(deck, cardsByKey, lcg(1), opts.goFirst ?? false);
  const prepared = { ...base, hand: [...hand], library: opts.library ?? base.library };
  // The hand is replaced before keepHand; turn 1 draws one more card from the library.
  return ok(keepHand(prepared));
}

describe('start', () => {
  it('shuffles the main deck, deals 6 and keeps the Legends out of the library', () => {
    const { deck, cardsByKey } = setup();
    const state = start(deck, cardsByKey, lcg(3), true);
    expect(state.phase).toBe('mulligan');
    expect(state.hand).toHaveLength(6);
    expect(state.library).toHaveLength(3);
    expect(state.hand.length + state.library.length).toBe(9);
    expect(state.legends).toHaveLength(3);
    expect([...state.hand, ...state.library].some((c) => c.type === 'Legend')).toBe(false);
    expect(state.legends.every((slot) => !slot.faceUp)).toBe(true);
  });

  it('is deterministic with the same seed', () => {
    const { deck, cardsByKey } = setup();
    expect(start(deck, cardsByKey, lcg(9), true).hand.map((c) => c.key)).toEqual(start(deck, cardsByKey, lcg(9), true).hand.map((c) => c.key));
  });

  it('spends the two leftmost Legends for the player who goes first, none for the second', () => {
    const { deck, cardsByKey } = setup();
    expect(start(deck, cardsByKey, lcg(2), true).legends.map((slot) => slot.spent)).toEqual([true, true, false]);
    expect(start(deck, cardsByKey, lcg(2), false).legends.map((slot) => slot.spent)).toEqual([false, false, false]);
  });
});

describe('mulligan', () => {
  it('is allowed once, before keeping, and deals a new 6 from the whole deck', () => {
    const { deck, cardsByKey } = setup();
    const first = start(deck, cardsByKey, lcg(4), false);
    expect(canMulligan(first)).toBe(true);
    const second = ok(mulligan(first, lcg(5)));
    expect(second.hand).toHaveLength(6);
    expect(second.hand.length + second.library.length).toBe(9);
    expect(second.mulliganUsed).toBe(true);
    expect(canMulligan(second)).toBe(false);
    expect(reason(mulligan(second, lcg(6)))).toBe('mulligan-used');
  });

  it('is refused after the hand is kept', () => {
    const { deck, cardsByKey } = setup();
    const kept = ok(keepHand(start(deck, cardsByKey, lcg(4), false)));
    expect(reason(mulligan(kept, lcg(1)))).toBe('wrong-phase');
  });
});

describe('turn start', () => {
  it('draws one card on turn 1 and asks for the Gig', () => {
    const { deck, cardsByKey } = setup();
    const state = ok(keepHand(start(deck, cardsByKey, lcg(4), true)));
    expect(state.turn).toBe(1);
    expect(state.hand).toHaveLength(7);
    expect(state.gigPending).toBe(true);
    expect(state.log[0]?.drawn).toBe(state.hand.at(-1));
  });

  it('keeps the first player\'s two spent Legends through turn 1 and readies them on turn 2', () => {
    let state = ok(chooseGig(playing([], { goFirst: true }), 4, () => 0.5));
    expect(availableMoney(state)).toBe(1);
    state = ok(chooseGig(ok(endTurn(state)), 6, () => 0.5));
    expect(availableMoney(state)).toBe(3);
  });

  it('readies spent Units and Eddies at the start of the next turn', () => {
    const unit = card('u', { cost: 0, power: 5 });
    let state = ok(chooseGig(playing([unit, fillers[0] as Card]), 4, () => 0));
    state = ok(play(state, 0));
    state = ok(sell(state, 0));
    state = ok(endTurn(state));
    state = ok(chooseGig(state, 6, () => 0));
    expect(state.field[0]?.lag).toBe(false);
    expect(freeEddies(state)).toBe(1);
  });
});

describe('Gig dice', () => {
  it('rolls the chosen die into the Gig area', () => {
    let state = playing([]);
    state = ok(chooseGig(state, 8, () => 0.99));
    expect(state.gigs).toEqual([8]);
    expect(state.dice).toEqual([4, 6, 10, 12, 20]);
    expect(streetCred(state)).toBe(8);
    expect(state.gigPending).toBe(false);
  });

  it('rolls 1 for the lowest random and the maximum for the highest', () => {
    expect(ok(chooseGig(playing([]), 12, () => 0)).gigs).toEqual([1]);
    expect(ok(chooseGig(playing([]), 12, () => 0.999999)).gigs).toEqual([12]);
  });

  it('keeps the d20 for last', () => {
    const state = playing([]);
    expect(reason(chooseGig(state, 20, () => 0))).toBe('die-last');
    expect(selectableDice(state)).toEqual([4, 6, 8, 10, 12]);
    expect(reason(chooseGig(state, 7, () => 0))).toBe('die-unavailable');
    const last = { ...state, dice: [20] };
    expect(selectableDice(last)).toEqual([20]);
    expect(ok(chooseGig(last, 20, () => 0.5)).gigs).toEqual([11]);
  });

  it('blocks the main phase until the die is chosen, and allows it once', () => {
    const state = playing([fillers[0] as Card]);
    expect(reason(sell(state, 0))).toBe('gig-pending');
    expect(reason(endTurn(state))).toBe('gig-pending');
    expect(reason(chooseGig(ok(chooseGig(state, 4, () => 0)), 6, () => 0))).toBe('no-gig-pending');
  });
});

describe('sell', () => {
  const sellable = card('s', { eddiable: true });
  const plain = card('p', { eddiable: false });

  it('turns a sellable card into a permanent Eddie, once per turn', () => {
    let state = ok(chooseGig(playing([sellable, sellable, plain]), 4, () => 0));
    state = ok(sell(state, 0));
    expect(state.eddies).toBe(1);
    expect(freeEddies(state)).toBe(1);
    expect(state.hand.filter((c) => c.key === 's')).toHaveLength(1);
    expect(reason(sell(state, 0))).toBe('already-sold');
    state = ok(chooseGig(ok(endTurn(state)), 6, () => 0));
    expect(ok(sell(state, 0)).eddies).toBe(2);
  });

  it('refuses a card without the sale mark and an unknown card', () => {
    const state = ok(chooseGig(playing([plain]), 4, () => 0));
    expect(reason(sell(state, 0))).toBe('not-sellable');
    expect(reason(sell(state, 9))).toBe('no-such-card');
  });
});

describe('play', () => {
  it('pays with Eddies first, then ready Legends, and puts a Unit in Lag', () => {
    const unit = card('u', { cost: 2 });
    let state = ok(chooseGig(playing([fillers[0] as Card, unit], { goFirst: false }), 4, () => 0));
    state = ok(sell(state, 0));
    state = ok(play(state, 0));
    expect(state.field).toHaveLength(1);
    expect(state.field[0]?.lag).toBe(true);
    expect(freeEddies(state)).toBe(0);
    expect(state.legends.filter((slot) => slot.spent)).toHaveLength(1);
    expect(state.firstUnitTurn).toBe(1);
    expect(state.log[0]?.played).toEqual([{ card: unit, cost: 2 }]);
  });

  it('refuses a card that costs more than the $ available', () => {
    const big = card('big', { cost: 4 });
    const state = ok(chooseGig(playing([big], { goFirst: true }), 4, () => 0));
    expect(reason(play(state, 0))).toBe('not-enough');
    expect(state.hand).toContain(big);
  });

  it('sends a Program to the trash and attaches a Gear to a Unit or a Legend', () => {
    const program = card('pr', { type: 'Program', cost: 0 });
    const gear = card('g', { type: 'Gear', cost: 0 });
    const unit = card('u', { cost: 0 });
    let state = ok(chooseGig(playing([program, gear, gear, unit]), 4, () => 0));
    state = ok(play(state, 0));
    expect(state.trash).toEqual([program]);
    expect(state.field).toHaveLength(0);
    state = ok(play(state, 2));
    expect(reason(play(state, 0))).toBe('needs-target');
    expect(reason(play(state, 0, { kind: 'unit', id: 99 }))).toBe('bad-target');
    const unitId = state.field[0]?.id as number;
    state = ok(play(state, 0, { kind: 'unit', id: unitId }));
    expect(state.field[0]?.gear).toEqual([gear]);
    state = ok(play(state, 0, { kind: 'legend', index: 1 }));
    expect(state.legends[1]?.gear).toEqual([gear]);
  });

  it('treats a card without cost as free', () => {
    const free = card('free', { cost: null });
    const state = ok(chooseGig(playing([free]), 4, () => 0));
    expect(ok(play(state, 0)).field).toHaveLength(1);
  });
});

describe('attack and stolen Gigs', () => {
  it.each([
    [0, 0],
    [null, 0],
    [9, 1],
    [10, 2],
    [25, 3],
  ])('power %s steals %s', (power, gigs) => {
    expect(gigsStolen(power)).toBe(gigs);
  });

  it('attacks only with a ready Unit that is not in Lag, once, and counts the Gigs', () => {
    const unit = card('u', { cost: 0, power: 25 });
    let state = ok(chooseGig(playing([unit]), 4, () => 0));
    state = ok(play(state, 0));
    const id = state.field[0]?.id as number;
    expect(reason(attack(state, id))).toBe('unit-lag');
    expect(reason(attack(state, 77))).toBe('no-such-unit');
    state = ok(chooseGig(ok(endTurn(state)), 6, () => 0));
    state = ok(attack(state, id));
    expect(state.stolen).toBe(3);
    expect(state.log.at(-1)?.stolen).toBe(3);
    expect(reason(attack(state, id))).toBe('unit-spent');
    expect(totalGigs(state)).toBe(2 + 3);
    state = ok(chooseGig(ok(endTurn(state)), 8, () => 0));
    expect(ok(attack(state, id)).stolen).toBe(6);
  });
});

describe('invoke a Legend', () => {
  it('costs 1 $, turns a random face-down Legend up and is allowed once a turn', () => {
    let state = ok(chooseGig(playing([], { goFirst: false }), 4, () => 0));
    state = ok(invokeLegend(state, () => 0));
    expect(state.legends.filter((slot) => slot.faceUp)).toHaveLength(1);
    expect(state.legends.filter((slot) => slot.spent)).toHaveLength(1);
    expect(reason(invokeLegend(state, () => 0))).toBe('already-invoked');
    state = ok(chooseGig(ok(endTurn(state)), 6, () => 0));
    state = ok(invokeLegend(state, () => 0.99));
    expect(state.legends.filter((slot) => slot.faceUp)).toHaveLength(2);
  });

  it('needs $ and a face-down Legend', () => {
    const none = ok(chooseGig(playing([], { goFirst: true }), 4, () => 0));
    expect(availableMoney(none)).toBe(1);
    const spentAll = { ...none, legends: none.legends.map((slot) => ({ ...slot, spent: true })) };
    expect(reason(invokeLegend(spentAll, () => 0))).toBe('not-enough');
    const allUp = { ...none, legends: none.legends.map((slot) => ({ ...slot, faceUp: true })) };
    expect(reason(invokeLegend(allUp, () => 0))).toBe('no-face-down-legend');
  });
});

describe('end of turn and game', () => {
  it('counts unspent $ as wasted and draws on the next turn', () => {
    let state = ok(chooseGig(playing([], { goFirst: false }), 4, () => 0));
    const handBefore = state.hand.length;
    state = ok(endTurn(state));
    expect(state.wasted).toBe(3);
    expect(state.turn).toBe(2);
    expect(state.hand).toHaveLength(handBefore + 1);
    expect(state.log).toHaveLength(2);
  });

  it('is over after turn 7 and the d20 is the last die of turn 6', () => {
    let state = playing([], { goFirst: false, library: Array.from({ length: 20 }, (_, i) => fillers[i] as Card) });
    for (let turn = 1; turn <= 6; turn += 1) {
      state = ok(chooseGig(state, selectableDice(state)[0] as number, () => 0));
      state = ok(endTurn(state));
    }
    expect(state.gigs).toHaveLength(6);
    expect(state.dice).toEqual([]);
    expect(state.turn).toBe(7);
    expect(state.gigPending).toBe(false);
    state = ok(endTurn(state));
    expect(state.phase).toBe('over');
    expect(state.end).toBe('turns');
    expect(reason(endTurn(state))).toBe('wrong-phase');
  });

  it('loses by deckout when the library is empty at the draw', () => {
    let state = playing([], { goFirst: false, library: [fillers[0] as Card, fillers[1] as Card] });
    expect(state.library).toHaveLength(1);
    state = ok(chooseGig(state, 4, () => 0));
    state = ok(endTurn(state));
    state = ok(chooseGig(state, 6, () => 0));
    state = ok(endTurn(state));
    expect(state.phase).toBe('over');
    expect(state.end).toBe('deckout');
  });

  it('stops at once with endGame', () => {
    const state = ok(chooseGig(playing([], { goFirst: false }), 4, () => 0));
    const over = endGame(state);
    expect(over.phase).toBe('over');
    expect(over.end).toBe('quit');
    expect(over.wasted).toBe(3);
    expect(endGame(over)).toBe(over);
  });
});

describe('break-test fixes (BRK-01, BRK-06)', () => {
  it('reports a Gear without any possible target as no-target, not as a missing choice', () => {
    const gear = card('g', { type: 'Gear', cost: 0 });
    const base = ok(chooseGig(playing([gear]), 4, () => 0));
    expect(playProblem(base, 0)).toBe('needs-target');
    const bare = { ...base, legends: [], field: [] };
    expect(playProblem(bare, 0)).toBe('no-target');
    expect(reason(play(bare, 0))).toBe('no-target');
  });

  it('says there are no Legends to invoke when the deck has none', () => {
    const state = ok(chooseGig(playing([card('u', { cost: 0 })]), 4, () => 0));
    expect(invokeProblem({ ...state, legends: [] })).toBe('no-legends');
    expect(invokeProblem(state)).toBeNull();
  });
});
