/*
 * Scanning a whole binder page from one picture (T-179): pure geometry and recognition of the pockets. The user
 * fits a rectangle to the page; it is split into equal pockets (3 columns, 3 or 4 rows), each pocket is cut out a
 * little inside its edges, brought to the card frame size of the scanner and recognised with the same fingerprints
 * and the same "sure" rule as a single card, so the thresholds measured on real phones apply here too.
 */
import { isConfident, queryFingerprints, rankFingerprints } from './cardFingerprint';
import type { FingerprintMatch, IndexedFingerprint, PixelImage } from './cardFingerprint';
import { SUGGEST_MAX_DISTANCE } from './continuousScan';
import type { Rect } from './scanCrop';

export type BinderGrid = '3x3' | '3x4';
export const BINDER_GRIDS: readonly BinderGrid[] = ['3x3', '3x4'];
export const BINDER_COLUMNS = 3;

export function binderRows(grid: BinderGrid): number {
  return grid === '3x4' ? 4 : 3;
}

/** Card 63 x 88 mm plus a margin around it for the pocket edge and the gap between pockets (mm). */
const POCKET_WIDTH_MM = 67;
const POCKET_HEIGHT_MM = 92;

/** Width / height of the guide frame: 3 pockets across, 3 or 4 down. */
export function binderAspect(grid: BinderGrid): number {
  return (BINDER_COLUMNS * POCKET_WIDTH_MM) / (binderRows(grid) * POCKET_HEIGHT_MM);
}

/** How much of a pocket is left out on each side (share of the pocket's width / height): the card sits inside the pocket. */
const INSET_X = 0.03;
const INSET_Y = 0.025;
/** The picture the pocket is brought to before recognising (the card frame of the scanner, 63:88). */
export const CELL_WIDTH = 360;
export const CELL_HEIGHT = Math.round((CELL_WIDTH * 88) / 63);

/** The pockets of `page` (a rectangle in picture pixels), row by row, each cut inside the pocket edges. */
export function pocketRects(grid: BinderGrid, page: Rect): Rect[] {
  const rows = binderRows(grid);
  const cellW = page.width / BINDER_COLUMNS;
  const cellH = page.height / rows;
  const rects: Rect[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < BINDER_COLUMNS; col++) {
      rects.push({
        x: page.x + col * cellW + cellW * INSET_X,
        y: page.y + row * cellH + cellH * INSET_Y,
        width: cellW * (1 - 2 * INSET_X),
        height: cellH * (1 - 2 * INSET_Y),
      });
    }
  }
  return rects;
}

/** The part `rect` of a picture as a width x height picture (every output pixel averages the pixels it covers). */
export function cropResample(image: PixelImage, rect: Rect, width: number, height: number): PixelImage {
  const out = new Uint8ClampedArray(width * height * 4);
  const stepX = rect.width / width;
  const stepY = rect.height / height;
  for (let oy = 0; oy < height; oy++) {
    const ya = Math.min(image.height - 1, Math.max(0, Math.floor(rect.y + oy * stepY)));
    const yb = Math.min(image.height, Math.max(ya + 1, Math.ceil(rect.y + (oy + 1) * stepY)));
    for (let ox = 0; ox < width; ox++) {
      const xa = Math.min(image.width - 1, Math.max(0, Math.floor(rect.x + ox * stepX)));
      const xb = Math.min(image.width, Math.max(xa + 1, Math.ceil(rect.x + (ox + 1) * stepX)));
      let r = 0;
      let g = 0;
      let b = 0;
      for (let y = ya; y < yb; y++) {
        for (let x = xa; x < xb; x++) {
          const i = (y * image.width + x) * 4;
          r += image.data[i] ?? 0;
          g += image.data[i + 1] ?? 0;
          b += image.data[i + 2] ?? 0;
        }
      }
      const n = (yb - ya) * (xb - xa);
      const o = (oy * width + ox) * 4;
      out[o] = r / n;
      out[o + 1] = g / n;
      out[o + 2] = b / n;
      out[o + 3] = 255;
    }
  }
  return { data: out, width, height };
}

/**
 * The part `rect` of a picture turned by `degrees` around its centre, as a width x height picture (bilinear, 2 x 2
 * samples per output pixel). A tilted page puts every card a few degrees off; the pocket is read at several angles.
 */
