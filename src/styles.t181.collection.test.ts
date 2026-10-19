import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T-181 package 3: the Collection rules that jsdom cannot render (measured in headless Chrome, see the task card). These
 * checks keep the agreed sizes from being undone by accident.
 */
const css = readFileSync(resolve(__dirname, 'styles/collection.css'), 'utf8');
const old = readFileSync(resolve(__dirname, 'styles.css'), 'utf8');

/** The declarations of the last rule whose selector is exactly `selector`. */
function rule(selector: string): string {
  const at = css.lastIndexOf(`\n${selector} {`);
  if (at === -1) throw new Error(`No rule for ${selector}`);
  const open = css.indexOf('{', at);
  return css.slice(open + 1, css.indexOf('}', open));
}

describe('T-181 Collection', () => {
  it('the overview rows are 28 px high with a 6 px bar', () => {
    expect(rule('.progress-row')).toMatch(/min-block-size:\s*28px/);
    expect(rule('.progress-bar')).toMatch(/block-size:\s*6px/);
  });

  it('the overview meters are mono 1.75rem and the ring is 96 px', () => {
    expect(rule('.coll-meter-value')).toMatch(/font-size:\s*1\.75rem/);
    expect(rule('.coll-band .ring--big')).toMatch(/inline-size:\s*6rem/);
  });

  it('an earned achievement is a 32 px chip', () => {
    expect(rule('.badge-grid--earned .badge')).toMatch(/min-block-size:\s*32px/);
  });

  it('the binder spread is sized to the screen height and the page turn buttons sit at its edges', () => {
    expect(css).toMatch(/--binder-page-fit:\s*calc\(\(100dvh - var\(--binder-chrome\)\)/);
    expect(css).toMatch(/\.binder-stage \{[^}]*grid-template-areas:\s*'prev book next'/);
  });

  it('the empty collection is one compact object, at most 44 rem wide', () => {
    expect(rule('.empty--collection')).toMatch(/max-inline-size:\s*44rem/);
  });

  it('the old Collection rules are gone from styles.css', () => {
    expect(old).not.toMatch(/\n\.(progress-row|badge|binder-book|scanner-body|pocket) \{/);
  });

  it('nothing in the Collection moves outside prefers-reduced-motion: no-preference', () => {
    const outside = css.replace(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}\n/g, '');
    expect(outside).not.toMatch(/\b(transition|animation)\s*:/);
  });
});
