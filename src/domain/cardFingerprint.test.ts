import { describe, expect, it } from 'vitest';
import {
  ART_REGION,
  CONFIDENCE,
  FULL_REGION,
  HASH_COLUMNS,
  HASH_ROWS,
  MAX_DISTANCE,
  averageGrid,
  cardFingerprint,
  fingerprintDistance,
  hammingDistance,
  frameSharpness,
  isConfident,
  isRegionHash,
  QUERY_WINDOWS,
  queryFingerprints,
  rankFingerprints,
  regionHash,
} from './cardFingerprint';
import type { IndexedFingerprint, PixelImage } from './cardFingerprint';

/** A test picture: the colour of each pixel from a function. */
function picture(width: number, height: number, color: (x: number, y: number) => [number, number, number]): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = color(x, y);
      data.set([r, g, b, 255], (y * width + x) * 4);
    }
  }
  return { data, width, height };
}

/** Pseudo-random but fixed pattern of blocks, so different seeds give different "art". */
function art(seed: number, width = 120, height = 168): PixelImage {
  const cell = (x: number, y: number, c: number) => {
    let h = (Math.floor(x / 6) * 73856093) ^ (Math.floor(y / 6) * 19349663) ^ (seed * 83492791) ^ (c * 2654435761);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h >>> 0) % 256;
  };
  return picture(width, height, (x, y) => [cell(x, y, 0), cell(x, y, 1), cell(x, y, 2)]);
}

describe('averageGrid', () => {
  it('averages a one-colour picture to that colour in every cell', () => {
    const grid = averageGrid(picture(40, 40, () => [10, 20, 30]), FULL_REGION, 4, 4);
    expect(grid).toHaveLength(4 * 4 * 3);
    expect(Array.from(grid.slice(0, 3))).toEqual([10, 20, 30]);
    expect(Array.from(grid.slice(-3))).toEqual([10, 20, 30]);
  });

  it('averages the pixels of a cell and reads only the given region', () => {
    const image = picture(4, 2, (x) => (x < 2 ? [0, 0, 0] : [200, 100, 50]));
    expect(Array.from(averageGrid(image, FULL_REGION, 1, 1))).toEqual([100, 50, 25]);
    expect(Array.from(averageGrid(image, { x0: 0.5, y0: 0, x1: 1, y1: 1 }, 1, 1))).toEqual([200, 100, 50]);
  });

  it('copes with a picture smaller than the grid', () => {
    const grid = averageGrid(picture(2, 2, () => [5, 5, 5]), FULL_REGION, 17, 16);
    expect(grid.every((v) => v === 5)).toBe(true);
  });
});

describe('regionHash', () => {
  it('has the length of a hash and is made of hex digits', () => {
    const hash = regionHash(art(1), FULL_REGION);
    expect(hash).toHaveLength((HASH_COLUMNS * HASH_ROWS * 3) / 4);
    expect(isRegionHash(hash)).toBe(true);
    expect(isRegionHash('zz')).toBe(false);
    expect(isRegionHash(5)).toBe(false);
  });

  it('is the same for the same picture and does not care about its size', () => {
    expect(regionHash(art(3), FULL_REGION)).toBe(regionHash(art(3), FULL_REGION));
    // The same pattern at twice the size (each pixel doubled; the grid divides both sizes) gives the same cell averages.
    const small = art(3, 136, 128);
    const big = picture(272, 256, (x, y) => {
      const i = (Math.floor(y / 2) * 136 + Math.floor(x / 2)) * 4;
      return [small.data[i] ?? 0, small.data[i + 1] ?? 0, small.data[i + 2] ?? 0];
    });
    expect(hammingDistance(regionHash(small, FULL_REGION), regionHash(big, FULL_REGION))).toBe(0);
  });

  it('survives a brightness change (differences stay the same)', () => {
    const base = art(4);
    const brighter = picture(base.width, base.height, (x, y) => {
      const i = (y * base.width + x) * 4;
      return [(base.data[i] ?? 0) / 2 + 100, (base.data[i + 1] ?? 0) / 2 + 100, (base.data[i + 2] ?? 0) / 2 + 100];
    });
    expect(hammingDistance(regionHash(base, FULL_REGION), regionHash(brighter, FULL_REGION))).toBeLessThan(8);
  });

  it('differs for another picture', () => {
    expect(hammingDistance(regionHash(art(1), FULL_REGION), regionHash(art(2), FULL_REGION))).toBeGreaterThan(100);
  });

  it('hashes the art region from the middle of the picture', () => {
    // Only the lower third differs: the art region (to 66 % of the height) must not see it.
    const a = art(5, 100, 100);
    const other = art(6, 100, 100);
    const b = picture(100, 100, (x, y) => {
      const from = y > 80 ? other : a;
      const i = (y * 100 + x) * 4;
      return [from.data[i] ?? 0, from.data[i + 1] ?? 0, from.data[i + 2] ?? 0];
    });
    expect(regionHash(a, ART_REGION)).toBe(regionHash(b, ART_REGION));
    expect(regionHash(a, FULL_REGION)).not.toBe(regionHash(b, FULL_REGION));
  });
});

