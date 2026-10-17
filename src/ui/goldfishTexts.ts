import { locale } from '../locale';
import { goldfishTextsEn } from './goldfishTexts.en';
import { goldfishTextsFi } from './goldfishTexts.fi';

// The language is resolved once at startup (D-019); the English object has the same type as the Finnish one.
export type GoldfishTexts = typeof goldfishTextsFi;
export const goldfishTexts: GoldfishTexts = locale === 'en' ? goldfishTextsEn : goldfishTextsFi;