export function cropRotated(image: PixelImage, rect: Rect, degrees: number, width: number, height: number): PixelImage {
  const out = new Uint8ClampedArray(width * height * 4);
  const cos = Math.cos((degrees * Math.PI) / 180);
  const sin = Math.sin((degrees * Math.PI) / 180);
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const sample = (x: number, y: number, channel: number): number => {
    const cx = Math.min(image.width - 1, Math.max(0, x));
    const cy = Math.min(image.height - 1, Math.max(0, y));
    const x0 = Math.floor(cx);
    const y0 = Math.floor(cy);
    const x1 = Math.min(image.width - 1, x0 + 1);
    const y1 = Math.min(image.height - 1, y0 + 1);
    const fx = cx - x0;
    const fy = cy - y0;
    const at = (px: number, py: number) => image.data[(py * image.width + px) * 4 + channel] ?? 0;
    return (at(x0, y0) * (1 - fx) + at(x1, y0) * fx) * (1 - fy) + (at(x0, y1) * (1 - fx) + at(x1, y1) * fx) * fy;
  };
  for (let oy = 0; oy < height; oy++) {
    for (let ox = 0; ox < width; ox++) {
      const sums = [0, 0, 0];
      for (const sy of [0.25, 0.75]) {
        for (const sx of [0.25, 0.75]) {
          const dx = ((ox + sx) / width - 0.5) * rect.width;
          const dy = ((oy + sy) / height - 0.5) * rect.height;
          const x = centerX + dx * cos - dy * sin;
          const y = centerY + dx * sin + dy * cos;
          for (let c = 0; c < 3; c++) sums[c] = (sums[c] ?? 0) + sample(x - 0.5, y - 0.5, c);
        }
      }
      const o = (oy * width + ox) * 4;
      out[o] = (sums[0] ?? 0) / 4;
      out[o + 1] = (sums[1] ?? 0) / 4;
      out[o + 2] = (sums[2] ?? 0) / 4;
      out[o + 3] = 255;
    }
  }
  return { data: out, width, height };
}

/** Grid the pocket is averaged to before its activity is measured: far coarser than any phone picture, so a soft or small picture counts like a sharp one. */
const ACTIVITY_COLUMNS = 45;
const ACTIVITY_ROWS = 63;

/**
 * How much a pocket picture varies: the mean grey step between neighbouring cells of a coarse grid. A card (art, frame
 * and text) varies a lot at any resolution; an empty pocket (plastic, noise, light falling off) hardly at all.
 */
export function pocketActivity(image: PixelImage): number {
  const small = cropResample(image, { x: 0, y: 0, width: image.width, height: image.height }, ACTIVITY_COLUMNS, ACTIVITY_ROWS);
  const grey = new Float64Array(ACTIVITY_COLUMNS * ACTIVITY_ROWS);
  for (let i = 0; i < grey.length; i++) grey[i] = 0.299 * (small.data[i * 4] ?? 0) + 0.587 * (small.data[i * 4 + 1] ?? 0) + 0.114 * (small.data[i * 4 + 2] ?? 0);
  let sum = 0;
  let count = 0;
  for (let y = 0; y < ACTIVITY_ROWS; y++) {
    for (let x = 0; x < ACTIVITY_COLUMNS; x++) {
      const here = grey[y * ACTIVITY_COLUMNS + x] ?? 0;
      if (x + 1 < ACTIVITY_COLUMNS) {
        sum += Math.abs(here - (grey[y * ACTIVITY_COLUMNS + x + 1] ?? 0));
        count += 1;
      }
      if (y + 1 < ACTIVITY_ROWS) {
        sum += Math.abs(here - (grey[(y + 1) * ACTIVITY_COLUMNS + x] ?? 0));
        count += 1;
      }
    }
  }
  return count === 0 ? 0 : sum / count;
}

/** A pocket with less activity than this is empty (synthetic cards measured 10.4 and up, empty pockets 4.8 and down). */
export const EMPTY_ACTIVITY = 7;

/** sure = a clear match; check = a likely match to confirm; unknown = nothing close; empty = nothing in the pocket. */
export type PocketState = 'sure' | 'check' | 'unknown' | 'empty';

export interface PocketReading {
  readonly state: PocketState;
  /** Closest pictures of the index, closest first (empty for an empty pocket). */
  readonly matches: readonly FingerprintMatch[];
  /** See pocketActivity. */
  readonly activity: number;
}

/** The picture of a pocket at the scanner's card size: what the user sees in the result and what an empty pocket is judged by. */
export function pocketPicture(image: PixelImage, rect: Rect): PixelImage {
  return cropResample(image, rect, CELL_WIDTH, CELL_HEIGHT);
}

interface Look {
  /** Shift of the pocket as a share of its width / height, and the turn in degrees. */
  readonly dx: number;
  readonly dy: number;
  readonly angle: number;
}

/**
 * Where else a pocket is looked at when the nominal place gives no sure match. A page photographed a little crooked
 * puts the pockets at the top and bottom a few per cent off the straight grid, and the cards a few degrees turned.
 */