describe('hammingDistance', () => {
  it('counts the differing bits', () => {
    expect(hammingDistance('0000', '0000')).toBe(0);
    expect(hammingDistance('f0', '0f')).toBe(8);
    expect(hammingDistance('1', '3')).toBe(1);
  });

  it('rejects hashes of different lengths', () => {
    expect(() => hammingDistance('00', '0')).toThrow(RangeError);
  });
});

describe('matching', () => {
  const index: IndexedFingerprint[] = [1, 2, 3, 4].map((seed) => ({ id: `card-${seed}`, ...cardFingerprint(art(seed)) }));

  it('has a fingerprint distance of 0 for the same picture and at most MAX_DISTANCE', () => {
    const a = cardFingerprint(art(1));
    expect(fingerprintDistance(a, a)).toBe(0);
    expect(fingerprintDistance(a, cardFingerprint(art(2)))).toBeLessThanOrEqual(MAX_DISTANCE);
  });

  it('ranks the right picture first, closest first, at most `limit` results', () => {
    const top = rankFingerprints(cardFingerprint(art(3)), index, 3);
    expect(top).toHaveLength(3);
    expect(top[0]).toEqual({ id: 'card-3', distance: 0 });
    expect(top[1]?.distance ?? 0).toBeGreaterThanOrEqual(top[0]?.distance ?? 1);
    expect(rankFingerprints(cardFingerprint(art(3)), index, 1)).toHaveLength(1);
    expect(rankFingerprints(cardFingerprint(art(3)), [], 3)).toEqual([]);
  });

  it('breaks ties by id so the order is stable', () => {
    const same = cardFingerprint(art(1));
    const tied = [{ id: 'b', ...same }, { id: 'a', ...same }];
    expect(rankFingerprints(same, tied).map((m) => m.id)).toEqual(['a', 'b']);
  });
});

describe('isConfident', () => {
  it('needs a close best match that is clearly ahead of the second', () => {
    const { maxDistance, minGap } = CONFIDENCE;
    expect(isConfident([])).toBe(false);
    expect(isConfident([{ id: 'a', distance: 10 }])).toBe(true);
    expect(isConfident([{ id: 'a', distance: maxDistance + 1 }])).toBe(false);
    expect(isConfident([{ id: 'a', distance: 10 }, { id: 'b', distance: 10 + minGap }])).toBe(true);
    expect(isConfident([{ id: 'a', distance: 10 }, { id: 'b', distance: 10 + minGap - 1 }])).toBe(false);
  });
});

describe('queryFingerprints', () => {
  it('starts with the plain fingerprint and has one per window', () => {
    const image = art(7);
    const fingerprints = queryFingerprints(image);
    expect(fingerprints).toHaveLength(QUERY_WINDOWS.length);
    expect(fingerprints[0]).toEqual(cardFingerprint(image));
  });

  it('finds a card that sits off-centre and smaller in the frame', () => {
    const card = art(8, 120, 168);
    const index: IndexedFingerprint[] = [8, 9, 10].map((seed) => ({ id: `card-${seed}`, ...cardFingerprint(art(seed)) }));
    // The card fills 90 % of the frame and is moved towards the lower right corner; the rest is background.
    const frame = picture(120, 168, (x, y) => {
      const cx = Math.round((x - 12) / 0.9);
      const cy = Math.round((y - 17) / 0.9);
      if (cx < 0 || cy < 0 || cx >= 120 || cy >= 168) return [30, 30, 30];
      const i = (cy * 120 + cx) * 4;
      return [card.data[i] ?? 0, card.data[i + 1] ?? 0, card.data[i + 2] ?? 0];
    });
    expect(rankFingerprints(queryFingerprints(frame), index, 1)[0]?.id).toBe('card-8');
  });
});

describe('frameSharpness (T-113)', () => {
  it('rates a sharp edge picture above a blurred one and a flat one at zero', () => {
    const sharp = picture(40, 40, (x) => (x < 20 ? [0, 0, 0] : [255, 255, 255]));
    const blurred = picture(40, 40, (x) => {
      const v = Math.max(0, Math.min(255, (x - 10) * 12));
      return [v, v, v];
    });
    const flat = picture(40, 40, () => [90, 90, 90]);
    expect(frameSharpness(sharp)).toBeGreaterThan(frameSharpness(blurred));
    expect(frameSharpness(blurred)).toBeGreaterThan(0);
    expect(frameSharpness(flat)).toBe(0);
  });
});
