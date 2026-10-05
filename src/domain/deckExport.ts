import type { Card } from './card';
import type { CardsByKey } from './deckRules';
import type { DeckContent } from './deck';
import { UNSAFE_CHARACTERS } from './validate';
import { currentDeckMessages } from './deckMessages';

/**
 * Deck export (T-015, SR-19). Builds the file contents as strings: .json in the exchange format of
 * D-007/D-008 (no id, no timestamps) and .txt in the reference format that import reads back.
 */
export const DECK_FORMAT = 'cyberdeck.deck';
export const DECK_FORMAT_VERSION = 1;
export const DEFAULT_EXPORT_FILE_NAME = 'pakka';
export const MAX_FILE_NAME_LENGTH = 60;

export type ExportFormat = 'json' | 'txt';

// Characters not allowed in file names (SR-19). Control and direction characters come from UNSAFE_CHARACTERS.
const FILE_NAME_FORBIDDEN = /[/\\:*?"<>|]/g;

/** Removes line breaks and control characters, so a name cannot add lines or section headings. */
function singleLine(text: string): string {
  return text.replace(UNSAFE_CHARACTERS, '').trim();
}

/** "pakan nimi.json": forbidden characters removed, at most 60 characters in the name part. */
export function exportFileName(deckName: string, format: ExportFormat): string {
  const cleaned = Array.from(singleLine(deckName).replace(FILE_NAME_FORBIDDEN, ''))
    .slice(0, MAX_FILE_NAME_LENGTH)
    .join('')
    .trim()
    // A name of only dots would be a relative path, and trailing dots are dropped by Windows.
    .replace(/^\.+|\.+$/g, '')
    .trim();
  return `${cleaned === '' ? currentDeckMessages().defaultExportFileName : cleaned}.${format}`;
}

/** The deck in the exchange format. Card names are written for readability only. */
export function deckToJson(deck: DeckContent, cardsByKey: CardsByKey): string {
  const file = {
    format: DECK_FORMAT,
    version: DECK_FORMAT_VERSION,
    deck: {
      name: deck.name,
      sections: deck.sections.map((section) => ({
        name: section.name,
        cards: section.cards.map(({ card, count }) => ({
          card,
          name: cardsByKey.get(card)?.displayName ?? card,
          count,
        })),
      })),
    },
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

/** "Name - Subname" as in deck lists (displayName uses a different dash). */
function listName(card: Card): string {
  return card.subname === null ? card.name : `${card.name} - ${card.subname}`;
}

/** The deck as a reference format list: `# Name`, a Legends block and a Main deck block. */
export function deckToText(deck: DeckContent, cardsByKey: CardsByKey): string {
  const totals = new Map<string, number>();
  for (const section of deck.sections) {
    for (const { card, count } of section.cards) totals.set(card, (totals.get(card) ?? 0) + count);
  }
  const legends: string[] = [];
  const main: string[] = [];
  let legendCount = 0;
  let mainCount = 0;
  for (const [key, count] of totals) {
    const card = cardsByKey.get(key);
    const line = `${count} ${singleLine(card === undefined ? key : listName(card))}`;
    if (card?.type === 'Legend') {
      legends.push(line);
      legendCount += count;
    } else {
      main.push(line);
      mainCount += count;
    }
  }
  const lines = [`# ${singleLine(deck.name)}`];
  if (legends.length > 0) lines.push(`// Legends (${legendCount})`, ...legends);
  if (main.length > 0) lines.push(`// Main deck (${mainCount})`, ...main);
  return `${lines.join('\n')}\n`;
}

/** One card the collection lacks for a deck (T-061). */
export interface MissingCard {
  card: Card;
  missing: number;
}

/** Missing copies as a deck list ("2 Name - Subname" per line), so it can be imported later (T-061). */
export function missingToText(rows: readonly MissingCard[]): string {
  return rows.map(({ card, missing }) => `${missing} ${singleLine(listName(card))}`).join('\n') + '\n';
}
