/*
 * `npm run cards:update` (D-013 osa 2, ARCHITECTURE.md 13.4): fetches every card from Netdeck.gg once,
 * validates it and writes src/data/cards.json only when the content changed. A developer runs this by
 * hand; it is not part of the build (SR-7). File access is injected, so tests need no disk or network.
 */
import { fetchAllCards } from '../../src/api';
import type { Card } from '../../src/domain/card';
import { parseCardFile, toCardFile } from '../../src/domain/cardFile';
import type { CardFile } from '../../src/domain/cardFile';
import { diffCardFiles } from './cardFileDiff';
import type { CardFileDiff } from './cardFileDiff';

export const CARDS_JSON_PATH = 'src/data/cards.json';

export interface UpdateCardsDeps {
  /** Defaults to globalThis.fetch; tests inject a fake. */
  fetchFn?: typeof fetch;
  /** Returns null when the file does not exist. */
  readText: (path: string) => Promise<string | null>;
  writeText: (path: string, text: string) => Promise<void>;
  log: (line: string) => void;
}

export type UpdateCardsResult =
  | { status: 'unchanged'; count: number }
  | { status: 'written'; count: number; diff: CardFileDiff }
  /** The data file was not touched. */
  | { status: 'failed'; reason: string };

/** The exact bytes of the data file: same cards in, same text out (D-013 osa 2). */
export function serializeCardFile(file: CardFile): string {
  return `${JSON.stringify(file, null, 2)}\n`;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function firstDuplicateKey(cards: readonly Card[]): string | null {
  const seen = new Set<string>();
  for (const card of cards) {
    if (seen.has(card.key)) return card.key;
    seen.add(card.key);
  }
  return null;
}

/** Fetches and checks the cards; returns them, or the reason the update must stop. */
async function fetchCheckedCards(fetchFn: typeof fetch | undefined): Promise<Card[] | string> {
  let catalog;
  try {
    catalog = await fetchAllCards({ fetchFn });
  } catch (error) {
    return `Fetching cards failed: ${message(error)}`;
  }
  const { cards, reportedTotal, skipped } = catalog;
  // Partial data is never written: the app has no partial state any more (D-013 osa 1).
  if (skipped > 0) return `${skipped} card(s) were rejected by mapCard`;
  if (cards.length !== reportedTotal) return `Received ${cards.length} cards, API reported ${reportedTotal}`;
  const duplicate = firstDuplicateKey(cards);
  if (duplicate !== null) return `Duplicate card key "${duplicate}"`;
  return cards;
}

/** Reads and validates the current file. A missing or broken file gives null (a broken one with a warning). */
async function readPrevious(deps: UpdateCardsDeps): Promise<{ text: string | null; cards: Card[] | null }> {
  const text = await deps.readText(CARDS_JSON_PATH);
  if (text === null) return { text, cards: null };
  try {
    return { text, cards: parseCardFile(JSON.parse(text)) };
  } catch (error) {
    deps.log(`WARNING: the current ${CARDS_JSON_PATH} is not valid (${message(error)}); it will be replaced.`);
    return { text, cards: null };
  }
}

function logDiff(diff: CardFileDiff, log: (line: string) => void): void {
  if (diff.added.length > 0) log(`Added (${diff.added.length}): ${diff.added.join(', ')}`);
  if (diff.removed.length > 0) {
    log(
      `Removed (${diff.removed.length}): ${diff.removed.join(', ')}  WARNING: saved collections may refer to these keys`,
    );
  }
  if (diff.changed.length > 0) {
    const items = diff.changed.map(({ key, fields }) => `${key} (${fields.join(', ')})`);
    log(`Changed (${diff.changed.length}): ${items.join(', ')}`);
  }
}

export async function updateCards(deps: UpdateCardsDeps): Promise<UpdateCardsResult> {
  const fail = (reason: string): UpdateCardsResult => {
    deps.log(`FAILED: ${reason}. ${CARDS_JSON_PATH} was not changed.`);
    return { status: 'failed', reason };
  };

  deps.log('Fetching cards from Netdeck.gg…');
  const cards = await fetchCheckedCards(deps.fetchFn);
  if (typeof cards === 'string') return fail(cards);

  const text = serializeCardFile(toCardFile(cards));
  try {
    // Round trip: exactly what the app will bundle must pass the same validation as cards.test.ts.
    parseCardFile(JSON.parse(text));
  } catch (error) {
    return fail(`Validation failed: ${message(error)}`);
  }

  let previous;
  try {
    previous = await readPrevious(deps);
  } catch (error) {
    return fail(`Reading ${CARDS_JSON_PATH} failed: ${message(error)}`);
  }

  deps.log(`Cards: ${cards.length}`);
  if (previous.text === text) {
    deps.log('No changes');
    return { status: 'unchanged', count: cards.length };
  }

  const diff = diffCardFiles(previous.cards ?? [], cards);
  logDiff(diff, deps.log);
  try {
    await deps.writeText(CARDS_JSON_PATH, text);
  } catch (error) {
    return fail(`Writing ${CARDS_JSON_PATH} failed: ${message(error)}`);
  }
  deps.log(`Wrote ${CARDS_JSON_PATH}`);
  return { status: 'written', count: cards.length, diff };
}
