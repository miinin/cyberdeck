import { useMemo, useState } from 'react';
import { RaritySymbol } from './RaritySymbol';
import type { ReactNode } from 'react';
import type { Card } from '../domain/card';
import { DEFAULT_SORT, sortCards } from '../domain/cardSort';
import type { CardSort, SortKey } from '../domain/cardSort';
import { CardColor, typeBadgeClass } from './CardColor';
import type { HoverPreviewProps } from './CardHoverPreview';
import { CardImage } from './CardImage';
import { CardDecks } from './CardDecks';
import { collectionState } from './CardList';
import type { OwnedColumn } from './CardList';
import { CountControl } from './CountControl';
import { deckTexts } from './deckTexts';
import { texts } from './texts';

/** A missing value shows a dash and a hidden spoken equivalent, as in the grid. */
export function Value({ value, missing }: { value: number | string | null; missing: string }): ReactNode {
  if (value !== null) return value;
  return (
    <>
      <span aria-hidden="true">{texts.missingValue}</span>
      <span className="visually-hidden">{missing}</span>
    </>
  );
}

function RarityCell({ rarity }: { rarity: string | null }): ReactNode {
  return rarity === null ? <Value value={null} missing={texts.noRarity} /> : <RaritySymbol rarity={rarity} />;
}

type SortState = CardSort;
/** One sortable column header: a button inside the th, with aria-sort on the active th only. */
function SortHeader({ label, column, sort, onSort, numeric = false }: { label: string; column: SortKey; sort: SortState; onSort: (column: SortKey) => void; numeric?: boolean }) {
  const active = sort.key === column ? sort.direction : null;
  return (
    <th scope="col" role="columnheader" className={numeric ? 'cell-number' : undefined} aria-sort={active === null ? undefined : active === 'asc' ? 'ascending' : 'descending'}>
      <button type="button" className="sort-button" onClick={() => onSort(column)}>
        {label}
        {active !== null && <span aria-hidden="true"> {active === 'asc' ? '▲' : '▼'}</span>}
      </button>
    </th>
  );
}

/**
 * Compact table view (T-040). The scroll container is a named, focusable region so a narrow screen
 * scrolls the table sideways, not the page. All values are React text nodes, never HTML (SR-1).
 */
