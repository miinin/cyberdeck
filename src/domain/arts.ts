import type { Card } from './card';
import type { Collection, CollectionEntry } from './collection';
import { versionsOf, withCount, setVersionCount, countOf, versionsTotal } from './collection';
import { setFilterId } from './printing';
import { officialRarity } from './cardSearch';
import type { Printing } from './printing';

/*
 * Arts (D-021): the visual versions of a card. The base art gathers every printing with an ordinary rarity;
 * each special rarity (Iconic Legend, Iconic Other, Iconic Secret, Nova Rare) is an art of its own.
 * Printings (Retail, Beta, FR, tournament numbers) stay the unit of the stored breakdown (D-020).
 */

/** Rarities that have their own art. */
export const SPECIAL_ART_RARITIES: readonly string[] = ['Iconic Legend', 'Iconic Other', 'Iconic Secret', 'Nova Rare'];

/** "Nova Rare" -> "nova-rare": lower case, every run of other characters becomes one dash. */
export function raritySlug(rarity: string): string {
  return rarity.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export interface Art {
  /** `<card key>` for the base art, `<card key>__<rarity slug>` for a special one. */
  artId: string;
  /** 'base' or the special rarity. */
  label: string;
  /** The special rarity, or null for the base art. */
  rarity: string | null;
  printings: readonly Printing[];
  /** Where a counter adds copies: Retail in English, else the first English printing, else the first. */
  defaultPrinting: Printing | null;
}

export function isSpecialRarity(rarity: string | null): rarity is string {
  return rarity !== null && SPECIAL_ART_RARITIES.includes(rarity);
}

function defaultOf(printings: readonly Printing[]): Printing | null {
  const english = printings.filter((p) => p.language === 'en');
  return english.find((p) => /Retail/.test(p.setName)) ?? english[0] ?? printings[0] ?? null;
}

/**
 * The arts of a card, base first. A special rarity is an art only when `hasArt` says it has a picture
 * (default: always). A card without printings has no arts.
 */
export function artsOf(card: Card, hasArt: (cardKey: string, rarity: string) => boolean = () => true): Art[] {
  const printings = card.printings ?? [];
  if (printings.length === 0) return [];
  const base: Printing[] = [];
  const special = new Map<string, Printing[]>();
  for (const printing of printings) {
    const rarity = printing.rarity;
    if (isSpecialRarity(rarity) && hasArt(card.key, rarity)) special.set(rarity, [...(special.get(rarity) ?? []), printing]);
    else base.push(printing);
  }
  // A card whose printings are all of special rarities (e.g. all Nova Rare) has no base art: an empty one would be a duplicate.
  const arts: Art[] = base.length === 0 && special.size > 0 ? [] : [{ artId: card.key, label: 'base', rarity: null, printings: base, defaultPrinting: defaultOf(base) }];
  for (const rarity of SPECIAL_ART_RARITIES) {
    const list = special.get(rarity);
    if (list !== undefined) {
      arts.push({ artId: `${card.key}__${raritySlug(rarity)}`, label: rarity, rarity, printings: list, defaultPrinting: defaultOf(list) });
    }
  }
  return arts;
}

/** The art a rarity belongs to (a special one, else the base art), or undefined. */
export function artForRarity(arts: readonly Art[], rarity: string | null): Art | undefined {
  return arts.find((art) => art.rarity !== null && art.rarity === rarity) ?? arts.find((art) => art.rarity === null);
}

/** The art that takes the copies without a version: the base art, or the first art when the card has no base art. */
function catchAll(arts: readonly Art[]): Art | undefined {
  return arts.find((art) => art.rarity === null) ?? arts[0];
}

/**
 * The rarity an art shows (for the rarity symbol): a special art its own rarity; the base art the rarity of its
 * printings (the card's own when it is among them, else the first), else the card's rarity.
 */
export function artRarity(card: Card, art: Art): string | null {
  if (art.rarity !== null) return art.rarity;
  const rarities = art.printings.map((p) => p.rarity).filter((r): r is string => r !== null);
  if (card.rarity !== null && rarities.includes(card.rarity)) return card.rarity;
  return rarities[0] ?? card.rarity;
}

/** Copies per art: a special art counts its printings' breakdown, the base art the rest (includes "version unknown"). */
export function ownedPerArt(entry: CollectionEntry | undefined, card: Card, arts: readonly Art[] = artsOf(card)): Map<string, number> {
  const result = new Map<string, number>();
  const versions = entry?.versions ?? {};
  let special = 0;
  for (const art of arts) {
    if (art.rarity === null) continue;
    const n = art.printings.reduce((sum, p) => sum + (versions[p.key] ?? 0), 0);
    result.set(art.artId, n);
    special += n;
  }
  for (const art of arts) if (art.rarity === null) result.set(art.artId, Math.max(0, (entry?.count ?? 0) - special));
  // Without a base art the first art also takes the copies without a version.
  const first = arts[0];
  if (first !== undefined && first.rarity !== null) result.set(first.artId, (result.get(first.artId) ?? 0) + Math.max(0, (entry?.count ?? 0) - special));
  return result;
}

/**
 * Sets the copies of one art. Raising goes to the default printing (the base art: to the total without a
 * version). Lowering takes the copies without a version first (base), then the default printing, then the others.
 * Throws RangeError like the collection functions do.
 */
export function setArtCount(collection: Collection, card: Card, artId: string, n: number, arts: readonly Art[] = artsOf(card)): Collection {
  const art = arts.find((a) => a.artId === artId);
  if (art === undefined) throw new RangeError('Unknown art');
  const entry = collection.entries.find((e) => e.card === card.key);
  const current = ownedPerArt(entry, card, arts).get(artId) ?? 0;
  let delta = n - current;
  let next = collection;
  if (delta > 0) {
    if (art.rarity === null || art.defaultPrinting === null) return withCount(collection, card.key, countOf(collection, card.key) + delta);
    const before = versionsOf(collection, card.key)[art.defaultPrinting.key] ?? 0;
    return setVersionCount(collection, card.key, art.defaultPrinting.key, before + delta);
  }
  if (catchAll(arts) === art) {
    const unknown = countOf(next, card.key) - versionsTotal(versionsOf(next, card.key));
    const take = Math.min(-delta, unknown);
    if (take > 0) next = withCount(next, card.key, countOf(next, card.key) - take);
    delta += take;
  }
  const ordered = art.defaultPrinting === null ? art.printings : [art.defaultPrinting, ...art.printings.filter((p) => p !== art.defaultPrinting)];
  for (const printing of ordered) {
    if (delta >= 0) break;
    const have = versionsOf(next, card.key)[printing.key] ?? 0;
    const take = Math.min(have, -delta);
    if (take > 0) {
      next = setVersionCount(next, card.key, printing.key, have - take);
      delta += take;
    }
  }
  return next;
}

/**
 * The special rarity whose art a search result should show (D-021 kohta 4): the printings matching the active
 * rarity and set family filters are looked at; when every match is of one special rarity, that is it.
 * Null without a filter, or when a match is an ordinary printing (then the base art is right).
 */
export function matchedSpecialRarity(
  card: Card,
  rarities: readonly string[],
  family: string | null,
  hasArt: (cardKey: string, rarity: string) => boolean = () => true,
): string | null {
  if (rarities.length === 0 && family === null) return null;
  const matches = (card.printings ?? []).filter(
    (p) => (rarities.length === 0 || (p.rarity !== null && rarities.includes(officialRarity(p.rarity)))) && (family === null || setFilterId(p) === family),
  );
  if (matches.length === 0) return null;
  const first = matches[0]?.rarity ?? null;
  if (first === null || !isSpecialRarity(first) || !hasArt(card.key, first)) return null;
  return matches.every((p) => p.rarity === first) ? first : null;
}

/** What a counter has to change in the store to turn `before` into `after` (version changes first; `count` only when no version moved). */
export function entryChanges(before: CollectionEntry | undefined, after: CollectionEntry | undefined): { versions: [string, number][]; count: number | null } {
  const was = before?.versions ?? {};
  const now = after?.versions ?? {};
  const versions: [string, number][] = [];
  for (const key of new Set([...Object.keys(was), ...Object.keys(now)])) {
    if ((was[key] ?? 0) !== (now[key] ?? 0)) versions.push([key, now[key] ?? 0]);
  }
  const count = after?.count ?? 0;
  return { versions, count: versions.length === 0 && count !== (before?.count ?? 0) ? count : null };
}
