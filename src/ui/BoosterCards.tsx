import { useEffect, useRef, useState } from 'react';
import type { BoosterCard } from '../domain/booster';
import type { Card } from '../domain/card';
import type { CardsByKey } from '../domain/deckRules';
import { getCardImage } from '../data/cardImages';
import { variantImageUrl } from '../data/variantImages';
import { CardName } from './CardName';
import { RaritySymbol } from './RaritySymbol';
import { sealedTexts as t } from './sealedTexts';

/**
 * The picture a pack card is shown with: the Iconic art when the printing is an Iconic one (the Beta art for a Beta
 * printing), else the card's own picture. null = no picture of its own.
 */
export function boosterArtUrl(entry: BoosterCard, card: Card | undefined): string | null {
  const printing = card?.printings?.find((candidate) => candidate.key === entry.printing);
  if (card === undefined || printing === undefined || printing.rarity === null || !printing.rarity.startsWith('Iconic')) return null;
  const beta = /\bBeta\b/.test(printing.setName);
  return (beta ? variantImageUrl(card.key, `${printing.rarity} Beta`) : null) ?? variantImageUrl(card.key, printing.rarity);
}

/** A card picture with a fixed shape. The image is decoration; the text around it names the card. */
export function BoosterPicture({ entry, card }: { entry: BoosterCard; card: Card }) {
  const art = boosterArtUrl(entry, card);
  const image = getCardImage(card.key);
  const src = art ?? image?.medium ?? null;
  const [failed, setFailed] = useState(false);
  if (src === null || failed) {
    return (
      <span className="booster-picture booster-picture-missing" aria-hidden="true" lang="en">
        <span>
          <CardName card={card} />
        </span>
      </span>
    );
  }
  return <img className="booster-picture" src={src} width={360} height={503} alt="" decoding="async" onError={() => setFailed(true)} />;
}

/** The frame class of a rarity group. */
export function rarityClass(rarity: string): string {
  return `rarity-${rarity.toLowerCase()}`;
}

/** The face of a revealed card: the picture in a frame of its rarity, then the rarity and the name. */
function PackFace({ entry, card, fresh }: { entry: BoosterCard; card: Card | undefined; fresh: boolean }) {
  return (
    <>
      <div className={`pack-art pack-art--face ${rarityClass(entry.rarity)}${fresh ? ' pack-art--fresh' : ''}`}>
        {card === undefined ? <span className="booster-picture booster-picture-missing">{entry.card}</span> : <BoosterPicture entry={entry} card={card} />}
      </div>
      <div className="pack-meta">
        <span className="pack-face-rarity">
          <RaritySymbol rarity={entry.rarity} showName />
        </span>
        <span className="pack-face-name">{card === undefined ? entry.card : <CardName card={card} />}</span>
      </div>
    </>
  );
}

/**
 * An opened pack that is revealed one card at a time (T-173): a tap on the next card turns it, "Paljasta kaikki" turns
 * the rest. The rarest card comes last. Every slot keeps its size, so nothing moves when a card turns, and the buttons
 * stay where they are. Give the component a new `key` for each pack.
 */
export function PackReveal({
  pack,
  cardsByKey,
  nextLabel,
  onNext,
  title,
}: {
  pack: readonly BoosterCard[];
  cardsByKey: CardsByKey;
  /** The button that goes on to the next step; enabled once every card is turned. */
  nextLabel: string;
  onNext: () => void;
  title: string;
}) {
  const [revealed, setRevealed] = useState(0);
  const nextCardRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);
  const done = revealed >= pack.length;

  // A turned card's button disappears: hand the focus to the next card, or to the next-step button.
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    (nextCardRef.current ?? nextRef.current)?.focus({ preventScroll: true });
  }, [revealed]);

  const revealNext = () => {
    moveFocus.current = true;
    setRevealed((count) => Math.min(pack.length, count + 1));
  };

  return (
    <section className="pack" aria-label={title}>
      <ul className="pack-grid">
        {pack.map((entry, index) => {
          const card = cardsByKey.get(entry.card);
          const turned = index < revealed;
          return (
            <li key={index} className="pack-slot" onClick={turned ? undefined : revealNext}>
              {turned ? (
                <PackFace entry={entry} card={card} fresh={index === revealed - 1} />
              ) : (
                <>
                  {index === revealed ? (
                    <button ref={nextCardRef} type="button" className="pack-art pack-back pack-back--next">
                      <span className="visually-hidden">{t.revealCard(index + 1, pack.length)}</span>
                      <span aria-hidden="true">{index + 1}</span>
                    </button>
                  ) : (
                    <span className="pack-art pack-back" aria-hidden="true">
                      {index + 1}
                    </span>
                  )}
                  <div className="pack-meta" aria-hidden="true" />
                </>
              )}
            </li>
          );
        })}
      </ul>
      <p className="visually-hidden" role="status" aria-live="polite">
        {t.revealedStatus(Math.min(revealed, pack.length), pack.length)}
      </p>
      <div className="pack-actions">
        <button
          type="button"
          className="button-secondary"
          disabled={done}
          onClick={() => {
            moveFocus.current = true;
            setRevealed(pack.length);
          }}
        >
          {t.revealAll}
        </button>
        <button ref={nextRef} type="button" className="button-primary" disabled={!done} onClick={onNext}>
          {nextLabel}
        </button>
        <span className="pack-progress" aria-hidden="true">
          {t.revealedStatus(Math.min(revealed, pack.length), pack.length)}
        </span>
      </div>
    </section>
  );
}
