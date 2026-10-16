import type { BoosterCard } from './booster';
import { addToMain, freeCopies, isSealedReady, newSealedRun, parseSealedData, parseSealedRun, poolRows, removeFromMain, SEALED_PACK_STEPS, toggleLegend, withPack } from './sealed';
import type { SealedRun } from './sealed';

const entry = (card: string, rarity: BoosterCard['rarity'] = 'Common'): BoosterCard => ({ card, printing: 'welcometonightcityretail:001', rarity });

function runWith(pool: BoosterCard[], patch: Partial<SealedRun> = {}): SealedRun {
  return { ...newSealedRun('welcome-to-night-city'), opened: 7, pool, ...patch };
}

describe('sealed run (T-173)', () => {
  it('opens packs one at a time and is ready after the sixth booster and the Legend pack', () => {
    let run = newSealedRun('welcome-to-night-city-beta');
    for (let i = 0; i < SEALED_PACK_STEPS; i += 1) {
      expect(isSealedReady(run)).toBe(false);
      run = withPack(run, [entry(`c${i}`)]);
    }
    expect(isSealedReady(run)).toBe(true);
    expect(run.pool).toHaveLength(SEALED_PACK_STEPS);
    expect(withPack(run, [entry('extra')])).toBe(run);
  });

  it('adds up to the copies in the pool and no more', () => {
    let run = runWith([entry('a'), entry('a'), entry('b')]);
    run = addToMain(run, 'a', false);
    run = addToMain(run, 'a', false);
    expect(run.main).toEqual([{ card: 'a', count: 2 }]);
    expect(addToMain(run, 'a', false)).toBe(run);
    expect(addToMain(run, 'zzz', false)).toBe(run);
    expect(freeCopies(run, 'a')).toBe(0);
    expect(freeCopies(run, 'b')).toBe(1);
  });

  it('never puts a Legend in the main deck', () => {
    const run = runWith([entry('legend')]);
    expect(addToMain(run, 'legend', true)).toBe(run);
  });

  it('takes copies back', () => {
    let run = addToMain(addToMain(runWith([entry('a'), entry('a')]), 'a', false), 'a', false);
    run = removeFromMain(run, 'a');
    expect(run.main).toEqual([{ card: 'a', count: 1 }]);
    run = removeFromMain(run, 'a');
    expect(run.main).toEqual([]);
    expect(removeFromMain(run, 'a')).toBe(run);
  });

  it('chooses at most three different Legends from the pool and toggles them off', () => {
    let run = runWith([entry('l1'), entry('l2'), entry('l3'), entry('l4')]);
    for (const key of ['l1', 'l2', 'l3']) run = toggleLegend(run, key);
    expect(run.legends).toEqual(['l1', 'l2', 'l3']);
    expect(toggleLegend(run, 'l4')).toBe(run);
    expect(toggleLegend(run, 'l2').legends).toEqual(['l1', 'l3']);
    expect(toggleLegend(runWith([entry('l1')]), 'nope').legends).toEqual([]);
  });

  it('shows each card of the pool once with its count and rarest art', () => {
    const rows = poolRows([entry('a'), entry('b'), entry('a', 'Epic')]);
    expect(rows.map((row) => [row.entry.card, row.count, row.entry.rarity])).toEqual([
      ['a', 2, 'Epic'],
      ['b', 1, 'Common'],
    ]);
  });
});

describe('reading a stored run (SR-23)', () => {
  const valid = {
    set: 'welcome-to-night-city',
    opened: 7,
    pool: [entry('a'), entry('a'), entry('l1', 'Rare')],
    main: [{ card: 'a', count: 2 }],
    legends: ['l1'],
  };

  it('reads a valid run and a missing one', () => {
    expect(parseSealedRun(valid)).toEqual(valid);
    expect(parseSealedData({ run: null })).toEqual({ value: null, dropped: 0 });
    expect(parseSealedData({ run: valid })?.value).toEqual(valid);
  });

  it('drops unknown fields instead of copying them', () => {
    expect(parseSealedRun({ ...valid, evil: 1 })).toEqual(valid);
  });

  it.each([
    ['unknown set', { ...valid, set: 'embracing-power' }],
    ['opened out of range', { ...valid, opened: 8 }],
    ['opened not an integer', { ...valid, opened: 1.5 }],
    ['bad card key', { ...valid, pool: [{ ...entry('a'), card: 'A b' }] }],
    ['bad printing key', { ...valid, pool: [{ ...entry('a'), printing: 'x' }] }],
    ['bad rarity', { ...valid, pool: [{ ...entry('a'), rarity: 'Nova Rare' }] }],
    ['pool too large', { ...valid, pool: Array.from({ length: 101 }, () => entry('a')) }],
    ['more copies than the pool', { ...valid, main: [{ card: 'a', count: 3 }] }],
    ['card not in the pool', { ...valid, main: [{ card: 'ghost', count: 1 }] }],
    ['zero count', { ...valid, main: [{ card: 'a', count: 0 }] }],
    ['fractional count', { ...valid, main: [{ card: 'a', count: 1.5 }] }],
    ['duplicate main row', { ...valid, main: [{ card: 'a', count: 1 }, { card: 'a', count: 1 }] }],
    ['four legends', { ...valid, legends: ['l1', 'l1', 'l1', 'l1'] }],
    ['duplicate legend', { ...valid, legends: ['l1', 'l1'] }],
    ['legend not in the pool', { ...valid, legends: ['ghost'] }],
    ['legend takes the copy the main deck holds', { ...valid, main: [{ card: 'a', count: 2 }], legends: ['a'] }],
    ['not an object', 'run'],
    ['pool not an array', { ...valid, pool: {} }],
  ])('refuses a run with %s', (_name, raw) => {
    expect(parseSealedRun(raw)).toBeNull();
    expect(parseSealedData({ run: raw })).toBeNull();
  });

  it('refuses data without a run field', () => {
    expect(parseSealedData({})).toBeNull();
    expect(parseSealedData(null)).toBeNull();
  });
});
