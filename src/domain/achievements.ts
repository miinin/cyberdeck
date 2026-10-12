import type { Card } from './card';
import type { Collection } from './collection';
import { collectionOverview, colorProgress, rarityProgress, setProgress, specialArtProgress, typeProgress } from './collectionProgress';

/*
 * Achievements (T-132, T-150, I-8): badges computed from the collection alone, so nothing is stored. Each one is
 * "owned out of total"; it is earned when owned reaches total. Only real challenges: no "first card" or small counts
 * (whoever uses the app has those), no Common or Uncommon sets (T-150, user feedback).
 */

export type AchievementKind = 'distinct' | 'all' | 'copies' | 'playsets' | 'set' | 'color' | 'type' | 'rarity';

/** How hard it is, for the look of the badge: 1 steel, 2 chrome, 3 neon. */
export type AchievementTier = 1 | 2 | 3;

export interface Achievement {
  /** Stable key, e.g. "copies-500" or "color-Red". */
  id: string;
  kind: AchievementKind;
  /** The goal number (distinct, copies) or the name of the set, color, type or rarity (official name). */
  subject: string | number;
  tier: AchievementTier;
  /** Progress, capped at total. */
  owned: number;
  total: number;
  done: boolean;
}

/** Half of the cards: the first collection goal worth a badge. */
export const DISTINCT_SHARE = 0.5;
export const COPY_GOALS: readonly (readonly [number, AchievementTier])[] = [
  [250, 1],
  [500, 2],
  [1000, 3],
];
/** The one set with a "Set complete" goal. */
export const ACHIEVEMENT_SET = 'welcome-to-night-city';
/** Rarities (official names) worth a badge; Common and Uncommon are left out (T-150). */
const RARITY_TIERS: Readonly<Record<string, AchievementTier>> = {
  Rare: 1,
  'Epic Rare': 2,
  'Secret Rare': 3,
  'Iconic Rare': 3,
  'Nova Rare': 3,
};

function make(id: string, kind: AchievementKind, subject: string | number, tier: AchievementTier, owned: number, total: number): Achievement {
  const capped = Math.min(owned, total);
  return { id, kind, subject, tier, owned: capped, total, done: total > 0 && capped >= total };
}

/** All achievements in a fixed order: the collection, the set, colors, types, rarities. */
export function achievements(
  cards: readonly Card[],
  collection: Collection,
  hasArt: (cardKey: string, rarity: string) => boolean = () => true,
): Achievement[] {
  const overview = collectionOverview(cards, collection);
  const list: Achievement[] = [];
  if (overview.total > 1) {
    const half = Math.ceil(overview.total * DISTINCT_SHARE);
    list.push(make('distinct-half', 'distinct', half, 1, overview.distinct, half));
  }
  if (overview.total > 0) list.push(make('all', 'all', overview.total, 3, overview.distinct, overview.total));
  for (const [goal, tier] of COPY_GOALS) list.push(make(`copies-${goal}`, 'copies', goal, tier, overview.copies, goal));
  if (overview.total > 0) list.push(make('playsets', 'playsets', overview.total, 3, overview.playsets, overview.total));
  // Only the main set (T-135, user's choice): promos, starter decks and tournament prints are no goals.
  for (const row of setProgress(cards, collection)) {
    if (row.family === ACHIEVEMENT_SET && row.total > 0) list.push(make(`set-${row.family}`, 'set', row.label, 3, row.owned, row.total));
  }
  for (const row of colorProgress(cards, collection)) {
    if (row.value !== null && row.total > 0) list.push(make(`color-${row.value}`, 'color', row.value, 2, row.owned, row.total));
  }
  for (const row of typeProgress(cards, collection)) {
    if (row.value !== null && row.total > 0) list.push(make(`type-${row.value}`, 'type', row.value, 2, row.owned, row.total));
  }
  // The special arts (Nova Rare, Iconic Rare) count arts, not cards (T-133).
  for (const row of [...rarityProgress(cards, collection), ...specialArtProgress(cards, collection, hasArt)]) {
    const tier = RARITY_TIERS[row.rarity];
    if (tier !== undefined && row.total > 0) list.push(make(`rarity-${row.rarity}`, 'rarity', row.rarity, tier, row.owned, row.total));
  }
  return list;
}

/**
 * The goals still open, closest to done first (by share, then by fewest cards missing), at most `limit`.
 * Ties keep the fixed order.
 */
export function nextAchievements(list: readonly Achievement[], limit: number): Achievement[] {
  return list
    .filter((item) => !item.done)
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        b.item.owned / b.item.total - a.item.owned / a.item.total ||
        a.item.total - a.item.owned - (b.item.total - b.item.owned) ||
        a.index - b.index,
    )
    .slice(0, limit)
    .map(({ item }) => item);
}
