// The only file that uses sharp (D-013 osa 4). Plain JavaScript, because sharp's types need @types/node,
// which the project does not have; importImages.ts gets this function injected.
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import sharp from 'sharp';

/** Formats accepted from the content, not the extension (D-013 osa 4: PNG, JPEG and WebP). */
const ACCEPTED_FORMATS = new Set(['png', 'jpeg', 'webp']);

/**
 * Writes the source image as WebP in each given width (quality 80, no enlargement). Metadata (EXIF, GPS)
 * is dropped because withMetadata() is never called. Rejects when the source is not an accepted image.
 * sharp's default pixel limit stays on.
 *
 * @param {string | Uint8Array} source
 * @param {{ path: string; width: number }[]} outputs
 */
export async function convertImage(source, outputs) {
  const { format } = await sharp(source, { failOn: 'error' }).metadata();
  if (!ACCEPTED_FORMATS.has(format)) throw new Error(`Unsupported image format: ${format}`);
  for (const { path, width } of outputs) {
    await mkdir(dirname(path), { recursive: true });
    await sharp(source, { failOn: 'error' })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path);
  }
}
