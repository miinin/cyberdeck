import { describe, expect, it } from 'vitest';
import {
  BINDER_COLUMNS,
  CELL_HEIGHT,
  CELL_WIDTH,
  MAX_FILE_BYTES,
  MAX_PICTURE_SIDE,
  acceptableImageFile,
  binderAspect,
  binderRows,
  clampRect,
  cornerPoint,
  cropResample,
  cropRotated,
  limitedSize,
  moveCorner,
  pocketRects,
  readPocket,
} from './binderPage';
import { cardFingerprint } from './cardFingerprint';
import type { IndexedFingerprint, PixelImage } from './cardFingerprint';

function flat(width: number, height: number, color: [number, number, number]): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) data.set([...color, 255], i * 4);
  return { data, width, height };
}

/** A fixed random-looking picture per seed (blocks of 6 px), like the scanner tests use. */
function art(seed: number, width = 120, height = 168): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < 3; c++) {
        let h = (Math.floor(x / 6) * 73856093) ^ (Math.floor(y / 6) * 19349663) ^ (seed * 83492791) ^ (c * 2654435761);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        data[(y * width + x) * 4 + c] = (h >>> 0) % 256;
      }
      data[(y * width + x) * 4 + 3] = 255;
    }
  }
  return { data, width, height };
}

describe('grid geometry', () => {
  it('has 3 columns and 3 or 4 rows, and a frame as wide as the pockets', () => {
    expect(BINDER_COLUMNS).toBe(3);
    expect(binderRows('3x3')).toBe(3);
    expect(binderRows('3x4')).toBe(4);
    expect(binderAspect('3x3')).toBeGreaterThan(binderAspect('3x4'));
    expect(binderAspect('3x3')).toBeCloseTo((3 * 67) / (3 * 92), 5);
  });

  it('splits the page into pockets in reading order, each inside its own cell', () => {
    const page = { x: 10, y: 20, width: 300, height: 400 };
    const rects = pocketRects('3x4', page);
    expect(rects).toHaveLength(12);
    expect(pocketRects('3x3', page)).toHaveLength(9);
    rects.forEach((rect, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      expect(rect.x).toBeGreaterThan(page.x + col * 100);
      expect(rect.x + rect.width).toBeLessThan(page.x + (col + 1) * 100);
      expect(rect.y).toBeGreaterThan(page.y + row * 100);
      expect(rect.y + rect.height).toBeLessThan(page.y + (row + 1) * 100);
    });
    expect(rects[1]?.x).toBeGreaterThan(rects[0]?.x ?? Infinity);
    expect(rects[3]?.y).toBeGreaterThan(rects[0]?.y ?? Infinity);
  });
});

describe('cropResample and cropRotated', () => {
  it('averages the pixels of the rectangle to the asked size', () => {
    const image = flat(4, 2, [0, 0, 0]);
    image.data.set([200, 100, 50, 255], 2 * 4);
    image.data.set([200, 100, 50, 255], 3 * 4);
    image.data.set([200, 100, 50, 255], (4 + 2) * 4);
    image.data.set([200, 100, 50, 255], (4 + 3) * 4);
    const out = cropResample(image, { x: 0, y: 0, width: 4, height: 2 }, 2, 1);
    expect(Array.from(out.data.slice(0, 4))).toEqual([0, 0, 0, 255]);
    expect(Array.from(out.data.slice(4, 8))).toEqual([200, 100, 50, 255]);
  });

  it('copes with a rectangle partly outside the picture', () => {
    const out = cropResample(flat(10, 10, [9, 9, 9]), { x: 8, y: 8, width: 10, height: 10 }, 4, 4);
    expect(out.width).toBe(4);
    expect(out.data.every((v, i) => i % 4 === 3 || v === 9)).toBe(true);
  });

  it('turns by zero degrees like the plain crop of a smooth picture', () => {
    const image = flat(40, 40, [50, 60, 70]);
    const out = cropRotated(image, { x: 5, y: 5, width: 30, height: 30 }, 0, 10, 10);
    expect(Array.from(out.data.slice(0, 3))).toEqual([50, 60, 70]);
  });
});

