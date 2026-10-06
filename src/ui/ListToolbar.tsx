import type { CatalogViewMode, DefaultEdition } from '../storage';
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
    <fieldset className="view-select image-size-select">
      <legend>{texts.imageSizeLegend}</legend>
      <div className="options">
        {IMAGE_SIZE_OPTIONS.map(([option, label]) => (
          <label key={option} className="option">
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />{' '}
            {label}
          </label>
        ))}
      </div>
    </fieldset>
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
      <fieldset className="view-select">
        <legend>{texts.viewLegend}</legend>
        <div className="options">
          {VIEW_OPTIONS.map(([value, label]) => (
            <label key={value} className="option">
              <input
                type="radio"
                name="catalog-view"
                value={value}
                checked={view === value}
                onChange={() => onViewChange(value)}
              />{' '}
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {imageSize !== undefined && (
        <ImageSizeSelect name="image-size" value={imageSize} onChange={(next) => onImageSizeChange?.(next)} />
      )}
      {allArts !== undefined && (
        <label className="option all-arts">
          <input type="checkbox" checked={allArts} onChange={(event) => onAllArtsChange?.(event.target.checked)} /> {texts.artsAllLabel}
        </label>
      )}
      {editable === true && edition !== undefined && (
        <fieldset className="view-select edition-select">
          <legend>{texts.editionLegend}</legend>
          <div className="options">
            {EDITION_OPTIONS.map(([value, label]) => (
              <label key={value} className="option">
                <input
                  type="radio"
                  name="default-edition"
                  value={value}
                  checked={edition === value}
                  aria-describedby="edition-hint"
                  onChange={() => onEditionChange?.(value)}
                />{' '}
                {label}
              </label>
            ))}
          </div>
          <p id="edition-hint" className="visually-hidden">
            {texts.editionHint}
          </p>
        </fieldset>
      )}
      {editable !== undefined && (
        <button
          type="button"
          role="switch"
          aria-checked={editable}
          className="edit-switch"
          onClick={() => onEditChange(!editable)}
        >
          <span className="edit-switch-track" aria-hidden="true">
            <span className="edit-switch-thumb" />
          </span>
          {texts.editSwitchLabel}
        </button>
      )}
    </div>
  );
}
