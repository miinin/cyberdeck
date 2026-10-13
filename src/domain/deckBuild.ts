import type { CardKey } from './cardKey';
import type { DeckContent } from './deck';
import { allDeckCounts } from './deckRules';
import type { MissingRow } from './wants';

/**
 * Building several decks from one collection (T-164). Pure calculations over the decks' main deck and sideboard
 * copies and the collection counts. `owned` is the copies in the collection. `known` (optional) tells which cards
 * exist in the card data; unknown cards are skipped.
 */
export type Owned = (card: CardKey) => number;
export type Known = (card: CardKey) => boolean;

function countsOf(deck: DeckContent | null, known?: Known): Map<CardKey, number> {
  const counts = deck === null ? new Map<CardKey, number>() : allDeckCounts(deck);
  if (known !== undefined) for (const key of [...counts.keys()]) if (!known(key)) counts.delete(key);
  return counts;
}

export interface SwapRow {
  readonly card: CardKey;
  /** Copies that stay on the table: min(in the deck on the table, in the wanted deck). */
  readonly keep: number;
  /** Copies that go back to the binder from the deck on the table. */
  readonly toBinder: number;
  /** Copies taken from the binder (free copies only). */
  readonly fromBinder: number;
  /** Copies the wanted deck still lacks. */
  readonly missing: number;
  /** When copies are missing: the other kept decks that hold copies of the card. */
  readonly inDecks: readonly string[];
}

/**
 * What to do to turn the deck on the table (`from`, or null for none) into `to`, while the `kept` decks stay built.
 * Binder copies = owned - copies in `from` - copies in the kept decks, at least 0.
 */
export function swapPlan(from: DeckContent | null, to: DeckContent, kept: readonly DeckContent[], owned: Owned, known?: Known): SwapRow[] {
  const a = countsOf(from, known);
  const b = countsOf(to, known);
  const keptCounts = kept.map((deck) => ({
    name: deck.name,
    counts: countsOf(deck, known),
  }));
  const rows: SwapRow[] = [];
  for (const card of new Set([...a.keys(), ...b.keys()])) {
    const inFrom = a.get(card) ?? 0;
    const inTo = b.get(card) ?? 0;
    const inKept = keptCounts.reduce((sum, entry) => sum + (entry.counts.get(card) ?? 0), 0);
    const keep = Math.min(inFrom, inTo);
    const free = Math.max(0, owned(card) - inFrom - inKept);
    const fromBinder = Math.min(inTo - keep, free);
    const missing = inTo - keep - fromBinder;
    const inDecks = missing > 0 ? keptCounts.filter((entry) => (entry.counts.get(card) ?? 0) > 0).map((entry) => entry.name) : [];
    rows.push({
      card,
      keep,
      toBinder: inFrom - keep,
      fromBinder,
      missing,
      inDecks,
    });
  }
  return rows;
}

/** Copies one deck lacks on its own. */
export function deckMissing(deck: DeckContent, owned: Owned, known?: Known): number {
  let total = 0;
  for (const [card, count] of countsOf(deck, known)) total += Math.max(0, count - owned(card));
  return total;
}

/** Copies lacking when both decks are built at the same time. */
export function pairMissing(d1: DeckContent, d2: DeckContent, owned: Owned, known?: Known): number {
  const a = countsOf(d1, known);
  const b = countsOf(d2, known);
  let total = 0;
  for (const card of new Set([...a.keys(), ...b.keys()])) {
    total += Math.max(0, (a.get(card) ?? 0) + (b.get(card) ?? 0) - owned(card));
  }
  return total;
}

export interface CompetingPair<D extends DeckContent = DeckContent> {
  readonly first: D;
  readonly second: D;
  /** Copies lacking when both are built. */
  readonly together: number;
  /** Together minus what each lacks alone: the shortage caused by sharing. */
  readonly extra: number;
}

/** Pairs that lack more together than the two lack separately (they compete for the same cards). */
export function competingPairs<D extends DeckContent>(decks: readonly D[], owned: Owned, known?: Known): CompetingPair<D>[] {
  const alone = decks.map((deck) => deckMissing(deck, owned, known));
  const pairs: CompetingPair<D>[] = [];
  decks.forEach((first, i) => {
    for (let j = i + 1; j < decks.length; j += 1) {
      const second = decks[j] as D;
      const together = pairMissing(first, second, owned, known);
      const extra = together - (alone[i] as number) - (alone[j] as number);
      if (extra > 0) pairs.push({ first, second, together, extra });
    }
  });
  return pairs;
}

export interface BuildAllRow extends MissingRow {
  /** Copies all the decks need together. */
  readonly need: number;
  readonly owned: number;
}

/** What is lacking when all the decks are built at the same time. */
export function allMissing(decks: readonly DeckContent[], owned: Owned, known?: Known): BuildAllRow[] {
  const need = new Map<CardKey, number>();
  for (const deck of decks) for (const [card, count] of countsOf(deck, known)) need.set(card, (need.get(card) ?? 0) + count);
  const rows: BuildAllRow[] = [];
  for (const [card, total] of need) {
    const have = owned(card);
    if (total > have) rows.push({ card, missing: total - have, need: total, owned: have });
  }
  return rows;
}
