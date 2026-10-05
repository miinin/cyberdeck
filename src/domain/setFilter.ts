import type { Card } from './card';
import type { Collection } from './collection';
import { versionsOf } from './collection';
import { setFamilyName, setFilterId } from './printing';

/** "sets" = the two Welcome to Night City sets (D-022); "other" = starter decks, promos, tournaments and the like. */
export type SetGroup = 'sets' | 'other';

/** One value of the "Set / Version" filter (T-074, D-022). `family` is the filter id, see setFilterId. */
export interface SetOption {
  family: string;
  label: string;
  group: SetGroup;
}

const SET_ORDER = ['welcome-to-night-city', 'welcome-to-night-city-beta'];

/** The filter values found in the cards' printings: the sets first (Retail, then Beta), the rest in order of first appearance. */
export function setOptions(cards: readonly Card[]): SetOption[] {
  const seen = new Map<string, string>();
  for (const card of cards) {
    for (const printing of card.printings ?? []) {
      const id = setFilterId(printing);
      if (!seen.has(id)) seen.set(id, id === SET_ORDER[1] ? `${setFamilyName(printing.setName)} (Beta)` : setFamilyName(printing.setName));
    }
  }
  const options = [...seen].map(([family, label]): SetOption => ({ family, label, group: SET_ORDER.includes(family) ? 'sets' : 'other' }));
  const sets = SET_ORDER.flatMap((id) => options.filter((option) => option.family === id));
  return [...sets, ...options.filter((option) => option.group === 'other')];
}

/** Does the card have a printing in this set (filter id)? */
export function hasSetPrinting(card: Card, family: string): boolean {
  return (card.printings ?? []).some((printing) => setFilterId(printing) === family);
}

/** Does the collection hold a recorded version of the card from this set (filter id)? */
export function ownsSetVersion(card: Card, family: string, collection: Collection): boolean {
  const versions = versionsOf(collection, card.key);
  return (card.printings ?? []).some((p) => setFilterId(p) === family && (versions[p.key] ?? 0) > 0);
}

/** Recorded version copies per set, only those above 0, in the order of {@link setOptions}. */
export function versionsBySet(cards: readonly Card[], collection: Collection): { label: string; count: number }[] {
  const totals = new Map<string, number>();
  for (const card of cards) {
    const versions = versionsOf(collection, card.key);
    for (const printing of card.printings ?? []) {
      const n = versions[printing.key] ?? 0;
      if (n > 0) totals.set(setFilterId(printing), (totals.get(setFilterId(printing)) ?? 0) + n);
    }
  }
  return setOptions(cards)
    .map(({ family, label }) => ({ label, count: totals.get(family) ?? 0 }))
    .filter((row) => row.count > 0);
}
