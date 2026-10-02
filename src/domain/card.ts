import type { CardKey } from './cardKey';

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
  /** The app's own key, cardKey(name, subname). Collections and decks refer to cards only by this (D-008). */
  key: CardKey;
}
