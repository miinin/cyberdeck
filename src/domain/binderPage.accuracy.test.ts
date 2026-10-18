/*
 * Accuracy test of the binder page scan (T-179). Synthetic pages are made of the real card pictures: pockets with gaps,
 * a slight tilt of the page and of every card, an uneven light, a hue difference, noise and JPEG, and one empty pocket
 * on every page. The pages are read with the same code the scanner uses and the result is compared with what was put
 * on the page. Gate: at least 95 % of the cards come out "sure" and right, no empty pocket is read as a card.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { OverlayOptions } from 'sharp';
import { describe, expect, it } from 'vitest';
import { parseFingerprintFile } from '../data/fingerprintIndex';
import { BINDER_COLUMNS, binderAspect, binderRows, limitedSize, pocketRects, readPocket } from './binderPage';
import type { BinderGrid } from './binderPage';
import type { PixelImage } from './cardFingerprint';

const CARD_DIR = path.resolve(__dirname, '../assets/cards/lg');
const index = parseFingerprintFile(JSON.parse(readFileSync(path.resolve(__dirname, '../data/cardFingerprints.json'), 'utf8')) ?? null) ?? [];
const files = readdirSync(CARD_DIR).filter((name) => name.endsWith('.webp'));

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POCKET_W = Number(process.env.BINDER_POCKET_W ?? 360);
const POCKET_H = Math.round((POCKET_W * 92) / 67);
const TABLE = { r: 70, g: 60, b: 52, alpha: 1 };

interface Made {
  image: PixelImage;
  page: { x: number; y: number; width: number; height: number };
  /** Card file per pocket, or null for the empty one. */
  contents: (string | null)[];
}

async function makePage(grid: BinderGrid, seed: number): Promise<Made> {
  const r = rng(seed);
  const uniform = (lo: number, hi: number) => lo + (hi - lo) * r();
  const gauss = () => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
  const rows = binderRows(grid);
  const pageW = BINDER_COLUMNS * POCKET_W;
  const pageH = rows * POCKET_H;
  const border = Math.round(pageW * 0.08);
  const canvasW = pageW + 2 * border;
  const canvasH = pageH + 2 * border;
  const empty = Math.floor(r() * BINDER_COLUMNS * rows);
  const chosen = new Set<string>();
  const contents: (string | null)[] = [];
  const parts: OverlayOptions[] = [];
  const sleeve = { r: 205 + Math.round(uniform(-20, 20)), g: 205 + Math.round(uniform(-20, 20)), b: 210 + Math.round(uniform(-20, 20)), alpha: 1 };
  parts.push({ input: { create: { width: pageW, height: pageH, channels: 4, background: { r: 28, g: 30, b: 36, alpha: 1 } } }, left: border, top: border });
  for (let slot = 0; slot < BINDER_COLUMNS * rows; slot++) {
    const col = slot % BINDER_COLUMNS;
    const row = Math.floor(slot / BINDER_COLUMNS);
    const left = border + col * POCKET_W;
    const top = border + row * POCKET_H;
    // The pocket plastic, a little inside the pocket edges.
    const gap = Math.round(POCKET_W * 0.02);
    parts.push({ input: { create: { width: POCKET_W - 2 * gap, height: POCKET_H - 2 * gap, channels: 4, background: sleeve } }, left: left + gap, top: top + gap });
    if (slot === empty) {
      contents.push(null);
      continue;
    }
    let file = files[Math.floor(r() * files.length)] ?? '';
    while (chosen.has(file)) file = files[Math.floor(r() * files.length)] ?? '';
    chosen.add(file);
    contents.push(file);
    const cardW = Math.round((POCKET_W * 63) / 67);
    const cardH = Math.round((POCKET_H * 88) / 92);
    const tilt = uniform(-0.8, 0.8);
    const buffer = await sharp(path.join(CARD_DIR, file))
      .resize(cardW, cardH, { fit: 'fill' })
      .ensureAlpha()
      .rotate(tilt, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer({ resolveWithObject: true });
    parts.push({
      input: buffer.data,
      left: Math.round(left + (POCKET_W - buffer.info.width) / 2 + uniform(-0.015, 0.015) * POCKET_W),
      top: Math.round(top + (POCKET_H - buffer.info.height) / 2 + uniform(-0.015, 0.015) * POCKET_H),
    });
  }
  const flat = await sharp({ create: { width: canvasW, height: canvasH, channels: 4, background: TABLE } }).composite(parts).png().toBuffer();
  const angle = uniform(-2, 2);
  const turned = await sharp(flat).rotate(angle, { background: TABLE }).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height } = turned.info;
  const data = new Uint8ClampedArray(turned.data);
  // Uneven light across the page, a hue difference and noise.
  const brightness = uniform(0.82, 1.1);
  const tint = [uniform(0.92, 1.08), uniform(0.95, 1.05), uniform(0.9, 1.1)];
  const slope = uniform(-0.18, 0.18);
  const sigma = uniform(3, 7);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const light = brightness * (1 + slope * (x / width - 0.5) + slope * 0.5 * (y / height - 0.5));
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) data[i + c] = (data[i + c] ?? 0) * light * (tint[c] ?? 1) + gauss() * sigma;
    }
  }
  const jpeg = await sharp(Buffer.from(data.buffer), { raw: { width, height, channels: 4 } })
    .removeAlpha()
    .jpeg({ quality: 60 })
    .toBuffer();
  let pipeline = sharp(jpeg);
  const fit = limitedSize(width, height);
  const scale = fit.width / width;
  if (scale < 1) pipeline = pipeline.resize(fit.width, fit.height);
  const decoded = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // The user fits a rectangle to the page: right size and place, give or take about one per cent of the page.
  const jitter = () => uniform(-0.01, 0.01);
  const page = {
    x: ((width - pageW) / 2 + jitter() * pageW) * scale,
    y: ((height - pageH) / 2 + jitter() * pageH) * scale,
    width: pageW * (1 + jitter()) * scale,
    height: pageH * (1 + jitter()) * scale,
  };
  return { image: { data: new Uint8ClampedArray(decoded.data), width: decoded.info.width, height: decoded.info.height }, page, contents };
}

