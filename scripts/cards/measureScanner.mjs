// `npm run cards:measure-scanner` (T-106 phase 0, D-027): an artificial accuracy test of the card fingerprints.
// Every card picture is distorted the way a phone camera would (tilt, rotation, crop, blur, light, noise, glare,
// JPEG, small size) and recognised against the committed fingerprints. Prints top-1 / top-3 accuracy per scenario and
// the worst confusions. `card` = the best match is the right card (the art, e.g. Nova vs Iconic, may differ). Gate: top-1 >= 90 %, top-3 >= 98 %. Not part of the build or the tests.
import { readdir, readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { runnerImport } from 'vite';

const options = { configFile: false, logLevel: 'error' };
const { module: fp } = await runnerImport('./src/domain/cardFingerprint.ts', options);
const { module: build } = await runnerImport('./scripts/cards/fingerprints.ts', options);

const FRAME_W = Number(process.env.FRAME_W ?? 360);
const FRAME_H = Math.round((FRAME_W * 88) / 63);
const TRIALS = Number(process.env.TRIALS ?? 2);
const ASPECT = 63 / 88;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const uniform = (r, lo, hi) => lo + (hi - lo) * r();
const signed = (r, max) => uniform(r, -max, max);
const gauss = (r) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());

const IDENTITY = { rot: 0, crop: 0, dx: 0, dy: 0, px: 0, py: 0, blur: 0, bright: 0, contrast: 1, warm: 0, noise: 0, glare: 0, jpeg: 0, small: 1 };
// crop > 0: the card is enlarged so that this share of each edge is outside the frame; crop < 0: background shows.
const SCENARIOS = {
  clean: () => ({}),
  rotation8: (r) => ({ rot: signed(r, 8) }),
  perspective: (r) => ({ px: signed(r, 0.18), py: signed(r, 0.18), rot: signed(r, 3) }),
  crop3to8: (r) => ({ crop: uniform(r, 0.03, 0.08), dx: signed(r, 0.01), dy: signed(r, 0.01) }),
  margin3to8: (r) => ({ crop: -uniform(r, 0.03, 0.08), dx: signed(r, 0.02), dy: signed(r, 0.02) }),
  offcenter: (r) => ({ dx: signed(r, 0.05), dy: signed(r, 0.05) }),
  blur: (r) => ({ blur: uniform(r, 1.5, 4) }),
  light: (r) => ({ bright: signed(r, 50), contrast: uniform(r, 0.6, 1.4), warm: signed(r, 35) }),
  noise: (r) => ({ noise: uniform(r, 10, 28) }),
  glare: (r) => ({ glare: uniform(r, 0.5, 0.95) }),
  jpeg50small: (r) => ({ jpeg: 50, small: uniform(r, 0.35, 0.6) }),
  combined: (r) => ({
    rot: signed(r, 6),
    crop: signed(r, 0.05),
    dx: signed(r, 0.03),
    dy: signed(r, 0.03),
    px: signed(r, 0.12),
    py: signed(r, 0.12),
    blur: uniform(r, 0, 2.5),
    bright: signed(r, 35),
    contrast: uniform(r, 0.75, 1.25),
    warm: signed(r, 25),
    noise: uniform(r, 0, 18),
    glare: r() < 0.5 ? uniform(r, 0.3, 0.8) : 0,
    jpeg: 50,
    small: uniform(r, 0.5, 1),
  }),
};

/** Warps the card (RGBA raw) into a FRAME_W x FRAME_H frame with a homography-like transform; bilinear. */
function warp(src, s, r) {
  const out = Buffer.alloc(FRAME_W * FRAME_H * 4);
  const bg = [uniform(r, 20, 200), uniform(r, 20, 200), uniform(r, 20, 200)];
  const zoom = 1 / (1 - 2 * s.crop);
  const cos = Math.cos((-s.rot * Math.PI) / 180);
  const sin = Math.sin((-s.rot * Math.PI) / 180);
  for (let v = 0; v < FRAME_H; v++) {
    for (let u = 0; u < FRAME_W; u++) {
      const X = (u + 0.5) / FRAME_H - ASPECT / 2;
      const Y = (v + 0.5) / FRAME_H - 0.5;
      const xt = X - s.dx;
      const yt = Y - s.dy;
      const w = 1 + s.px * xt + s.py * yt;
      const xr = (xt / w) * cos - (yt / w) * sin;
      const yr = (xt / w) * sin + (yt / w) * cos;
      const qx = xr / zoom;
      const qy = yr / zoom;
      const sx = (qx / ASPECT + 0.5) * src.width - 0.5;
      const sy = (qy + 0.5) * src.height - 0.5;
      const o = (v * FRAME_W + u) * 4;
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      if (x0 < 0 || y0 < 0 || x0 >= src.width - 1 || y0 >= src.height - 1) {
        out[o] = bg[0];
        out[o + 1] = bg[1];
        out[o + 2] = bg[2];
        out[o + 3] = 255;
        continue;
      }
      const fx = sx - x0;
      const fy = sy - y0;
      for (let c = 0; c < 3; c++) {
        const p = (y, x) => src.data[(y * src.width + x) * 4 + c];
        out[o + c] = p(y0, x0) * (1 - fx) * (1 - fy) + p(y0, x0 + 1) * fx * (1 - fy) + p(y0 + 1, x0) * (1 - fx) * fy + p(y0 + 1, x0 + 1) * fx * fy;
      }
      out[o + 3] = 255;
    }
  }
  return out;
}

