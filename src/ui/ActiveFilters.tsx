import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { texts } from './texts';

/** One selected filter value shown as a removable chip (T-050a). */
export interface ActiveFilter {
  /** Unique and stable while the value is selected, e.g. "type:Unit". */
  id: string;
  label: string;
  /** Game terms stay English ("Unit", "Red", "Rare"). */
  lang?: string;
  onRemove: () => void;
}

/**
 * Chips for the selected filters above the results, and "Tyhjennä haku ja suodattimet" at the end.
 * Removing a chip moves focus to the chip now in its place (the next one), else the previous one,
 * else the search field, so focus never falls to <body>.
 */
export function ActiveFilters({
  filters,
  showClear,
  onClear,
  searchInputRef,
}: {
  filters: readonly ActiveFilter[];
  showClear: boolean;
  onClear: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
}) {
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  /** Index of the removed chip; focus is placed after the list has re-rendered. */
  const focusAfterRemove = useRef<number | null>(null);

  useEffect(() => {
    const index = focusAfterRemove.current;
    if (index === null) return;
    focusAfterRemove.current = null;
    if (filters.length === 0) searchInputRef.current?.focus();
    else chipRefs.current[Math.min(index, filters.length - 1)]?.focus();
  }, [filters, searchInputRef]);

  if (filters.length === 0 && !showClear) return null;

  return (
    <div className="active-filters">
      {filters.length > 0 && (
        <span className="active-filters-label" aria-hidden="true">
          {texts.activeFilters}
        </span>
      )}
      {filters.map((filter, index) => (
        <button
          key={filter.id}
          ref={(element) => {
            chipRefs.current[index] = element;
          }}
          type="button"
          className="filter-chip"
          aria-label={texts.removeFilter(filter.label)}
          onClick={() => {
            focusAfterRemove.current = index;
            filter.onRemove();
          }}
        >
          <span lang={filter.lang}>{filter.label}</span>
          <span className="filter-chip-x" aria-hidden="true">
            ×
          </span>
        </button>
      ))}
      {showClear && (
        <button type="button" className="link-button active-filters-clear" onClick={onClear}>
          {texts.clearFilters}
        </button>
      )}
    </div>
  );
}
