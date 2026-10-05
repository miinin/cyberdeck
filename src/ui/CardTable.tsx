import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Card } from '../domain/card';
import { sortCards } from '../domain/cardSort';
import type { SortDirection, SortKey } from '../domain/cardSort';
import { CardColor, typeBadgeClass } from './CardColor';
import type { HoverPreviewProps } from './CardHoverPreview';
import { CardImage } from './CardImage';
import { CardDecks } from './CardDecks';
import { collectionState } from './CardList';
import type { OwnedColumn } from './CardList';
import { CountControl } from './CountControl';
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

type SortState = { key: SortKey; direction: SortDirection } | null;

/** One sortable column header: a button inside the th, with aria-sort on the active th only. */
function SortHeader({ label, column, sort, onSort, numeric = false }: { label: string; column: SortKey; sort: SortState; onSort: (column: SortKey) => void; numeric?: boolean }) {
  const active = sort !== null && sort.key === column ? sort.direction : null;
  return (
    <th scope="col" className={numeric ? 'cell-number' : undefined} aria-sort={active === null ? undefined : active === 'asc' ? 'ascending' : 'descending'}>
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
  wanted,
  decksOf,
  onOpenImage,
  hoverProps,
}: {
  cards: readonly Card[];
  caption?: string;
  owned?: OwnedColumn;
  /** The want list column (T-064b); left out when the want list is not ready. */
  wanted?: OwnedColumn;
  decksOf?: (card: Card) => readonly string[];
  onOpenImage: (card: Card, opener: HTMLButtonElement) => void;
  /** Mouse hover preview of the bigger image (T-052), as in the deck editor. */
  hoverProps?: (card: Card) => HoverPreviewProps;
}) {
  // Sort state lives here and is not stored. Cycle: ascending, descending, original order.
  const [sort, setSort] = useState<SortState>(null);
  const rows = useMemo(() => (sort === null ? cards : sortCards(cards, sort.key, sort.direction)), [cards, sort]);
  const onSort = (key: SortKey) =>
    setSort((current) => {
      if (current === null || current.key !== key) return { key, direction: 'asc' };
      return current.direction === 'asc' ? { key, direction: 'desc' } : null;
    });
  return (
    <div className="table-scroll" role="region" aria-label={texts.tableRegionLabel(caption)} tabIndex={0}>
      <table className="card-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="visually-hidden">{texts.columnImage}</span>
            </th>
            <SortHeader label={texts.columnName} column="name" sort={sort} onSort={onSort} />
            <SortHeader label={texts.columnType} column="type" sort={sort} onSort={onSort} />
            <SortHeader label={texts.columnRarity} column="rarity" sort={sort} onSort={onSort} />
            <SortHeader label={texts.columnCost} column="cost" sort={sort} onSort={onSort} numeric />
            <SortHeader label={texts.columnPower} column="power" sort={sort} onSort={onSort} numeric />
            <SortHeader label={texts.columnRam} column="ram" sort={sort} onSort={onSort} numeric />
            {owned !== undefined && <th scope="col">{texts.columnCollection}</th>}
            {wanted !== undefined && <th scope="col">{texts.columnWant}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((card) => (
            <tr key={card.id} className={collectionState(card, owned)} {...hoverProps?.(card)}>
              <td className="cell-image">
                <CardImage card={card} onOpen={onOpenImage} />
              </td>
              <th scope="row" className="cell-name">
                <button
                  type="button"
                  className="link-button"
                  aria-haspopup="dialog"
                  onClick={(event) => onOpenImage(card, event.currentTarget)}
                >
                  <span lang="en">{card.name}</span>
                  {card.subname !== null && (
                    <>
                      <span className="visually-hidden">, </span>
                      <span className="card-subname" lang="en">
                        {card.subname}
                      </span>
                    </>
                  )}
                </button>
                {decksOf !== undefined && <CardDecks names={decksOf(card)} />}
              </th>
              <td>
                <span className={typeBadgeClass(card.color)} lang="en" title={card.color ?? undefined}>
                  {card.type}
                </span>
                <span className="visually-hidden">
                  , <CardColor color={card.color} />
                </span>
              </td>
              <td>
                <Value value={card.rarity} missing={texts.noRarity} />
              </td>
              <td className="cell-number">
                <Value value={card.cost} missing={texts.noCost} />
              </td>
              <td className="cell-number">
                <Value value={card.power} missing={texts.noPower} />
              </td>
              <td className="cell-number">
                <Value value={card.ram} missing={texts.noRam} />
              </td>
              {owned !== undefined && (
                <td className="cell-collection">
                  <CountControl
                    card={card}
                    count={owned.countOf(card)}
                    mode={owned.mode}
                    onChange={owned.onChange}
                    onLimit={owned.onLimit}
                    editable={owned.editable}
                  />
                </td>
              )}
              {wanted !== undefined && (
                <td className="cell-collection">
                  <CountControl
                    card={card}
                    count={wanted.countOf(card)}
                    mode={wanted.mode}
                    onChange={wanted.onChange}
                    onLimit={wanted.onLimit}
                    editable={wanted.editable}
                    kind="want"
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
