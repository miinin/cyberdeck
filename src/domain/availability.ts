import type { Printing } from './printing';
import { setFamilyName } from './printing';
import { isMainSetPrinting } from './setFilter';

export type SourceKind = 'starter' | 'demo' | 'promo' | 'prize';

export interface AvailabilitySource {
  kind: SourceKind;
  /** Set family names in the order of the card data, no duplicates. */
  names: string[];
}

export interface Availability {
  /** Some printing comes in the Welcome to Night City boosters (T-160 exceptions left out). */
  inBoosters: boolean;
  /** Other places the card comes from, in the order starter, demo, promo, prize; empty groups left out. */
  sources: AvailabilitySource[];
}

const KIND_ORDER: readonly SourceKind[] = ['starter', 'demo', 'promo', 'prize'];

/** Starter deck, demo deck, tournament prize (Open, Brawl, Showdown) or else a promo (promos, Box Toppers, Pre-Release). */
export function sourceKindOf(familyName: string): SourceKind {
  if (/Starter Deck$/.test(familyName)) return 'starter';
  if (/Demo Deck$/.test(familyName)) return 'demo';
  if (/\b(Open|Brawl|Showdown)\b/.test(familyName)) return 'prize';
  return 'promo';
}

/** Where a card comes from (T-166): the boosters, and the starter decks, demo decks, promos and prizes outside them. */
export function availabilityOf(printings: readonly Printing[]): Availability {
  const names = new Map<SourceKind, string[]>();
  let inBoosters = false;
  for (const printing of printings) {
    if (isMainSetPrinting(printing)) {
      inBoosters = true;
      continue;
    }
    const family = setFamilyName(printing.setName);
    // A Welcome to Night City printing outside the boosters (T-160) is a prize art, not a source of its own.
    if (family === 'Welcome to Night City') continue;
    const kind = sourceKindOf(family);
    const list = names.get(kind) ?? [];
    if (!list.includes(family)) list.push(family);
    names.set(kind, list);
  }
  return {
    inBoosters,
    sources: KIND_ORDER.flatMap((kind) => {
      const list = names.get(kind);
      return list === undefined ? [] : [{ kind, names: list }];
    }),
  };
}

/** The card is in the boosters but this art (its printings) is not. */
export function artOutsideBoosters(card: Availability, artPrintings: readonly Printing[]): boolean {
  return card.inBoosters && !artPrintings.some(isMainSetPrinting);
}
