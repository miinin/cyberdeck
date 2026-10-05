import { locale } from '../locale';
import { deckTextsEn } from './deckTexts.en';
import { deckTextsFi } from './deckTexts.fi';

// The language is resolved once at startup (D-019); the English object has the same type as the Finnish one.
export type DeckTexts = typeof deckTextsFi;
export const deckTexts: DeckTexts = locale === 'en' ? deckTextsEn : deckTextsFi;

export const { formatDecimal, formatPercent } = deckTexts;
