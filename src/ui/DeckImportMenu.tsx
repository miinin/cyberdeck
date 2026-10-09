import { useEffect, useId, useRef, useState } from 'react';
import { cameraSupported } from './CardScanner';
import { CameraIcon } from './CameraIcon';
import { Chevron } from './Chevron';
import { scannerTexts } from './scannerTexts';
import { deckTexts } from './deckTexts';

/**
 * The deck page's actions on one row (T-117): "+ New deck" and a secondary "Import ▾" menu with the two import
 * sources. The menu closes with Escape (focus returns to the toggle) and with a press outside it.
 */
export function DeckActions({
  onCreate,
  onScan,
  onImport,
}: {
  onCreate: () => void;
  /** Creates a deck and opens the scanner for it (T-119). */
  onScan: () => void;
  onImport: (source: 'text' | 'link') => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const pick = (source: 'text' | 'link') => {
    setOpen(false);
    onImport(source);
  };

  return (
    <div className="deck-actions" ref={rootRef}>
      <button type="button" className="button-primary" onClick={onCreate}>
        <span aria-hidden="true" className="button-plus">
          +
        </span>
        {deckTexts.newDeck}
      </button>
      {cameraSupported() && (
        <button type="button" className="button-secondary scan-open" onClick={onScan}>
          <CameraIcon />
          {scannerTexts.scanNewDeck}
        </button>
      )}
      <button
        ref={toggleRef}
        type="button"
        className="button-secondary"
        data-focus-id="import-menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        {deckTexts.importMenu}
        <Chevron direction="down" size={12} className="button-caret" />
      </button>
      <div id={panelId} className="export-menu-panel deck-actions-panel" hidden={!open}>
        <button type="button" className="button-secondary" onClick={() => pick('text')}>
          {deckTexts.importButton}
        </button>
        <button type="button" className="button-secondary" onClick={() => pick('link')}>
          {deckTexts.fetchNetdeck}
        </button>
      </div>
    </div>
  );
}
