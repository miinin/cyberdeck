import {
  AWAY_MS,
  MIN_SHARPNESS,
  SUGGEST_MS,
  candidateInWindow,
  initialContinuousState,
  initialSuggestionState,
  isSharpEnough,
  stepContinuous,
  stepSuggestion,
} from './continuousScan';
import type { ContinuousState, SuggestionState } from './continuousScan';

/** Feeds observations (id, time) and returns the ids that were added. */
function run(observations: readonly [string | null, number][], from: ContinuousState = initialContinuousState) {
  const added: string[] = [];
  let state = from;
  for (const [id, at] of observations) {
    const step = stepContinuous(state, id, at);
    state = step.state;
    if (step.add !== null) added.push(step.add);
  }
  return { added, state };
}

describe('continuous scan decisions (3 of the last 4 pictures)', () => {
  it('adds a card when the same art is sure in three pictures, not in two', () => {
    expect(run([['a', 0], ['a', 280]]).added).toEqual([]);
    expect(run([['a', 0], ['a', 280], ['a', 560]]).added).toEqual(['a']);
  });

  it('allows one unsure or different picture between the hits', () => {
    expect(run([['a', 0], [null, 280], ['a', 560], ['a', 840]]).added).toEqual(['a']);
    expect(run([['a', 0], ['b', 280], ['a', 560], ['a', 840]]).added).toEqual(['a']);
  });

  it('does not add when the hits are spread over more than four pictures', () => {
    expect(run([['a', 0], [null, 280], [null, 560], ['a', 840], [null, 1120], [null, 1400], ['a', 1680]]).added).toEqual([]);
    expect(run([['a', 0], ['b', 280], ['c', 560], ['a', 840], ['d', 1120], ['e', 1400], ['a', 1680]]).added).toEqual([]);
  });

  it('never adds the same card twice while it stays in the frame', () => {
    const times = Array.from({ length: 20 }, (_, i): [string, number] => ['a', i * 280]);
    expect(run(times).added).toEqual(['a']);
  });

  it('adds the same card again after the frame has been empty (or unsure) long enough', () => {
    const { added } = run([['a', 0], ['a', 280], ['a', 560], [null, 840], [null, 840 + AWAY_MS], ['a', 1700], ['a', 1980], ['a', 2260]]);
    expect(added).toEqual(['a', 'a']);
  });

  it('does not add the same card again after only a short gap', () => {
    const { added } = run([['a', 0], ['a', 280], ['a', 560], [null, 840], ['a', 1120], ['a', 1400], ['a', 1680]]);
    expect(added).toEqual(['a']);
  });

  it('adds a different card right after the first one', () => {
    expect(run([['a', 0], ['a', 280], ['a', 560], ['b', 840], ['b', 1120], ['b', 1400]]).added).toEqual(['a', 'b']);
  });

  it('starts from nothing again after a reset', () => {
    const { state } = run([['a', 0], ['a', 280], ['a', 560]]);
    expect(state.blocked).toBe('a');
    expect(run([['a', 0], ['a', 280], ['a', 560]], initialContinuousState).added).toEqual(['a']);
  });

  it('tells which art is being held still (seen, but not yet added)', () => {
    expect(candidateInWindow(initialContinuousState)).toBeNull();
    expect(candidateInWindow(run([['a', 0]]).state)).toBe('a');
    expect(candidateInWindow(run([['a', 0], ['a', 280]]).state)).toBe('a');
    expect(candidateInWindow(run([['a', 0], ['a', 280], ['a', 560]]).state)).toBeNull();
    expect(candidateInWindow(run([['a', 0], [null, 280]]).state)).toBeNull();
  });
});

describe('sharpness limit', () => {
  it('skips pictures below the limit', () => {
    expect(isSharpEnough(MIN_SHARPNESS - 1)).toBe(false);
    expect(isSharpEnough(MIN_SHARPNESS)).toBe(true);
  });
});

describe('suggestion of the best match', () => {
  const feed = (steps: readonly [string | null, number, boolean, number][], from: SuggestionState = initialSuggestionState) =>
    steps.reduce((state, [best, distance, sure, at]) => stepSuggestion(state, best, distance, sure, at), from);

  it('offers a match only after it has stayed for 1.5 seconds', () => {
    expect(feed([['a', 600, false, 0], ['a', 600, false, SUGGEST_MS - 1]]).shown).toBeNull();
    expect(feed([['a', 600, false, 0], ['a', 600, false, SUGGEST_MS]]).shown).toBe('a');
  });

  it('does not offer a sure match (it is added by itself) or one that is too far', () => {
    expect(feed([['a', 500, true, 0], ['a', 500, true, SUGGEST_MS]]).shown).toBeNull();
    expect(feed([['a', 651, false, 0], ['a', 651, false, SUGGEST_MS]]).shown).toBeNull();
  });

  it('keeps the offer until another best match has stayed for 1.5 seconds', () => {
    const shown = feed([['a', 600, false, 0], ['a', 600, false, SUGGEST_MS]]);
    const flicker = feed([['b', 600, false, 2000], ['a', 600, false, 2300]], shown);
    expect(flicker.shown).toBe('a');
    const next = feed([['b', 600, false, 3000], ['b', 600, false, 3000 + SUGGEST_MS]], shown);
    expect(next.shown).toBe('b');
  });

  it('withdraws the offer when nothing near stays in the frame', () => {
    const shown = feed([['a', 600, false, 0], ['a', 600, false, SUGGEST_MS]]);
    expect(feed([[null, 9999, false, 2000], [null, 9999, false, 2000 + SUGGEST_MS]], shown).shown).toBeNull();
  });
});
