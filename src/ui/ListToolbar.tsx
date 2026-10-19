import type { ReactNode } from 'react';
import type { CatalogViewMode, DefaultEdition } from '../storage';
import type { CardSort } from '../domain/cardSort';
import { MarkOwnButton } from './MarkOwnBanner';
import { SortSelect } from './SortSelect';
import { SegmentedChoice } from './SegmentedChoice';
import { texts } from './texts';

/** Grid image size (T-050a): session state only, never saved. */
export type ImageSize = 'small' | 'medium' | 'large';

const IMAGE_SIZE_OPTIONS: readonly (readonly [ImageSize, string])[] = [
  ['small', texts.imageSizeSmall],
  ['medium', texts.imageSizeMedium],
  ['large', texts.imageSizeLarge],
];

/** Pieni / Keski / Iso for an image grid (T-050a, T-050b). The name keeps radio groups apart. */
export function ImageSizeSelect({
  name,
  value,
  onChange,
  disabled,
}: {
  name: string;
  value: ImageSize;
  onChange: (next: ImageSize) => void;
  disabled?: boolean;
}) {
  return (
    <SegmentedChoice
      className="image-size-select"
      size="sm"
      legend={texts.imageSizeLegend}
      name={name}
      value={value}
      options={IMAGE_SIZE_OPTIONS}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

/** A 2x2 grid of pictures (T-125). */
function GridIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false" className="toolbar-icon">
      <path d="M3 3h5v5H3zM12 3h5v5h-5zM3 12h5v5H3zM12 12h5v5h-5z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

/** Three lines with bullets (T-125). */
function ListIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false" className="toolbar-icon">
      <path d="M7 5h10M7 10h10M7 15h10M3 5h.01M3 10h.01M3 15h.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Icon always; the word only on a wide screen (the radio keeps it as its accessible name, T-125). */
const viewLabel = (icon: ReactNode, text: string) => (
  <>
    {icon}
    <span className="toolbar-label">{text}</span>
  </>
);

export const VIEW_OPTIONS: readonly (readonly [CatalogViewMode, ReactNode])[] = [
  ['grid', viewLabel(<GridIcon />, texts.viewGrid)],
  ['table', viewLabel(<ListIcon />, texts.viewTable)],
];

const EDITION_OPTIONS: readonly (readonly [DefaultEdition, string])[] = [
  ['beta', texts.editionBeta],
  ['retail', texts.editionRetail],
];

/** Four corners (expand) around a card: opens the gallery (T-123). */
function GalleryIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M3 8V3h5M12 3h5v5M17 12v5h-5M8 17H3v-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** One switch style for the whole app (T-115). */
export function SwitchButton({
  checked,
  label,
  onChange,
  disabled,
}: {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="edit-switch" disabled={disabled} onClick={() => onChange(!checked)}>
      <span className="edit-switch-track" aria-hidden="true">
        <span className="edit-switch-thumb" />
      </span>
      {label}
    </button>
  );
}

/**
 * Above the list (T-040, T-125): one row with the view selector, the gallery button (T-123), the scan button and, at the
 * right end, the "Merkitse omat kortit" button. "Kaikki versiot" and the order live in the filter panel.
 * `editable` undefined leaves the button out (the collection is not ready, so nothing can be edited);
 * while marking (`editable` true) the banner below the toolbar replaces it (T-123).
 * `imageSize` undefined leaves the image size selector out; `imageSizeDisabled` greys it out in the list view, so the row
 * does not jump when the view changes (T-126).
 */
export function ListToolbar({
  view,
  onViewChange,
  editable,
  onEditChange,
  collectionEmpty = false,
  onGalleryOpen,
  hideEditSwitch = false,
  imageSize,
  onImageSizeChange,
  edition,
  onEditionChange,
  scanSlot,
  endSlot,
  imageSizeDisabled = false,
  sort,
  onSortChange,
}: {
  view: CatalogViewMode;
  onViewChange: (next: CatalogViewMode) => void;
  editable: boolean | undefined;
  onEditChange: (next: boolean) => void;
  /** The collection has no cards: the marking button gets a reminder beside it (T-123). */
  collectionEmpty?: boolean;
  /** Opens the gallery (T-123); undefined leaves the button out. */
  onGalleryOpen?: () => void;
  /** The edit switch is left out and editing is always on (the Collection page's own cards, T-112). */
  hideEditSwitch?: boolean;
  imageSize?: ImageSize;
  onImageSizeChange?: (next: ImageSize) => void;
  /** The default edition of the + and − (D-022); shown only while editing. Undefined leaves it out. */
  edition?: DefaultEdition;
  onEditionChange?: (next: DefaultEdition) => void;
  /** The scan button (T-125): sits in the row after the gallery button. */
  scanSlot?: ReactNode;
  /** A quiet tool at the end of the row (T-181: the Collection list's "Add missing to wants"). */
  endSlot?: ReactNode;
  /** The image size only applies to the grid (T-050a); in the list it stays in place but greyed out (T-126). */
  imageSizeDisabled?: boolean;
  /** The order of the cards (T-181: in the tool row, not in the filter panel); undefined leaves it out. */
  sort?: CardSort;
  onSortChange?: (next: CardSort) => void;
}) {
  return (
    <div className="list-toolbar">
      <SegmentedChoice size="sm" legend={texts.viewLegend} name="catalog-view" value={view} options={VIEW_OPTIONS} onChange={onViewChange} />
      {imageSize !== undefined && (
        <ImageSizeSelect name="image-size" value={imageSize} onChange={(next) => onImageSizeChange?.(next)} disabled={imageSizeDisabled} />
      )}
      {onGalleryOpen !== undefined && (
        <button type="button" id="gallery-open" className="button-quiet gallery-open" onClick={onGalleryOpen}>
          <GalleryIcon />
          <span className="toolbar-label">{texts.galleryOpen}</span>
        </button>
      )}
      {scanSlot}
      {sort !== undefined && onSortChange !== undefined && <SortSelect toolbar sort={sort} onChange={onSortChange} />}
      {editable === true && hideEditSwitch && edition !== undefined && (
        <SegmentedChoice
          className="edition-select"
          legend={texts.editionLegend}
          name="default-edition"
          value={edition}
          options={EDITION_OPTIONS}
          size="sm"
          describedBy="edition-hint"
          onChange={onEditionChange ?? (() => undefined)}
        >
          <p id="edition-hint" className="visually-hidden">
            {texts.editionHint}
          </p>
        </SegmentedChoice>
      )}
      {editable === false && !hideEditSwitch && (
        <MarkOwnButton onStart={() => onEditChange(true)} collectionEmpty={collectionEmpty} />
      )}
      {endSlot !== undefined && <div className="toolbar-end">{endSlot}</div>}
    </div>
  );
}