function photometric(buf, s, r) {
  const gx = uniform(r, 0.25, 0.75) * FRAME_W;
  const gy = uniform(r, 0.15, 0.7) * FRAME_H;
  const gr = uniform(r, 0.12, 0.3) * FRAME_W;
  for (let v = 0; v < FRAME_H; v++) {
    for (let u = 0; u < FRAME_W; u++) {
      const o = (v * FRAME_W + u) * 4;
      const d = Math.hypot(u - gx, v - gy) / gr;
      const glare = s.glare > 0 ? s.glare * Math.exp(-d * d) : 0;
      for (let c = 0; c < 3; c++) {
        let x = buf[o + c];
        x = (x - 128) * s.contrast + 128 + s.bright + (c === 0 ? s.warm : c === 2 ? -s.warm : 0);
        if (s.noise > 0) x += gauss(r) * s.noise;
        x = x * (1 - glare) + 255 * glare;
        buf[o + c] = Math.max(0, Math.min(255, x));
      }
    }
  }
}

async function distort(src, s, r) {
  const buf = warp(src, s, r);
  photometric(buf, s, r);
  let img = sharp(buf, { raw: { width: FRAME_W, height: FRAME_H, channels: 4 } });
  if (s.blur >= 0.3) img = img.blur(s.blur);
  if (s.small < 1 || s.jpeg > 0) {
    // The camera resolution: shrink and compress (the scanner works on whatever size the canvas has).
    const jpg = await img.resize(Math.round(FRAME_W * s.small)).jpeg({ quality: s.jpeg || 90 }).toBuffer();
    img = sharp(jpg);
  }
  const { data, info } = await img.removeAlpha().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

const colorOf = new Map(JSON.parse(await readFile('./src/data/cards.json', 'utf8')).cards.map((c) => [c.key, c.color]));
const index = JSON.parse(await readFile(build.FINGERPRINTS_PATH, 'utf8')).entries;
const files = [];
for (const dir of build.FINGERPRINT_SOURCE_DIRS) for (const n of (await readdir(dir)).sort()) files.push(`${dir}/${n}`);

const stats = {};
const confusions = new Map();
const results = []; // [correct, distance, gap] for tuning the "sure" rule
for (const name of Object.keys(SCENARIOS)) stats[name] = { n: 0, top1: 0, top3: 0, card1: 0 };

let seed = 1;
for (const path of files) {
  const id = build.artIdOfFile(path.slice(path.lastIndexOf('/') + 1));
  if (id === null) continue;
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const src = { data, width: info.width, height: info.height };
  for (const [name, make] of Object.entries(SCENARIOS)) {
    for (let t = 0; t < TRIALS; t++) {
      const r = rng(seed++);
      const s = { ...IDENTITY, ...make(r) };
      const image = await distort(src, s, r);
      const query = process.env.PLAIN ? fp.cardFingerprint(image) : fp.queryFingerprints(image);
      const top = fp.rankFingerprints(query, index, 3);
      const st = stats[name];
      st.n++;
      if (top[0].id === id) st.top1++;
      else {
        const k = `${id} -> ${top[0].id}`;
        confusions.set(k, (confusions.get(k) ?? 0) + 1);
      }
      if (top.some((m) => m.id === id)) st.top3++;
      if (top[0].id.split('__')[0] === id.split('__')[0]) st.card1++;
      results.push([top[0].id === id, top[0].distance, (top[1]?.distance ?? 9999) - top[0].distance, colorOf.get(id.split('__')[0]) ?? '?', top[0].id.split('__')[0] === id.split('__')[0]]);
    }
  }
}

let n = 0;
let t1 = 0;
let t3 = 0;
let c1 = 0;
console.log(`frame ${FRAME_W}x${FRAME_H}, ${TRIALS} trials per picture and scenario, ${index.length} pictures`);
for (const [name, st] of Object.entries(stats)) {
  n += st.n;
  t1 += st.top1;
  t3 += st.top3;
  c1 += st.card1;
  console.log(`${name.padEnd(13)} top1 ${((100 * st.top1) / st.n).toFixed(1).padStart(5)} %  top3 ${((100 * st.top3) / st.n).toFixed(1).padStart(5)} %  card ${((100 * st.card1) / st.n).toFixed(1).padStart(5)} %  (n=${st.n})`);
}
console.log(`ALL           top1 ${((100 * t1) / n).toFixed(1)} %  top3 ${((100 * t3) / n).toFixed(1)} %  card ${((100 * c1) / n).toFixed(1)} %  (n=${n})`);
console.log('Worst confusions:');
for (const [k, c] of [...confusions].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`  ${c}x ${k}`);

const { CONFIDENCE } = fp;
const rules = [[CONFIDENCE.maxDistance, CONFIDENCE.minGap], [240, 40], [580, 20], [580, 60], [650, 40]];
for (const [maxDistance, minGap] of rules) {
  const sure = results.filter(([, d, g]) => d <= maxDistance && g >= minGap);
  const wrong = sure.filter(([ok]) => !ok).length;
  console.log(
    `sure (<=${maxDistance}, gap>=${minGap}): ${((100 * sure.length) / results.length).toFixed(1)} % of scans, wrong among them ${wrong} (${((100 * wrong) / Math.max(1, sure.length)).toFixed(2)} %)`,
  );
}

// Wrong sure matches per card colour (T-113b): wrong = another card (a different art of the same card is not counted).
for (const [maxDistance, minGap] of rules.slice(0, 1)) {
  console.log(`Per colour with the current rule (<=${maxDistance}, gap>=${minGap}): scans / sure / wrong card / wrong art`);
  for (const color of [...new Set(results.map((r) => r[3]))].sort()) {
    const mine = results.filter((r) => r[3] === color);
    const sure = mine.filter(([, d, g]) => d <= maxDistance && g >= minGap);
    console.log(`  ${color.padEnd(8)} ${mine.length} / ${sure.length} / ${sure.filter((r) => !r[4]).length} / ${sure.filter((r) => !r[0]).length}`);
  }
}
