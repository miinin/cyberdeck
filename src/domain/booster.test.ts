import { CARDS } from '../data/cards';
import { boosterRarityOf, openBooster, openLegendPack, poolCounts, sealedIssues, sealedStats, SEALED_SETS } from './booster';
import type { BoosterCard, BoosterRarity, SealedDeck, SealedSetId } from './booster';
import type { Card } from './card';
import { toCardsByKey } from './deckRules';
import { setFilterId } from './printing';
import type { Rng } from './testHand';

function lcg(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

const byKey = toCardsByKey(CARDS);

function printingOf(entry: BoosterCard) {
  const card = byKey.get(entry.card) as Card;
  return (card.printings ?? []).find((printing) => printing.key === entry.printing);
}

const count = (pack: readonly BoosterCard[], rarity: BoosterRarity) => pack.filter((entry) => entry.rarity === rarity).length;

describe('openBooster (T-173)', () => {
  it.each(SEALED_SETS)('has 12 cards in the shape 7 Common, 3 Uncommon and 2 Rare or better (%s)', (set) => {
    const rng = lcg(1);
    for (let i = 0; i < 200; i += 1) {
      const pack = openBooster(CARDS, set, rng);
      expect(pack).toHaveLength(12);
      expect(count(pack, 'Common')).toBe(7);
      expect(count(pack, 'Uncommon')).toBe(3);
      expect(pack.filter((entry) => !['Common', 'Uncommon'].includes(entry.rarity))).toHaveLength(2);
    }
  });

  it('puts the rarest cards last', () => {
    const order = ['Common', 'Uncommon', 'Rare', 'Epic', 'Iconic', 'Secret'];
    const rng = lcg(2);
    for (let i = 0; i < 100; i += 1) {
      const ranks = openBooster(CARDS, 'welcome-to-night-city', rng).map((entry) => order.indexOf(entry.rarity));
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    }
  });

  it('draws only printings of the chosen set whose rarity matches the group, and never a Nova Rare', () => {
    const rng = lcg(3);
    for (const set of SEALED_SETS) {
      for (let i = 0; i < 300; i += 1) {
        for (const entry of openBooster(CARDS, set, rng)) {
          const printing = printingOf(entry);
          expect(printing).toBeDefined();
          expect(setFilterId(printing as NonNullable<typeof printing>)).toBe(set);
          expect(printing?.language).toBe('en');
          expect(printing?.rarity).not.toBe('Nova Rare');
          expect(boosterRarityOf(printing as NonNullable<typeof printing>)).toBe(entry.rarity);
        }
      }
    }
  });

  it('has no card twice in the same rarity group of a pack', () => {
    const rng = lcg(4);
    for (let i = 0; i < 500; i += 1) {
      const pack = openBooster(CARDS, 'welcome-to-night-city-beta', rng);
      const seen = new Set(pack.map((entry) => `${entry.rarity}:${entry.card}`));
      expect(seen.size).toBe(pack.length);
    }
  });

  it('is repeatable with the same seed and different with another', () => {
    expect(openBooster(CARDS, 'welcome-to-night-city', lcg(9))).toEqual(openBooster(CARDS, 'welcome-to-night-city', lcg(9)));
    expect(openBooster(CARDS, 'welcome-to-night-city', lcg(9))).not.toEqual(openBooster(CARDS, 'welcome-to-night-city', lcg(10)));
  });

  it('follows the community rates over 10 000 packs with a fixed seed (Epic about 25 % per pack)', () => {
    const rng = lcg(20261017);
    const packs = 10_000;
    const totals: Record<string, number> = { Epic: 0, Iconic: 0, Secret: 0, Rare: 0 };
    for (let i = 0; i < packs; i += 1) {
      for (const entry of openBooster(CARDS, 'welcome-to-night-city', rng)) totals[entry.rarity] = (totals[entry.rarity] ?? 0) + 1;
    }
    expect((totals.Epic as number) / packs).toBeGreaterThan(0.22);
    expect((totals.Epic as number) / packs).toBeLessThan(0.28);
    expect((totals.Iconic as number) / packs).toBeGreaterThan(1 / 18 - 0.02);
    expect((totals.Iconic as number) / packs).toBeLessThan(1 / 18 + 0.02);
    expect((totals.Secret as number) / packs).toBeGreaterThan(1 / 24 - 0.02);
    expect((totals.Secret as number) / packs).toBeLessThan(1 / 24 + 0.02);
  });

  it('gives a shorter pack, not an error, from cards without printings', () => {
    const bare = CARDS.map((card) => ({ ...card, printings: undefined }));
    expect(openBooster(bare, 'welcome-to-night-city', lcg(1))).toEqual([]);
  });
});

describe('openLegendPack (T-173)', () => {
  it.each(SEALED_SETS)('has 3 different Legends of the set (%s)', (set: SealedSetId) => {
    const rng = lcg(5);
    for (let i = 0; i < 200; i += 1) {
      const pack = openLegendPack(CARDS, set, rng);
      expect(pack).toHaveLength(3);
      expect(new Set(pack.map((entry) => entry.card)).size).toBe(3);
      for (const entry of pack) {
        expect((byKey.get(entry.card) as Card).type).toBe('Legend');
        const printing = printingOf(entry);
        expect(setFilterId(printing as NonNullable<typeof printing>)).toBe(set);
      }
    }
  });
});

describe('sealedIssues (T-173)', () => {
  const cards = CARDS.filter((card) => card.type !== 'Legend');
  const legends = CARDS.filter((card) => card.type === 'Legend');
  const pool: BoosterCard[] = [...cards.slice(0, 40), ...legends.slice(0, 3)].map((card) => ({
    card: card.key,
    printing: 'welcometonightcityretail:001',
    rarity: 'Common',
  }));
  const mainOf = (n: number) => pool.filter((entry) => !legends.some((legend) => legend.key === entry.card)).slice(0, n).map((entry) => ({ card: entry.card, count: 1 }));
  const legendKeys = legends.slice(0, 3).map((card) => card.key);

  it('has no color, Legend or pool issue for one color and 3 Legends', () => {
    const colorOf = (key: string) => (byKey.get(key) as Card).color;
    const reds = pool.filter((entry) => colorOf(entry.card) === 'Red' && !legendKeys.includes(entry.card));
    const deck: SealedDeck = { main: reds.map((entry) => ({ card: entry.card, count: 1 })), legends: legendKeys };
    const issues = sealedIssues(pool, deck, byKey);
    expect(issues.some((issue) => issue.kind === 'colors' || issue.kind === 'legends' || issue.kind === 'over-pool')).toBe(false);
  });

  it('asks for 30 main cards and 3 Legends', () => {
    const issues = sealedIssues(pool, { main: mainOf(5), legends: legendKeys.slice(0, 2) }, byKey);
    expect(issues).toContainEqual({ kind: 'main-size', have: 5, need: 30 });
    expect(issues).toContainEqual({ kind: 'legends', have: 2, need: 3 });
  });

  it('does not count Legends in the main deck or limit colors by them', () => {
    const stats = sealedStats({ main: [{ card: legendKeys[0] as string, count: 1 }], legends: legendKeys }, byKey);
    expect(stats).toEqual({ main: 0, units: 0, sellable: 0, colors: [] });
  });

  it('flags a fourth color', () => {
    const picks = (['Red', 'Yellow', 'Green', 'Blue'] as const).map((color) => cards.find((card) => card.color === color) as Card);
    const fourColors = picks.map((card) => ({ card: card.key, count: 1 }));
    const issues = sealedIssues(
      picks.map((card) => ({ card: card.key, printing: 'welcometonightcityretail:001', rarity: 'Common' as const })),
      { main: fourColors, legends: legendKeys },
      byKey,
    );
    expect(issues.some((issue) => issue.kind === 'colors')).toBe(true);
  });

  it('flags more copies than the pool holds', () => {
    const first = pool[0] as BoosterCard;
    const issues = sealedIssues(pool, { main: [{ card: first.card, count: 2 }], legends: legendKeys }, byKey);
    expect(issues).toContainEqual({ kind: 'over-pool', card: first.card });
  });

  it('counts Units and sellable cards', () => {
    const unit = cards.find((card) => card.type === 'Unit' && card.eddiable === true) as Card;
    expect(sealedStats({ main: [{ card: unit.key, count: 2 }], legends: [] }, byKey)).toMatchObject({ main: 2, units: 2, sellable: 2 });
    expect(poolCounts([{ card: 'a' }, { card: 'a' }, { card: 'b' }]).get('a')).toBe(2);
  });
});
