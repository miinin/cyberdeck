import type { Card } from './card';
import { KNOWN_CARD_RARITIES } from './cardSearch';

export type SortKey = 'name' | 'type' | 'rarity' | 'cost' | 'power' | 'ram';
export type SortDirection = 'asc' | 'desc';

function valueOf(card: Card, key: SortKey): string | number | null {
  if (key === 'name') return card.displayName;
  if (key === 'rarity' && card.rarity !== null) {
    // Game order (Common → Nova Rare); an unknown rarity sorts after the known ones.
    const index = KNOWN_CARD_RARITIES.indexOf(card.rarity);
    return index === -1 ? KNOWN_CARD_RARITIES.length : index;
  }
  return card[key];
}

function compareValues(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'en', { sensitivity: 'base' });
}

/**
 * Returns a sorted copy. Missing (null) values are always last whatever the direction; ties keep
 * the input order (stable) after a secondary comparison by name.
 */
export function sortCards(cards: readonly Card[], key: SortKey, direction: SortDirection): Card[] {
  const sign = direction === 'asc' ? 1 : -1;
  return [...cards].sort((x, y) => {
    const a = valueOf(x, key);
    const b = valueOf(y, key);
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    const main = compareValues(a, b) * sign;
    if (main !== 0) return main;
    return key === 'name' ? 0 : compareValues(x.displayName, y.displayName);
  });
}
