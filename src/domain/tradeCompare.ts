import { playsetSize } from './card';
import type { CardKey } from './cardKey';
import { compareCardKeys } from './collection';
import type { Collection, CollectionEntry } from './collection';
import type { CardsByKey } from './deckRules';
import type { WantList } from './wants';

/** Copies free to trade (T-063): what is owned beyond a full playset. */
export function tradeableCount(owned: number, card: Parameters<typeof playsetSize>[0]): number {
  return Math.max(0, owned - playsetSize(card));
}

/** Tradeable copies per known card; a card that is not in the card data is counted in `unknown` (rows). */
export function tradeableOf(
  have: Collection,
  cardsByKey: CardsByKey,
): { readonly counts: Map<CardKey, number>; readonly unknown: number } {
  const counts = new Map<CardKey, number>();
  let unknown = 0;
  for (const { card, count } of have.entries) {
    const known = cardsByKey.get(card);
    if (known === undefined) unknown += 1;
    else {
      const tradeable = tradeableCount(count, known);
      if (tradeable > 0) counts.set(card, tradeable);
    }
  }
  return { counts, unknown };
}

function overlap(offered: ReadonlyMap<CardKey, number>, wanted: WantList): CollectionEntry[] {
  const rows: CollectionEntry[] = [];
  for (const { card, count } of wanted.entries) {
    const available = offered.get(card);
    if (available !== undefined) rows.push({ card, count: Math.min(available, count) });
  }
  return rows.sort((a, b) => compareCardKeys(a.card, b.card));
}

export interface TradeComparison {
  /** I have it to give, they want it. */
  readonly iCanGive: readonly CollectionEntry[];
  /** They have it to give, I want it. */
  readonly theyCanGive: readonly CollectionEntry[];
}

/** Both sides offer only tradeable copies; count = min(offered, wanted). */
export function compareTrade(
  mine: Collection,
  myWants: WantList,
  theirs: Collection,
  theirWants: WantList,
  cardsByKey: CardsByKey,
  /** Tradeable copies by the trade rules (T-135); without them the playset rule applies. */
  tradeable: { readonly mine?: ReadonlyMap<CardKey, number>; readonly theirs?: ReadonlyMap<CardKey, number> } = {},
): TradeComparison {
  return {
    iCanGive: overlap(tradeable.mine ?? tradeableOf(mine, cardsByKey).counts, theirWants),
    theyCanGive: overlap(tradeable.theirs ?? tradeableOf(theirs, cardsByKey).counts, myWants),
  };
}
