import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, CompositionEvent, KeyboardEvent, ReactNode, Ref } from 'react';
import type { Card } from '../domain/card';
import { CARD_IMAGE_WIDTH, cardImageHeight } from '../domain/cardImage';
import { SEARCH_MAX_LENGTH } from './CardFilters';
import { cardNameText } from './CardName';
import { GalleryViewer } from './GalleryViewer';
import type { GalleryItem } from './galleryItems';
import { SegmentedChoice } from './SegmentedChoice';
import { SwitchButton } from './ListToolbar';
import { texts } from './texts';
import { useBarVisibility } from './useBarVisibility';
import type { GallerySize } from './useGallery';
import { HOVER_QUERY, useMediaQuery } from './useMediaQuery';

/** Below this width the bar keeps only the essentials (T-123): 600 px. */
const COMPACT_QUERY = '(max-width: 37.4375rem)';

const SIZE_OPTIONS: readonly (readonly [GallerySize, string])[] = [
  ['normal', texts.gallerySizeNormal],
  ['large', texts.gallerySizeLarge],
  ['huge', texts.gallerySizeHuge],
];

/** One picture of the grid: a button named after the card; a missing or failed picture shows the name instead. */
function GalleryCard({
  item,
  buttonRef,
  onOpen,
}: {
  item: GalleryItem;
  buttonRef: Ref<HTMLButtonElement>;
  onOpen: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const shown = item.src !== null && !failed;
  return (
    <li>
      <button
        type="button"
        ref={buttonRef}
        className={shown ? 'gallery-card' : 'gallery-card gallery-card--missing'}
        aria-haspopup="dialog"
        onClick={onOpen}
      >
        {shown ? (
          <img
            src={item.src ?? undefined}
            width={CARD_IMAGE_WIDTH.lg}
            height={cardImageHeight('lg')}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="gallery-card-name" aria-hidden="true" lang="en">
            {cardNameText(item.card)}
          </span>
        )}
        <span className="visually-hidden" lang="en">
          {item.label}
        </span>
      </button>
    </li>
  );
}

/**
 * The gallery (T-123): only the card art, big, on a dark ground. A thin floating bar holds the close button, the search,
 * the filters, the size and "Kaikki versiot"; it fades so the pictures stay clear. The filter panel opens in the page
 * under the bar. A card opens the full-screen viewer. The page itself scrolls; there is no scroll area inside it.
 */
export function CardGallery({
  items,
  size,
  onSizeChange,
  query,
  onQueryChange,
  searchInputRef,
  filterCount,
  renderFilters,
  allArts,
  onAllArtsChange,
  onClose,
  onClear,
  onOpenDetails,
}: {
  items: readonly GalleryItem[];
  size: GallerySize;
  onSizeChange: (next: GallerySize) => void;
  query: string;
  onQueryChange: (query: string, composing: boolean) => void;
  searchInputRef: Ref<HTMLInputElement>;
  /** Number of chosen filters, shown on the Filters button when above 0. */
  filterCount: number;
  /** The filter panel; `showResults` is for its "Näytä N korttia" button. */
  renderFilters: (showResults: () => void) => ReactNode;
  allArts: boolean;
  onAllArtsChange: (next: boolean) => void;
  onClose: () => void;
  onClear: () => void;
  /** "Kortin tiedot": opens the details of a card; focus returns to `opener`. */
  onOpenDetails: (card: Card, opener: HTMLButtonElement, artUrl: string | null) => void;
}) {
  const compact = useMediaQuery(COMPACT_QUERY, false);
  const touch = !useMediaQuery(HOVER_QUERY, true);
  const barRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const filtersToggleRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const barVisible = useBarVisibility(barRef, touch, filtersOpen);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Esc closes the gallery, but not when it belongs to something else: a dialog, or text the field would clear.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (document.querySelector('dialog[open]') !== null) return;
      onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // "Näytä N korttia": the panel closes, then (in the effect, once it is gone) the view goes to the pictures.
  const [showRequest, setShowRequest] = useState(0);
  const showResults = () => {
    setFiltersOpen(false);
    setShowRequest((n) => n + 1);
  };
  useEffect(() => {
    if (showRequest === 0) return;
    filtersToggleRef.current?.focus({ preventScroll: true });
    gridRef.current?.scrollIntoView?.({ block: 'start' });
  }, [showRequest]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onQueryChange(event.target.value, (event.nativeEvent as InputEvent).isComposing === true);
  };
  const handleCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
    onQueryChange(event.currentTarget.value, false);
  };
  const handleSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    // The same as in the filter form: Esc clears the text first (the document handler then ignores the key).
    if (event.key === 'Escape' && query !== '') {
      event.preventDefault();
      onQueryChange('', false);
    }
  };

  const closeViewer = () => {
    const current = viewer === null ? undefined : items[viewer];
    setViewer(null);
    if (current !== undefined) buttons.current.get(current.id)?.focus();
  };
  const openDetails = (index: number) => {
    const item = items[index];
    const opener = item === undefined ? undefined : buttons.current.get(item.id);
    setViewer(null);
    if (item !== undefined && opener !== undefined) onOpenDetails(item.card, opener, item.artUrl);
  };

  const searchField = (
    <input
      ref={searchInputRef}
      type="search"
      className="gallery-search"
      aria-label={texts.searchLabel}
      placeholder={texts.searchPlaceholder}
      autoComplete="off"
      spellCheck={false}
      autoCapitalize="none"
      enterKeyHint="search"
      maxLength={SEARCH_MAX_LENGTH}
      value={query}
      onChange={handleChange}
      onCompositionEnd={handleCompositionEnd}
      onKeyDown={handleSearchKey}
    />
  );

  return (
    <div className="gallery">
      <div
        ref={barRef}
        className={barVisible ? 'gallery-bar' : 'gallery-bar is-hidden'}
        role="toolbar"
        aria-label={texts.galleryOpen}
      >
        <button type="button" ref={closeRef} className="gallery-btn gallery-close" onClick={onClose}>
          <span aria-hidden="true">{texts.closeSymbol}</span>
          <span className={compact ? 'visually-hidden' : undefined}>{texts.galleryClose}</span>
        </button>
        {compact ? (
          <button
            type="button"
            className="gallery-btn gallery-search-toggle"
            aria-expanded={searchOpen}
            aria-controls="gallery-search-row"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
              <circle cx="8.5" cy="8.5" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12.5 12.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="visually-hidden">{texts.gallerySearchOpen}</span>
          </button>
        ) : (
          searchField
        )}
        <button
          type="button"
          ref={filtersToggleRef}
          className="gallery-btn gallery-filters-toggle"
          aria-expanded={filtersOpen}
          aria-controls="gallery-filters"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          {filtersOpen ? texts.galleryHideFilters : texts.galleryFilters(filterCount)}
          <span className="filter-toggle-icon" aria-hidden="true" />
        </button>
        <SegmentedChoice
          className="gallery-size"
          legend={texts.gallerySize}
          name="gallery-size"
          value={size}
          options={SIZE_OPTIONS}
          onChange={onSizeChange}
        />
        {!compact && <SwitchButton checked={allArts} label={texts.artsAllLabel} onChange={onAllArtsChange} />}
        {!compact && <span className="gallery-count">{texts.galleryCount(items.length)}</span>}
        {compact && searchOpen && (
          <div id="gallery-search-row" className="gallery-search-row">
            {searchField}
          </div>
        )}
      </div>

      {filtersOpen && (
        <div id="gallery-filters" className="gallery-filters">
          {renderFilters(showResults)}
          {compact && (
            <div className="gallery-filters-switch">
              <SwitchButton checked={allArts} label={texts.artsAllLabel} onChange={onAllArtsChange} />
            </div>
          )}
        </div>
      )}

      <div ref={gridRef} className="gallery-body">
        {items.length === 0 ? (
          <div className="gallery-empty">
            <p>{texts.galleryEmpty}</p>
            <button type="button" className="button-primary" onClick={onClear}>
              {texts.galleryClear}
            </button>
          </div>
        ) : (
          <ul className="gallery-grid" aria-label={texts.galleryLabel} data-size={size}>
            {items.map((item, index) => (
              <GalleryCard
                key={item.id}
                item={item}
                buttonRef={(node) => {
                  if (node === null) buttons.current.delete(item.id);
                  else buttons.current.set(item.id, node);
                }}
                onOpen={() => setViewer(index)}
              />
            ))}
          </ul>
        )}
      </div>

      {viewer !== null && (
        <GalleryViewer items={items} index={viewer} onIndexChange={setViewer} onClose={closeViewer} onDetails={openDetails} />
      )}
    </div>
  );
}
