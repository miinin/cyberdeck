import type { Card } from './card';
import type { Collection, CollectionEntry } from './collection';
import { versionsOf, withCount, setVersionCount, countOf, versionsTotal } from './collection';
import { setFilterId } from './printing';
import { officialRarity } from './cardSearch';
import type { Printing } from './printing';

/** A Beta edition set (T-148). */
const BETA_SET = /Beta/;
/** A collector number with a letter after the first one (005b, β005b): an alternate illustration (T-148). */
const ALT_NUMBER = /^\D*\d+([b-z])$/i;

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
  /** The special rarity, or null for the base art and an alternate base art. */
  rarity: string | null;
  /**
   * The name of the art's own picture for variantImageUrl (T-148): the special rarity, "<rarity> Beta" for a Beta
   * edition art of its own, "Alt <letter>" for an alternate base art (e.g. V 005b); null = the card's own picture.
   */
  image: string | null;
  printings: readonly Printing[];
  /** Where a counter adds copies: Retail in English, else the first English printing, else the first. */
  defaultPrinting: Printing | null;
}

/**
 * The arts a set filter keeps (T-146): only those with a printing in the set, so a Welcome to Night City search never
 * offers an Edgerunner Open promo art. No set, or no art in it: all arts.
 */
export function artsInSet(arts: readonly Art[], family: string | null): readonly Art[] {
  if (family === null) return arts;
  const inSet = arts.filter((art) => art.printings.some((p) => setFilterId(p) === family));
  return inSet.length === 0 ? arts : inSet;
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
  // Keyed by the picture name; insertion order is the order of the printings.
  const alternates = new Map<string, Printing[]>();
  const special = new Map<string, Printing[]>();
  for (const printing of printings) {
    const rarity = printing.rarity;
    if (isSpecialRarity(rarity) && hasArt(card.key, rarity)) {
      // T-148: the Beta edition of a special rarity has its own illustration when it has its own picture.
      const beta = `${rarity} Beta`;
      const image = BETA_SET.test(printing.setName) && hasArt(card.key, beta) ? beta : rarity;
      special.set(image, [...(special.get(image) ?? []), printing]);
      continue;
    }
    // T-148: a lettered number after the first (005b) is another illustration when it has its own picture.
    const letter = ALT_NUMBER.exec(printing.number)?.[1]?.toLowerCase();
    const alternate = letter === undefined ? null : `Alt ${letter}`;
    if (alternate !== null && hasArt(card.key, alternate)) alternates.set(alternate, [...(alternates.get(alternate) ?? []), printing]);
    else base.push(printing);
  }
  const art = (image: string | null, label: string, rarity: string | null, list: Printing[]): Art => ({
    artId: image === null ? card.key : `${card.key}__${raritySlug(image)}`,
    label,
    rarity,
    image,
    printings: list,
    defaultPrinting: defaultOf(list),
  });
  // A card whose printings are all of special rarities (e.g. all Nova Rare) has no base art: an empty one would be a duplicate.
  const arts: Art[] = base.length === 0 && (special.size > 0 || alternates.size > 0) ? [] : [art(null, 'base', null, base)];
  for (const [image, list] of alternates) arts.push(art(image, 'alt', null, list));
  for (const rarity of SPECIAL_ART_RARITIES) {
    for (const image of [rarity, `${rarity} Beta`]) {
      const list = special.get(image);
      if (list !== undefined) arts.push(art(image, rarity, rarity, list));
    }
  }
  return arts;
}

/** A base art: the card's own picture, the one that takes the copies without a version (T-148: an alternate base art is not). */
export function isBaseArt(art: Art): boolean {
  return art.image === null;
}

/** A Beta edition art of its own (T-148). */
export function isBetaArt(art: Art): boolean {
  return art.image !== null && art.rarity !== null && art.image !== art.rarity;
}

/**
 * The art a search result should show (D-021 kohta 4, T-148): the arts with a printing that matches the active rarity
 * and set filters; when exactly one matches and it has a picture of its own, that one. Null without a filter, or when
 * the base art or several arts match.
 */
export function matchedArt(arts: readonly Art[], rarities: readonly string[], family: string | null): Art | null {
  if (rarities.length === 0 && family === null) return null;
  const matching = arts.filter((a) =>
    a.printings.some(
      (p) => (rarities.length === 0 || (p.rarity !== null && rarities.includes(officialRarity(p.rarity)))) && (family === null || setFilterId(p) === family),
    ),
  );
  const only = matching.length === 1 ? matching[0] : undefined;
  return only !== undefined && !isBaseArt(only) ? only : null;
}

/** The art a rarity belongs to (a special one, else the base art), or undefined. */
export function artForRarity(arts: readonly Art[], rarity: string | null): Art | undefined {
  return arts.find((art) => art.rarity !== null && art.rarity === rarity) ?? arts.find(isBaseArt);
}

/** The art that takes the copies without a version: the base art, or the first art when the card has no base art. */
function catchAll(arts: readonly Art[]): Art | undefined {
  return arts.find(isBaseArt) ?? arts[0];
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
    if (isBaseArt(art)) continue;
    const n = art.printings.reduce((sum, p) => sum + (versions[p.key] ?? 0), 0);
    result.set(art.artId, n);
    special += n;
  }
  for (const art of arts) if (isBaseArt(art)) result.set(art.artId, Math.max(0, (entry?.count ?? 0) - special));
  // Without a base art the first art also takes the copies without a version.
  const first = arts[0];
  if (first !== undefined && !isBaseArt(first)) result.set(first.artId, (result.get(first.artId) ?? 0) + Math.max(0, (entry?.count ?? 0) - special));
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
    if (isBaseArt(art) || art.defaultPrinting === null) return withCount(collection, card.key, countOf(collection, card.key) + delta);
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
