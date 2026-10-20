import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T-185: the chamfers of the whole site are at the top right corner, and the edge of a clipped box is drawn along the diagonal.
 * jsdom cannot paint, so these checks keep the shapes from being changed back by accident.
 */
const files = ['styles.css', 'styles/cards.css', 'styles/collection.css', 'styles/decks.css', 'styles/editor.css', 'styles/havewant.css', 'styles/playtest.css', 'styles/premium.css', 'styles/proxy.css'];
const css = files.map((f) => readFileSync(resolve(__dirname, f), 'utf8')).join('\n');
const base = readFileSync(resolve(__dirname, 'styles.css'), 'utf8');

describe('T-185 chamfers', () => {
  it('--shape-chamfer* cut the top right corner', () => {
    expect(base).toContain('--shape-chamfer: polygon(0 0, calc(100% - var(--cut)) 0, 100% var(--cut), 100% 100%, 0 100%);');
    expect(base).toContain('--shape-chamfer-inner: polygon(0 0, calc(100% - var(--cut-inner)) 0, 100% var(--cut-inner), 100% 100%, 0 100%);');
    expect(base).toContain('--shape-chamfer-inner-2: polygon(0 0, calc(100% - var(--cut-inner-2)) 0, 100% var(--cut-inner-2), 100% 100%, 0 100%);');
    expect(base).toContain('--shape-chamfer-sm: polygon(0 0, calc(100% - var(--cut-sm)) 0, 100% var(--cut-sm), 100% 100%, 0 100%);');
    expect(base).toContain('--shape-object: polygon(0 0, calc(100% - var(--cut-lg)) 0, 100% var(--cut-lg), 100% 100%, 0 100%);');
  });

  it('no polygon cuts the bottom right corner any more', () => {
    expect(css).not.toMatch(/polygon\([^)]*100% calc\(100% - [^)]*\) 100%/);
    expect(css).not.toMatch(/polygon\(0 0, 100% 0, 100% \d+%/);
  });

  it('the clipped boxes draw the diagonal edge as a gradient layer', () => {
    expect((css.match(/linear-gradient\(to bottom left, transparent 50%/g) ?? []).length).toBeGreaterThanOrEqual(7);
  });
});
