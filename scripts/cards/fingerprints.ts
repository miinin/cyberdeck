/*
 * `npm run cards:fingerprints` (T-106, D-027): fingerprints of every card picture for the scanner. A developer
 * runs this by hand after the pictures change and commits the result, so the build does not need sharp. File access and
 * the picture decoder are injected; this file needs no Node types.
 */
import { FULL_REGION, ART_REGION, HASH_COLUMNS, HASH_ROWS, cardFingerprint } from '../../src/domain/cardFingerprint';
import type { IndexedFingerprint, PixelImage } from '../../src/domain/cardFingerprint';

/** Generated file; the scanner loads it with a dynamic import. */
export const FINGERPRINTS_PATH = 'src/data/cardFingerprints.json';
/** Card pictures (one per card) and the art of each special rarity. */
export const FINGERPRINT_SOURCE_DIRS = ['src/assets/cards/lg', 'src/assets/cards/variants'] as const;

export interface FingerprintFile {
  version: 1;
  /** What the hashes were made with; the loader rejects a file made with other settings. */
  grid: { columns: number; rows: number; full: typeof FULL_REGION; art: typeof ART_REGION };
  entries: IndexedFingerprint[];
}

export function fingerprintGrid(): FingerprintFile['grid'] {
  return { columns: HASH_COLUMNS, rows: HASH_ROWS, full: FULL_REGION, art: ART_REGION };
}

/** `adam-smasher.webp` -> `adam-smasher`; null for other files. */
export function artIdOfFile(name: string): string | null {
  const match = /^([a-z0-9-]+(?:__[a-z0-9-]+)?)\.webp$/.exec(name);
  return match?.[1] ?? null;
}

/** Fingerprints of `files` (paths), sorted by id. Rejects when two pictures have the same art id. */
export async function buildFingerprintFile(files: readonly string[], decode: (path: string) => Promise<PixelImage>): Promise<FingerprintFile> {
  const entries: IndexedFingerprint[] = [];
  const seen = new Set<string>();
  for (const path of files) {
    const id = artIdOfFile(path.slice(path.lastIndexOf('/') + 1));
    if (id === null) continue;
    if (seen.has(id)) throw new Error(`Two pictures for ${id}`);
    seen.add(id);
    entries.push({ id, ...cardFingerprint(await decode(path)) });
  }
  entries.sort((a, b) => a.id.localeCompare(b.id));
  return { version: 1, grid: fingerprintGrid(), entries };
}
