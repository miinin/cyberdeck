import type { Card } from './card';
import type { CardKey } from './cardKey';
import { playsetSize } from './card';

export interface Substitute {
  readonly card: Card;
  /** Copies of the substitute the collection holds. */
  readonly owned: number;
}

/**
 * For each missing card an owned stand-in (T-075): same colour and type, Cost within ±1, owned, and not
 * already in the deck as a full playset. Copies are not suggested twice: what one row takes is gone for the next.
 * The closest Cost wins, then the most spare copies, then the name.
 */
export function findSubstitutes(
  missing: readonly Card[],
  allCards: Iterable<Card>,
  ownedOf: (key: CardKey) => number,
  deckCountOf: (key: CardKey) => number,
): Map<CardKey, Substitute> {
  const pool = [...allCards];
  const taken = new Map<CardKey, number>();
  const result = new Map<CardKey, Substitute>();
  for (const wanted of missing) {
    const wantedCost = wanted.cost;
    if (wantedCost === null) continue;
    const options = pool
      .filter((card) => {
        if (card.key === wanted.key || card.type !== wanted.type || card.color !== wanted.color) return false;
        if (card.cost === null || Math.abs(card.cost - wantedCost) > 1) return false;
        const inDeck = deckCountOf(card.key);
        const spare = ownedOf(card.key) - inDeck - (taken.get(card.key) ?? 0);
        return inDeck < playsetSize(card) && spare > 0;
      })
      .map((card) => ({
        card,
        distance: Math.abs((card.cost ?? 0) - wantedCost),
        spare: ownedOf(card.key) - deckCountOf(card.key) - (taken.get(card.key) ?? 0),
      }))
      .sort((a, b) => a.distance - b.distance || b.spare - a.spare || a.card.displayName.localeCompare(b.card.displayName, 'en'));
    const best = options[0];
    if (best === undefined) continue;
    taken.set(best.card.key, (taken.get(best.card.key) ?? 0) + 1);
    result.set(wanted.key, { card: best.card, owned: ownedOf(best.card.key) });
  }
  return result;
}
