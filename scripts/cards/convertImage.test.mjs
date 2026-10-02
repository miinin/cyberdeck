import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { convertImage } from './convertImage.mjs';

let dir;
afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true });
  dir = undefined;
});

/** A small generated image, never a real card image (ARCHITECTURE.md 13.8). */
function image(width, height) {
  return sharp({ create: { width, height, channels: 3, background: '#336699' } });
}

describe('convertImage', () => {
  it('writes WebP in each width without enlarging and without metadata', async () => {
    dir = await mkdtemp(join(tmpdir(), 'cards-'));
    const source = await image(400, 559).withMetadata({ exif: { IFD0: { Copyright: 'test' } } }).png().toBuffer();
    const outputs = [
      { path: join(dir, 'sm', 'a.webp'), width: 160 },
      { path: join(dir, 'lg', 'a.webp'), width: 720 },
    ];
    await convertImage(source, outputs);

    const small = await sharp(await readFile(outputs[0].path)).metadata();
    const large = await sharp(await readFile(outputs[1].path)).metadata();
    expect([small.format, small.width, small.height, small.exif]).toEqual(['webp', 160, 224, undefined]);
    expect([large.format, large.width, large.height]).toEqual(['webp', 400, 559]);
  });

  it('rejects content that is not PNG, JPEG or WebP, whatever the file is called', async () => {
    const gif = await image(10, 10).gif().toBuffer();
    await expect(convertImage(gif, [])).rejects.toThrow('Unsupported image format: gif');
    await expect(convertImage(new Uint8Array([1, 2, 3]), [])).rejects.toThrow();
  });
});