export function CardTable({
  cards,
  caption = texts.tableCaption,
  owned,
  decksOf,
  onOpenImage,
  artUrlOf,
  rarityOf,
  hoverProps,
  sort: controlledSort,
  onSortChange,
  extraColumn,
}: {
  cards: readonly Card[];
  caption?: string;
  owned?: OwnedColumn;
  decksOf?: (card: Card) => readonly string[];
  onOpenImage: (card: Card, opener: HTMLButtonElement, artUrl?: string | null) => void;
  /** A special art to show in place of a card's picture (D-021). */
  artUrlOf?: (card: Card) => string | null;
  /** The rarity a row shows; default: the card's own. */
  rarityOf?: (card: Card) => string | null;
  /** Mouse hover preview of the bigger image (T-052), as in the deck editor. */
  hoverProps?: (card: Card, artUrl?: string | null) => HoverPreviewProps;
  /** Controlled sort shared with the "Järjestys" selector (T-060); without it the table keeps its own. */
  sort?: CardSort;
  onSortChange?: (next: CardSort) => void;
  /** A last column of the page's own (Have/Want counts, T-135). */
  extraColumn?: { label: string; render: (card: Card) => ReactNode };
}) {
  // Sort state is never stored. Header cycle: ascending, descending, original order.
  const [ownSort, setOwnSort] = useState<SortState>(DEFAULT_SORT);
  const sort = controlledSort ?? ownSort;
  const setSort = onSortChange ?? setOwnSort;
  const rows = useMemo(() => sortCards(cards, sort.key, sort.direction), [cards, sort]);
  const onSort = (key: SortKey) => {
    if (sort.key !== key) setSort({ key, direction: 'asc' });
    else setSort(sort.direction === 'asc' ? { key, direction: 'desc' } : DEFAULT_SORT);
  };
  return (
    <div className="table-scroll" role="region" aria-label={texts.tableRegionLabel(caption)} tabIndex={0}>
      {/* Explicit roles (T-090): on phones the rows are restacked with CSS grid, which drops the native table semantics in some browsers. */}
      <table className="card-table" role="table">
        <caption className="visually-hidden">{caption}</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">
              <span className="visually-hidden">{texts.columnImage}</span>
            </th>
            <SortHeader label={texts.columnName} column="name" sort={sort} onSort={onSort} />
            <SortHeader label={texts.columnType} column="type" sort={sort} onSort={onSort} />
            <SortHeader label={texts.columnRarity} column="rarity" sort={sort} onSort={onSort} />
            <SortHeader label={texts.columnCost} column="cost" sort={sort} onSort={onSort} numeric />
            <SortHeader label={texts.columnPower} column="power" sort={sort} onSort={onSort} numeric />
            <SortHeader label={texts.columnRam} column="ram" sort={sort} onSort={onSort} numeric />
            {decksOf !== undefined && (
              <th scope="col" role="columnheader" className="cell-decks">
                {deckTexts.columnDecks}
              </th>
            )}
            {owned !== undefined && <th scope="col" role="columnheader">{texts.columnCollection}</th>}
            {extraColumn !== undefined && <th scope="col" role="columnheader">{extraColumn.label}</th>}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((card) => (
            <tr key={card.id} role="row" className={collectionState(card, owned)} {...hoverProps?.(card, artUrlOf?.(card) ?? null)}>
              <td role="cell" className="cell-image">
                <CardImage card={card} onOpen={onOpenImage} artUrl={artUrlOf?.(card) ?? null} />
              </td>
              <th scope="row" role="rowheader" className="cell-name">
                <button
                  type="button"
                  className="link-button"
                  aria-haspopup="dialog"
                  onClick={(event) => onOpenImage(card, event.currentTarget)}
                >
                  <span lang="en">{card.name}</span>
                </button>
                {card.subname !== null && (
                  <>
                    <span className="visually-hidden">, </span>
                    <span className="card-subname" lang="en">
                      {card.subname}
                    </span>
                  </>
                )}
              </th>
              <td role="cell" className="cell-type">
                <span className={typeBadgeClass(card.color)} lang="en" title={card.color ?? undefined}>
                  {card.type}
                </span>
                <span className="visually-hidden">
                  , <CardColor color={card.color} />
                </span>
              </td>
              <td role="cell" className="cell-rarity">
                <RarityCell rarity={rarityOf?.(card) ?? card.rarity} />
              </td>
              <td role="cell" className="cell-number" data-label={texts.columnCost}>
                <Value value={card.cost} missing={texts.noCost} />
              </td>
              <td role="cell" className="cell-number" data-label={texts.columnPower}>
                <Value value={card.power} missing={texts.noPower} />
              </td>
              <td role="cell" className="cell-number" data-label={texts.columnRam}>
                <Value value={card.ram} missing={texts.noRam} />
              </td>
              {decksOf !== undefined && (
                <td role="cell" className="cell-decks">
                  <CardDecks names={decksOf(card)} compact="number" />
                </td>
              )}
              {owned !== undefined && (
                <td role="cell" className="cell-collection">
                  <CountControl
                    card={card}
                    count={owned.countOf(card)}
                    mode={owned.mode}
                    onChange={owned.onChange}
                    onLimit={owned.onLimit}
                    editable={owned.editable}
                    min={owned.minOf?.(card)}
                  />
                </td>
              )}
              {extraColumn !== undefined && (
                <td role="cell" className="cell-collection" data-label={extraColumn.label}>
                  {extraColumn.render(card)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
