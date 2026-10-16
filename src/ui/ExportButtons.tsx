import { useId, useRef, useState } from 'react';
import type { DeckContent } from '../domain/deck';
import { encodeDeckShare } from '../domain/deckShare';
import { deckToJson, deckToText, exportFileName } from '../domain/deckExport';
import type { ExportFormat } from '../domain/deckExport';
import type { CardsByKey } from '../domain/deckRules';
import { deckTexts } from './deckTexts';
import { downloadTextFile } from './downloadFile';
import { QrDialog } from './QrDialog';
import { TournamentListDialog } from './TournamentListDialog';

/** Share glyph (a box with an arrow out), shared with the export menu button (T-071). */
export function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </svg>
  );
}

/** One "Vie ja jaa" menu per deck: .json (T-015), .txt and a share link (T-056); T-071 folded them into one button. */
export function ExportButtons({ deck, cardsByKey }: { deck: DeckContent; cardsByKey: CardsByKey }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  /** Closes the panel and returns focus to the toggle, so it never falls to the page (WCAG 2.4.3). */
  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };
  const exportAs = (format: ExportFormat) => {
    close();
    const text = format === 'json' ? deckToJson(deck, cardsByKey) : deckToText(deck, cardsByKey);
    const mime = format === 'json' ? 'application/json' : 'text/plain;charset=utf-8';
    downloadTextFile(exportFileName(deck.name, format), text, mime);
  };
  const [shared, setShared] = useState<'copied' | 'failed' | null>(null);
  const [link, setLink] = useState('');
  const share = async () => {
    close();
    const url = `${window.location.origin}/#/jaa/${encodeDeckShare(deck, cardsByKey)}`;
    setLink(url);
    try {
      await navigator.clipboard.writeText(url);
      setShared('copied');
    } catch {
      setShared('failed');
    }
  };
  const [qrLink, setQrLink] = useState<string | null>(null);
  const showQr = () => {
    close();
    setQrLink(`${window.location.origin}/#/jaa/${encodeDeckShare(deck, cardsByKey)}`);
  };
  const [tlOpen, setTlOpen] = useState(false);
  const showTournamentList = () => {
    close();
    setTlOpen(true);
  };
  return (
    <div
      className="export-menu"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          close();
        }
      }}
    >
      <button
        ref={toggleRef}
        type="button"
        className="button-secondary export-menu-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={deckTexts.forDeck(deckTexts.exportAndShare, deck.name)}
        title={deckTexts.exportAndShare}
        onClick={() => setOpen(!open)}
      >
        <ShareIcon />
      </button>
      <div id={panelId} className="export-menu-panel" hidden={!open}>
        <button
          type="button"
          className="button-secondary"
          aria-label={deckTexts.forDeck(deckTexts.exportJson, deck.name)}
          onClick={() => exportAs('json')}
        >
          {deckTexts.exportJson}
        </button>
        <button
          type="button"
          className="button-secondary"
          aria-label={deckTexts.forDeck(deckTexts.exportTxt, deck.name)}
          onClick={() => exportAs('txt')}
        >
          {deckTexts.exportTxt}
        </button>
        <button
          type="button"
          className="button-secondary"
          aria-label={deckTexts.forDeck(deckTexts.shareButton, deck.name)}
          onClick={() => void share()}
        >
          {deckTexts.shareButton}
        </button>
        <button
          type="button"
          className="button-secondary"
          aria-label={deckTexts.qrFor(deck.name)}
          onClick={showQr}
        >
          {deckTexts.qrButton}
        </button>
        <button type="button" className="button-secondary" aria-label={deckTexts.tlTitle(deck.name)} onClick={showTournamentList}>
          {deckTexts.tlButton}
        </button>
      </div>
      <QrDialog
        open={qrLink !== null}
        title={deckTexts.qrFor(deck.name)}
        link={qrLink ?? ''}
        onClose={() => {
          setQrLink(null);
          toggleRef.current?.focus();
        }}
      />
      <TournamentListDialog
        open={tlOpen}
        deck={deck}
        cardsByKey={cardsByKey}
        onClose={() => {
          setTlOpen(false);
          toggleRef.current?.focus();
        }}
      />
      <span className="hint" role="status">
        {shared === 'copied' ? deckTexts.shareCopied : ''}
      </span>
      {shared === 'failed' && (
        <span>
          <label>
            {deckTexts.shareCopyFailed}
            <input
              type="text"
              readOnly
              value={link}
              aria-label={deckTexts.shareLinkLabel}
              onFocus={(e) => e.target.select()}
            />
          </label>
        </span>
      )}
    </div>
  );
}
