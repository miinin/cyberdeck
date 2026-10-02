import type { Card } from './card';
import type { CardKey } from './cardKey';
import type { Deck, DeckContent } from './deck';
import { validateDeck } from './deckRules';
import type { CardsByKey, DeckIssue } from './deckRules';
import { DEFAULT_IMPORT_NAME } from './deckText';
import type { ImportedRow, ParsedDeckText } from './deckText';

export interface ReportRow {
  readonly card: Card;
  readonly needed: number;
  readonly owned: number;
  /** Copies the collection lacks (0 when it has enough). */
  readonly missing: number;
  /** Names of the user's saved decks that contain the card. */
  readonly inDecks: readonly string[];
}

export interface ImportReport {
  readonly rows: readonly ReportRow[];
  /** Total missing copies. */
  readonly missingTotal: number;
  readonly missingRows: readonly ReportRow[];
  readonly unrecognized: readonly string[];
  /** Sideboard cards compared with the collection (not part of the saved deck). */
  readonly sideboardRows: readonly ReportRow[];
  readonly source: ParsedDeckText['source'] | null;
  readonly issues: readonly DeckIssue[];
  /** The deck that "Tallenna pakaksi" would create, with the name from the list or the default. */
  readonly content: DeckContent;
}

/** Compares an imported list with the collection and the saved decks (T-014). Pure: nothing is saved. */
export function buildImportReport(
  parsed: ParsedDeckText,
  owned: ReadonlyMap<CardKey, number>,
  decks: readonly Deck[],
  cardsByKey: CardsByKey,
): ImportReport {
  const toRow = ({ card, count }: ImportedRow): ReportRow => {
    const have = owned.get(card.key) ?? 0;
    const inDecks = decks
      .filter((deck) => deck.sections.some((section) => section.cards.some((row) => row.card === card.key)))
      .map((deck) => deck.name);
    return { card, needed: count, owned: have, missing: Math.max(0, count - have), inDecks };
  };
  const rows = parsed.rows.map(toRow);
  const content: DeckContent = {
    name: parsed.name ?? DEFAULT_IMPORT_NAME,
    sections: [{ name: '', cards: parsed.rows.map(({ card, count }) => ({ card: card.key, count })) }],
  };
  const missingRows = rows.filter((row) => row.missing > 0);
  return {
    rows,
    missingTotal: missingRows.reduce((sum, row) => sum + row.missing, 0),
    missingRows,
    unrecognized: parsed.unrecognized,
    sideboardRows: (parsed.sideboard ?? []).map(toRow),
    source: parsed.source ?? null,
    issues: validateDeck(content, cardsByKey),
    content,
  };
}
