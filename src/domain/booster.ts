import type { Card } from './card';
import type { CardKey } from './cardKey';
import type { CardsByKey } from './deckRules';
import { isMainSetPrinting } from './setFilter';
import { setFilterId } from './printing';
import type { Printing, PrintingKey } from './printing';
import type { Rng } from './testHand';

/*
 * Virtual boosters (T-173). Pure functions over the card data; the random source is injected so tests are
 * deterministic. The pack contents are community estimates, not the publisher's official numbers (docs/tasks/T-173).
 */

/** The two sets whose boosters can be opened: the filter ids of Welcome to Night City (Retail) and its Beta. */
export const SEALED_SETS = ['welcome-to-night-city', 'welcome-to-night-city-beta'] as const;
export type SealedSetId = (typeof SEALED_SETS)[number];

export function isSealedSet(value: unknown): value is SealedSetId {
  return typeof value === 'string' && (SEALED_SETS as readonly string[]).includes(value);
}

/** Rarity groups of a booster, rarest last. Nova Rares do not come in boosters. */
export const BOOSTER_RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Iconic', 'Secret'] as const;
export type BoosterRarity = (typeof BOOSTER_RARITIES)[number];

export function isBoosterRarity(value: unknown): value is BoosterRarity {
  return typeof value === 'string' && (BOOSTER_RARITIES as readonly string[]).includes(value);
}

export const BOOSTER_SIZE = 12;
export const BOOSTER_COMMONS = 7;
export const BOOSTER_UNCOMMONS = 3;
export const BOOSTER_RARE_SLOTS = 2;
export const LEGEND_PACK_SIZE = 3;
/** Per rare-or-better slot (community estimate): Epic about 1/4 and Iconic 1/18 and Secret 1/24 per pack. */
export const RARE_SLOT_CHANCE = { Epic: 1 / 8, Iconic: 1 / 36, Secret: 1 / 48 } as const;

/** One card of an opened pack: the card, the printing it was drawn as (its art) and the rarity group. */
export interface BoosterCard {
  readonly card: CardKey;
  readonly printing: PrintingKey;
  readonly rarity: BoosterRarity;
}

/** The rarity group of a printing, or null for one that does not come in boosters (Nova Rare and the like). */
export function boosterRarityOf(printing: Pick<Printing, 'rarity'>): BoosterRarity | null {
  const rarity = printing.rarity;
  if (rarity === 'Common' || rarity === 'Uncommon' || rarity === 'Rare' || rarity === 'Epic') return rarity;
  if (rarity === 'Secret' || rarity === 'Iconic Secret') return 'Secret';
  if (rarity !== null && rarity.startsWith('Iconic')) return 'Iconic';
  return null;
}

interface Source {
  readonly card: Card;
  readonly printings: Printing[];
}

type SetIndex = Map<BoosterRarity, Source[]>;

const indexes = new WeakMap<readonly Card[], Map<SealedSetId, SetIndex>>();

function inSet(printing: Printing, set: SealedSetId): boolean {
  return printing.language === 'en' && isMainSetPrinting(printing) && setFilterId(printing) === set;
}

/** The set's printings grouped by rarity group and card. The T-160 exceptions and other languages are left out. */
function indexOf(cards: readonly Card[], set: SealedSetId): SetIndex {
  let bySet = indexes.get(cards);
  if (bySet === undefined) {
    bySet = new Map();
    indexes.set(cards, bySet);
  }
  const cached = bySet.get(set);
  if (cached !== undefined) return cached;
  const index: SetIndex = new Map();
  for (const card of cards) {
    const perRarity = new Map<BoosterRarity, Printing[]>();
    for (const printing of card.printings ?? []) {
      if (!inSet(printing, set)) continue;
      const rarity = boosterRarityOf(printing);
      if (rarity === null) continue;
      perRarity.set(rarity, [...(perRarity.get(rarity) ?? []), printing]);
    }
    for (const [rarity, printings] of perRarity) index.set(rarity, [...(index.get(rarity) ?? []), { card, printings }]);
  }
  bySet.set(set, index);
  return index;
}

function pickIndex(length: number, rng: Rng): number {
  return Math.min(length - 1, Math.floor(rng() * length));
}

/** One card of the group, not one already taken when the group has others; null when the group is empty. */
function draw(index: SetIndex, rarity: BoosterRarity, taken: Set<CardKey>, rng: Rng): BoosterCard | null {
  const all = index.get(rarity) ?? [];
  if (all.length === 0) return null;
  const free = all.filter((source) => !taken.has(source.card.key));
  const choices = free.length > 0 ? free : all;
  const source = choices[pickIndex(choices.length, rng)] as Source;
  const printing = source.printings[pickIndex(source.printings.length, rng)] as Printing;
  taken.add(source.card.key);
  return { card: source.card.key, printing: printing.key, rarity };
}

/** The rarity group of one rare-or-better slot. A group the set does not have becomes Rare. */
function rareSlotRarity(index: SetIndex, rng: Rng): BoosterRarity {
  const roll = rng();
  let rarity: BoosterRarity = 'Rare';
  if (roll < RARE_SLOT_CHANCE.Epic) rarity = 'Epic';
  else if (roll < RARE_SLOT_CHANCE.Epic + RARE_SLOT_CHANCE.Iconic) rarity = 'Iconic';
  else if (roll < RARE_SLOT_CHANCE.Epic + RARE_SLOT_CHANCE.Iconic + RARE_SLOT_CHANCE.Secret) rarity = 'Secret';
  return (index.get(rarity) ?? []).length > 0 ? rarity : 'Rare';
}

/**
 * One booster: 7 Common, 3 Uncommon and 2 Rare-or-better, in the order they are revealed (rarest last). No card twice
 * inside one rarity group of a pack. A set without cards for a slot gives a shorter pack.
 */
