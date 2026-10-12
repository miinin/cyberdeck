import type { CardKey } from './cardKey';
import type { Printing } from './printing';

/** The app's own card model. Independent of Netdeck.gg field names. */
export interface Card {
  /** Unique id from the data source (Netdeck UUID). */
  id: string;
  /** Readable unique key from the data source, e.g. "v-streetkid". Not used in stored data. */
  slug: string;
  /** "V" */
  name: string;
  /** "Streetkid", or null when the card has no subname. */
  subname: string | null;
  /** "V — Streetkid" (unique). */
  displayName: string;
  /** "Legend" | "Unit" | "Gear" | "Program". A plain string so a new type does not break the app. */
  type: string;
  /** "Red" | "Yellow" | "Green" | "Blue", or null. */
  color: string | null;
  /** In-game cost, or null when the card has none. */
  cost: number | null;
  /** Power, or null when the card has none. */
  power: number | null;
  /** RAM, or null when the card has none. */
  ram: number | null;
  /** "Common", "Rare" and so on (first printing), or null when unknown. A plain string so a new rarity does not break the app. */
  rarity: string | null;
  /** Netdeck's "is_eddiable": the card can be sold for eddies (€$). null = unknown. Always set in the bundled data; test cards may omit it. */
  eddiable?: boolean | null;
  /** Netdeck's "classifications" (T-151): the tags printed on the card, e.g. Arasaka, Merc, Netrunner. Test cards may omit them. */
  tags?: readonly string[];
  /** The app's own key, cardKey(name, subname). Collections and decks refer to cards only by this (D-008). */
  key: CardKey;
  /** All printings (versions) of the card, in source order (D-020). Always set in the bundled data; test cards may omit it. */
  printings?: Printing[];
}

/** Copies that make a full playset: 1 for Legend cards, 3 for every other type. */
export function playsetSize(card: Pick<Card, 'type'>): number {
  return card.type === 'Legend' ? 1 : 3;
}
