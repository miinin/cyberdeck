import { deckMessagesEn, deckMessagesFi, setDeckMessages } from '../domain/deckMessages';
import { locale } from '../locale';
import { textsEn } from './texts.en';
import { textsFi } from './texts.fi';

// The language is resolved once at startup (D-019); the English object has the same type as the Finnish one.
export type Texts = typeof textsFi;
export const texts: Texts = locale === 'en' ? textsEn : textsFi;

// Rule explanations come from the domain layer, which has no language of its own.
setDeckMessages(locale === 'en' ? deckMessagesEn : deckMessagesFi);

export const { cardCount, copiesSuffix } = texts;

/** Card color names. The API values are shown as such in both languages (UX.md 5.2, K6). */
export const colorNames: ReadonlyMap<string, string> = new Map([
  ['Red', 'Red'],
  ['Yellow', 'Yellow'],
  ['Green', 'Green'],
  ['Blue', 'Blue'],
]);
