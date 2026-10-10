import type { Card } from '../domain/card';
import { officialRarity } from '../domain/cardSearch';
import { getCardImage } from '../data/cardImages';
import { cardNameText } from './CardName';
import type { CardListItem } from './CardList';
import { texts } from './texts';

/** One picture of the gallery (T-123): a card, or in the "all arts" mode one art of a card. */
export interface GalleryItem {
  id: string;
  card: Card;
  /** The biggest picture (lg), or null when the card has none. */
  src: string | null;
  /** Spoken name: the card, and the version when it is one. */
  label: string;
  /** Picture of a special art, or null for the card's own picture (what the details dialog shows first). */
  artUrl: string | null;
  /** Name of the version when the item is one art of a card, else null. */
  version: string | null;
}

/** The gallery shows the same cards, in the same order, as the grid (filters, search, order, all arts). */
export function galleryItemsOf(items: readonly CardListItem[]): GalleryItem[] {
  return items.map((item) => {
    const version = item.art === null ? null : item.art.rarity === null ? texts.artBase : officialRarity(item.art.rarity);
    const name = cardNameText(item.card);
    return {
      id: item.art === null ? item.card.id : item.art.artId,
      card: item.card,
      src: item.imageUrl ?? getCardImage(item.card.key)?.large ?? null,
      artUrl: item.imageUrl,
      label: version === null ? name : `${name} – ${version}`,
      version,
    };
  });
}
