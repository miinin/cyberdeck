import type { Card } from './card';
import type { Collection } from './collection';
import { countOf, setVersionCount, versionsOf, versionsTotal, withCount } from './collection';
import { BETA_SET_CODE, RETAIL_SET_CODE } from './printing';
import type { Printing } from './printing';

/*
 * Editions (D-022): the two Welcome to Night City editions a collection tells apart. The default edition is where
 * a card box's + adds copies; − takes from it first. Only printings of an ordinary rarity count (the Iconic and
 * Nova arts have their own counters).
 */

export type Edition = 'beta' | 'retail';
export const DEFAULT_EDITION: Edition = 'beta';

const EDITION_SET_CODE: Readonly<Record<Edition, string>> = { beta: BETA_SET_CODE, retail: RETAIL_SET_CODE };

/** Iconic Legend / Other / Secret, Nova Rare and the like: a rarity with an art of its own. */
export function isSpecialPrinting(printing: Pick<Printing, 'rarity'>): boolean {
  return printing.rarity !== null && /^(Iconic|Nova)\b/i.test(printing.rarity);
}

function byNumber(a: Printing, b: Printing): number {
  return a.number.localeCompare(b.number, 'en', { numeric: true });
}

/** The ordinary-rarity printing of one edition (the first by collector number when a/b exist), or null. */
export function editionPrinting(card: Pick<Card, 'printings'>, edition: Edition): Printing | null {
  const matches = (card.printings ?? [])
    .filter((p) => p.setCode === EDITION_SET_CODE[edition] && !isSpecialPrinting(p))
    .sort(byNumber);
  return matches[0] ?? null;
}

/** Where a + goes: the preferred edition's printing, else the other edition's, else null (the card has no WtNC printing). */
export function targetPrinting(card: Pick<Card, 'printings'>, preferred: Edition): Printing | null {
  return editionPrinting(card, preferred) ?? editionPrinting(card, preferred === 'beta' ? 'retail' : 'beta');
}

/** Copies that no − of the card box may take: the breakdown's special printings and keys the card does not list. */
export function protectedCount(collection: Collection, card: Pick<Card, 'key' | 'printings'>): number {
  const versions = versionsOf(collection, card.key);
  const base = (card.printings ?? []).filter((p) => !isSpecialPrinting(p));
  return versionsTotal(versions) - base.reduce((sum, p) => sum + (versions[p.key] ?? 0), 0);
}

/**
 * Sets the copies of a card with the edition rules (D-022): raising adds to the preferred edition's printing;
 * lowering takes from it first, then from the copies without a version, then from the other ordinary printings.
 * The special printings are never touched. Throws RangeError like the collection functions do, also when the
 * count would go below the special printings. The card must have a target printing (targetPrinting).
 */
export function setCopiesByEdition(collection: Collection, card: Card, preferred: Edition, count: number): Collection {
  const target = targetPrinting(card, preferred);
  if (target === null) throw new RangeError('Card has no Welcome to Night City printing');
  const current = countOf(collection, card.key);
  const delta = count - current;
  if (delta >= 0) {
    return setVersionCount(collection, card.key, target.key, (versionsOf(collection, card.key)[target.key] ?? 0) + delta);
  }
  let next = collection;
  let left = -delta;
  const takeFrom = (printing: Printing) => {
    const have = versionsOf(next, card.key)[printing.key] ?? 0;
    const take = Math.min(have, left);
    if (take > 0) {
      next = setVersionCount(next, card.key, printing.key, have - take);
      left -= take;
    }
  };
  takeFrom(target);
  if (left > 0) {
    const unknown = countOf(next, card.key) - versionsTotal(versionsOf(next, card.key));
    const take = Math.min(unknown, left);
    if (take > 0) {
      next = withCount(next, card.key, countOf(next, card.key) - take);
      left -= take;
    }
  }
  for (const printing of (card.printings ?? []).filter((p) => !isSpecialPrinting(p) && p !== target)) {
    if (left > 0) takeFrom(printing);
  }
  if (left > 0) throw new RangeError('Count is below the special versions');
  return next;
}
