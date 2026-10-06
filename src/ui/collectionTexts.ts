import { locale } from '../locale';
import { collectionTextsEn } from './collectionTexts.en';
import { collectionTextsFi } from './collectionTexts.fi';

// The language is resolved once at startup (D-019); the English object has the same type as the Finnish one.
export type CollectionTexts = typeof collectionTextsFi;
export const collectionTexts: CollectionTexts = locale === 'en' ? collectionTextsEn : collectionTextsFi;
