import { AWAY_MS, initialContinuousState, stepContinuous } from './continuousScan';
import type { ContinuousState } from './continuousScan';

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

describe('continuous scan decisions', () => {
  it('adds a card only when the same art is sure in two pictures in a row', () => {
    expect(run([['a', 0]]).added).toEqual([]);
    expect(run([['a', 0], ['a', 280]]).added).toEqual(['a']);
  });

  it('does not add when the sure match changes between the pictures or a picture is unsure', () => {
    expect(run([['a', 0], ['b', 280], ['a', 560]]).added).toEqual([]);
    expect(run([['a', 0], [null, 280], ['a', 560]]).added).toEqual([]);
  });

  it('never adds the same card twice while it stays in the frame', () => {
    const times = Array.from({ length: 20 }, (_, i): [string, number] => ['a', i * 280]);
    expect(run(times).added).toEqual(['a']);
  });

  it('adds the same card again after the frame has been empty (or unsure) long enough', () => {
    const { added } = run([['a', 0], ['a', 280], [null, 560], [null, 560 + AWAY_MS], ['a', 1400], ['a', 1680]]);
    expect(added).toEqual(['a', 'a']);
  });

  it('adds the same card again after another card was in the frame long enough', () => {
    const { added } = run([['a', 0], ['a', 280], ['b', 560], ['b', 840], ['b', 560 + AWAY_MS], ['a', 1400], ['a', 1680]]);
    expect(added).toEqual(['a', 'b', 'a']);
  });

  it('does not add the same card again after only a short gap', () => {
    const { added } = run([['a', 0], ['a', 280], [null, 560], ['a', 840], ['a', 1120]]);
    expect(added).toEqual(['a']);
  });

  it('starts the gap over when the added card returns to the frame', () => {
    const { added } = run([['a', 0], ['a', 280], [null, 560], ['a', 840], [null, 1120], ['a', 1400], ['a', 1680], ['a', 1960]]);
    expect(added).toEqual(['a']);
  });

  it('adds a different card right after the first one', () => {
    expect(run([['a', 0], ['a', 280], ['b', 560], ['b', 840]]).added).toEqual(['a', 'b']);
  });

  it('starts from nothing again after a reset', () => {
    const { state } = run([['a', 0], ['a', 280]]);
    expect(state.blocked).toBe('a');
    expect(run([['a', 0], ['a', 280]], initialContinuousState).added).toEqual(['a']);
  });
});
