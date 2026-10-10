import type { Card } from './card';
import type { CardKey } from './cardKey';
import { playsetSize } from './card';
import type { DeckContent } from './deck';
import { deckCounts, type CardsByKey } from './deckRules';
import { withDeckCount } from './deckEdit';

/** One owned stand-in for a missing card: how many copies of it fill the gap, and how many the collection holds. */
export interface Substitute {
  readonly card: Card;
  /** Copies of the substitute that fill the gap. */
  readonly copies: number;
  /** Copies of the substitute the collection holds. */
  readonly owned: number;
}

export interface MissingRow {
  readonly card: Card;
  readonly missing: number;
}

/**
 * Owned stand-ins for every missing copy (T-075, T-121): same colour and type, Cost within ±1, owned, and the
 * deck (originals plus stand-ins) stays within one playset of it. Copies are not suggested twice: what one copy
 * takes is gone for the next. Per copy the closest Cost wins, then the most spare copies, then the name.
 * A row can get several stand-ins (2× A, 1× B); copies without any stand-in are simply left out.
 */
export function findSubstitutes(
  missing: readonly MissingRow[],
  allCards: Iterable<Card>,
  ownedOf: (key: CardKey) => number,
  deckCountOf: (key: CardKey) => number,
): Map<CardKey, Substitute[]> {
  const pool = [...allCards];
  const taken = new Map<CardKey, number>();
  const result = new Map<CardKey, Substitute[]>();
  for (const { card: wanted, missing: count } of missing) {
    const wantedCost = wanted.cost;
    if (wantedCost === null) continue;
    const used = new Map<CardKey, number>();
    for (let copy = 0; copy < count; copy += 1) {
      const options = pool
        .filter((card) => {
          if (card.key === wanted.key || card.type !== wanted.type || card.color !== wanted.color) return false;
          if (card.cost === null || Math.abs(card.cost - wantedCost) > 1) return false;
          const inDeck = deckCountOf(card.key) + (taken.get(card.key) ?? 0);
          return inDeck < playsetSize(card) && ownedOf(card.key) - inDeck > 0;
        })
        .map((card) => ({
          card,
          distance: Math.abs((card.cost ?? 0) - wantedCost),
          spare: ownedOf(card.key) - deckCountOf(card.key) - (taken.get(card.key) ?? 0),
        }))
        .sort((a, b) => a.distance - b.distance || b.spare - a.spare || a.card.displayName.localeCompare(b.card.displayName, 'en'));
      const best = options[0];
      if (best === undefined) break;
      taken.set(best.card.key, (taken.get(best.card.key) ?? 0) + 1);
      used.set(best.card.key, (used.get(best.card.key) ?? 0) + 1);
    }
    if (used.size === 0) continue;
    result.set(
      wanted.key,
      [...used].map(([key, copies]) => {
        const card = pool.find((c) => c.key === key) as Card;
        return { card, copies, owned: ownedOf(key) };
      }),
    );
  }
  return result;
}

/** Main-deck copies of each non-Legend card the collection lacks, and the stand-in copies that cover them. */
function mainGaps(
  deck: DeckContent,
  cardsByKey: CardsByKey,
  ownedOf: (key: CardKey) => number,
  substitutes: ReadonlyMap<CardKey, readonly Substitute[]>,
) {
  const gaps: { key: CardKey; count: number; missing: number; stand: Substitute[] }[] = [];
  for (const [key, count] of deckCounts(deck)) {
    if (cardsByKey.get(key)?.type === 'Legend') continue;
    const missing = Math.max(0, count - ownedOf(key));
    // Own copies go to the main deck first; the sideboard gets what is left.
    gaps.push({ key, count, missing, stand: [...(substitutes.get(key) ?? [])] });
  }
  return gaps;
}

/**
 * The deck with the missing main-deck copies swapped for their stand-ins (T-121). Legends and the sideboard stay
 * as they are, and so do copies without a stand-in.
 */
export function applySubstitutes(
  deck: DeckContent,
  cardsByKey: CardsByKey,
  ownedOf: (key: CardKey) => number,
  substitutes: ReadonlyMap<CardKey, readonly Substitute[]>,
): DeckContent {
  const counts = new Map(deckCounts(deck));
  for (const { key, missing, stand } of mainGaps(deck, cardsByKey, ownedOf, substitutes)) {
    let left = missing;
    for (const sub of stand) {
      const n = Math.min(left, sub.copies);
      if (n <= 0) continue;
      left -= n;
      counts.set(key, (counts.get(key) ?? 0) - n);
      counts.set(sub.card.key, (counts.get(sub.card.key) ?? 0) + n);
    }
  }
  let next = deck;
  for (const [key, count] of counts) {
    if (count !== (deckCounts(deck).get(key) ?? 0)) next = withDeckCount(next, key, count);
  }
  return next;
}

export interface Playability {
  /** Non-Legend cards of the main deck. */
  readonly total: number;
  /** Of those, how many the collection holds. */
  readonly own: number;
  /** Of those, how many the collection holds when the stand-ins fill the gaps. */
  readonly withSubstitutes: number;
}

/** How playable the main deck is with the collection as it is, and with stand-ins (T-121). Legends are left out. */
export function playability(
  deck: DeckContent,
  cardsByKey: CardsByKey,
  ownedOf: (key: CardKey) => number,
  substitutes: ReadonlyMap<CardKey, readonly Substitute[]>,
): Playability {
  let total = 0;
  let own = 0;
  let covered = 0;
  for (const { count, missing, stand } of mainGaps(deck, cardsByKey, ownedOf, substitutes)) {
    total += count;
    own += count - missing;
    covered += Math.min(
      missing,
      stand.reduce((sum, sub) => sum + sub.copies, 0),
    );
  }
  return { total, own, withSubstitutes: own + covered };
}

