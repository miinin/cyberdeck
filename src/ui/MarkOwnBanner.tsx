import type { ReactNode } from 'react';
import type { DefaultEdition } from '../storage';
import { SegmentedChoice } from './SegmentedChoice';
import { texts } from './texts';

export const MARK_OPEN_ID = 'mark-open';
export const MARK_DONE_ID = 'mark-done';

const EDITION_OPTIONS: readonly (readonly [DefaultEdition, string])[] = [
  ['beta', texts.editionBeta],
  ['retail', texts.editionRetail],
];

/** A plus and a card (T-123): says "add cards" without words. */
function MarkIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false" className="mark-icon">
      <rect x="6" y="3" width="10" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h6M6 7v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Starts the marking of the cards the user owns (T-123; replaces the "Muokkaa kokoelmaa" switch).
 * The hint says what the mode does; an empty collection also gets a dimmed reminder beside the button.
 */
export function MarkOwnButton({ onStart, collectionEmpty }: { onStart: () => void; collectionEmpty: boolean }) {
  return (
    <div className="mark-open-row">
      <button
        type="button"
        id={MARK_OPEN_ID}
        className="button-secondary button-compact mark-open"
        title={texts.markHint}
        aria-describedby="mark-hint"
        onClick={onStart}
      >
        <MarkIcon />
        <span className="mark-open-label">{texts.markOpen}</span>
      </button>
      <p id="mark-hint" className="visually-hidden">
        {texts.markHint}
      </p>
      {collectionEmpty && <p className="mark-empty-hint">{texts.markEmptyHint}</p>}
    </div>
  );
}

/**
 * The bar shown while the user marks the cards they own (T-123, T-125): one row with the mode name, the edition the + adds
 * to (it only matters for marking) and "Valmis", which leaves the mode. What the mode does is a title and a description
 * only; `extra` (the "add missing to wants" link) gets a row of its own.
 */
export function MarkOwnBanner({
  edition,
  onEditionChange,
  onDone,
  extra,
}: {
  edition: DefaultEdition;
  onEditionChange: (next: DefaultEdition) => void;
  onDone: () => void;
  extra?: ReactNode;
}) {
  return (
    <section
      className="mark-banner"
      aria-labelledby="mark-banner-title"
      aria-describedby="mark-banner-body"
      title={texts.markBannerBody}
    >
      <strong id="mark-banner-title" className="mark-banner-title">
        {texts.markBannerTitle}
      </strong>
      <span id="mark-banner-body" className="visually-hidden">
        {texts.markBannerBody}
      </span>
      <div className="mark-banner-actions">
        <SegmentedChoice
          className="edition-select"
          legend={texts.editionLegend}
          name="default-edition"
          value={edition}
          options={EDITION_OPTIONS}
          describedBy="edition-hint"
          onChange={onEditionChange}
        >
          <p id="edition-hint" className="visually-hidden">
            {texts.editionHint}
          </p>
        </SegmentedChoice>
        <button type="button" id={MARK_DONE_ID} className="button-secondary button-compact" onClick={onDone}>
          {texts.markDone}
        </button>
      </div>
      {extra}
    </section>
  );
}