describe('limits for a chosen picture', () => {
  it('scales the longest side down to at most 2400 px and keeps the shape', () => {
    expect(limitedSize(1200, 800)).toEqual({ width: 1200, height: 800 });
    const big = limitedSize(4800, 3200);
    expect(big).toEqual({ width: MAX_PICTURE_SIDE, height: 1600 });
    expect(limitedSize(1000, 6000).height).toBe(MAX_PICTURE_SIDE);
  });

  it('accepts only non-empty images of at most 25 MB', () => {
    expect(acceptableImageFile({ type: 'image/jpeg', size: 1000 })).toBe(true);
    expect(acceptableImageFile({ type: 'image/png', size: MAX_FILE_BYTES })).toBe(true);
    expect(acceptableImageFile({ type: 'image/png', size: MAX_FILE_BYTES + 1 })).toBe(false);
    expect(acceptableImageFile({ type: 'text/plain', size: 10 })).toBe(false);
    expect(acceptableImageFile({ type: 'application/pdf', size: 10 })).toBe(false);
    expect(acceptableImageFile({ type: 'image/png', size: 0 })).toBe(false);
  });
});

describe('moving a corner of the page rectangle', () => {
  const picture = { width: 1000, height: 800 };
  const rect = { x: 100, y: 100, width: 600, height: 500 };

  it('finds the corners', () => {
    expect(cornerPoint(rect, 'topLeft')).toEqual({ x: 100, y: 100 });
    expect(cornerPoint(rect, 'bottomRight')).toEqual({ x: 700, y: 600 });
  });

  it('moves a corner and keeps the opposite one', () => {
    expect(moveCorner(rect, 'topLeft', 50, 60, picture)).toEqual({ x: 50, y: 60, width: 650, height: 540 });
    expect(moveCorner(rect, 'bottomRight', 800, 700, picture)).toEqual({ x: 100, y: 100, width: 700, height: 600 });
  });

  it('keeps the corner inside the picture and the sides apart', () => {
    expect(moveCorner(rect, 'topLeft', -50, -50, picture)).toMatchObject({ x: 0, y: 0 });
    expect(moveCorner(rect, 'bottomRight', 5000, 5000, picture)).toMatchObject({ width: 900, height: 700 });
    const crossed = moveCorner(rect, 'topLeft', 900, 900, picture, 24);
    expect(crossed.width).toBeGreaterThanOrEqual(24);
    expect(crossed.height).toBeGreaterThanOrEqual(24);
    expect(crossed.x + crossed.width).toBeLessThanOrEqual(picture.width);
  });

  it('clamps a rectangle into the picture', () => {
    expect(clampRect({ x: -5, y: 790, width: 5000, height: 100 }, picture)).toEqual({ x: 0, y: 700, width: 1000, height: 100 });
  });
});

describe('readPocket', () => {
  const index: IndexedFingerprint[] = [1, 2, 3].map((seed) => ({ id: `card-${seed}`, ...cardFingerprint(art(seed)) }));

  it('calls a flat pocket empty without looking for a card', () => {
    const reading = readPocket(flat(CELL_WIDTH, CELL_HEIGHT, [200, 200, 205]), { x: 0, y: 0, width: CELL_WIDTH, height: CELL_HEIGHT }, index);
    expect(reading.state).toBe('empty');
    expect(reading.matches).toEqual([]);
  });

  it('recognises a card picture as sure', () => {
    const reading = readPocket(art(2), { x: 0, y: 0, width: 120, height: 168 }, index);
    expect(reading.state).toBe('sure');
    expect(reading.matches[0]?.id).toBe('card-2');
  });

  // The shift and turn search for a pocket that matches nothing is slow under a full parallel run (T-181-0).
  it('does not call a picture of something else a sure card', () => {
    const reading = readPocket(art(99), { x: 0, y: 0, width: 120, height: 168 }, index);
    expect(reading.state).not.toBe('sure');
    expect(reading.state).not.toBe('empty');
  }, 20_000);
});
