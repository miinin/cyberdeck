import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T-174: layout and colour fixes that jsdom cannot measure. The measurements (getBoundingClientRect, contrast) were taken in
 * headless Chrome; these checks only keep the rules that carry the fixes from being removed or weakened by accident.
 */
const css = readFileSync(resolve(__dirname, 'styles.css'), 'utf8');

/** The declarations of the first rule that starts with `selector` (alone, or last in a selector list). */
function rule(selector: string): string {
  for (const marker of [`
${selector} {`, `
${selector},`]) {
    const at = css.indexOf(marker);
    if (at === -1) continue;
    const open = css.indexOf("{", at);
    return css.slice(open + 1, css.indexOf("}", open));
  }
  throw new Error(`No rule for ${selector}`);
}

describe('T-174 style rules', () => {
  it('UX-02: the export menu panel is anchored to the right edge and never wider than the screen', () => {
    const panel = rule('.export-menu-panel');
    expect(panel).toMatch(/inset-inline-end:\s*0/);
    expect(panel).not.toMatch(/inset-inline-start/);
    expect(panel).toMatch(/max-inline-size:\s*calc\(100vw/);
  });

  it('UX-11: the Yellow bar of the collection overview keeps its colour in the light theme', () => {
    const bar = rule(":root[data-theme='light'] .progress-row.progress-color.type-badge-yellow");
    expect(bar).toMatch(/--bar:\s*var\(--color-card-yellow\)/);
  });

  it('UX-10: earned badges use a darker ink for the title and stamp in the light theme', () => {
    expect(rule(":root[data-theme='light'] .badge")).toMatch(/--badge-ink:\s*color-mix\(.*#000\)/);
    expect(rule('.badge.is-done .badge-title')).toMatch(/var\(--badge-ink/);
  });

  it('UX-06: the proxy bar text may wrap', () => {
    expect(rule('.deck-bar.proxy-screen .deck-bar-part')).toMatch(/white-space:\s*normal/);
  });

  it('UX-12: the binder cover has no border (it made the cover narrower than a page)', () => {
    expect(rule('.binder-cover')).not.toMatch(/^\s*border:/m);
  });

  it('UX-22: the filter groups are aligned to the start of their row', () => {
    expect(css).toMatch(/\.card-filters \.fieldsets \{[^}]*align-items:\s*flex-start/);
  });

  it('UX-14: the secondary button hover takes the section colour, lifts, and has no underline or cyan', () => {
    const hover = rule('.button-secondary:hover');
    expect(hover).toMatch(/translateY\(-1px\)/);
    expect(hover).not.toMatch(/underline|--color-info/);
    expect(rule('.tile-action:hover')).not.toMatch(/underline|--color-info/);
  });

  it('UX-15: the primary hover is clearly darker in the light theme', () => {
    expect(css).toMatch(/--color-accent-hover:\s*color-mix\(in srgb, var\(--color-accent\) 62%, #000\)/);
  });

  it('UX-16: every segmented option shows the accent bar on hover', () => {
    expect(rule('.segmented-option:hover')).toMatch(/box-shadow:\s*inset 0 -3px 0 color-mix/);
  });

  it('UX-13: the control of a card box is always in the right column of the foot', () => {
    expect(rule('.card-foot')).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\) auto/);
    expect(rule('.card-collection')).toMatch(/grid-column:\s*2/);
  });

  it('UX-24: a note line is reserved in every search result', () => {
    expect(rule('.pick-notes')).toMatch(/min-block-size/);
  });
});
