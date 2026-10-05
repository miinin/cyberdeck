/** One page of GET /api/cards/cyberpunk after shape validation. Items stay unknown until mapCard. */
export interface NetdeckPage {
  items: unknown[];
  total: number;
  limit: number;
  offset: number;
}

/** Fields of a raw Netdeck.gg card that the app reads (all others are ignored). */
export interface NetdeckCardFields {
  id: unknown;
  slug: unknown;
  name: unknown;
  subname: unknown;
  canonical_name: unknown;
  card_type: unknown;
  color: unknown;
  cost: unknown;
  power: unknown;
  ram: unknown;
  rarity: unknown;
  is_eddiable: unknown;
  printings: unknown;
}
