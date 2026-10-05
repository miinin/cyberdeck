// Entry point for `npm run cards:images -- <folder>` (D-013 osa 4, ARCHITECTURE.md 13.8). Like
// cards-update.mjs, Vite's module runner loads the TypeScript code; file access and sharp live here.
// Run from the repository root (npm run does this).
import { readdir, readFile, stat } from 'node:fs/promises';
import { runnerImport } from 'vite';
import { convertImage } from './cards/convertImage.mjs';

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.log('Usage: npm run cards:images -- <folder with the original card images>');
  process.exit(1);
}

const options = { configFile: false, logLevel: 'error' };
const { module } = await runnerImport('./scripts/cards/importImages.ts', options);
const { module: data } = await runnerImport('./src/data/cards.ts', options);

const result = await module.importImages(sourceDir.replace(/[\\/]+$/, ''), data.CARDS, {
  listFiles: async (dir) => {
    try {
      return (await readdir(dir, { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name);
    } catch (error) {
      if (error?.code === 'ENOENT') return null;
      throw error;
    }
  },
  fileSize: async (path) => (await stat(path)).size,
  readText: async (path) => {
    try {
      return await readFile(path, 'utf8');
    } catch (error) {
      if (error?.code === 'ENOENT') return null;
      throw error;
    }
  },
  convert: convertImage,
  log: (line) => console.log(line),
});

process.exitCode = result.exitCode;
