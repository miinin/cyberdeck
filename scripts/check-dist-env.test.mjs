import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkDist, containsId, readEnvs } from './check-dist-env.mjs';

// D-017 Muutos K-P8, SR-28 kohta 3: a build must hold only its own Firebase project.
const envs = readEnvs(readFileSync('src/account/firebase/config.ts', 'utf8'));
const prod = `{projectId:"${envs.production.projectId}",apiKey:"${envs.production.apiKey}"}`;
const test = `{projectId:"${envs.test.projectId}",apiKey:"${envs.test.apiKey}"}`;

describe('check-dist-env', () => {
  it('reads both projects from config.ts', () => {
    expect(envs.production.projectId).toBe('cyberdeck-tcg');
    expect(envs.test.projectId).toBe('cyberdeck-tcg-dev');
    expect(envs.production.apiKey).toMatch(/^AIza/);
    expect(envs.test.apiKey).not.toBe(envs.production.apiKey);
  });

  it('matches an id only as a whole id', () => {
    expect(containsId('"cyberdeck-tcg"', 'cyberdeck-tcg')).toBe(true);
    expect(containsId('https://cyberdeck-tcg.web.app', 'cyberdeck-tcg')).toBe(true);
    expect(containsId('"cyberdeck-tcg-dev"', 'cyberdeck-tcg')).toBe(false);
    expect(containsId('xcyberdeck-tcg', 'cyberdeck-tcg')).toBe(false);
  });

  it('accepts a build with only its own project', () => {
    expect(checkDist([{ path: 'a.js', text: prod }], envs, 'production')).toEqual([]);
    expect(checkDist([{ path: 'a.js', text: test }], envs, 'test')).toEqual([]);
  });

  it('rejects a build with the other project or without its own', () => {
    expect(checkDist([{ path: 'a.js', text: test }], envs, 'production')).toEqual([
      "a.js: contains the other environment's projectId",
      "a.js: contains the other environment's apiKey",
      'dist/: own projectId is missing',
      'dist/: own apiKey is missing',
    ]);
    expect(checkDist([{ path: 'a.js', text: prod + test }], envs, 'test')).toHaveLength(2);
  });

  it('rejects gRPC and analytics code but not the SDK component name table', () => {
    const files = (extra) => [{ path: 'a.js', text: prod + extra }];
    expect(checkDist(files('`@firebase/analytics`'), envs, 'production')).toEqual([]);
    expect(checkDist(files('import("firebase/analytics")'), envs, 'production')).toHaveLength(1);
    expect(checkDist(files('@grpc/grpc-js'), envs, 'production')).toHaveLength(1);
    expect(checkDist(files('measurementId'), envs, 'production')).toHaveLength(1);
    expect(checkDist(files('window.gtag'), envs, 'production')).toHaveLength(1);
  });
});
