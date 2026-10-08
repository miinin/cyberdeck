/*
 * Card fingerprints (T-106, D-027): a small hash of a card picture that survives a camera: tilt, blur, other
 * light, noise and JPEG. The same pure code runs in the build script (sharp pixels of the card art) and in the
 * browser (canvas pixels of the camera frame), so the two always agree.
 *
 * A fingerprint has two parts, the whole card and the art area. Each part is a difference hash (dHash) per colour
 * channel: the picture is averaged to a small grid and every cell is compared with its right neighbour (1 = the cell
 * is brighter). Hashes are stored as hex strings.
 */

/** RGBA pixels, row by row, like canvas ImageData. */
export interface PixelImage {
  readonly data: Uint8ClampedArray | Uint8Array;
  readonly width: number;
  readonly height: number;
}

/** A rectangle as fractions of the picture (0..1). */
export interface Region {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

export const FULL_REGION: Region = { x0: 0, y0: 0, x1: 1, y1: 1 };
/** The picture on a card, without the title and the rules text below it. */
export const ART_REGION: Region = { x0: 0.06, y0: 0.06, x1: 0.94, y1: 0.66 };

/** Hash grid: HASH_COLUMNS comparisons per row, HASH_ROWS rows, 3 colour channels. */
export const HASH_COLUMNS = 16;
export const HASH_ROWS = 16;
const CHANNELS = 3;
const BITS_PER_PART = HASH_COLUMNS * HASH_ROWS * CHANNELS;
const HEX_PER_PART = BITS_PER_PART / 4;

export interface CardFingerprint {
  /** Hash of the whole card. */
  readonly full: string;
  /** Hash of the art area. */
  readonly art: string;
}

/** A fingerprint of a known picture. `id` is the art id (`<card key>` or `<card key>__<rarity slug>`). */
export interface IndexedFingerprint extends CardFingerprint {
  readonly id: string;
}

/** Averages the pixels of `region` to a cols × rows grid; the result has 3 values (R, G, B) per cell. */
export function averageGrid(image: PixelImage, region: Region, cols: number, rows: number): Float64Array {
  const { data, width, height } = image;
  const left = region.x0 * width;
  const top = region.y0 * height;
  const cellWidth = ((region.x1 - region.x0) * width) / cols;
  const cellHeight = ((region.y1 - region.y0) * height) / rows;
  const grid = new Float64Array(cols * rows * CHANNELS);
  for (let row = 0; row < rows; row++) {
    const ya = Math.min(height - 1, Math.max(0, Math.floor(top + row * cellHeight)));
    const yb = Math.min(height, Math.max(ya + 1, Math.ceil(top + (row + 1) * cellHeight)));
    for (let col = 0; col < cols; col++) {
      const xa = Math.min(width - 1, Math.max(0, Math.floor(left + col * cellWidth)));
      const xb = Math.min(width, Math.max(xa + 1, Math.ceil(left + (col + 1) * cellWidth)));
      let r = 0;
      let g = 0;
      let b = 0;
      for (let y = ya; y < yb; y++) {
        for (let x = xa; x < xb; x++) {
          const i = (y * width + x) * 4;
          r += data[i] ?? 0;
          g += data[i + 1] ?? 0;
          b += data[i + 2] ?? 0;
        }
      }
      const n = (yb - ya) * (xb - xa);
      const o = (row * cols + col) * CHANNELS;
      grid[o] = r / n;
      grid[o + 1] = g / n;
      grid[o + 2] = b / n;
    }
  }
  return grid;
}

/** dHash of one region as hex: per channel, per row, HASH_COLUMNS bits (cell brighter than its right neighbour). */
export function regionHash(image: PixelImage, region: Region): string {
  const cols = HASH_COLUMNS + 1;
  const grid = averageGrid(image, region, cols, HASH_ROWS);
  const bits = new Uint8Array(BITS_PER_PART);
  let n = 0;
  for (let channel = 0; channel < CHANNELS; channel++) {
    for (let row = 0; row < HASH_ROWS; row++) {
      for (let col = 0; col < HASH_COLUMNS; col++) {
        const here = grid[(row * cols + col) * CHANNELS + channel] ?? 0;
        const next = grid[(row * cols + col + 1) * CHANNELS + channel] ?? 0;
        bits[n++] = here > next ? 1 : 0;
      }
    }
  }
  let hex = '';
  for (let i = 0; i < BITS_PER_PART; i += 4) {
    hex += ((bits[i] ?? 0) * 8 + (bits[i + 1] ?? 0) * 4 + (bits[i + 2] ?? 0) * 2 + (bits[i + 3] ?? 0)).toString(16);
  }
  return hex;
}

/** The fingerprint of a card picture (the whole picture is the card). */
export function cardFingerprint(image: PixelImage): CardFingerprint {
  return { full: regionHash(image, FULL_REGION), art: regionHash(image, ART_REGION) };
}

/** The part of `inner` (fractions of `outer`) as fractions of the whole picture. */
function within(outer: Region, inner: Region): Region {
  const w = outer.x1 - outer.x0;
  const h = outer.y1 - outer.y0;
  return { x0: outer.x0 + inner.x0 * w, y0: outer.y0 + inner.y0 * h, x1: outer.x0 + inner.x1 * w, y1: outer.y0 + inner.y1 * h };
}

/**
 * Windows the card may be seen through: the whole picture, and a slightly smaller window moved around in the
 * picture. A card that sits off-centre or small in the camera frame matches through one of them.
 */
const WINDOW_SCALE = 0.92;
const WINDOW_SHIFT = 0.04;
export const QUERY_WINDOWS: readonly Region[] = [
  FULL_REGION,
  ...[-1, 0, 1].flatMap((sy) =>
    [-1, 0, 1].map((sx): Region => {
      const margin = (1 - WINDOW_SCALE) / 2;
      const x0 = margin + sx * WINDOW_SHIFT;
      const y0 = margin + sy * WINDOW_SHIFT;
      return { x0, y0, x1: x0 + WINDOW_SCALE, y1: y0 + WINDOW_SCALE };
    }),
  ),
];

/** Fingerprints of a camera picture seen through each window (the first is the plain one). */
export function queryFingerprints(image: PixelImage): CardFingerprint[] {
  return QUERY_WINDOWS.map((window) => ({ full: regionHash(image, window), art: regionHash(image, within(window, ART_REGION)) }));
}

const POPCOUNT = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

/** Number of differing bits between two hex hashes of the same length. */
export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) throw new RangeError('Hashes must have the same length');
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    distance += POPCOUNT[parseInt(a[i] ?? '0', 16) ^ parseInt(b[i] ?? '0', 16)] ?? 0;
  }
  return distance;
}

