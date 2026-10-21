import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** T-189: CSS guards (jsdom cannot paint): the data rows follow the width of the box, the cost frame is broken at the corners. */
const cards = readFileSync(resolve(__dirname, 'styles/cards.css'), 'utf8');
const rule = (sel: string) => {
  const start = cards.indexOf(sel + ' {');
  return start < 0 ? '' : cards.slice(start, cards.indexOf('}', start) + 1);
};

describe('T-189 info box', () => {
  it('the box is a size container and the meta rows are a three-column grid', () => {
    expect(rule('.card-box')).toContain('container-type: inline-size;');
    expect(rule('.card-meta')).toContain('grid-template-columns: repeat(3, minmax(0, 1fr));');
    expect(cards).toMatch(/@container \(max-width: [\d.]+rem\)/);
  });

  it('the marks keep digits of at least 0.875rem in the narrow box', () => {
    const narrow = /@container \(max-width[^{]*\{([\s\S]*?)\n\}\n/.exec(cards)?.[1] ?? '';
    const sizes = [...narrow.matchAll(/font-size: ([\d.]+)rem/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(0);
    for (const s of sizes) expect(s).toBeGreaterThanOrEqual(0.875);
  });

  it('the cost frame has a line in the middle of each side and nothing in the corners', () => {
    const before = rule('.card-meta .cost-gem::before');
    expect(before).toContain('top center');
    expect(before).toContain('bottom center');
    expect(before).toContain('center left');
    expect(before).toContain('center right');
    expect(before).not.toMatch(/top left|top right|bottom left|bottom right/);
  });
});
