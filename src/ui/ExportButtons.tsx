import { useState } from 'react';
import type { DeckContent } from '../domain/deck';
import { encodeDeckShare } from '../domain/deckShare';
import { deckToJson, deckToText, exportFileName } from '../domain/deckExport';
import type { ExportFormat } from '../domain/deckExport';
import type { CardsByKey } from '../domain/deckRules';
import { deckTexts } from './deckTexts';
import { downloadTextFile } from './downloadFile';

/** "Vie" buttons of one deck: .json (exchange format) and .txt (deck list), T-015. */
export function ExportButtons({ deck, cardsByKey }: { deck: DeckContent; cardsByKey: CardsByKey }) {
  const exportAs = (format: ExportFormat) => {
    const text = format === 'json' ? deckToJson(deck, cardsByKey) : deckToText(deck, cardsByKey);
    const mime = format === 'json' ? 'application/json' : 'text/plain;charset=utf-8';
    downloadTextFile(exportFileName(deck.name, format), text, mime);
  };
  const [shared, setShared] = useState<'copied' | 'failed' | null>(null);
  const [link, setLink] = useState('');
  const share = async () => {
    const url = `${window.location.origin}/#/jaa/${encodeDeckShare(deck, cardsByKey)}`;
    setLink(url);
    try {
      await navigator.clipboard.writeText(url);
      setShared('copied');
    } catch {
      setShared('failed');
    }
  };
  return (
    <>
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
      {shared === 'copied' && (
        <span className="hint" role="status">
          {deckTexts.shareCopied}
        </span>
      )}
      {shared === 'failed' && (
        <span role="status">
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
    </>
  );
}
