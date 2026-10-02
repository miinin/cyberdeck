/*
 * Pure file name → card key matching for `npm run cards:images` (D-013 osa 4, ARCHITECTURE.md 13.8).
 * No file system: the caller passes the file names, the cards and the optional map file content.
 */
import type { Card } from '../../src/domain/card';
import { isCardKey, normalizeCardName } from '../../src/domain/cardKey';
import type { CardKey } from '../../src/domain/cardKey';

export type MatchRule = 'map' | 'key' | 'slug' | 'name';
export type UnmatchedReason = 'no-match' | 'ambiguous' | 'conflict' | 'invalid-map-entry';

export interface ImageMatchReport {
  matched: { file: string; key: CardKey; rule: MatchRule }[];
  unmatched: { file: string; reason: UnmatchedReason }[];
  /** Hidden files, Thumbs.db, desktop.ini and files without an image extension. */
  ignored: string[];
  /** Map entries whose file is not in the folder (a typo in the map would otherwise go unnoticed). */
  unusedMapEntries: string[];
  missingCards: { key: CardKey; displayName: string }[];
}

/** The extension only pre-filters; the import checks the real format from the content. */
const IMAGE_EXTENSION = /\.(png|jpe?g|webp)$/i;
const SYSTEM_FILES = new Set(['thumbs.db', 'desktop.ini']);

function isIgnored(file: string): boolean {
  return file.startsWith('.') || SYSTEM_FILES.has(file.toLowerCase()) || !IMAGE_EXTENSION.test(file);
}

function stem(file: string): string {
  return file.replace(/\.[^.]+$/, '');
}

type Match = { key: CardKey; rule: MatchRule } | { reason: UnmatchedReason };

function matchOne(
  file: string,
  cards: readonly Card[],
  keys: ReadonlySet<CardKey>,
  map: Readonly<Record<string, string>>,
): Match {
  if (Object.hasOwn(map, file)) {
    const key = map[file];
    return isCardKey(key) && keys.has(key) ? { key, rule: 'map' } : { reason: 'invalid-map-entry' };
  }
  const normalized = normalizeCardName(stem(file));
  if (keys.has(normalized)) return { key: normalized, rule: 'key' };
  // Netdeck's slug keeps apostrophes as separators ("don-t"), like file names that replace them with "_".
  const bySlug = cards.find((card) => card.slug === normalized);
  if (bySlug) return { key: bySlug.key, rule: 'slug' };
  const byName = cards.filter((card) => normalizeCardName(card.name) === normalized);
  if (byName.length > 1) return { reason: 'ambiguous' };
  if (byName.length === 1 && byName[0]) return { key: byName[0].key, rule: 'name' };
  return { reason: 'no-match' };
}

/**
 * Rules in order, first match wins: map file → normalized name = key → normalized name = slug →
 * name without subname when exactly one card has it. Two files for one card is a conflict: neither is used.
 */
export function matchImages(
  fileNames: readonly string[],
  cards: readonly Card[],
  map: Readonly<Record<string, string>> = {},
): ImageMatchReport {
  const keys = new Set(cards.map((card) => card.key));
  const ignored: string[] = [];
  const unmatched: ImageMatchReport['unmatched'] = [];
  const byKey = new Map<CardKey, { file: string; rule: MatchRule }[]>();

  for (const file of fileNames) {
    if (isIgnored(file)) {
      ignored.push(file);
      continue;
    }
    const match = matchOne(file, cards, keys, map);
    if ('reason' in match) {
      unmatched.push({ file, reason: match.reason });
      continue;
    }
    const list = byKey.get(match.key) ?? [];
    list.push({ file, rule: match.rule });
    byKey.set(match.key, list);
  }

  const matched: ImageMatchReport['matched'] = [];
  for (const [key, files] of byKey) {
    if (files.length === 1 && files[0]) matched.push({ file: files[0].file, key, rule: files[0].rule });
    else for (const { file } of files) unmatched.push({ file, reason: 'conflict' });
  }
  // Code unit order, not localeCompare, so the report is the same on every machine.
  const byFile = (a: { file: string }, b: { file: string }) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0);
  matched.sort(byFile);
  unmatched.sort(byFile);

  const present = new Set(fileNames);
  return {
    matched,
    unmatched,
    ignored,
    unusedMapEntries: Object.keys(map).filter((file) => !present.has(file)),
    missingCards: cards
      .filter((card) => !matched.some((entry) => entry.key === card.key))
      .map((card) => ({ key: card.key, displayName: card.displayName })),
  };
}
