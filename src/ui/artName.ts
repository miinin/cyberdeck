import { isBaseArt, isBetaArt } from '../domain/arts';
import type { Art } from '../domain/arts';
import { officialRarity } from '../domain/cardSearch';
import { texts } from './texts';

/** The name of an art (D-021, T-148): "Perus", "Toinen kuvitus" for an alternate base art, else the official rarity (Beta marked). */
export function artName(art: Art): string {
  if (isBaseArt(art)) return texts.artBase;
  if (art.rarity === null) return texts.artAlt;
  return isBetaArt(art) ? `${officialRarity(art.rarity)} (Beta)` : officialRarity(art.rarity);
}
