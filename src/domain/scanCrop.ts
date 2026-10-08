/*
 * Where the card frame is in the camera picture (T-106). The video fills its box like CSS `object-fit: cover`
 * (scaled to cover the box, the overflow cropped evenly), so the frame the user sees maps to a smaller rectangle
 * of the real video pixels.
 */
export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * The rectangle of the video (in video pixels) behind `frame`, which is given in px relative to the box the video
 * is shown in. Null when a size is empty.
 */
export function coverCropSource(video: Size, box: Size, frame: Rect): Rect | null {
  if (video.width <= 0 || video.height <= 0 || box.width <= 0 || box.height <= 0 || frame.width <= 0 || frame.height <= 0) return null;
  const scale = Math.max(box.width / video.width, box.height / video.height);
  const offsetX = (video.width * scale - box.width) / 2;
  const offsetY = (video.height * scale - box.height) / 2;
  const x = Math.max(0, (frame.x + offsetX) / scale);
  const y = Math.max(0, (frame.y + offsetY) / scale);
  return {
    x,
    y,
    width: Math.min(video.width - x, frame.width / scale),
    height: Math.min(video.height - y, frame.height / scale),
  };
}
