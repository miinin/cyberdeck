import { acceptableImageFile, limitedSize } from '../domain/binderPage';
import type { PixelImage } from '../domain/cardFingerprint';
import type { Rect } from '../domain/scanCrop';

/** The pixels of `source` (`area` of it, in source pixels) at most MAX_PICTURE_SIDE on the longest side; null without a canvas. */
export function grabPixels(source: CanvasImageSource, area: Rect): PixelImage | null {
  const size = limitedSize(Math.round(area.width), Math.round(area.height));
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (context === null) return null;
  context.drawImage(source, area.x, area.y, area.width, area.height, 0, 0, size.width, size.height);
  const pixels = context.getImageData(0, 0, size.width, size.height);
  return { data: pixels.data, width: pixels.width, height: pixels.height };
}

/**
 * Reads a chosen picture file (T-179): an image of at most 25 MB, decoded by the browser with the photo's own
 * orientation and scaled down to at most 2400 px. Rejects for anything else. The file is never uploaded or stored.
 */
export async function readImageFile(file: File): Promise<PixelImage> {
  if (!acceptableImageFile(file)) throw new Error('Unreadable image');
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const pixels = grabPixels(bitmap, { x: 0, y: 0, width: bitmap.width, height: bitmap.height });
    if (pixels === null) throw new Error('No canvas');
    return pixels;
  } finally {
    bitmap.close();
  }
}
