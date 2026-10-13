import { describe, expect, it } from 'vitest';
import { matrixToPath } from './qrPath';

describe('matrixToPath', () => {
  it('merges horizontal runs and adds the quiet zone', () => {
    const { size, path } = matrixToPath(
      [
        [true, true, false],
        [false, false, true],
      ],
      1,
    );
    expect(size).toBe(4);
    expect(path).toBe('M1 1h2v1h-2zM3 2h1v1h-1z');
  });

  it('gives an empty path for an all-light matrix', () => {
    expect(matrixToPath([[false, false]], 4)).toEqual({ size: 9, path: '' });
  });
});
