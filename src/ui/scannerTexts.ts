import { locale } from '../locale';
import { scannerTextsEn } from './scannerTexts.en';
import { scannerTextsFi } from './scannerTexts.fi';

// The language is resolved once at startup (D-019); the English object has the same type as the Finnish one.
export type ScannerTexts = typeof scannerTextsFi;
export const scannerTexts: ScannerTexts = locale === 'en' ? scannerTextsEn : scannerTextsFi;
