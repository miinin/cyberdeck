import { describe, expect, it } from 'vitest';
import { playsetSize } from './card';

describe('playsetSize', () => {
  it('is 1 for Legend and 3 for every other type', () => {
    expect(playsetSize({ type: 'Legend' })).toBe(1);
    for (const type of ['Unit', 'Gear', 'Program', 'Something new']) expect(playsetSize({ type }), type).toBe(3);
  });
});
