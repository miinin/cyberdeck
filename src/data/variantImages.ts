/*
 * Official art of a card's rarity (T-076): src/assets/cards/variants/<card key>__<rarity slug>.webp, written by
 * `npm run cards:images`. One picture covers every printing of the card with that rarity. Like cardImages.ts,
 * Vite hashes the URLs, so the bundle holds only these strings and a missing picture never causes a request.
 */
const urls = import.meta.glob<string>('../assets/cards/variants/*.webp', { eager: true, query: '?url', import: 'default' });

const byArtId = new Map<string, string>(
  Object.entries(urls).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.webp'.length), url]),
);

/** "Nova Rare" -> "nova-rare": lower case, every run of other characters becomes one dash. */
export function raritySlug(rarity: string): string {
  return rarity.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** The URL of the art for a card's rarity, or null when there is none. */
export function variantImageUrl(cardKey: string, rarity: string | null): string | null {
  if (rarity === null) return null;
  return byArtId.get(`${cardKey}__${raritySlug(rarity)}`) ?? null;
}
