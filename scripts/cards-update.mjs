// Entry point for `npm run cards:update` (D-013 osa 2). Vite's module runner loads the TypeScript
// code, which uses extensionless imports that plain Node cannot resolve. File access lives here, so
// the TypeScript code needs no Node types. Run from the repository root (npm run does this).
import { readFile, writeFile } from 'node:fs/promises';
import { runnerImport } from 'vite';

const { module } = await runnerImport('./scripts/cards/updateCards.ts', { configFile: false, logLevel: 'error' });

const result = await module.updateCards({
  readText: async (path) => {
    try {
      return await readFile(path, 'utf8');
    } catch (error) {
      if (error?.code === 'ENOENT') return null;
      throw error;
    }
  },
  writeText: (path, text) => writeFile(path, text, 'utf8'),
  log: (line) => console.log(line),
});

process.exitCode = result.status === 'failed' ? 1 : 0;
