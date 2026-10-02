/*
 * public/theme-init.js runs before the app bundle, so it repeats the theme key instead of importing it
 * (UX.md 8.7, T-025 A1). These tests keep the copy in sync and check that it only reads.
 */
import themeInitSource from '../../public/theme-init.js?raw';
import { THEME_KEY } from './keys';

function runThemeInit() {
  // The source is a file from this repository, not external input. It is run as the browser would run it.
  // eslint-disable-next-line no-new-func
  new Function(themeInitSource)();
}

// The static default of index.html; src/test/setup.ts removes the attribute after each test.
beforeEach(() => {
  document.documentElement.setAttribute('data-theme', 'dark');
});

describe('public/theme-init.js', () => {
  it('uses the same key as the storage layer and compares only with the value light', () => {
    expect(themeInitSource).toContain(`getItem('${THEME_KEY}') === 'light'`);
    expect(themeInitSource.match(/cyberdeck:[\w:-]*/g)).toEqual([THEME_KEY]);
  });

  it('never writes to storage', () => {
    expect(themeInitSource).not.toMatch(/setItem|removeItem|clear\(|sessionStorage|indexedDB|cookie/);
  });

  it('sets the light theme when light is saved', () => {
    localStorage.setItem(THEME_KEY, 'light');
    runThemeInit();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it.each([null, 'dark', 'LIGHT', '<script>'])('keeps the dark default when the saved value is %j', (raw) => {
    if (raw !== null) localStorage.setItem(THEME_KEY, raw);
    runThemeInit();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('keeps the dark default and does not throw when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(runThemeInit).not.toThrow();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});
