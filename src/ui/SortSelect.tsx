import { useId } from 'react';
import { SORT_KEYS } from '../domain/cardSort';
import type { CardSort, SortDirection, SortKey } from '../domain/cardSort';
import { texts } from './texts';

/**
 * "Järjestys" selector: sort key and direction (T-060). State is kept by the parent, never stored.
 * `toolbar` (T-181): one select and an arrow button for the direction, for the tool row; the label is spoken only.
 */
export function SortSelect({ sort, onChange, toolbar = false }: { sort: CardSort; onChange: (next: CardSort) => void; toolbar?: boolean }) {
  const id = useId();
  const keySelect = (
    <select id={id} value={sort.key} onChange={(event) => onChange({ ...sort, key: event.target.value as SortKey })}>
      {SORT_KEYS.map((key) => (
        <option key={key} value={key}>
          {texts.sortOptions[key]}
        </option>
      ))}
    </select>
  );
  if (toolbar) {
    const direction = `${texts.sortDirectionLabel}: ${sort.direction === 'asc' ? texts.sortAscending : texts.sortDescending}`;
    return (
      <div className="sort-select sort-select--toolbar">
        <label htmlFor={id} className="visually-hidden">
          {texts.sortLabel}
        </label>
        {keySelect}
        <button
          type="button"
          className="icon-button sort-direction"
          aria-label={direction}
          title={direction}
          onClick={() => onChange({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
            <path
              d={sort.direction === 'asc' ? 'M10 16V4M5 9l5-5 5 5' : 'M10 4v12M5 11l5 5 5-5'}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    );
  }
  return (
    <div className="sort-select">
      <label htmlFor={id}>{texts.sortLabel}</label>
      {keySelect}
      <select
        aria-label={texts.sortDirectionLabel}
        value={sort.direction}
        onChange={(event) => onChange({ ...sort, direction: event.target.value as SortDirection })}
      >
        <option value="asc">{texts.sortAscending}</option>
        <option value="desc">{texts.sortDescending}</option>
      </select>
    </div>
  );
}
