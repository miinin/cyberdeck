import { useRef, useState } from 'react';
import { RaritySymbol, rarityTitle } from './RaritySymbol';
import { officialRarity, shortRarity } from '../domain/cardSearch';
import type { ChangeEvent, CompositionEvent, KeyboardEvent, ReactNode, Ref } from 'react';
import type { CardFilterCriteria, NumberFilterGroup } from '../domain/cardSearch';
import { NUMBER_GROUPS } from './ActiveFilters';
import { CardColor } from './CardColor';
import type { CardSort } from '../domain/cardSort';
import { SortSelect } from './SortSelect';
import { SwitchButton } from './ListToolbar';
import { texts } from './texts';
import { useMediaQuery } from './useMediaQuery';
import { SegmentedChoice } from './SegmentedChoice';

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
  setOptions?: readonly { family: string; label: string; group: 'sets' | 'other' }[];
  setFamily?: string | null;
  onSetChange?: (family: string | null) => void;
  /** The tags of the cards with counts (T-151); undefined or empty leaves the tag choice out. The chosen one is criteria.tag. */
  tagOptions?: readonly { tag: string; count: number }[];
  onTagChange?: (tag: string | null) => void;
  /** Search text changed. `composing` is true while an IME composition is in progress. */
  onQueryChange: (query: string, composing: boolean) => void;
  onToggleType: (type: string) => void;
  onToggleColor: (color: string) => void;
  onToggleRarity: (rarity: string) => void;
  onToggleNumber: (group: NumberFilterGroup, value: string) => void;
  /** Toggles the "only sellable (€$)" filter; without it the group is left out. */
  onToggleSellable?: () => void;
  /** Enter in the search field: announce the result now (UX.md 5.6). */
  onSearchSubmit: () => void;
  /**
   * Media query from which the filters are always shown (T-050). Below it they sit in a panel opened with
   * the "Suodattimet" button; the search field stays visible. Undefined: always shown, no button.
   */
  collapsibleBelow?: string;
  /**
   * Collapsed panel only (T-087): a "Näytä N korttia" button at its end closes it and scrolls to the element
   * with this id, so on a phone the results are one tap away instead of a long scroll past the filters.
   */
  results?: { count: number; id: string };
  /**
   * The gallery (T-123) has its own search field in its bar: leaves the one of the form out. The panel is then always
   * open, and `onShowResults` gives its "Näytä N korttia" button (needs `results` for the count) a job of its own.
   */
  hideSearch?: boolean;
  onShowResults?: () => void;
  /** The order of the cards and the "Kaikki versiot" switch open the panel in a "Järjestys ja näkymä" section (T-125). Undefined leaves each out. */
  sort?: CardSort;
  onSortChange?: (next: CardSort) => void;
  allArts?: boolean;
  /** Greys out "Kaikki versiot" in the list view instead of hiding it, so the panel does not jump (T-126). */
  allArtsDisabled?: boolean;
  onAllArtsChange?: (next: boolean) => void;
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
    (criteria.sellable === true ? 1 : 0) +
    (criteria.tag != null ? 1 : 0) +
    collection
  );
}

/**
 * A rarely used filter group (T-181 B.1): a closed `disclosure` with the choices inside. A group that has a choice is open and the
 * count is in the title ("COST · 2"). The legend stays for screen readers, the summary is the visible title.
 */
