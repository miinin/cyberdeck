import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T-187: the diagonal edge line of a clipped box sits on the clip edge (the gradient layer starts at the border box, not the padding box),
 * the info box clips with its own cut, and the card marks are thin shapes on a dark base. jsdom cannot paint, so these keep the CSS from regressing.
 */
const read = (f: string) => readFileSync(resolve(__dirname, f), 'utf8');
const files = ['styles.css', 'styles/cards.css', 'styles/collection.css'];
const css = files.map(read).join('\n');
const cards = read('styles/cards.css');

describe('T-187 chamfer edges', () => {
  it('every diagonal edge gradient is placed from the border box', () => {
    const gradients = (css.match(/background:[^;{}]*?linear-gradient\(to bottom left[^;{}]*;/g) ?? []).length;
    const origins = css.match(/background:[^;{}]*?linear-gradient\(to bottom left[^;{}]*;\s*background-origin: border-box;/g) ?? [];
    expect(gradients).toBeGreaterThanOrEqual(8);
    expect(origins.length).toBe(gradients);
  });

  it('the info box clips with its own cut, so the clip and the diagonal line have the same size', () => {
    const box = /\.card-box \{[^}]*\}/.exec(cards)?.[0] ?? '';
    expect(box).toContain('--cut: 0.875rem;');
    expect(box).toContain('clip-path: polygon(0 0, calc(100% - var(--cut)) 0, 100% var(--cut)');
  });

  it('the colour chips have a smaller chamfer than the default small one', () => {
    const option = /\n\.option \{[^}]*\}/.exec(read('styles.css'))?.[0] ?? '';
    expect(option).toContain('--cut-sm: 0.25rem;');
    expect(option).toContain('--shape-chamfer-sm: polygon(0 0, calc(100% - var(--cut-sm)) 0');
  });
});

describe('T-187 marks', () => {
  it('have no printed POWER or RAM label and no solid bright tiles', () => {
    expect(cards).not.toContain("content: 'POWER'");
    expect(cards).not.toContain("content: 'RAM'");
    expect(cards).not.toMatch(/\.card-meta \.cost-gem \{[^}]*background: var\(--mark-bright\)/);
  });
});
