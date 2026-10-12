// `npm run cards:check -- <dir>` (T-149): compares the bundled card data with choom.gg's (saved by
// scripts/cards-check-grab.mjs into <dir>/cards.json). Prints a report; changes nothing. Method: docs/LESSONS.md (T-146).
// - set membership per card (choom.gg lists neither the retail pre-release kit nor the demo decks: those are noted, not errors)
// - Welcome to Night City Retail printings by number and name
// - type, color, cost, power, RAM and rarity
// - pictures: the base picture against choom.gg's base row and the Iconic pictures against their edition, by a 16x16 dHash
//   (downloaded pictures are cached in <dir>/img)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const dir = process.argv[2];
if (!dir) throw new Error('Usage: npm run cards:check -- <dir with cards.json from cards-check-grab>');
const d = JSON.parse(readFileSync('src/data/cards.json', 'utf8'));
const ours = Array.isArray(d) ? d : d.cards ?? Object.values(d).find(Array.isArray);
const theirs = JSON.parse(readFileSync(join(dir, 'cards.json'), 'utf8'));
mkdirSync(join(dir, 'img'), { recursive: true });

const report = [];
const note = (section, line) => report.push(`[${section}] ${line}`);
// choom.gg writes a missing subname as '', we write null.
const sameCard = (c) => (r) => r.name === c.name && (r.subname || null) === (c.subname || null);
const family = (code) =>
  [['welcometonightcity', 'WNC'], ['edgerunner', 'EOS1'], ['prerelease', 'PRB'], ['embracingpower', 'EPS'], ['theheist', 'THS'], ['boxtoppers', 'BXT'], ['nightcitybrawl', 'NCB01'], ['nightcityshowdown', 'NCS01']].find(([p]) => code.startsWith(p))?.[1] ?? code;
const theirFamily = (series) => (series === 'WNCB' || series === 'WNCR' ? 'WNC' : series);
const NOT_LISTED = new Set(['arasakademodeck', 'mercdemodeck', 'prereleaseretail']);

// 1. Set membership.
for (const c of ours) {
  const rows = theirs.filter(sameCard(c));
  if (rows.length === 0) { note('missing', `${c.key}: not on choom.gg`); continue; }
  const mine = [...new Set((c.printings ?? []).map((p) => p.setCode).filter((s) => !NOT_LISTED.has(s)).map(family))].sort().join('+');
  const other = [...new Set(rows.map((r) => theirFamily(r.series)).filter((s) => !s.startsWith('_')))].sort().join('+');
  if (mine !== other) note('sets', `${c.key}: ours ${mine}, choom.gg ${other}`);
}

// 2. Welcome to Night City Retail by number.
const wnc = theirs.filter((r) => r.series === 'WNC' || r.series === 'WNCR');
for (const c of ours) {
  for (const p of (c.printings ?? []).filter((x) => x.setCode === 'welcometonightcityretail')) {
    if (!wnc.some((r) => r.print_number === p.number && sameCard(c)(r))) note('wnc', `${p.number} ${c.key}: no such row on choom.gg`);
  }
}

// 3. Stats.
const norm = (v) => (v === undefined || v === null || v === '' ? null : String(v));
for (const c of ours) {
  const rows = theirs.filter((r) => !r.is_alternate && !r.series.startsWith('_') && sameCard(c)(r));
  const r = rows.find((x) => x.series === 'WNC') ?? rows[0];
  if (!r) continue;
  for (const k of ['type', 'color', 'cost', 'power', 'ram', 'rarity']) {
    if (norm(c[k]) !== norm(r[k])) note('stats', `${c.key} ${k}: ours ${c[k]}, choom.gg ${r[k]}`);
  }
}

// 4. Pictures.
async function hash(file) {
  const px = await sharp(file).resize(17, 16, { fit: 'fill' }).grayscale().raw().toBuffer();
  let bits = '';
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) bits += px[y * 17 + x] > px[y * 17 + x + 1] ? '1' : '0';
  return bits;
}
const distance = (a, b) => [...a].filter((ch, i) => ch !== b[i]).length;
async function picture(row) {
  const file = join(dir, 'img', `${row.id}.webp`);
  if (!existsSync(file)) writeFileSync(file, Buffer.from(await (await fetch(new URL(row.image_url, 'https://choom.gg/'))).arrayBuffer()));
  return file;
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const SAME = 20;
for (const c of ours) {
  const r = theirs.filter((x) => !x.is_alternate && !x.series.startsWith('_') && x.image_url && sameCard(c)(x)).sort((a) => (a.series === 'WNC' ? -1 : 1))[0];
  const mine = `src/assets/cards/lg/${c.key}.webp`;
  if (r && existsSync(mine)) {
    const dd = distance(await hash(mine), await hash(await picture(r)));
    if (dd > SAME) note('picture', `${c.key}: base picture differs from choom.gg ${r.id} (${dd}/256)`);
  }
}
for (const r of theirs.filter((x) => x.series === 'WNCR' || x.series === 'WNCB')) {
  const c = ours.find(sameCard(r));
  if (!c) continue;
  const retail = theirs.some((x) => x.series === 'WNCR' && x.print_number === r.print_number.replace('β', ''));
  const name = r.series === 'WNCB' && retail ? `${r.rarity} Beta` : r.rarity;
  const mine = `src/assets/cards/variants/${c.key}__${slug(name)}.webp`;
  if (!existsSync(mine)) { note('picture', `${r.print_number} ${c.key}: no picture ${mine}`); continue; }
  const dd = distance(await hash(mine), await hash(await picture(r)));
  if (dd > SAME) note('picture', `${r.print_number} ${c.key}: ${name} picture differs from choom.gg (${dd}/256)`);
}

console.log(report.length === 0 ? 'No differences.' : report.join('\n'));
console.log(`\n${ours.length} cards checked against ${theirs.length} choom.gg rows. Not on choom.gg by design: the retail pre-release kit, the demo decks.`);
