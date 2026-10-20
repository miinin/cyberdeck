import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T-181 package 2 (B.1, B.2): the sizes of the card grid and the card dialog that jsdom cannot measure. The measurements were
 * taken in headless Chrome; these checks keep the numbers that carry them from being changed by accident.
 */
const cards = readFileSync(resolve(__dirname, 'styles/cards.css'), 'utf8');
const base = readFileSync(resolve(__dirname, 'styles.css'), 'utf8');

/** The declarations of the first rule in cards.css whose selector is exactly `selector`. */
function rule(selector: string): string {
  const at = cards.indexOf(`\n${selector} {`);
  if (at === -1) throw new Error(`No rule for ${selector}`);
  const open = cards.indexOf('{', at);
  return cards.slice(open + 1, cards.indexOf('}', open));
}

describe('T-181 cards (package 2)', () => {
  it('the card and its data are one info box (T-185): the old box rules are gone from styles.css, the name plate is 40 px', () => {
    expect(base).not.toMatch(/\n\.card-box \{/);
    expect(rule('.card-box')).toMatch(/clip-path:\s*var\(--shape-chamfer\)/);
    expect(rule('.card-box')).toMatch(/background:/);
    expect(rule('.card-strip')).toMatch(/min-block-size:\s*2\.5rem/);
  });

  it('the sizes (12, 16 and 22 rem) give three Normal boxes at 1280 px, five at 1920 px, and two on the narrowest phones (Large: one)', () => {
    expect(cards).toMatch(/\[data-image-size='medium'\] \.card-grid[^{]*\{\s*--card-min:\s*16rem/);
    expect(cards).toMatch(/\[data-image-size='small'\] \.card-grid[^{]*\{\s*--card-min:\s*12rem/);
    expect(cards).toMatch(/\[data-image-size='large'\] \.card-grid[^{]*\{\s*--card-min:\s*22rem/);
    expect(cards).toMatch(/@media \(max-width: 29\.99rem\) \{\s*\.card-grid \{\s*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
    expect(cards).toMatch(/\[data-image-size='large'\] \.card-grid,[^{]*\{\s*grid-template-columns:\s*minmax\(0, 1fr\)/);
  });

  it('the name and the subname are each one line with an ellipsis, and the subname is never hidden', () => {
    const lines = rule('.card-name > [lang],\n.card-name > .card-subname');
    expect(lines).toMatch(/white-space:\s*nowrap/);
    expect(lines).toMatch(/text-overflow:\s*ellipsis/);
    expect(rule('.card-box .card-subname')).not.toMatch(/clip-path|position:\s*absolute|display:\s*none/);
  });

  it('the filter side panel is 16 rem and sticky is not used', () => {
    expect(cards).toMatch(/grid-template-columns:\s*16rem minmax\(0, 1fr\)/);
    expect(rule('.catalog-filters')).not.toMatch(/sticky/);
  });

  it('a list row is 44 px high', () => {
    expect(cards).toMatch(/\.card-table tbody th,\s*\.card-table tbody td \{\s*block-size:\s*2\.75rem/);
  });

  it('the marking bar is 56 px with a 2 px line in the section colour', () => {
    const bar = rule('.mark-banner');
    expect(bar).toMatch(/min-block-size:\s*3\.5rem/);
    expect(bar).toMatch(/border-block-start:\s*2px solid var\(--section-accent\)/);
    expect(bar).toMatch(/background:\s*var\(--surface-3\)/);
  });

  it('the dialog is 72 rem wide from 40 rem, the picture never taller than the screen, and Versions is closed', () => {
    expect(cards).toMatch(/width:\s*min\(72rem, 100%\)/);
    expect(cards).toMatch(/max-block-size:\s*min\(calc\(100dvh - 4rem\), 46rem\)/);
    const versions = readFileSync(resolve(__dirname, 'ui/CardVersions.tsx'), 'utf8');
    expect(versions).toMatch(/<details className="disclosure">/);
    expect(versions).not.toMatch(/<details className="disclosure" open/);
  });

  it('adds no animation', () => {
    expect(cards).not.toMatch(/@keyframes|animation:|transition:/);
  });
});
