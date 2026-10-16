import { locale } from '../locale';
import { sealedTextsEn } from './sealedTexts.en';
import { sealedTextsFi } from './sealedTexts.fi';

// The language is resolved once at startup (D-019); the English object has the same type as the Finnish one.
export type SealedTexts = typeof sealedTextsFi;
export const sealedTexts: SealedTexts = locale === 'en' ? sealedTextsEn : sealedTextsFi;
