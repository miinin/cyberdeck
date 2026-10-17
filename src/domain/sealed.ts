import { isCardKey } from './cardKey';
import type { CardKey } from './cardKey';
import { isBoosterRarity, isSealedSet, poolCounts, SEALED_LEGENDS } from './booster';
import type { BoosterCard, SealedDeck, SealedRow, SealedSetId } from './booster';
import { MAX_DECK_CARD_COUNT } from './deck';
import { isPrintingKey } from './printing';
import { isDeckId, isRecord } from './validate';
import type { DeckId } from './deck';
import type { Parsed } from './validate';

/*
 * A running sealed (T-173): the set, the pool of opened cards, the main deck and the chosen Legends. Pure functions;
 * every change returns a new run (or the same one when nothing changes). Stored on this device only.
 */

/** Six boosters and the Legend pack, opened one at a time. */
export const SEALED_BOOSTERS = 6;
export const SEALED_PACK_STEPS = SEALED_BOOSTERS + 1;
/** The largest pool a stored run may have (7 packs of up to 12 cards). */
export const MAX_SEALED_POOL = 100;

export interface SealedRun {
  readonly set: SealedSetId;
  /** Packs opened so far, 0–7: the 6 boosters first, the Legend pack last. Ready to build when it is 7. */
  readonly opened: number;
  readonly pool: readonly BoosterCard[];
  readonly main: readonly SealedRow[];
  readonly legends: readonly CardKey[];
  /** The deck this run was last saved as (T-176), so saving again updates it. Absent = not saved yet or an older run. */
  readonly deckId?: DeckId;
  /** The updatedAt of that deck right after this run saved it: a different one later means the deck was edited elsewhere. */
  readonly deckUpdatedAt?: string;
}

export function newSealedRun(set: SealedSetId): SealedRun {
  return { set, opened: 0, pool: [], main: [], legends: [] };
}

export function isSealedReady(run: SealedRun): boolean {
  return run.opened >= SEALED_PACK_STEPS;
}

export function sealedDeckOf(run: SealedRun): SealedDeck {
  return { main: run.main, legends: run.legends };
}

/** Adds the cards of the next pack to the pool. Nothing changes once all packs are open. */
export function withPack(run: SealedRun, pack: readonly BoosterCard[]): SealedRun {
  if (isSealedReady(run)) return run;
  return { ...run, opened: run.opened + 1, pool: [...run.pool, ...pack] };
}

/** The run without the deck it was saved as (the deck is gone). */
export function withoutDeckId(run: SealedRun): SealedRun {
  if (run.deckId === undefined) return run;
  return { set: run.set, opened: run.opened, pool: run.pool, main: run.main, legends: run.legends };
}

export function mainCountOf(run: SealedRun, card: CardKey): number {
  return run.main.find((row) => row.card === card)?.count ?? 0;
}

/** Copies of the card in the pool that are neither in the main deck nor chosen as a Legend. */
export function freeCopies(run: SealedRun, card: CardKey): number {
  const inPool = poolCounts(run.pool).get(card) ?? 0;
  return inPool - mainCountOf(run, card) - (run.legends.includes(card) ? 1 : 0);
}

/** Moves one copy from the pool to the main deck. A Legend, a card without a free copy or a full deck change nothing. */
export function addToMain(run: SealedRun, card: CardKey, isLegend: boolean): SealedRun {
  if (isLegend || freeCopies(run, card) < 1 || mainCountOf(run, card) >= MAX_DECK_CARD_COUNT) return run;
  const exists = run.main.some((row) => row.card === card);
  const main = exists ? run.main.map((row) => (row.card === card ? { card, count: row.count + 1 } : row)) : [...run.main, { card, count: 1 }];
  return { ...run, main };
}

/** Takes one copy back from the main deck to the pool. */
export function removeFromMain(run: SealedRun, card: CardKey): SealedRun {
  const count = mainCountOf(run, card);
  if (count < 1) return run;
  const main = count === 1 ? run.main.filter((row) => row.card !== card) : run.main.map((row) => (row.card === card ? { card, count: count - 1 } : row));
  return { ...run, main };
}

/** Chooses or drops a Legend. A fourth Legend, or one that is not in the pool, changes nothing. */
export function toggleLegend(run: SealedRun, card: CardKey): SealedRun {
  if (run.legends.includes(card)) return { ...run, legends: run.legends.filter((legend) => legend !== card) };
  if (run.legends.length >= SEALED_LEGENDS || !run.pool.some((entry) => entry.card === card)) return run;
  return { ...run, legends: [...run.legends, card] };
}

