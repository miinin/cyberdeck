/*
 * `npm run cards:images -- <folder>` (D-013 osa 4, ARCHITECTURE.md 13.8): matches the user's card images
 * to cards, converts them to WebP in two sizes and reports what did not match. A developer runs this by
 * hand; it is not part of the build. File access and the image converter (sharp) are injected, so this
 * file needs no Node types and tests need no disk.
 */
import type { Card } from '../../src/domain/card';
import { CARD_IMAGE_WIDTH } from '../../src/domain/cardImage';
import type { CardImageSize } from '../../src/domain/cardImage';
import { isCardKey } from '../../src/domain/cardKey';
import type { CardKey } from '../../src/domain/cardKey';
import { isRecord } from '../../src/domain/validate';
import { matchImages } from './matchImages';
import type { ImageMatchReport } from './matchImages';

export const CARD_IMAGES_DIR = 'src/assets/cards';
/** Committed, so the fixes for odd file names survive the next import (the source folder is not in git). */
export const CARD_IMAGES_MAP_PATH = 'scripts/cards/card-images.map.json';
/** Official art of a card's rarity (T-076), one file per `<card key>__<rarity slug>`; committed like the card images. */
export const VARIANT_IMAGES_DIR = 'src/assets/cards/variants';
/** [{ source, artId, ... }]: the source path (from the repository root) of each variant picture. */
export const VARIANT_MAP_PATH = 'scripts/cards/variant-art.map.json';
const VARIANT_WIDTH = CARD_IMAGE_WIDTH.lg;
const IMAGE_EXTENSION = /\.(png|jpe?g|webp)$/i;
const ART_ID = /^[a-z0-9-]{1,100}__[a-z0-9-]{1,100}$/;
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const SIZES = Object.keys(CARD_IMAGE_WIDTH) as CardImageSize[];

export interface ImageOutput {
  path: string;
  width: number;
}

export interface ImportImagesDeps {
  /** File names in a folder, or null when the folder does not exist. */
  listFiles: (dir: string) => Promise<string[] | null>;
  fileSize: (path: string) => Promise<number>;
  /** Returns null when the file does not exist. */
  readText: (path: string) => Promise<string | null>;
  /** Writes each output as WebP. Rejects when the source is not a PNG, JPEG or WebP image. */
  convert: (sourcePath: string, outputs: ImageOutput[]) => Promise<void>;
  log: (line: string) => void;
}

export interface ImportImagesReport extends ImageMatchReport {
  converted: number;
  /** Variant pictures converted to src/assets/cards/variants. */
  variantsConverted: number;
  rejected: { file: string; reason: 'too-large' | 'not-image' }[];
  /** Images in the output folder whose key is not in the card data (reported, never deleted). */
  orphans: CardKey[];
}

export type ImportImagesResult = { exitCode: 0 | 1; report: ImportImagesReport | null };

export function variantOutputPath(artId: string): string {
  if (!ART_ID.test(artId)) throw new Error(`Invalid art id: ${artId}`);
  return `${VARIANT_IMAGES_DIR}/${artId}.webp`;
}

/** The source/artId pairs of the variant map; null when the file is malformed. */
function parseVariantMap(text: string | null): { source: string; artId: string }[] | null {
  if (text === null) return [];
  try {
    const value: unknown = JSON.parse(text);
    if (!Array.isArray(value)) return null;
    const entries: { source: string; artId: string }[] = [];
    for (const item of value as unknown[]) {
      if (!isRecord(item) || typeof item.source !== 'string' || typeof item.artId !== 'string') return null;
      if (!ART_ID.test(item.artId) || item.source.split(/[/\\]/).includes('..')) return null;
      entries.push({ source: item.source, artId: item.artId });
    }
    return entries;
  } catch {
    return null;
  }
}

/** Output paths come only from a validated card key, never from the source file name (path traversal). */
export function outputPath(size: CardImageSize, key: CardKey): string {
  if (!isCardKey(key)) throw new Error(`Invalid card key: ${key}`);
  return `${CARD_IMAGES_DIR}/${size}/${key}.webp`;
}

function parseMap(text: string | null): Record<string, string> | null {
  if (text === null) return {};
  try {
    const value: unknown = JSON.parse(text);
    if (!isRecord(value)) return null;
    const map: Record<string, string> = {};
    for (const [file, key] of Object.entries(value)) {
      // A plain file name only: the map must not point outside the source folder.
      if (typeof key !== 'string' || /[/\\]/.test(file) || file === '.' || file === '..') return null;
      map[file] = key;
    }
    return map;
  } catch {
    return null;
  }
}

