import type { Card } from './card';
import type { Collection } from './collection';
import { versionsOf } from './collection';
import { setFamily, setFamilyName } from './printing';

/** One set family (Retail, Beta and FR printings together) for the "Set / Version" filter (T-074). */
export interface SetOption {
  family: string;
  label: string;
}

/** The set families found in the cards' printings, in order of first appearance. */
export function setOptions(cards: readonly Card[]): SetOption[] {
  const seen = new Map<string, string>();
  for (const card of cards) {
    for (const printing of card.printings ?? []) {
      const family = setFamily(printing.setName);
      if (!seen.has(family)) seen.set(family, setFamilyName(printing.setName));
    }
  }
  return [...seen].map(([family, label]) => ({ family, label }));
}

/** Does the card have a printing in this set family? */
export function hasSetPrinting(card: Card, family: string): boolean {
  return (card.printings ?? []).some((printing) => setFamily(printing.setName) === family);
}

/** Does the collection hold a recorded version of the card from this set family? */
export function ownsSetVersion(card: Card, family: string, collection: Collection): boolean {
  const versions = versionsOf(collection, card.key);
  return (card.printings ?? []).some((p) => setFamily(p.setName) === family && (versions[p.key] ?? 0) > 0);
}

/** Recorded version copies per set family, only those above 0, in the order of {@link setOptions}. */
export function versionsBySet(cards: readonly Card[], collection: Collection): { label: string; count: number }[] {
  const totals = new Map<string, number>();
  for (const card of cards) {
    const versions = versionsOf(collection, card.key);
    for (const printing of card.printings ?? []) {
      const n = versions[printing.key] ?? 0;
      if (n > 0) totals.set(setFamily(printing.setName), (totals.get(setFamily(printing.setName)) ?? 0) + n);
    }
  }
  return setOptions(cards)
    .map(({ family, label }) => ({ label, count: totals.get(family) ?? 0 }))
    .filter((row) => row.count > 0);
}
