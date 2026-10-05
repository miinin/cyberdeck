import { useId } from 'react';
import { SORT_KEYS } from '../domain/cardSort';
import type { CardSort, SortDirection, SortKey } from '../domain/cardSort';
import { texts } from './texts';

/** "Järjestys" selector: sort key and direction (T-060). State is kept by the parent, never stored. */
export function SortSelect({ sort, onChange }: { sort: CardSort; onChange: (next: CardSort) => void }) {
  const id = useId();
  return (
    <div className="sort-select">
      <label htmlFor={id}>{texts.sortLabel}</label>
      <select id={id} value={sort.key} onChange={(event) => onChange({ ...sort, key: event.target.value as SortKey })}>
        {SORT_KEYS.map((key) => (
          <option key={key} value={key}>
            {texts.sortOptions[key]}
          </option>
        ))}
      </select>
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
