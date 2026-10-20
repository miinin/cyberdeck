import { useState } from 'react';
import type { ReactNode } from 'react';
import { RaritySymbol } from './RaritySymbol';
import { playsetSize } from '../domain/card';
import type { Card } from '../domain/card';
import type { Art } from '../domain/arts';
import { artRarity } from '../domain/arts';
import { CardColor, typeBadgeClass, typeColorClass } from './CardColor';
import { Chevron } from './Chevron';
import { CardImage } from './CardImage';
import { CostGem } from './DeckPickTable';
import { CountControl } from './CountControl';
import type { CountControlMode } from './CountControl';
import { artName } from './artName';
import { texts } from './texts';

/** The collection part of each box. Left out when the collection could not be read. */
export interface OwnedColumn {
  mode: CountControlMode;
  countOf: (card: Card) => number;
  onChange: (card: Card, count: number) => void;
  onLimit: (card: Card) => void;
  /** The lowest count of a card: the sum of its versions (D-020). Default 0. */
  minOf?: (card: Card) => number;
  /** Copies of one art of a card; with it and onArtChange the boxes of an art item count that art (D-021). */
  artCountOf?: (card: Card, art: Art) => number;
  onArtChange?: (card: Card, art: Art, count: number) => void;
  /** The marking mode ("Merkitse omat kortit", T-040, T-123): false hides the − and + buttons. */
  editable: boolean;
  /** 'proxy' = the print queue (T-102): its own spoken texts and no playset edge. Default: the collection. */
  kind?: 'owned' | 'proxy';
}

/** Box state (UX.md 7.5): only when the collection is ready; a 1 px edge colour, never a size change. */
export function collectionState(card: Card, owned: OwnedColumn | undefined): string {
  if (owned?.mode !== 'ready') return '';
  const count = owned.countOf(card);
  if (owned.kind === 'proxy') return count > 0 ? 'is-owned' : '';
  if (count >= playsetSize(card)) return 'is-owned is-playset';
  return count > 0 ? 'is-owned' : '';
}

/** One box of the grid (D-021): a card, or one art of a card in the "all arts" mode. */
export interface CardListItem {
  card: Card;
  /** Set in the "all arts" mode: the box counts and names this art. */
  art: Art | null;
  /** Picture of a special art, or null for the card's own picture. */
  imageUrl: string | null;
  /** Arts of the card; more than one shows a corner mark in the one-box-per-card mode. */
  artCount: number;
  /** One-box-per-card mode: the picture of each version (null = the card's own), for the ‹ › buttons. */
  versionUrls?: readonly (string | null)[];
  /** Rarity of each version in versionUrls (the rarity symbol follows the shown version). */
  versionRarities?: readonly (string | null)[];
  /** Index in versionUrls to start from (the art a filter matches). */
  startVersion?: number;
  /** Rarity of the shown picture when there are no ‹ › buttons. Default: the art's rarity, else the card's. */
  rarity?: string | null;
}

/** The picture of a box. With several versions it has ‹ › buttons that cycle the shown version (tile state only). */
function BoxPicture({
  card,
  imageUrl,
  versionUrls,
  index,
  onStep,
  onOpenImage,
  imageLabel,
}: {
  card: Card;
  imageUrl: string | null;
  versionUrls?: readonly (string | null)[];
  index: number;
  onStep: (delta: number) => void;
  onOpenImage: (card: Card, opener: HTMLButtonElement, artUrl?: string | null) => void;
  imageLabel?: string;
}) {
  const n = versionUrls?.length ?? 0;
  if (versionUrls === undefined || n < 2) return <CardImage card={card} onOpen={onOpenImage} artUrl={imageUrl} actionLabel={imageLabel} />;
  const step = onStep;
  return (
    <div className="card-picture">
      <CardImage key={index} card={card} onOpen={onOpenImage} artUrl={versionUrls[index] ?? null} actionLabel={imageLabel} />
      <span className="art-count-badge">{texts.versionPosition(index + 1, n)}</span>
      <button type="button" className="version-step version-step--prev" aria-label={texts.versionPrev(card.displayName)} onClick={() => step(-1)}>
        <Chevron direction="left" size={18} />
      </button>
      <button type="button" className="version-step version-step--next" aria-label={texts.versionNext(card.displayName)} onClick={() => step(1)}>
        <Chevron direction="right" size={18} />
      </button>
    </div>
  );
}

