import { describe, expect, it } from 'vitest';
import { artIdOfFile, buildFingerprintFile } from './fingerprints';

const picture = (shade: number) => ({ data: new Uint8ClampedArray(8 * 8 * 4).fill(shade), width: 8, height: 8 });

describe('artIdOfFile', () => {
  it('reads the art id from the file name', () => {
    expect(artIdOfFile('adam-smasher.webp')).toBe('adam-smasher');
    expect(artIdOfFile('adam-smasher__nova-rare.webp')).toBe('adam-smasher__nova-rare');
    expect(artIdOfFile('notes.txt')).toBeNull();
    expect(artIdOfFile('Bad Name.webp')).toBeNull();
  });
});

describe('buildFingerprintFile', () => {
  it('fingerprints each picture, sorted by id, and skips other files', async () => {
    const file = await buildFingerprintFile(['dir/zeta.webp', 'dir/alpha__nova-rare.webp', 'dir/readme.txt'], async (path) => picture(path.includes('zeta') ? 10 : 200));
    expect(file.version).toBe(1);
    expect(file.entries.map((entry) => entry.id)).toEqual(['alpha__nova-rare', 'zeta']);
    expect(file.entries[0]?.full).toHaveLength(192);
  });

  it('rejects two pictures with the same id', async () => {
    await expect(buildFingerprintFile(['a/x.webp', 'b/x.webp'], async () => picture(1))).rejects.toThrow('Two pictures for x');
  });
});
