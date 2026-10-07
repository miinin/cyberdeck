/*
 * The card fingerprints of the scanner (T-106, D-027), made by `npm run cards:fingerprints` and committed as
 * cardFingerprints.json. The file is loaded with a dynamic import, so it is a chunk of its own that is fetched
 * only when the scanner opens. A file made with other settings (or a broken one) is rejected, never used.
 */
import { FULL_REGION, ART_REGION, HASH_COLUMNS, HASH_ROWS, isRegionHash } from '../domain/cardFingerprint';
import type { IndexedFingerprint, Region } from '../domain/cardFingerprint';
import { isRecord } from '../domain/validate';

const ID = /^[a-z0-9-]{1,100}(?:__[a-z0-9-]{1,100})?$/;

function sameRegion(value: unknown, region: Region): boolean {
  return isRecord(value) && value['x0'] === region.x0 && value['y0'] === region.y0 && value['x1'] === region.x1 && value['y1'] === region.y1;
}

/** The entries of a fingerprint file, or null when the file is not what this code expects. */
export function parseFingerprintFile(value: unknown): IndexedFingerprint[] | null {
  if (!isRecord(value) || value['version'] !== 1 || !isRecord(value['grid']) || !Array.isArray(value['entries'])) return null;
  const grid = value['grid'];
  if (grid['columns'] !== HASH_COLUMNS || grid['rows'] !== HASH_ROWS || !sameRegion(grid['full'], FULL_REGION) || !sameRegion(grid['art'], ART_REGION)) {
    return null;
  }
  const entries: IndexedFingerprint[] = [];
  const seen = new Set<string>();
  for (const entry of value['entries'] as unknown[]) {
    if (!isRecord(entry)) return null;
    const { id, full, art } = entry;
    if (typeof id !== 'string' || !ID.test(id) || seen.has(id) || !isRegionHash(full) || !isRegionHash(art)) return null;
    seen.add(id);
    entries.push({ id, full, art });
  }
  return entries;
}

/** Loads the fingerprints; rejects when the file is unusable. */
export async function loadFingerprintIndex(): Promise<IndexedFingerprint[]> {
  const file: { default: unknown } = await import('./cardFingerprints.json');
  const entries = parseFingerprintFile(file.default);
  if (entries === null || entries.length === 0) throw new Error('Unusable card fingerprint file');
  return entries;
}
