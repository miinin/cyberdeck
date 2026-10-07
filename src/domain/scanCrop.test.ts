import { describe, expect, it } from 'vitest';
import { coverCropSource } from './scanCrop';

describe('coverCropSource', () => {
  it('maps the frame one to one when the video has the size of the box', () => {
    expect(coverCropSource({ width: 400, height: 500 }, { width: 400, height: 500 }, { x: 50, y: 20, width: 300, height: 420 })).toEqual({
      x: 50,
      y: 20,
      width: 300,
      height: 420,
    });
  });

  it('scales by the video size', () => {
    expect(coverCropSource({ width: 800, height: 1000 }, { width: 400, height: 500 }, { x: 50, y: 20, width: 300, height: 420 })).toEqual({
      x: 100,
      y: 40,
      width: 600,
      height: 840,
    });
  });

  it('accounts for the sides cut off by object-fit: cover (wide video in a tall box)', () => {
    // 1600x900 video, 450x900 box: scale 1, the video is cut 575 px from each side.
    const crop = coverCropSource({ width: 1600, height: 900 }, { width: 450, height: 900 }, { x: 25, y: 100, width: 400, height: 700 });
    expect(crop).toEqual({ x: 600, y: 100, width: 400, height: 700 });
  });

  it('accounts for the top and bottom cut off (tall video in a wide box)', () => {
    // 900x1600 video, 900x450 box: scale 1, 575 px cut from top and bottom.
    const crop = coverCropSource({ width: 900, height: 1600 }, { width: 900, height: 450 }, { x: 100, y: 25, width: 300, height: 400 });
    expect(crop).toEqual({ x: 100, y: 600, width: 300, height: 400 });
  });

  it('keeps the rectangle inside the video and returns null for empty sizes', () => {
    const crop = coverCropSource({ width: 100, height: 100 }, { width: 100, height: 100 }, { x: -10, y: 90, width: 50, height: 50 });
    expect(crop).toEqual({ x: 0, y: 90, width: 50, height: 10 });
    expect(coverCropSource({ width: 0, height: 100 }, { width: 100, height: 100 }, { x: 0, y: 0, width: 10, height: 10 })).toBeNull();
    expect(coverCropSource({ width: 100, height: 100 }, { width: 100, height: 100 }, { x: 0, y: 0, width: 0, height: 10 })).toBeNull();
  });
});
