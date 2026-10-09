import type { CatalogViewMode, DefaultEdition } from '../storage';
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

/** One switch style for the whole app (T-115): the "Muokkaa kokoelmaa" look. */
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
 * Above the list (T-040): the view selector and the "Muokkaa kokoelmaa" switch.
 * `editable` undefined leaves the switch out (the collection is not ready, so nothing can be edited).
 * `imageSize` undefined leaves the image size selector out (T-050a: it only applies to the grid).
 */
export function ListToolbar({
  view,
  onViewChange,
  editable,
  onEditChange,
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
      {editable === true && edition !== undefined && (
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
      {(editable !== undefined || allArts !== undefined) && (
        <div className="toolbar-switches">
          {editable !== undefined && <SwitchButton checked={editable} label={texts.editSwitchLabel} onChange={onEditChange} />}
          {allArts !== undefined && (
            <SwitchButton checked={allArts} label={texts.artsAllLabel} onChange={(next) => onAllArtsChange?.(next)} />
          )}
        </div>
      )}
    </div>
  );
}
