import type { CatalogViewMode, DefaultEdition } from '../storage';
import { MarkOwnButton } from './MarkOwnBanner';
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
}: {
  name: string;
  value: ImageSize;
  onChange: (next: ImageSize) => void;
}) {
  return (
    <SegmentedChoice
      className="image-size-select"
      legend={texts.imageSizeLegend}
      name={name}
      value={value}
      options={IMAGE_SIZE_OPTIONS}
      onChange={onChange}
    />
  );
}

const VIEW_OPTIONS: readonly (readonly [CatalogViewMode, string])[] = [
  ['grid', texts.viewGrid],
  ['table', texts.viewTable],
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
export function SwitchButton({ checked, label, onChange }: { checked: boolean; label: string; onChange: (next: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="edit-switch" onClick={() => onChange(!checked)}>
      <span className="edit-switch-track" aria-hidden="true">
        <span className="edit-switch-thumb" />
      </span>
      {label}
    </button>
  );
}

/**
 * Above the list (T-040): the view selector, the gallery button (T-123) and the "Merkitse omat kortit" button.
 * `editable` undefined leaves the button out (the collection is not ready, so nothing can be edited);
 * while marking (`editable` true) the banner below the toolbar replaces it (T-123).
 * `imageSize` undefined leaves the image size selector out (T-050a: it only applies to the grid).
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
  allArts,
  onAllArtsChange,
  edition,
  onEditionChange,
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
  /** The "all arts" switch (D-021); undefined leaves it out. Session state, never saved. */
  allArts?: boolean;
  onAllArtsChange?: (next: boolean) => void;
  /** The default edition of the + and − (D-022); shown only while editing. Undefined leaves it out. */
  edition?: DefaultEdition;
  onEditionChange?: (next: DefaultEdition) => void;
}) {
  return (
    <div className="list-toolbar">
      <SegmentedChoice legend={texts.viewLegend} name="catalog-view" value={view} options={VIEW_OPTIONS} onChange={onViewChange} />
      {imageSize !== undefined && (
        <ImageSizeSelect name="image-size" value={imageSize} onChange={(next) => onImageSizeChange?.(next)} />
      )}
      {onGalleryOpen !== undefined && (
        <button type="button" id="gallery-open" className="button-secondary gallery-open" onClick={onGalleryOpen}>
          <GalleryIcon />
          {texts.galleryOpen}
        </button>
      )}
      {editable === true && hideEditSwitch && edition !== undefined && (
        <SegmentedChoice
          className="edition-select"
          legend={texts.editionLegend}
          name="default-edition"
          value={edition}
          options={EDITION_OPTIONS}
          describedBy="edition-hint"
          onChange={onEditionChange ?? (() => undefined)}
        >
          <p id="edition-hint" className="visually-hidden">
            {texts.editionHint}
          </p>
        </SegmentedChoice>
      )}
      {((editable === false && !hideEditSwitch) || allArts !== undefined) && (
        <div className="toolbar-switches">
          {editable === false && !hideEditSwitch && <MarkOwnButton onStart={() => onEditChange(true)} collectionEmpty={collectionEmpty} />}
          {allArts !== undefined && (
            <SwitchButton checked={allArts} label={texts.artsAllLabel} onChange={(next) => onAllArtsChange?.(next)} />
          )}
        </div>
      )}
    </div>
  );
}
