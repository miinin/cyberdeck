import { LOCALES, readStoredLocale, saveStoredLocale } from './storage';
import type { Locale } from './storage';

/** UI language (T-068, D-019). Resolved once at startup; changing it reloads the page. */
export { LOCALES };
export type { Locale };

/** Saved choice first, then the browser language (`fi*` is Finnish), otherwise English. */
export function resolveLocale(stored: Locale | null, browserLanguage: string): Locale {
  if (stored !== null) return stored;
  return /^fi(-|_|$)/i.test(browserLanguage) ? 'fi' : 'en';
}

function browserLanguage(): string {
  try {
    return typeof navigator.language === 'string' ? navigator.language : '';
  } catch {
    return '';
  }
}

/** Saves the choice. Returns false when the storage refuses. */
export function saveLocale(next: Locale): boolean {
  return saveStoredLocale(next);
}

export const locale: Locale = resolveLocale(readStoredLocale(), browserLanguage());

/** BCP 47 tag for Intl formatters (dates, numbers). */
export const intlLocale: string = locale === 'en' ? 'en-GB' : 'fi-FI';

if (typeof document !== 'undefined') {
  document.documentElement.lang = locale;
}