/** One game value (cost, power, RAM). A missing value shows a dash and a hidden spoken equivalent. */
function Stat({
  label,
  value,
  missing,
  className = '',
  hideLabel = false,
  mark = false,
  children,
}: {
  label: string;
  value: number | string | null;
  missing: string;
  className?: string;
  /** The label is only spoken (the cost gem and rarity speak for themselves visually). */
  hideLabel?: boolean;
  /** The value is drawn as the mark of the card (Power box, RAM chip, T-185). */
  mark?: boolean;
  /** Replaces the plain value, e.g. with the cost gem. */
  children?: ReactNode;
}) {
  let shown: ReactNode = mark && value !== null ? <span className="stat-mark">{value}</span> : value;
  if (value === null) {
    shown = (
      <>
        <span aria-hidden="true">{texts.missingValue}</span>
        <span className="visually-hidden">{missing}</span>
      </>
    );
  }
  return (
    <div className={'card-stat ' + className} title={value === null ? undefined : `${label} ${value}`}>
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
  items,
  caption = texts.tableCaption,
  owned,
  onOpenImage,
  imageLabel,
  renderFoot,
}: {
  cards: readonly Card[];
  /** Boxes in place of one box per card (D-021). */
  items?: readonly CardListItem[];
  caption?: string;
  owned?: OwnedColumn;
  /** Opens the enlarged image (T-027 UX); the button is where focus returns. */
  onOpenImage: (card: Card, opener: HTMLButtonElement, artUrl?: string | null) => void;
  /** Spoken text of the picture button when it does not enlarge (Proxy adds on click). */
  imageLabel?: string;
  /** Per-card control in place of the collection control (Have/Want, T-067). */
  renderFoot?: (card: Card) => ReactNode;
}) {
  return (
    <ul className="card-grid" aria-label={caption}>
      {(items ?? cards.map((card): CardListItem => ({ card, art: null, imageUrl: null, artCount: 1 }))).map((item) => (
        <CardBox
          key={item.art === null ? item.card.id : item.art.artId}
          item={item}
          showArtLabel={items !== undefined}
          owned={owned}
          onOpenImage={onOpenImage}
          imageLabel={imageLabel}
          renderFoot={renderFoot}
        />
      ))}
    </ul>
  );
}

