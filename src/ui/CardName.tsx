import type { Card } from '../domain/card';

/** "V, Streetkid" for screen readers, with the English names marked as English (UX.md 6.4.1). */
export function CardName({ card }: { card: Card }) {
  return (
    <>
      <span lang="en">{card.name}</span>
      {card.subname !== null && (
        <>
          , <span lang="en">{card.subname}</span>
        </>
      )}
    </>
  );
}

/** The same name as plain text for live announcements (UX.md 6.9). */
export function cardNameText(card: Card): string {
  return card.subname === null ? card.name : `${card.name}, ${card.subname}`;
}
