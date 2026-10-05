import { LOCALES, locale, saveLocale } from '../locale';
import type { Locale } from '../locale';
import { texts } from './texts';

const FLAG_PROPS = { viewBox: '0 0 20 14', width: 20, height: 14, 'aria-hidden': true, focusable: 'false' } as const;

/** Inline flags (T-071): Finland and the United Kingdom. */
function Flag({ option }: { option: Locale }) {
  if (option === 'fi') {
    return (
      <svg {...FLAG_PROPS}>
        <rect width='20' height='14' fill='#fff' />
        <rect x='5' width='3.5' height='14' fill='#003580' />
        <rect y='5.25' width='20' height='3.5' fill='#003580' />
      </svg>
    );
  }
  return (
    <svg {...FLAG_PROPS}>
      <rect width='20' height='14' fill='#012169' />
      <path d='M0 0L20 14M20 0L0 14' stroke='#fff' strokeWidth='3' />
      <path d='M0 0L20 14M20 0L0 14' stroke='#C8102E' strokeWidth='1' />
      <path d='M10 0V14M0 7H20' stroke='#fff' strokeWidth='5' />
      <path d='M10 0V14M0 7H20' stroke='#C8102E' strokeWidth='3' />
    </svg>
  );
}

const FLAG_NAMES: Record<Locale, string> = { fi: 'Suomi', en: 'English' };

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
          aria-label={FLAG_NAMES[option]}
          aria-pressed={option === locale}
          onClick={() => choose(option)}
        >
          <Flag option={option} />
        </button>
      ))}
    </div>
  );
}