const SEARCH_STAGES: readonly (readonly Look[])[] = [
  [-0.06, -0.03, 0, 0.03, 0.06].flatMap((dx) => [-0.04, 0, 0.04].map((dy): Look => ({ dx, dy, angle: 0 }))).filter((look) => look.dx !== 0 || look.dy !== 0),
  [-2.5, -1.25, 1.25, 2.5].flatMap((angle) => [-0.03, 0, 0.03].flatMap((dx) => [-0.03, 0, 0.03].map((dy): Look => ({ dx, dy, angle })))),
];

function judge(matches: readonly FingerprintMatch[]): PocketState {
  const best = matches[0];
  if (best === undefined) return 'unknown';
  if (isConfident(matches)) return 'sure';
  return best.distance <= SUGGEST_MAX_DISTANCE ? 'check' : 'unknown';
}

/**
 * Recognises the pocket `rect` of a page picture. The nominal place is tried first; only a pocket that is not sure
 * there is also looked at in shifted and turned places (the closest match of all places counts, with the same rule).
 */
export function readPocket(image: PixelImage, rect: Rect, index: readonly IndexedFingerprint[]): PocketReading {
  const base = pocketPicture(image, rect);
  const activity = pocketActivity(base);
  if (activity < EMPTY_ACTIVITY) return { state: 'empty', matches: [], activity };
  const queries = [...queryFingerprints(base)];
  let matches = rankFingerprints(queries, index, 3);
  for (const stage of SEARCH_STAGES) {
    if (judge(matches) === 'sure') break;
    for (const look of stage) {
      const moved = { x: rect.x + look.dx * rect.width, y: rect.y + look.dy * rect.height, width: rect.width, height: rect.height };
      queries.push(...queryFingerprints(cropRotated(image, moved, look.angle, CELL_WIDTH, CELL_HEIGHT)));
    }
    matches = rankFingerprints(queries, index, 3);
  }
  return { state: judge(matches), matches, activity };
}

/** Largest picture side processed (px): a bigger picture is scaled down before it is read. */
export const MAX_PICTURE_SIDE = 2400;
/** Largest file accepted (bytes). */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

/** The size a picture is scaled to so that its longest side is at most MAX_PICTURE_SIDE. */
export function limitedSize(width: number, height: number): { width: number; height: number } {
  const scale = Math.min(1, MAX_PICTURE_SIDE / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Whether a chosen file may be read at all: an image, not empty, not over the size limit. */
export function acceptableImageFile(file: { type: string; size: number }): boolean {
  return file.type.startsWith('image/') && file.size > 0 && file.size <= MAX_FILE_BYTES;
}

/** Keeps a page rectangle inside the picture and at least `min` px on each side. */
export function clampRect(rect: Rect, picture: { width: number; height: number }, min = 24): Rect {
  const width = Math.min(picture.width, Math.max(min, rect.width));
  const height = Math.min(picture.height, Math.max(min, rect.height));
  return {
    x: Math.min(picture.width - width, Math.max(0, rect.x)),
    y: Math.min(picture.height - height, Math.max(0, rect.y)),
    width,
    height,
  };
}

export type Corner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
export const CORNERS: readonly Corner[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

/** Where a corner of `rect` is, in picture pixels. */
export function cornerPoint(rect: Rect, corner: Corner): { x: number; y: number } {
  return {
    x: corner === 'topLeft' || corner === 'bottomLeft' ? rect.x : rect.x + rect.width,
    y: corner === 'topLeft' || corner === 'topRight' ? rect.y : rect.y + rect.height,
  };
}

/**
 * Drags one corner of `rect` to (x, y) while the opposite corner stays. The corner stays inside the picture and the
 * rectangle keeps at least `min` px on each side, so the corners never cross.
 */
export function moveCorner(rect: Rect, corner: Corner, x: number, y: number, picture: { width: number; height: number }, min = 24): Rect {
  const left = corner === 'topLeft' || corner === 'bottomLeft';
  const top = corner === 'topLeft' || corner === 'topRight';
  const fixedX = left ? rect.x + rect.width : rect.x;
  const fixedY = top ? rect.y + rect.height : rect.y;
  const nextX = left ? Math.min(fixedX - min, Math.max(0, x)) : Math.max(fixedX + min, Math.min(picture.width, x));
  const nextY = top ? Math.min(fixedY - min, Math.max(0, y)) : Math.max(fixedY + min, Math.min(picture.height, y));
  return clampRect({ x: Math.min(fixedX, nextX), y: Math.min(fixedY, nextY), width: Math.abs(nextX - fixedX), height: Math.abs(nextY - fixedY) }, picture, min);
}
