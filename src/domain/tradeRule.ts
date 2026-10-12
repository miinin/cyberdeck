import { playsetSize } from './card';
import type { Card } from './card';
import type { CardKey } from './cardKey';
import type { Collection } from './collection';
import type { Deck } from './deck';
import type { CardsByKey } from './deckRules';

/*
 * Trade rule (T-135): how many copies of each card the user keeps; the rest of the copies are tradeable ("Have").
 * Like the trade lists of other card game apps: keep a playset (the default, T-063), keep one, or keep nothing,
 * and optionally keep at least the copies the user's decks use (all decks built at once).
 */

export type TradeKeep = 'playset' | 'one' | 'none';

export interface TradeRule {
  readonly keep: TradeKeep;
  /** Keep at least the copies in the decks (summed over all decks and their sections). */
  readonly keepDeckCards: boolean;
}

export const TRADE_KEEPS: readonly TradeKeep[] = ['playset', 'one', 'none'];
export const DEFAULT_TRADE_RULE: TradeRule = { keep: 'playset', keepDeckCards: false };

/** Copies of each card in all decks together. */
export function deckUse(decks: readonly Deck[]): Map<CardKey, number> {
  const use = new Map<CardKey, number>();
  for (const deck of decks) {
    for (const section of deck.sections) {
      for (const { card, count } of section.cards) use.set(card, (use.get(card) ?? 0) + count);
    }
  }
  return use;
}

/** Copies the rule keeps of a card. */
export function keptCount(card: Parameters<typeof playsetSize>[0], rule: TradeRule, inDecks = 0): number {
  const base = rule.keep === 'playset' ? playsetSize(card) : rule.keep === 'one' ? 1 : 0;
  return rule.keepDeckCards ? Math.max(base, inDecks) : base;
}

/** Tradeable copies per known card under the rule; cards with none are left out. */
export function tradeableWithRule(
  have: Collection,
  cardsByKey: CardsByKey,
  rule: TradeRule,
  use: ReadonlyMap<CardKey, number> = new Map(),
): Map<CardKey, number> {
  const counts = new Map<CardKey, number>();
  for (const { card, count } of have.entries) {
    const known: Card | undefined = cardsByKey.get(card);
    if (known === undefined) continue;
    const tradeable = count - keptCount(known, rule, use.get(card) ?? 0);
    if (tradeable > 0) counts.set(card, tradeable);
  }
  return counts;
}
