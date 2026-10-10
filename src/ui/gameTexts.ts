import { locale } from '../locale';
import { gameTextsEn } from './gameTexts.en';
import { gameTextsFi } from './gameTexts.fi';

// The language is resolved once at startup (D-019); the English object has the same type as the Finnish one.
export type GameTexts = typeof gameTextsFi;
export const gameTexts: GameTexts = locale === 'en' ? gameTextsEn : gameTextsFi;
