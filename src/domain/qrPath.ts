/** Quiet zone around a QR code, in modules (the QR specification asks for 4). */
export const QR_QUIET_ZONE = 4;

/** Larger than this, the code is dense and hard to scan from a distance (T-165). */
export const QR_DENSE_LINK_LENGTH = 1200;

/** Byte-mode capacity of the biggest QR code at error correction L; longer links never fit. */
export const QR_MAX_BYTES = 2900;

export interface QrPath {
  /** Side of the square viewBox in modules, quiet zone included. */
  size: number;
  /** One SVG path of all dark modules (run-length merged per row), numbers only. */
  path: string;
}

/**
 * Turns a QR matrix (true = dark module) into one SVG path, so the link never ends up as HTML (T-165).
 * Each horizontal run of dark modules becomes one rectangle.
 */
export function matrixToPath(matrix: readonly (readonly boolean[])[], quiet: number = QR_QUIET_ZONE): QrPath {
  const size = matrix.length + quiet * 2;
  const parts: string[] = [];
  matrix.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x += 1;
        continue;
      }
      let end = x;
      while (end < row.length && row[end]) end += 1;
      parts.push(`M${x + quiet} ${y + quiet}h${end - x}v1h-${end - x}z`);
      x = end;
    }
  });
  return { size, path: parts.join('') };
}
