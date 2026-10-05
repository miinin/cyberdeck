import type { ReactNode } from 'react';
import { playsetSize } from '../domain/card';
import type { Card } from '../domain/card';
import { CardColor, typeBadgeClass } from './CardColor';
import { CardImage } from './CardImage';
import { CostGem } from './DeckPickTable';
import { CountControl } from './CountControl';
import type { CountControlMode } from './CountControl';
import { CardDecks } from './CardDecks';
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
function Stat({
  label,
  value,
  missing,
  className = '',
  hideLabel = false,
  children,
}: {
  label: string;
  value: number | string | null;
  missing: string;
  className?: string;
  /** The label is only spoken (the cost gem and rarity speak for themselves visually). */
  hideLabel?: boolean;
  /** Replaces the plain value, e.g. with the cost gem. */
  children?: ReactNode;
}) {
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
    <div className={'card-stat ' + className}>
      <dt className={hideLabel ? 'visually-hidden' : undefined}>{label}</dt>
      <dd>{children ?? shown}</dd>
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
  wanted,
  decksOf,
  onOpenImage,
}: {
  cards: readonly Card[];
  caption?: string;
  owned?: OwnedColumn;
  /** The want list column (T-064b); left out when the want list is not ready. */
  wanted?: OwnedColumn;
  /** Names of the decks a card is in (T-013); left out when decks could not be read. */
  decksOf?: (card: Card) => readonly string[];
  /** Opens the enlarged image (T-027 UX); the button is where focus returns. */
  onOpenImage: (card: Card, opener: HTMLButtonElement) => void;
}) {
  return (
    <ul className="card-grid" aria-label={caption}>
      {cards.map((card) => (
        <li key={card.id} className={'card-box ' + collectionState(card, owned)}>
          <CardImage card={card} onOpen={onOpenImage} />
          <div className="card-head">
            <dl className="card-cost">
              <Stat label={texts.columnCost} value={card.cost} missing={texts.noCost} hideLabel>
                {card.cost === null ? undefined : <CostGem card={card} />}
              </Stat>
            </dl>
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
          </div>
          <div className="card-meta">
            <p className="card-type">
              <span className={typeBadgeClass(card.color)} lang="en" title={card.color ?? undefined}>
                {card.type}
              </span>
              <span className="visually-hidden">
                , <CardColor color={card.color} />
              </span>
            </p>
            <dl className="card-stats">
              <Stat label={texts.columnPower} value={card.power} missing={texts.noPower} className="stat-chip" />
              <Stat label={texts.columnRam} value={card.ram} missing={texts.noRam} className="stat-chip" />
              <Stat
                label={texts.columnRarity}
                value={card.rarity}
                missing={texts.noRarity}
                className="card-rarity"
                hideLabel
              />
            </dl>
          </div>
          <div className="card-foot">
            {decksOf !== undefined && <CardDecks names={decksOf(card)} />}
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
            {wanted !== undefined && (
              <div className="card-want">
                <CountControl
                  card={card}
                  count={wanted.countOf(card)}
                  mode={wanted.mode}
                  onChange={wanted.onChange}
                  onLimit={wanted.onLimit}
                  editable={wanted.editable}
                  kind="want"
                />
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
