import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** T-188: CSS guards (jsdom cannot paint): the select keeps the diagonal edge, the dialog veil has no blur, the marks have labels, the list type has the card colour. */
const read = (f: string) => readFileSync(resolve(__dirname, f), 'utf8');
const styles = read('styles.css');
const cards = read('styles/cards.css');

describe('T-188 CSS', () => {
  it('no select rule replaces the field background (it holds the diagonal edge line)', () => {
    const rules = styles.match(/[^{}]*select[^{}]*\{[^}]*\}/g) ?? [];
    const offenders = rules.filter((r) => /^\s*[^{]*\bselect\b[^{]*\{/.test(r) && /\n\s*background:/.test(r) && !r.includes('user-select') && !/\.segmented|\.view-select|is-selected|:where\(/.test(r.split('{')[0] ?? ''));
    expect(offenders).toEqual([]);
  });

  it('the dialog veil is flat: no backdrop-filter on a dialog backdrop', () => {
    const veil = /\.test-hand-dialog::backdrop \{[^}]*\}/.exec(styles)?.[0] ?? '';
    expect(veil).toContain('background:');
    expect(veil).not.toMatch(/(^|[^/*])backdrop-filter:/m);
  });

  it('Cost, Power and RAM show a label beside the mark, and the list type word takes the card colour', () => {
    expect(cards).toMatch(/\.card-cost dt,\s*\.stat-chip dt \{[^}]*text-transform: uppercase/);
    expect(cards).not.toMatch(/\.stat-chip dt \{[^}]*clip-path/);
    for (const colour of ['red', 'yellow', 'green', 'blue']) {
      expect(cards).toContain(`.card-table .cell-type .type-badge-${colour} {`);
      expect(cards).toContain(`:root[data-theme='light'] .card-table .cell-type .type-badge-${colour} {`);
    }
  });
});
