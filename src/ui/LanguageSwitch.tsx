import { LOCALES, locale, saveLocale } from '../locale';
import type { Locale } from '../locale';
import { texts } from './texts';

/** Reloads the page; the hash route survives. A separate function so tests can replace it. */
export const languageActions = {
  reload: () => window.location.reload(),
};

/**
 * Language switcher in the header (T-068, D-019): "FI / EN" as a group of toggle buttons. The language
 * is resolved once at startup, so choosing the other one saves it and reloads the page.
 */
export function LanguageSwitch() {
  function choose(next: Locale) {
    if (next === locale) return;
    // A refused save would make the reload land back in the old language, so skip the reload then.
    if (saveLocale(next)) languageActions.reload();
  }

  return (
    <div className="language-switch" role="group" aria-label={texts.languageLabel}>
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          className="theme-toggle"
          lang={option}
          aria-pressed={option === locale}
          onClick={() => choose(option)}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
