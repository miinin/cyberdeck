import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** T-191: CSS guards (jsdom cannot paint): cost, power and RAM are plain numbers, RAM in the card colour. */
const cards = readFileSync(resolve(__dirname, 'styles/cards.css'), 'utf8');
const t191 = cards.slice(cards.indexOf('T-191'));

describe('T-191 plain numbers in the info box', () => {
  it('the marks lose their boxes, frames and shapes', () => {
    expect(t191).toContain('.card-meta .stat-chip.stat-ram dd > .stat-mark {\n  inline-size: auto;');
    expect(t191).toContain('background: none;');
    expect(t191).toContain('box-shadow: none;');
    expect(t191).toMatch(/\.card-meta \.cost-gem::before,[\s\S]*?content: none;/);
  });

  it('cost and power use the text colour, RAM the card colour of each theme', () => {
    expect(t191).toContain('color: var(--color-text);');
    expect(t191).toContain('color: var(--ram-ink);');
    for (const color of ['#ff4d5e', '#ffd400', '#39e08a', '#4d9dff', '#b0182d', '#7a5c00', '#0b6b3a', '#1a55b0']) {
      expect(t191).toContain(`--ram-ink: ${color};`);
    }
  });
});