/** True when the string is a hash this module makes (right length, hex). */
export function isRegionHash(value: unknown): value is string {
  return typeof value === 'string' && value.length === HEX_PER_PART && /^[0-9a-f]+$/.test(value);
}

/** Largest possible distance (both parts, all bits). */
export const MAX_DISTANCE = BITS_PER_PART * 2;

/** Distance of two fingerprints: the differing bits of both parts added. 0 = identical. */
export function fingerprintDistance(a: CardFingerprint, b: CardFingerprint): number {
  return hammingDistance(a.full, b.full) + hammingDistance(a.art, b.art);
}

export interface FingerprintMatch {
  readonly id: string;
  readonly distance: number;
}

/** The `limit` closest pictures of the index, closest first. */
export function rankFingerprints(query: CardFingerprint | readonly CardFingerprint[], index: readonly IndexedFingerprint[], limit = 3): FingerprintMatch[] {
  const queries = 'full' in query ? [query] : query;
  return index
    .map((entry) => ({ id: entry.id, distance: Math.min(...queries.map((q) => fingerprintDistance(q, entry))) }))
    .sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id))
    .slice(0, limit);
}

/** The settings of "sure": how close the best match is and how far ahead of the second one. */
export interface ConfidenceRule {
  readonly maxDistance: number;
  readonly minGap: number;
}

/** Tuned by scripts/cards/measureScanner.mjs on distorted pictures (T-106). */
export const CONFIDENCE: ConfidenceRule = { maxDistance: 240, minGap: 40 };

/** True when the best match is close enough and clearly ahead of the second best (matches sorted, closest first). */
export function isConfident(matches: readonly FingerprintMatch[], rule: ConfidenceRule = CONFIDENCE): boolean {
  const best = matches[0];
  if (best === undefined || best.distance > rule.maxDistance) return false;
  const second = matches[1];
  return second === undefined || second.distance - best.distance >= rule.minGap;
}
