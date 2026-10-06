import { locale } from '../locale';
import { proxyTextsEn } from './proxyTexts.en';
import { proxyTextsFi } from './proxyTexts.fi';

// The language is resolved once at startup (D-019); the English object has the same type as the Finnish one.
export type ProxyTexts = typeof proxyTextsFi;
export const proxyTexts: ProxyTexts = locale === 'en' ? proxyTextsEn : proxyTextsFi;