/** One box. Holds which version the ‹ › buttons show, so the rarity symbol can follow it. */
function CardBox({
  item,
  showArtLabel,
  owned,
  onOpenImage,
  imageLabel,
  renderFoot,
}: {
  item: CardListItem;
  showArtLabel: boolean;
  owned?: OwnedColumn;
  onOpenImage: (card: Card, opener: HTMLButtonElement, artUrl?: string | null) => void;
  imageLabel?: string;
  renderFoot?: (card: Card) => ReactNode;
}) {
  const { card, art, imageUrl, artCount, versionUrls, versionRarities, startVersion = 0 } = item;
  const [picked, setPicked] = useState<number | null>(null);
  const n = versionUrls?.length ?? 0;
  const index = n < 2 ? 0 : (picked ?? startVersion) % n;
  const step = (delta: number) => setPicked((index + delta + n) % n);
  const shownRarity = n >= 2 && versionRarities !== undefined
    ? (versionRarities[index] ?? card.rarity)
    : item.rarity !== undefined ? item.rarity : art !== null ? artRarity(card, art) : card.rarity;
  const artMode = art !== null && owned?.artCountOf !== undefined && owned.onArtChange !== undefined;
  const artOwned = artMode ? (owned?.artCountOf?.(card, art) ?? 0) : 0;
  const state = artMode ? (owned?.mode === 'ready' && artOwned > 0 ? 'is-owned' : '') : collectionState(card, owned);
  const fullName = card.subname === null ? card.name : `${card.name}, ${card.subname}`;
  // Marking mode and the Have/Want controls need room for − and +, so they get a row of their own; browsing shows the count in the data strip (T-181).
  const control =
    owned === undefined ? null : (
      <CountControl
        card={card}
        count={artMode ? artOwned : owned.countOf(card)}
        mode={owned.mode}
        label={artMode && art !== null ? texts.artTileName(card.displayName, artName(art)) : undefined}
        onChange={artMode && art !== null ? (c, n) => owned.onArtChange?.(c, art, n) : owned.onChange}
        onLimit={owned.onLimit}
        editable={owned.editable}
        kind={owned.kind}
        min={artMode ? 0 : owned.minOf?.(card)}
      />
    );
  const controlInStrip = owned !== undefined && !owned.editable && renderFoot === undefined;
  const footControl = renderFoot !== undefined ? renderFoot(card) : owned?.editable === true ? control : null;
  return (
    <li className={'card-box card-box--art ' + state}>
      {art === null && artCount > 1 && (versionUrls?.length ?? 0) < 2 && <span className="art-count-badge">{texts.artsCount(artCount)}</span>}
      <BoxPicture card={card} imageUrl={imageUrl} versionUrls={versionUrls} index={index} onStep={step} onOpenImage={onOpenImage} imageLabel={imageLabel} />
      {/* Line 1 (T-184): the name on one line (the whole name in the title) and the collection count. The deck count is not shown here (T-187). */}
      <div className="card-strip">
        <h3 className="card-name" title={fullName}>
          <span lang="en">{card.name}</span>
          {card.subname !== null && (
            <>
              <span className="visually-hidden">, </span>
              <span className="card-subname" lang="en">
                {card.subname}
              </span>
            </>
          )}
          {/* The version is only a picture and a rarity symbol; screen readers get its name here. */}
          {showArtLabel && art !== null && (
            <span className="visually-hidden"> – {artName(art)}</span>
          )}
        </h3>
        {controlInStrip && <div className="card-collection">{control}</div>}
      </div>
      {/* The version's name is also shown (T-118, UX-118-27): boxes of one card differ only by the picture otherwise. */}
      {showArtLabel && art !== null && (
        <p className="card-art-label" aria-hidden="true" lang={art.rarity === null ? undefined : 'en'}>
          {artName(art)}
        </p>
      )}
      {/* Line 2 (T-184): cost gem, type and rarity; line 3: Power and RAM. One reading size for all. */}
      <div className={'card-meta ' + typeColorClass(card.color)}>
        <dl className="card-cost">
          <Stat label={texts.columnCost} value={card.cost} missing={texts.noCost} hideLabel>
            {card.cost === null ? undefined : <CostGem card={card} />}
          </Stat>
        </dl>
        <p className="card-type">
          <span className={typeBadgeClass(card.color)} lang="en" title={card.color ?? undefined}>
            {card.type}
          </span>
          <span className="visually-hidden">
            , <CardColor color={card.color} />
          </span>
        </p>
        <dl className="card-rarity-box">
          <Stat label={texts.columnRarity} value={null} missing={texts.noRarity} className="card-rarity" hideLabel>
            {shownRarity === null ? undefined : <RaritySymbol rarity={shownRarity} size={16} />}
          </Stat>
        </dl>
        <dl className="card-stats">
          <Stat label={texts.columnPower} value={card.power} missing={texts.noPower} className="stat-chip stat-power" mark />
          <Stat label={texts.columnRam} value={card.ram} missing={texts.noRam} className="stat-chip stat-ram" mark />
        </dl>
      </div>
      {footControl !== null && (
        <div className="card-foot">
          <div className="card-collection">{footControl}</div>
        </div>
      )}
    </li>
  );
}