/** The cards of the pool once each, in the order they were opened, with how many copies there are. */
export function poolRows(pool: readonly BoosterCard[]): { entry: BoosterCard; count: number }[] {
  const rows = new Map<CardKey, { entry: BoosterCard; count: number }>();
  for (const entry of pool) {
    const row = rows.get(entry.card);
    if (row === undefined) rows.set(entry.card, { entry, count: 1 });
    else {
      row.count += 1;
      // The rarest art of the card is the one shown.
      if (isRarer(entry, row.entry)) row.entry = entry;
    }
  }
  return [...rows.values()];
}

function isRarer(a: BoosterCard, b: BoosterCard): boolean {
  const order = ['Common', 'Uncommon', 'Rare', 'Epic', 'Iconic', 'Secret'];
  return order.indexOf(a.rarity) > order.indexOf(b.rarity);
}

/* --- Reading stored data (SR-11, SR-23): nothing is trusted, a run that is not exactly valid is not read at all --- */

function parsePool(raw: unknown): BoosterCard[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_SEALED_POOL) return null;
  const pool: BoosterCard[] = [];
  for (const item of raw as unknown[]) {
    if (!isRecord(item)) return null;
    const { card, printing, rarity } = item;
    if (!isCardKey(card) || !isPrintingKey(printing) || !isBoosterRarity(rarity)) return null;
    pool.push({ card, printing, rarity });
  }
  return pool;
}

function parseMain(raw: unknown, counts: ReadonlyMap<CardKey, number>): SealedRow[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_SEALED_POOL) return null;
  const main: SealedRow[] = [];
  const seen = new Set<string>();
  for (const item of raw as unknown[]) {
    if (!isRecord(item)) return null;
    const { card, count } = item;
    if (!isCardKey(card) || seen.has(card)) return null;
    // The deck never holds more copies than the pool (SR-23).
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > MAX_DECK_CARD_COUNT || count > (counts.get(card) ?? 0)) return null;
    seen.add(card);
    main.push({ card, count });
  }
  return main;
}

function parseLegends(raw: unknown, counts: ReadonlyMap<CardKey, number>, main: readonly SealedRow[]): CardKey[] | null {
  if (!Array.isArray(raw) || raw.length > SEALED_LEGENDS) return null;
  const legends: CardKey[] = [];
  for (const item of raw as unknown[]) {
    if (!isCardKey(item) || legends.includes(item)) return null;
    // A Legend taken from the pool takes a copy; the main deck must still fit around it.
    const taken = (main.find((row) => row.card === item)?.count ?? 0) + 1;
    if (taken > (counts.get(item) ?? 0)) return null;
    legends.push(item);
  }
  return legends;
}

/** A stored run, or null when it is not valid. */
export function parseSealedRun(raw: unknown): SealedRun | null {
  if (!isRecord(raw)) return null;
  const { set, opened, pool, main, legends, deckId, deckUpdatedAt } = raw;
  if (!isSealedSet(set) || typeof opened !== 'number' || !Number.isInteger(opened) || opened < 0 || opened > SEALED_PACK_STEPS) return null;
  const parsedPool = parsePool(pool);
  if (parsedPool === null) return null;
  const counts = poolCounts(parsedPool);
  const parsedMain = parseMain(main, counts);
  if (parsedMain === null) return null;
  const parsedLegends = parseLegends(legends, counts, parsedMain);
  if (parsedLegends === null) return null;
  // A run saved before T-176 has no deck id. The id is kept only with a valid stamp, so a run cannot overwrite a deck without the
  // edited-elsewhere check (SEC-T176-1); otherwise both are dropped and the run itself is still read.
  const linked = isDeckId(deckId) && typeof deckUpdatedAt === 'string' && deckUpdatedAt.length > 0 && deckUpdatedAt.length <= 40;
  return { set, opened, pool: parsedPool, main: parsedMain, legends: parsedLegends, ...(linked ? { deckId, deckUpdatedAt } : {}) };
}

/** The envelope's data: `{ run }` where `run` is null when no sealed is going. */
export function parseSealedData(raw: unknown): Parsed<SealedRun | null> | null {
  if (!isRecord(raw)) return null;
  if (raw.run === null) return { value: null, dropped: 0 };
  const run = parseSealedRun(raw.run);
  return run === null ? null : { value: run, dropped: 0 };
}
