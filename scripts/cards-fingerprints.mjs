// Entry point for `npm run cards:fingerprints` (T-106). Vite's module runner loads the TypeScript code; sharp lives here.
// Run from the repository root (npm run does this).
import { readdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { runnerImport } from 'vite';

const { module } = await runnerImport('./scripts/cards/fingerprints.ts', { configFile: false, logLevel: 'error' });

async function decodePixels(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

const files = [];
for (const dir of module.FINGERPRINT_SOURCE_DIRS) {
  for (const name of (await readdir(dir)).sort()) files.push(`${dir}/${name}`);
}
const file = await module.buildFingerprintFile(files, decodePixels);
await writeFile(module.FINGERPRINTS_PATH, `${JSON.stringify(file)}\n`);
console.log(`Wrote ${file.entries.length} fingerprints to ${module.FINGERPRINTS_PATH}`);
