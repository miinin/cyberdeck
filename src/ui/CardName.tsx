import type { Card } from '../domain/card';

/** "V, Streetkid" for screen readers, with the English names marked as English (UX.md 6.4.1). */
export function CardName({ card, muteSubname = false }: { card: Card; muteSubname?: boolean }) {
  return (
    <>
      <span lang="en">{card.name}</span>
      {card.subname !== null && (
        <span className={muteSubname ? 'name-sub' : undefined}>
          , <span lang="en">{card.subname}</span>
        </span>
      )}
    </>
  );
}

/** The same name as plain text for live announcements (UX.md 6.9). */
export function cardNameText(card: Card): string {
  return card.subname === null ? card.name : `${card.name}, ${card.subname}`;
}
