import type { ReactNode } from 'react';
import type { Card } from '../domain/card';
import { CardColor } from './CardColor';
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
}

/** Owned-box highlight (UX.md 7.5): only when the collection is ready and the count is above zero. */
function isOwned(card: Card, owned: OwnedColumn | undefined): boolean {
  return owned?.mode === 'ready' && owned.countOf(card) > 0;
}

/** One game value (cost, power, RAM). A missing value shows a dash and a hidden spoken equivalent. */
function Stat({ label, value, missing }: { label: string; value: number | null; missing: string }) {
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
        <li key={card.id} className={isOwned(card, owned) ? 'card-box is-owned' : 'card-box'}>
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
            <span lang="en">{card.type}</span>
            <span className="visually-hidden">, </span>
            <span className="separator" aria-hidden="true">
              {' · '}
            </span>
            <span className="card-color">
              <CardColor color={card.color} />
            </span>
          </p>
          <dl className="card-stats">
            <Stat label={texts.columnCost} value={card.cost} missing={texts.noCost} />
            <Stat label={texts.columnPower} value={card.power} missing={texts.noPower} />
            <Stat label={texts.columnRam} value={card.ram} missing={texts.noRam} />
          </dl>
          {owned !== undefined && (
            <div className="card-collection">
              <CountControl
                card={card}
                count={owned.countOf(card)}
                mode={owned.mode}
                onChange={owned.onChange}
                onLimit={owned.onLimit}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
