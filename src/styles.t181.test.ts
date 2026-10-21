import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T-181 package 1 (D-038): the design system rules that jsdom cannot render. These checks keep the decisions R1, R2 and R4
 * and the stylesheet order of the view packages from being undone by accident.
 */
const css = readFileSync(resolve(__dirname, 'styles.css'), 'utf8');
const main = readFileSync(resolve(__dirname, 'main.tsx'), 'utf8');

/** The declarations of the first rule whose selector is exactly `selector`. */
function rule(selector: string): string {
  const at = css.indexOf(`\n${selector} {`);
  if (at === -1) throw new Error(`No rule for ${selector}`);
  const open = css.indexOf('{', at);
  return css.slice(open + 1, css.indexOf('}', open));
}

describe('T-181 design system', () => {
  it('R1: controls are 40 px with a mouse and 44 px on touch', () => {
    expect(rule(':root')).toMatch(/--control-h:\s*2\.5rem/);
    expect(css).toMatch(/@media \(pointer: coarse\) \{\s*:root \{\s*--control-h:\s*2\.75rem;\s*--target-min:\s*2\.75rem;/);
  });

  it('R2: running text stays at least 16 px; labels are 14 px', () => {
    const root = rule(':root');
    expect(root).toMatch(/--font-size-sm:\s*1rem/);
    expect(root).toMatch(/--font-size-control:\s*1rem/);
    expect(root).toMatch(/--font-size-label:\s*0\.875rem/);
  });

  it('keeps the old token names as aliases of the new surfaces', () => {
    const root = rule(':root');
    expect(root).toMatch(/--color-surface:\s*var\(--surface-1\)/);
    expect(root).toMatch(/--color-surface-raised:\s*var\(--surface-2\)/);
    expect(root).toMatch(/--color-border:\s*var\(--line\)/);
  });

  it('a section is open (no box) and the object is the one box', () => {
    const panel = rule('.panel');
    expect(panel).toMatch(/border:\s*0/);
    expect(panel).toMatch(/background:\s*none/);
    expect(rule('.object')).toMatch(/clip-path:\s*var\(--shape-object\)/);
  });

  it('has the quiet tool button, the small segment size and the small button size', () => {
    expect(rule('.button-quiet')).toMatch(/border:\s*0/);
    expect(css).toMatch(/\.segmented--sm \.segmented-option \{[^}]*var\(--control-h-sm\)/);
    expect(rule('.button--sm')).toMatch(/var\(--control-h-sm\)/);
  });

  it('T-190: the phone navigation is a fixed bottom tab bar of five slots', () => {
    expect(css).toMatch(/\.main-nav \{\s*position:\s*fixed;[^}]*display:\s*grid;\s*grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/);
    expect(css).toMatch(/--bottom-nav-h:\s*calc\(3\.5rem \+ env\(safe-area-inset-bottom/);
  });

  it('the motion tokens stay at most 150 ms', () => {
    expect(rule(':root')).toMatch(/--ease:\s*0\.12s/);
    expect(rule(':root')).toMatch(/--ease-lift:\s*0\.15s/);
  });

  it('loads the view stylesheets after styles.css in the agreed order', () => {
    const order = ['styles.css', 'cards', 'collection', 'decks', 'editor', 'playtest', 'havewant', 'proxy', 'premium'].map((name) =>
      main.indexOf(name === 'styles.css' ? "import './styles.css'" : `import './styles/${name}.css'`),
    );
    expect(order.every((at) => at !== -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});
