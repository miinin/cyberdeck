import { useEffect, useState } from 'react';
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

/** The time between two cards turning when a pack opens (T-176). */
const TURN_STEP_MS = 70;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * How many cards of an opened pack are turned (T-176). A new pack turns by itself, one card after the other in a short
 * animation; with reduced motion the whole pack is turned at once. null = no pack open, nothing turned.
 */
export function useRevealProgress(pack: readonly BoosterCard[] | null): number {
  const [state, setState] = useState<{ pack: readonly BoosterCard[] | null; revealed: number }>({ pack, revealed: 0 });
  // A new pack starts again from zero (adjusted while rendering, so no frame shows the old count with the new pack).
  let revealed = state.revealed;
  if (state.pack !== pack) {
    revealed = pack !== null && prefersReducedMotion() ? pack.length : 0;
    setState({ pack, revealed });
  }
  useEffect(() => {
    if (pack === null || revealed >= pack.length) return;
    const timer = window.setTimeout(() => setState({ pack, revealed: revealed + 1 }), TURN_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [pack, revealed]);
  return pack === null ? 0 : Math.min(revealed, pack.length);
}

/**
 * A sealed pack as an object (T-181 package 5a): a chamfered box with the set name, the number of the pack and corner marks.
 * It stands where the cards will appear, so there are no empty slots before a pack is opened. Decorative: the heading and
 * the button around it say the same.
 */
export function ClosedPack({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="pack-closed" aria-hidden="true">
      <span className="pack-closed-corner pack-closed-corner--tl">CD</span>
      <span className="pack-closed-corner pack-closed-corner--br">TCG</span>
      <span className="pack-closed-title">
        {title}
      </span>
      <span className="pack-closed-sub">{sub}</span>
    </div>
  );
}

/**
 * The cards of a pack in their slots (T-176). Every slot keeps its size whether it is face down or turned, so nothing
 * moves when a card turns. `pack` null = the pack is still closed: `closed` stands in its place (T-181 package 5a).
 */
export function PackGrid({
  pack,
  slots,
  revealed,
  cardsByKey,
  title,
  closed,
}: {
  pack: readonly BoosterCard[] | null;
  slots: number;
  revealed: number;
  cardsByKey: CardsByKey;
  title: string;
  /** The heading and the number shown on the closed pack. */
  closed: { title: string; sub: string };
}) {
  const done = pack !== null && revealed >= pack.length;
  if (pack === null) {
    return (
      <section className="pack" aria-label={title}>
        <ClosedPack title={closed.title} sub={closed.sub} />
      </section>
    );
  }
  return (
    <section className="pack" aria-label={title}>
      <ul className="pack-grid">
        {Array.from({ length: slots }, (_, index) => {
          const entry = pack[index];
          if (entry !== undefined && index < revealed) {
            return (
              <li key={index} className="pack-slot">
                <PackFace entry={entry} card={cardsByKey.get(entry.card)} fresh={index === revealed - 1} />
              </li>
            );
          }
          return (
            <li key={index} className="pack-slot">
              <span className="pack-art pack-back" aria-hidden="true">
                {index + 1}
              </span>
              <div className="pack-meta" aria-hidden="true" />
            </li>
          );
        })}
      </ul>
      {/* Said once the whole pack is turned, not for every card. */}
      <p className="visually-hidden" role="status" aria-live="polite">
        {done ? t.revealedStatus(pack.length, pack.length) : ''}
      </p>
    </section>
  );
}