function FilterGroup({ legend, lang, count, className, children }: { legend: string; lang?: string; count: number; className?: string; children: ReactNode }) {
  return (
    <details className={'disclosure filter-group' + (className ? ' ' + className : '')} open={count > 0 || undefined}>
      <summary>
        <span lang={lang}>{legend}</span>
        {count > 0 && <span className="filter-group-count"> · {count}</span>}
      </summary>
      <fieldset aria-describedby="filter-hint">
        <legend className="visually-hidden" lang={lang}>
          {legend}
        </legend>
        {children}
      </fieldset>
    </details>
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
  tagOptions = [],
  onTagChange,
  onQueryChange,
  onToggleType,
  onToggleColor,
  onToggleRarity,
  onToggleNumber,
  onToggleSellable,
  onSearchSubmit,
  collapsibleBelow,
  results,
  hideSearch = false,
  onShowResults,
  sort,
  onSortChange,
  allArts,
  allArtsDisabled,
  onAllArtsChange,
}: CardFiltersProps) {
  // Without matchMedia (tests) the panel counts as wide: always open.
  const alwaysOpen = useMediaQuery(collapsibleBelow ?? 'all', true) || collapsibleBelow === undefined;
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const showResults = () => {
    setOpen(false);
    // Focus goes back to the toggle (the panel closes under it); the view goes to the results.
    toggleRef.current?.focus({ preventScroll: true });
    if (results !== undefined) document.getElementById(results.id)?.scrollIntoView({ block: 'start' });
  };
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
      className="card-filters"
      onSubmit={(event) => {
        event.preventDefault();
        onSearchSubmit();
      }}
    >
      {!hideSearch && (
        <div className="search-row">
          <div className="field search-field">
            <label htmlFor="card-search" className="visually-hidden">
              {texts.searchLabel}
            </label>
            <p id="card-search-hint" className="visually-hidden">
              {texts.searchHint}
            </p>
            <svg className="search-icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
              <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12.7 12.7L17 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              ref={searchInputRef}
              id="card-search"
              type="search"
              // A visible hint only (T-115): the accessible name still comes from the hidden <label>.
              placeholder={texts.searchPlaceholder}
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
              ref={toggleRef}
              className="button-secondary filter-toggle"
              aria-expanded={open}
              aria-controls="filter-panel"
              onClick={() => setOpen(!open)}
            >
              {texts.filtersToggle(selected)}
              <span className="filter-toggle-icon" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <div id="filter-panel" className="filter-panel" hidden={!alwaysOpen && !open}>
        {((sort !== undefined && onSortChange !== undefined) || (allArts !== undefined && onAllArtsChange !== undefined)) && (
          <fieldset className="view-options">
            <legend>{texts.viewOptionsLegend}</legend>
            {sort !== undefined && onSortChange !== undefined && <SortSelect sort={sort} onChange={onSortChange} />}
            {allArts !== undefined && onAllArtsChange !== undefined && (
              <SwitchButton checked={allArts} label={texts.artsAllLabel} onChange={onAllArtsChange} disabled={allArtsDisabled} />
            )}
          </fieldset>
        )}

        {collectionFilter !== undefined && (
          <SegmentedChoice
            legendVisible
            className="owned-only"
            legend={texts.collectionLegend}
            name="collection-filter"
            value={collectionFilter}
            options={COLLECTION_OPTIONS}
            inputRef={(value) => (value === 'all' ? collectionAllRef : undefined)}
            onChange={onCollectionFilterChange}
          />
        )}

        {setOptions.length > 0 && onSetChange !== undefined && (
          <div className="field set-filter">
            <label htmlFor="set-filter">{texts.setLegend}</label>
            <select id="set-filter" value={setFamily ?? ''} onChange={(event) => onSetChange(event.target.value || null)}>
              <option value="">{texts.setAll}</option>
              {(['sets', 'other'] as const).map((group) => {
                const options = setOptions.filter((option) => option.group === group);
                if (options.length === 0) return null;
                return (
                  <optgroup key={group} label={group === 'sets' ? texts.setGroupSets : texts.setGroupOther}>
                    {options.map(({ family, label }) => (
                      <option key={family} value={family}>
                        {label}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
        )}

        {tagOptions.length > 0 && onTagChange !== undefined && (
          <div className="field set-filter tag-filter">
            <label htmlFor="tag-filter">{texts.tagLegend}</label>
            <select id="tag-filter" value={criteria.tag ?? ''} onChange={(event) => onTagChange(event.target.value || null)}>
              <option value="">{texts.tagAll}</option>
              {tagOptions.map(({ tag, count }) => (
                <option key={tag} value={tag} lang="en">
                  {tag} ({count})
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

          <FilterGroup legend={texts.rarityLegend} count={criteria.rarities.length}>
            <div className="options options-even options-rarity">
              {rarityOptions.map((rarity) => (
                <label key={rarity} className="option" title={rarityTitle(officialRarity(rarity))}>
                  <input
                    type="checkbox"
                    name="rarity"
                    value={rarity}
                    checked={criteria.rarities.includes(rarity)}
                    onChange={() => onToggleRarity(rarity)}
                  />{' '}
                  <RaritySymbol rarity={rarity} size={12} />
                  <span aria-hidden="true" lang="en" className="option-rarity-name">
                    {shortRarity(officialRarity(rarity))}
                  </span>
                </label>
              ))}
            </div>
          </FilterGroup>

          {onToggleSellable !== undefined && (
            <fieldset aria-describedby="filter-hint">
              <legend>{texts.sellableLegend}</legend>
              <div className="options">
                <label className="option">
                  <input type="checkbox" name="sellable" checked={criteria.sellable === true} onChange={onToggleSellable} />{' '}
                  <span>{texts.sellableOnly}</span>
                </label>
              </div>
            </fieldset>
          )}

          {NUMBER_GROUPS.map(([group, legend]) =>
            numberOptions[group].length === 0 ? null : (
              <FilterGroup key={group} legend={legend} lang="en" count={criteria[group].length} className="number-filter">
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
              </FilterGroup>
            ),
          )}
        </div>
        {(!alwaysOpen || onShowResults !== undefined) && results !== undefined && (
          <button type="button" className="button-primary filter-show-results" onClick={onShowResults ?? showResults}>
            {texts.showResults(results.count)}
          </button>
        )}
      </div>
    </form>
  );
}
