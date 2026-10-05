import { resolveLocale } from './locale';

describe('resolveLocale', () => {
  it.each([
    ['fi', 'fi'],
    ['fi-FI', 'fi'],
    ['FI', 'fi'],
    ['en-US', 'en'],
    ['sv-FI', 'en'],
    ['fil', 'en'],
    ['', 'en'],
  ] as const)('uses the browser language %j when nothing is saved: %s', (language, expected) => {
    expect(resolveLocale(null, language)).toBe(expected);
  });

  it('prefers the saved choice over the browser language', () => {
    expect(resolveLocale('en', 'fi-FI')).toBe('en');
    expect(resolveLocale('fi', 'en-US')).toBe('fi');
  });
});
