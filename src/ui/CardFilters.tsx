import type { ChangeEvent, CompositionEvent, KeyboardEvent, Ref } from 'react';
import type { CardFilterCriteria } from '../domain/cardSearch';
import { CardColor } from './CardColor';
import { texts } from './texts';

/** Longest accepted search text (PM 2026-10-01). No message is shown at the limit (UX.md 5.3). */
export const SEARCH_MAX_LENGTH = 100;

export interface CardFiltersProps {
  criteria: CardFilterCriteria;
  typeOptions: readonly string[];
  colorOptions: readonly string[];
  searchInputRef: Ref<HTMLInputElement>;
  /** "Vain omistetut" checked state; undefined leaves the checkbox out (collection not ready, UX.md 6.6). */
  ownedOnly?: boolean;
  ownedOnlyRef: Ref<HTMLInputElement>;
  onToggleOwnedOnly: () => void;
  /** Search text changed. `composing` is true while an IME composition is in progress. */
  onQueryChange: (query: string, composing: boolean) => void;
  onToggleType: (type: string) => void;
  onToggleColor: (color: string) => void;
  /** Enter in the search field: announce the result now (UX.md 5.6). */
  onSearchSubmit: () => void;
}

/** Search and filter form (UX.md 5.4). Purely presentational: the parent owns the state. */
export function CardFilters({
  criteria,
  typeOptions,
  colorOptions,
  searchInputRef,
  ownedOnly,
  ownedOnlyRef,
  onToggleOwnedOnly,
  onQueryChange,
  onToggleType,
  onToggleColor,
  onSearchSubmit,
}: CardFiltersProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onQueryChange(event.target.value, (event.nativeEvent as InputEvent).isComposing === true);
  };

  const handleCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
    onQueryChange(event.currentTarget.value, false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Escape' && criteria.query !== '') {
      // Same behaviour in every browser (Firefox does not clear a search field on Esc).
      event.preventDefault();
      onQueryChange('', false);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      onSearchSubmit();
    }
  };

  return (
    <form
      role="search"
      aria-label={texts.filterFormLabel}
      className="card-filters"
      onSubmit={(event) => {
        event.preventDefault();
        onSearchSubmit();
      }}
    >
      <div className="field">
        <label htmlFor="card-search">{texts.searchLabel}</label>
        <p id="card-search-hint" className="hint">
          {texts.searchHint}
        </p>
        <input
          ref={searchInputRef}
          id="card-search"
          type="search"
          aria-describedby="card-search-hint"
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="none"
          enterKeyHint="search"
          maxLength={SEARCH_MAX_LENGTH}
          value={criteria.query}
          onChange={handleChange}
          onCompositionEnd={handleCompositionEnd}
          onKeyDown={handleKeyDown}
        />
      </div>

      {ownedOnly !== undefined && (
        <div className="field owned-only">
          <label className="option">
            <input
              ref={ownedOnlyRef}
              type="checkbox"
              name="owned-only"
              checked={ownedOnly}
              onChange={onToggleOwnedOnly}
            />{' '}
            {texts.ownedOnly}
          </label>
        </div>
      )}

      <p id="filter-hint" className="hint filter-hint">
        {texts.filterHint}
      </p>

      <fieldset aria-describedby="filter-hint">
        <legend>{texts.typeLegend}</legend>
        <div className="options">
          {typeOptions.map((type) => (
            <label key={type} className="option">
              <input
                type="checkbox"
                name="type"
                value={type}
                checked={criteria.types.includes(type)}
                onChange={() => onToggleType(type)}
              />{' '}
              <span lang="en">{type}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset aria-describedby="filter-hint">
        <legend>{texts.colorLegend}</legend>
        <div className="options">
          {colorOptions.map((color) => (
            <label key={color} className="option">
              <input
                type="checkbox"
                name="color"
                value={color}
                checked={criteria.colors.includes(color)}
                onChange={() => onToggleColor(color)}
              />{' '}
              <span>
                <CardColor color={color} />
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </form>
  );
}