function logReport(report: ImportImagesReport, log: (line: string) => void): void {
  log(`Converted: ${report.converted} / matched ${report.matched.length}`);
  log(`Variant images converted: ${report.variantsConverted}`);
  const byRule = new Map<string, number>();
  for (const { rule } of report.matched) byRule.set(rule, (byRule.get(rule) ?? 0) + 1);
  log(`  by rule: ${[...byRule].map(([rule, count]) => `${rule} ${count}`).join(', ') || '-'}`);
  log(`Files without a card: ${report.unmatched.length}`);
  for (const { file, reason } of report.unmatched) log(`  ${file} (${reason})`);
  log(`Rejected files: ${report.rejected.length}`);
  for (const { file, reason } of report.rejected) log(`  ${file} (${reason})`);
  log(`Ignored files: ${report.ignored.length}`);
  for (const file of report.ignored) log(`  ${file}`);
  if (report.unusedMapEntries.length > 0) {
    log(`Map entries without a file: ${report.unusedMapEntries.length}`);
    for (const file of report.unusedMapEntries) log(`  ${file}`);
  }
  log(`Cards without an image: ${report.missingCards.length}`);
  for (const { key, displayName } of report.missingCards) log(`  ${key} (${displayName})`);
  log(`Orphan images in ${CARD_IMAGES_DIR}: ${report.orphans.length}`);
  for (const key of report.orphans) log(`  ${key}`);
}

export async function importImages(
  sourceDir: string,
  cards: readonly Card[],
  deps: ImportImagesDeps,
): Promise<ImportImagesResult> {
  const files = await deps.listFiles(sourceDir);
  if (files === null) {
    deps.log(`Folder not found: ${sourceDir}`);
    return { exitCode: 1, report: null };
  }
  const map = parseMap(await deps.readText(CARD_IMAGES_MAP_PATH));
  if (map === null) {
    deps.log(`Invalid map file ${CARD_IMAGES_MAP_PATH}: expected { "<file name>": "<card key>" }`);
    return { exitCode: 1, report: null };
  }

  const variantMap = parseVariantMap(await deps.readText(VARIANT_MAP_PATH));
  if (variantMap === null) {
    deps.log(`Invalid map file ${VARIANT_MAP_PATH}: expected [{ "source": "<path>", "artId": "<card key>__<rarity slug>" }]`);
    return { exitCode: 1, report: null };
  }

  // Variant pictures: the files of the variant map, plus files in the source folder named exactly by an art id.
  const variantFiles: { path: string; artId: string }[] = variantMap.map(({ source, artId }) => ({ path: source, artId }));
  const cardFiles: string[] = [];
  for (const file of files) {
    const stem = file.replace(/\.[^.]+$/, '').toLowerCase();
    if (IMAGE_EXTENSION.test(file) && ART_ID.test(stem)) variantFiles.push({ path: `${sourceDir}/${file}`, artId: stem });
    else cardFiles.push(file);
  }

  const match = matchImages(cardFiles, cards, map);
  const rejected: ImportImagesReport['rejected'] = [];
  const failedKeys = new Set<CardKey>();
  let converted = 0;
  // One at a time: 151 images take seconds, and errors stay in file order.
  for (const { file, key } of match.matched) {
    const source = `${sourceDir}/${file}`;
    if ((await deps.fileSize(source)) > MAX_SOURCE_BYTES) {
      rejected.push({ file, reason: 'too-large' });
      failedKeys.add(key);
      continue;
    }
    try {
      await deps.convert(
        source,
        SIZES.map((size) => ({ path: outputPath(size, key), width: CARD_IMAGE_WIDTH[size] })),
      );
      converted += 1;
    } catch {
      rejected.push({ file, reason: 'not-image' });
      failedKeys.add(key);
    }
  }

  let variantsConverted = 0;
  for (const { path: source, artId } of variantFiles) {
    try {
      if ((await deps.fileSize(source)) > MAX_SOURCE_BYTES) {
        rejected.push({ file: source, reason: 'too-large' });
        continue;
      }
      await deps.convert(source, [{ path: variantOutputPath(artId), width: VARIANT_WIDTH }]);
      variantsConverted += 1;
    } catch {
      // A missing or unreadable file is reported like a file that is not an image.
      rejected.push({ file: source, reason: 'not-image' });
    }
  }

  const keys = new Set(cards.map((card) => card.key));
  const existing = (await deps.listFiles(`${CARD_IMAGES_DIR}/md`)) ?? [];
  const report: ImportImagesReport = {
    ...match,
    // A matched image that could not be converted leaves its card without an image, too.
    missingCards: cards
      .filter((card) => failedKeys.has(card.key) || !match.matched.some((entry) => entry.key === card.key))
      .map((card) => ({ key: card.key, displayName: card.displayName })),
    converted,
    variantsConverted,
    rejected,
    orphans: existing
      .filter((file) => file.endsWith('.webp'))
      .map((file) => file.slice(0, -'.webp'.length))
      .filter((key) => !keys.has(key)),
  };
  logReport(report, deps.log);
  return { exitCode: converted + variantsConverted === 0 ? 1 : 0, report };
}