export function openBooster(cards: readonly Card[], set: SealedSetId, rng: Rng): BoosterCard[] {
  const index = indexOf(cards, set);
  const taken = new Map<BoosterRarity, Set<CardKey>>(BOOSTER_RARITIES.map((rarity) => [rarity, new Set<CardKey>()]));
  const slots: BoosterRarity[] = [
    ...Array.from({ length: BOOSTER_COMMONS }, (): BoosterRarity => 'Common'),
    ...Array.from({ length: BOOSTER_UNCOMMONS }, (): BoosterRarity => 'Uncommon'),
    ...Array.from({ length: BOOSTER_RARE_SLOTS }, () => rareSlotRarity(index, rng)),
  ];
  const pack: BoosterCard[] = [];
  for (const rarity of slots) {
    const drawn = draw(index, rarity, taken.get(rarity) as Set<CardKey>, rng);
    if (drawn !== null) pack.push(drawn);
  }
  // Stable sort: equal rarities keep the draw order; the rarest card comes last.
  return pack.sort((a, b) => BOOSTER_RARITIES.indexOf(a.rarity) - BOOSTER_RARITIES.indexOf(b.rarity));
}

/** The sealed kit's Legend pack: 3 different Legends of the set, each in its ordinary art. */
export function openLegendPack(cards: readonly Card[], set: SealedSetId, rng: Rng): BoosterCard[] {
  const legends: Source[] = [];
  for (const card of cards) {
    if (card.type !== 'Legend') continue;
    const printings = (card.printings ?? []).filter((printing) => inSet(printing, set) && boosterRarityOf(printing) !== null);
    if (printings.length > 0) legends.push({ card, printings });
  }
  const pack: BoosterCard[] = [];
  while (pack.length < LEGEND_PACK_SIZE && legends.length > 0) {
    const source = legends.splice(pickIndex(legends.length, rng), 1)[0] as Source;
    const ordinary = source.printings.filter((printing) => boosterRarityOf(printing) === 'Rare');
    const choices = ordinary.length > 0 ? ordinary : source.printings;
    const printing = choices[pickIndex(choices.length, rng)] as Printing;
    pack.push({ card: source.card.key, printing: printing.key, rarity: boosterRarityOf(printing) as BoosterRarity });
  }
  return pack;
}

/* --- Sealed rules (the publisher's sealed primer) --- */

export const SEALED_MIN_MAIN = 30;
export const SEALED_LEGENDS = 3;
export const SEALED_MAX_COLORS = 3;
/** Recommended: 14 Units and 16 sellable cards (the primer). */
export const SEALED_UNITS_HINT = 14;
export const SEALED_SELLABLE_HINT = 16;

export interface SealedRow {
  readonly card: CardKey;
  readonly count: number;
}

/** The deck of a sealed run: main deck rows (no Legends) and the chosen Legends. */
export interface SealedDeck {
  readonly main: readonly SealedRow[];
  readonly legends: readonly CardKey[];
}

export type SealedIssue =
  | { kind: 'main-size'; have: number; need: number }
  | { kind: 'legends'; have: number; need: number }
  | { kind: 'colors'; colors: readonly string[]; max: number }
  | { kind: 'over-pool'; card: CardKey };

export function poolCounts(pool: readonly { readonly card: CardKey }[]): Map<CardKey, number> {
  const counts = new Map<CardKey, number>();
  for (const entry of pool) counts.set(entry.card, (counts.get(entry.card) ?? 0) + 1);
  return counts;
}

export interface SealedStats {
  /** Main deck cards (Legends and unknown cards not counted). */
  main: number;
  units: number;
  sellable: number;
  /** Colors of the main deck's cards in the order of first appearance; Legends do not count. */
  colors: string[];
}

export function sealedStats(deck: SealedDeck, cardsByKey: CardsByKey): SealedStats {
  const stats: SealedStats = { main: 0, units: 0, sellable: 0, colors: [] };
  for (const row of deck.main) {
    const card = cardsByKey.get(row.card);
    if (card === undefined || card.type === 'Legend') continue;
    stats.main += row.count;
    if (card.type === 'Unit') stats.units += row.count;
    if (card.eddiable === true) stats.sellable += row.count;
    if (card.color !== null && !stats.colors.includes(card.color)) stats.colors.push(card.color);
  }
  return stats;
}

/**
 * What stops the deck from being a legal sealed deck: under 30 cards without Legends, not exactly 3 Legends, over 3 colors
 * (Legends do not limit colors, RAM does not matter), or more copies of a card than the pool holds.
 */
export function sealedIssues(pool: readonly BoosterCard[], deck: SealedDeck, cardsByKey: CardsByKey): SealedIssue[] {
  const issues: SealedIssue[] = [];
  const stats = sealedStats(deck, cardsByKey);
  if (stats.main < SEALED_MIN_MAIN) issues.push({ kind: 'main-size', have: stats.main, need: SEALED_MIN_MAIN });
  if (deck.legends.length !== SEALED_LEGENDS) issues.push({ kind: 'legends', have: deck.legends.length, need: SEALED_LEGENDS });
  if (stats.colors.length > SEALED_MAX_COLORS) issues.push({ kind: 'colors', colors: stats.colors, max: SEALED_MAX_COLORS });
  const counts = poolCounts(pool);
  for (const row of deck.main) {
    if (row.count > (counts.get(row.card) ?? 0)) issues.push({ kind: 'over-pool', card: row.card });
  }
  for (const legend of deck.legends) {
    if ((counts.get(legend) ?? 0) < 1) issues.push({ kind: 'over-pool', card: legend });
  }
  return issues;
}
