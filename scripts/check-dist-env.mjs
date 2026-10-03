#!/usr/bin/env node
/*
 * Usage: node scripts/check-dist-env.mjs <production|test>
 *
 * Fails the build when dist/ holds the other environment's Firebase projectId or apiKey, misses its own,
 * or contains code that must never ship (D-017 Muutos K-P8, SR-28 kohta 3). Runs in every deploy
 * workflow right after the build. The values are read from src/account/firebase/config.ts, so the two
 * never drift apart.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEXT_FILES = /\.(js|mjs|css|html|json|txt|map|webmanifest|svg)$/i;
/**
 * SR-28 kohta 3: the Node-only gRPC client and analytics must never reach the browser bundle.
 * `firebase/analytics` is matched as an import path only: firebase/app itself carries the component
 * name "@firebase/analytics" in its platform logger table, which loads nothing.
 */
const FORBIDDEN = [/@grpc/, /(?<!@)firebase\/analytics/, /measurementId/, /gtag/];

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** `name` alone, not as part of a longer id: 'cyberdeck-tcg' must not match 'cyberdeck-tcg-dev'. */
export function containsId(text, id) {
  return new RegExp(`(?<![\\w-])${escapeRegExp(id)}(?![\\w-])`).test(text);
}

/** Reads `projectId` and `apiKey` of PROD_ENV and TEST_ENV from config.ts source. */
export function readEnvs(source) {
  const read = (name) => {
    const block = source.match(new RegExp(`export const ${name}: FirebaseEnv = \\{([\\s\\S]*?)\\n\\};`));
    if (block === null) throw new Error(`${name} not found in config.ts`);
    const field = (key) => {
      const match = block[1].match(new RegExp(`\\b${key}: '([^']+)'`));
      if (match === null) throw new Error(`${name}.${key} not found in config.ts`);
      return match[1];
    };
    return { projectId: field('projectId'), apiKey: field('apiKey') };
  };
  return { production: read('PROD_ENV'), test: read('TEST_ENV') };
}

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

/** Returns the problems found in `files` ({ path, text }) for a build of `mode`. Empty = OK. */
export function checkDist(files, envs, mode) {
  const own = envs[mode];
  const other = envs[mode === 'production' ? 'test' : 'production'];
  const problems = [];
  for (const { path, text } of files) {
    for (const [label, value] of Object.entries(other)) {
      if (containsId(text, value)) problems.push(`${path}: contains the other environment's ${label}`);
    }
    for (const pattern of FORBIDDEN) {
      if (pattern.test(text)) problems.push(`${path}: contains forbidden ${pattern}`);
    }
  }
  for (const [label, value] of Object.entries(own)) {
    if (!files.some(({ text }) => containsId(text, value))) problems.push(`dist/: own ${label} is missing`);
  }
  return problems;
}

function main() {
  const mode = process.argv[2];
  if (mode !== 'production' && mode !== 'test') {
    console.error('Usage: node scripts/check-dist-env.mjs <production|test>');
    process.exit(2);
  }
  const root = fileURLToPath(new URL('..', import.meta.url));
  const envs = readEnvs(readFileSync(join(root, 'src/account/firebase/config.ts'), 'utf8'));
  const dist = join(root, 'dist');
  const files = listFiles(dist)
    .filter((path) => TEXT_FILES.test(path))
    .map((path) => ({ path: relative(root, path), text: readFileSync(path, 'utf8') }));
  const problems = checkDist(files, envs, mode);
  if (problems.length > 0) {
    console.error(`check-dist-env (${mode}): build rejected`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(`check-dist-env (${mode}): OK, ${files.length} files checked`);
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) main();
