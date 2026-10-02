import type { ReactNode } from 'react';
import { playsetSize } from '../domain/card';
import type { Card } from '../domain/card';
import { CardColor, typeBadgeClass } from './CardColor';
import { CardImage } from './CardImage';
import { CountControl } from './CountControl';
import type { CountControlMode } from './CountControl';
import { texts } from './texts';

/** The collection part of each box. Left out when the collection could not be read. */
export interface OwnedColumn {
  mode: CountControlMode;
  countOf: (card: Card) => number;
  onChange: (card: Card, count: number) => void;
  onLimit: (card: Card) => void;
  /** The "Muokkaa kokoelmaa" switch (T-040): false hides the − and + buttons. */
  editable: boolean;
}

/** Box state (UX.md 7.5): only when the collection is ready; a 1 px edge colour, never a size change. */
export function collectionState(card: Card, owned: OwnedColumn | undefined): string {
  if (owned?.mode !== 'ready') return '';
  const count = owned.countOf(card);
  if (count >= playsetSize(card)) return 'is-owned is-playset';
  return count > 0 ? 'is-owned' : '';
}

/** One game value (cost, power, RAM). A missing value shows a dash and a hidden spoken equivalent. */
function Stat({ label, value, missing }: { label: string; value: number | string | null; missing: string }) {
  let shown: ReactNode = value;
  if (value === null) {
    shown = (
      <>
        <span aria-hidden="true">{texts.missingValue}</span>
        <span className="visually-hidden">{missing}</span>
      </>
    );
  }
  return (
    <div className="card-stat">
      <dt>{label}</dt>
      <dd>{shown}</dd>
    </div>
  );
}

/**
 * Card grid (T-034): one box per card with the image, name, type and color, the game values and the
 * collection control. All values are rendered as React text nodes, never as HTML (SR-1).
 * `caption` names the list for screen readers ("Kaikki kortit" / "Hakua vastaavat kortit").
 */
export function CardList({
  cards,
  caption = texts.tableCaption,
  owned,
  onOpenImage,
}: {
  cards: readonly Card[];
  caption?: string;
  owned?: OwnedColumn;
  /** Opens the enlarged image (T-027 UX); the button is where focus returns. */
  onOpenImage: (card: Card, opener: HTMLButtonElement) => void;
}) {
  return (
    <ul className="card-grid" aria-label={caption}>
      {cards.map((card) => (
        <li key={card.id} className={'card-box ' + collectionState(card, owned)}>
          <CardImage card={card} onOpen={onOpenImage} />
          <h3 className="card-name">
            <span lang="en">{card.name}</span>
            {card.subname !== null && (
              <>
                <span className="visually-hidden">, </span>
                <span className="card-subname" lang="en">
                  {card.subname}
                </span>
              </>
            )}
          </h3>
          <p className="card-type">
            <span className={typeBadgeClass(card.color)} lang="en" title={card.color ?? undefined}>
              {card.type}
            </span>
            <span className="visually-hidden">
              , <CardColor color={card.color} />
            </span>
          </p>
          <dl className="card-stats">
            <Stat label={texts.columnCost} value={card.cost} missing={texts.noCost} />
            <Stat label={texts.columnPower} value={card.power} missing={texts.noPower} />
            <Stat label={texts.columnRam} value={card.ram} missing={texts.noRam} />
            <Stat label={texts.columnRarity} value={card.rarity} missing={texts.noRarity} />
          </dl>
          {owned !== undefined && (
            <div className="card-collection">
              <CountControl
                card={card}
                count={owned.countOf(card)}
                mode={owned.mode}
                onChange={owned.onChange}
                onLimit={owned.onLimit}
                editable={owned.editable}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
