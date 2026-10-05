import { useState } from 'react';
import type { ChangeEvent, CompositionEvent, KeyboardEvent, Ref } from 'react';
import type { CardFilterCriteria, NumberFilterGroup } from '../domain/cardSearch';
import { NUMBER_GROUPS } from './ActiveFilters';
import { CardColor } from './CardColor';
import { texts } from './texts';
import { useMediaQuery } from './useMediaQuery';

/** Longest accepted search text (PM 2026-10-01). No message is shown at the limit (UX.md 5.3). */
export const SEARCH_MAX_LENGTH = 100;

export type CollectionFilter = 'all' | 'owned' | 'missing';

export interface CardFiltersProps {
  criteria: CardFilterCriteria;
  typeOptions: readonly string[];
  colorOptions: readonly string[];
  rarityOptions: readonly string[];
  /** Cost, Power and RAM options ("3", "9+"), see numberFilterOptions (T-052). */
  numberOptions: Readonly<Record<NumberFilterGroup, readonly string[]>>;
  searchInputRef: Ref<HTMLInputElement>;
  /** "Kokoelma" radio group value; undefined leaves the group out (collection not ready, UX.md 6.6). */
  collectionFilter?: CollectionFilter;
  /** Ref of the "Kaikki" radio, the focus target after "Näytä kaikki kortit". */
  collectionAllRef: Ref<HTMLInputElement>;
  onCollectionFilterChange: (next: CollectionFilter) => void;
  /** Set families for the "Setti / versio" select (T-074); empty or undefined leaves the group out. */
  setOptions?: readonly { family: string; label: string }[];
  setFamily?: string | null;
  onSetChange?: (family: string | null) => void;
  /** Search text changed. `composing` is true while an IME composition is in progress. */
  onQueryChange: (query: string, composing: boolean) => void;
  onToggleType: (type: string) => void;
  onToggleColor: (color: string) => void;
  onToggleRarity: (rarity: string) => void;
  onToggleNumber: (group: NumberFilterGroup, value: string) => void;
  /** Enter in the search field: announce the result now (UX.md 5.6). */
  onSearchSubmit: () => void;
  /**
   * Media query from which the filters are always shown (T-050). Below it they sit in a panel opened with
   * the "Suodattimet" button; the search field stays visible. Undefined: always shown, no button.
   */
  collapsibleBelow?: string;
}

/** How many choices are selected; "Kaikki" in "Kokoelma" is not a choice (T-050a). */
export function selectedFilterCount(criteria: CardFilterCriteria, collectionFilter: CollectionFilter | undefined) {
  const collection = collectionFilter !== undefined && collectionFilter !== 'all' ? 1 : 0;
  return (
    criteria.types.length +
    criteria.colors.length +
    criteria.rarities.length +
    criteria.costs.length +
    criteria.powers.length +
    criteria.rams.length +
    collection
  );
}

const COLLECTION_OPTIONS: readonly (readonly [CollectionFilter, string])[] = [
  ['all', texts.collectionAll],
  ['owned', texts.collectionOwned],
  ['missing', texts.collectionMissing],
];

/** Search and filter form (UX.md 5.4). Purely presentational: the parent owns the state. */
export function CardFilters({
  criteria,
  typeOptions,
  colorOptions,
  rarityOptions,
  numberOptions,
  searchInputRef,
  collectionFilter,
  collectionAllRef,
  onCollectionFilterChange,
  setOptions = [],
  setFamily = null,
  onSetChange,
  onQueryChange,
  onToggleType,
  onToggleColor,
  onToggleRarity,
  onToggleNumber,
  onSearchSubmit,
  collapsibleBelow,
}: CardFiltersProps) {
  // Without matchMedia (tests) the panel counts as wide: always open.
  const alwaysOpen = useMediaQuery(collapsibleBelow ?? 'all', true) || collapsibleBelow === undefined;
  const [open, setOpen] = useState(false);
  const selected = selectedFilterCount(criteria, collectionFilter);

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
      className="card-filters panel"
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

      {!alwaysOpen && (
        <button
          type="button"
          className="button-secondary filter-toggle"
          aria-expanded={open}
          aria-controls="filter-panel"
          onClick={() => setOpen(!open)}
        >
          {texts.filtersToggle(selected)}
          <span className="filter-toggle-icon" aria-hidden="true" />
        </button>
      )}

      <div id="filter-panel" className="filter-panel" hidden={!alwaysOpen && !open}>
        {collectionFilter !== undefined && (
          <fieldset className="owned-only">
            <legend>{texts.collectionLegend}</legend>
            <div className="options">
              {COLLECTION_OPTIONS.map(([value, label]) => (
                <label key={value} className="option">
                  <input
                    ref={value === 'all' ? collectionAllRef : undefined}
                    type="radio"
                    name="collection-filter"
                    value={value}
                    checked={collectionFilter === value}
                    onChange={() => onCollectionFilterChange(value)}
                  />{' '}
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {setOptions.length > 0 && onSetChange !== undefined && (
          <div className="field set-filter">
            <label htmlFor="set-filter">{texts.setLegend}</label>
            <select id="set-filter" value={setFamily ?? ''} onChange={(event) => onSetChange(event.target.value || null)}>
              <option value="">{texts.setAll}</option>
              {setOptions.map(({ family, label }) => (
                <option key={family} value={family}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        <p id="filter-hint" className="visually-hidden">
          {texts.filterHint}
        </p>

        <div className="fieldsets">
          <fieldset aria-describedby="filter-hint">
            <legend>{texts.typeLegend}</legend>
            <div className="options options-even">
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
            <div className="options options-even">
              {colorOptions.map((color) => (
                <label key={color} className="option option-color">
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

          <fieldset aria-describedby="filter-hint">
            <legend>{texts.rarityLegend}</legend>
            <div className="options options-even">
              {rarityOptions.map((rarity) => (
                <label key={rarity} className="option">
                  <input
                    type="checkbox"
                    name="rarity"
                    value={rarity}
                    checked={criteria.rarities.includes(rarity)}
                    onChange={() => onToggleRarity(rarity)}
                  />{' '}
                  <span lang="en">{rarity}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {NUMBER_GROUPS.map(([group, legend]) =>
            numberOptions[group].length === 0 ? null : (
              <fieldset key={group} aria-describedby="filter-hint" className="number-filter">
                <legend lang="en">{legend}</legend>
                <div className="options options-number">
                  {numberOptions[group].map((value) => (
                    <label key={value} className="option option-number">
                      <input
                        type="checkbox"
                        name={group}
                        value={value}
                        checked={criteria[group].includes(value)}
                        onChange={() => onToggleNumber(group, value)}
                      />
                      <span>{value}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ),
          )}
        </div>
      </div>
    </form>
  );
}