describe('binder page recognition accuracy', () => {
  it('has the index and the pictures', () => {
    expect(index.length).toBeGreaterThan(100);
    expect(files.length).toBeGreaterThan(100);
    expect(binderAspect('3x3')).toBeCloseTo(0.728, 2);
  });

  it('reads 95 % of the cards of synthetic pages as sure and right, and no empty pocket as a card', { timeout: 280_000 }, async () => {
    let cards = 0;
    let right = 0;
    let wrongSure = 0;
    let sameCard = 0;
    let minCardActivity = Infinity;
    let maxEmptyActivity = 0;
    let notSure = 0;
    let emptyTotal = 0;
    let emptyAsCard = 0;
    const misses: string[] = [];
    const jobs: [BinderGrid, number][] = [];
    const pages = Number(process.env.BINDER_PAGES ?? 6);
    const firstSeed = Number(process.env.BINDER_SEED ?? 100);
    for (let i = 0; i < pages; i++) jobs.push(['3x3', firstSeed + i], ['3x4', firstSeed + 100 + i]);
    for (const [grid, seed] of jobs) {
      const made = await makePage(grid, seed);
      const rects = pocketRects(grid, made.page);
      rects.forEach((rect, slot) => {
        const reading = readPocket(made.image, rect, index);
        const expected = made.contents[slot];
        if (expected === null || expected === undefined) {
          emptyTotal += 1;
          maxEmptyActivity = Math.max(maxEmptyActivity, reading.activity);
          if (reading.state !== 'empty') emptyAsCard += 1;
          return;
        }
        cards += 1;
        minCardActivity = Math.min(minCardActivity, reading.activity);
        const id = expected.replace(/\.webp$/, '');
        if (reading.state === 'sure' && reading.matches[0]?.id === id) right += 1;
        else if (reading.state === 'sure') {
          wrongSure += 1;
          if (reading.matches[0]?.id.split('__')[0] === id.split('__')[0]) sameCard += 1;
          misses.push(`${grid}#${seed}/${slot} ${id} -> ${reading.matches[0]?.id} (sure, wrong)`);
        } else {
          notSure += 1;
          misses.push(`${grid}#${seed}/${slot} ${id} -> ${reading.state} ${reading.matches[0]?.id} d=${reading.matches[0]?.distance} gap=${(reading.matches[1]?.distance ?? 0) - (reading.matches[0]?.distance ?? 0)} activity=${reading.activity.toFixed(1)}`);
        }
      });
    }
    console.log(`binder accuracy: ${right}/${cards} sure and right (${((100 * right) / cards).toFixed(1)} %), wrong sure ${wrongSure} (${sameCard} of them another art of the right card), not sure ${notSure}, empty as card ${emptyAsCard}/${emptyTotal}, activity: cards >= ${minCardActivity.toFixed(1)}, empty pockets <= ${maxEmptyActivity.toFixed(1)}`);
    if (misses.length > 0) console.log(misses.slice(0, 40).join('\n'));
    expect(right / cards).toBeGreaterThanOrEqual(0.95);
    expect(emptyAsCard).toBe(0);
  });
});
