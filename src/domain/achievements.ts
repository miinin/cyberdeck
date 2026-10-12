import type { Card } from './card';
import type { Collection } from './collection';
import { collectionOverview, colorProgress, rarityProgress, setProgress, specialArtProgress, typeProgress } from './collectionProgress';

/*
 * Achievements (T-132, I-8): badges and goals computed from the collection alone, so nothing is stored. Each one
 * is "owned out of total"; it is earned when owned reaches total.
 */

export type AchievementKind = 'distinct' | 'all' | 'copies' | 'playsets' | 'set' | 'color' | 'type' | 'rarity';

export interface Achievement {
  /** Stable key, e.g. "distinct-25" or "color-Red". */
  id: string;
  kind: AchievementKind;
  /** The goal number (distinct, copies) or the name of the set, color, type or rarity. */
  subject: string | number;
  /** Progress, capped at total. */
  owned: number;
  total: number;
  done: boolean;
}

/** Steps for the number of distinct cards and of copies; a step at or above the card count is left out (the "all" badge covers it). */
export const DISTINCT_GOALS = [1, 25, 50, 100] as const;
export const COPY_GOALS = [100, 250, 500, 1000] as const;

function make(id: string, kind: AchievementKind, subject: string | number, owned: number, total: number): Achievement {
  const capped = Math.min(owned, total);
  return { id, kind, subject, owned: capped, total, done: total > 0 && capped >= total };
}

/** All achievements in a fixed order: milestones first, then sets, colors, types and rarities. */
export function achievements(
  cards: readonly Card[],
  collection: Collection,
  hasArt: (cardKey: string, rarity: string) => boolean = () => true,
): Achievement[] {
  const overview = collectionOverview(cards, collection);
  const list: Achievement[] = [];
  for (const goal of DISTINCT_GOALS) {
    if (goal < overview.total) list.push(make(`distinct-${goal}`, 'distinct', goal, overview.distinct, goal));
  }
  if (overview.total > 0) list.push(make('all', 'all', overview.total, overview.distinct, overview.total));
  for (const goal of COPY_GOALS) list.push(make(`copies-${goal}`, 'copies', goal, overview.copies, goal));
  if (overview.total > 0) list.push(make('playsets', 'playsets', overview.total, overview.playsets, overview.total));
  for (const row of setProgress(cards, collection)) {
    if (row.total > 0) list.push(make(`set-${row.family}`, 'set', row.label, row.owned, row.total));
  }
  for (const row of colorProgress(cards, collection)) {
    if (row.value !== null && row.total > 0) list.push(make(`color-${row.value}`, 'color', row.value, row.owned, row.total));
  }
  for (const row of typeProgress(cards, collection)) {
    if (row.value !== null && row.total > 0) list.push(make(`type-${row.value}`, 'type', row.value, row.owned, row.total));
  }
  // The special arts (Nova Rare, Iconic Rare) count arts, not cards (T-133).
  for (const row of [...rarityProgress(cards, collection), ...specialArtProgress(cards, collection, hasArt)]) {
    if (row.total > 0) list.push(make(`rarity-${row.rarity}`, 'rarity', row.rarity, row.owned, row.total));
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
