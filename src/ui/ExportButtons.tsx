import type { DeckContent } from '../domain/deck';
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
    </>
  );
}
