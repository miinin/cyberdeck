import { LOCALE_KEY } from './keys';
import { openBrowserStore } from './keyValueStore';

/** UI language (T-068, D-019). Stored as the raw string, no envelope; not personal data and never synced. */
export type Locale = 'fi' | 'en';

export const LOCALES: readonly Locale[] = ['fi', 'en'];

/** The saved language, or null when nothing valid is saved or the storage is blocked. Synchronous on purpose. */
export function readStoredLocale(): Locale | null {
  const raw = openBrowserStore()?.getItem(LOCALE_KEY) ?? null;
  return raw === 'fi' || raw === 'en' ? raw : null;
}

/** Saves the language. Returns false when the storage refuses, so the caller can skip the reload. */
export function saveStoredLocale(locale: Locale): boolean {
  const store = openBrowserStore();
  if (store === null) return false;
  try {
    store.setItem(LOCALE_KEY, locale);
    return true;
  } catch {
    return false;
  }
}
