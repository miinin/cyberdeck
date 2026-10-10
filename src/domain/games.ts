/*
 * Game results of the user's decks (T-122, D-030). One log, one row per game. Like every stored value it is
 * validated on every read (SR-23, SR-44): rows are built field by field from whitelisted fields, text is cleaned
 * of control characters before its length is checked, and a row with an unknown field or a bad value is dropped.
 */
import { isCardKey } from './cardKey';
import type { CardKey } from './cardKey';
import type { DeckId } from './deck';
import { isDeckId, isRecord, UNSAFE_CHARACTERS } from './validate';
import type { Parsed } from './validate';

export type GameResult = 'win' | 'loss' | 'draw';
export type GameTurn = 'first' | 'second';

export interface GameRecord {
  /** `[A-Za-z0-9_-]{1,64}`, made by the app. */
  readonly id: string;
  readonly deckId: DeckId;
  /** 'YYYY-MM-DD', a real calendar day. */
  readonly playedOn: string;
  /** ISO time of the entry: the order inside one day. */
  readonly createdAt: string;
  readonly result: GameResult;
  readonly opponentName: string | null;
  readonly opponentLegends: readonly CardKey[];
  readonly turn: GameTurn | null;
  readonly event: string | null;
  readonly sideboard: boolean;
  readonly note: string | null;
}

export interface GameLog {
  readonly games: readonly GameRecord[];
}

/** What the user chooses; the app adds `id` and `createdAt`. */
export type GameInput = Omit<GameRecord, 'id' | 'createdAt'>;

export const EMPTY_GAME_LOG: GameLog = Object.freeze({ games: Object.freeze([]) });

export const MAX_GAMES = 1000;
/** Firestore's limit is 1 MiB per document; the encoded log stays below this (UTF-8 bytes). */
export const MAX_GAME_LOG_BYTES = 900_000;
export const MAX_OPPONENT_LENGTH = 60;
export const MAX_EVENT_LENGTH = 60;
export const MAX_NOTE_LENGTH = 500;
export const MAX_OPPONENT_LEGENDS = 3;
const MAX_LEGEND_KEY_LENGTH = 64;

export const GAME_RESULTS: readonly GameResult[] = ['win', 'loss', 'draw'];

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const FIELDS: ReadonlySet<string> = new Set([
  'id',
  'deckId',
  'playedOn',
  'createdAt',
  'result',
  'opponentName',
  'opponentLegends',
  'turn',
  'event',
  'sideboard',
  'note',
]);

export function isGameId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value);
}

/** True for 'YYYY-MM-DD' that is a real calendar day (not 2026-02-30). */
export function isPlayedOn(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = DAY_PATTERN.exec(value);
  if (match === null) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Today in the user's local time as 'YYYY-MM-DD'. */
export function localDay(at: Date): string {
  const pad = (n: number, width = 2) => String(n).padStart(width, '0');
  return `${pad(at.getFullYear(), 4)}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}

/** Cleaned optional text: undefined = not valid (not a string/null, or too long once cleaned), null = empty. */
function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const cleaned = value.normalize('NFC').replace(UNSAFE_CHARACTERS, '').trim();
  if (cleaned.length === 0) return null;
  return cleaned.length <= max ? cleaned : undefined;
}

function parseLegends(value: unknown): CardKey[] | null {
  if (!Array.isArray(value) || value.length > MAX_OPPONENT_LEGENDS) return null;
  const legends: CardKey[] = [];
  for (const item of value as unknown[]) {
    if (!isCardKey(item) || item.length > MAX_LEGEND_KEY_LENGTH || legends.includes(item)) return null;
    legends.push(item);
  }
  return legends;
}

/** One row, or null when anything about it is not valid (SR-44). Builds the result from whitelisted fields only. */
export function parseGameRecord(raw: unknown): GameRecord | null {
  if (!isRecord(raw)) return null;
  for (const key of Object.keys(raw)) if (!FIELDS.has(key)) return null;
  const { id, deckId, playedOn, createdAt, result, turn, sideboard } = raw;
  if (!isGameId(id) || !isDeckId(deckId) || !isPlayedOn(playedOn)) return null;
  if (typeof createdAt !== 'string' || createdAt.length < 1 || createdAt.length > 40 || !Number.isFinite(Date.parse(createdAt))) return null;
  if (result !== 'win' && result !== 'loss' && result !== 'draw') return null;
  if (turn !== null && turn !== 'first' && turn !== 'second') return null;
  if (typeof sideboard !== 'boolean') return null;
  const opponentName = optionalText(raw.opponentName, MAX_OPPONENT_LENGTH);
  const event = optionalText(raw.event, MAX_EVENT_LENGTH);
  const note = optionalText(raw.note, MAX_NOTE_LENGTH);
  const opponentLegends = parseLegends(raw.opponentLegends);
  if (opponentName === undefined || event === undefined || note === undefined || opponentLegends === null) return null;
  return { id, deckId, playedOn, createdAt, result, opponentName, opponentLegends, turn, event, sideboard, note };
}

/** Newest day first, then newest entry first; the id makes the order total. */
export function compareGames(a: GameRecord, b: GameRecord): number {
  if (a.playedOn !== b.playedOn) return a.playedOn < b.playedOn ? 1 : -1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
  if (a.id === b.id) return 0;
  return a.id < b.id ? 1 : -1;
}

/**
 * `{ games: [...] }`. Null when the root is wrong or there are more than MAX_GAMES rows (such a log is invalid as
 * a whole and never overwritten, SR-44). Invalid rows and repeated ids (the first stays) are dropped and counted.
 */
export function parseGameLog(raw: unknown): Parsed<GameLog> | null {
  if (!isRecord(raw) || !Array.isArray(raw.games)) return null;
  const input: unknown[] = raw.games;
  if (input.length > MAX_GAMES) return null;
  const seen = new Set<string>();
  const games: GameRecord[] = [];
  let dropped = 0;
  for (const item of input) {
    const game = parseGameRecord(item);
    if (game === null || seen.has(game.id)) {
      dropped += 1;
      continue;
    }
    seen.add(game.id);
    games.push(game);
  }
  games.sort(compareGames);
  return { value: { games }, dropped };
}

/** UTF-8 size of the stored log, a close estimate of the encoded document (SR-45). */
export function gameLogBytes(log: GameLog): number {
  return new TextEncoder().encode(JSON.stringify(log.games)).length;
}

/** True when the log is within both limits (SR-45). */
export function gameLogFits(log: GameLog): boolean {
  return log.games.length <= MAX_GAMES && gameLogBytes(log) <= MAX_GAME_LOG_BYTES;
}

export function sameGame(a: GameRecord | undefined, b: GameRecord | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  return (
    a.id === b.id &&
    a.deckId === b.deckId &&
    a.playedOn === b.playedOn &&
    a.createdAt === b.createdAt &&
    a.result === b.result &&
    a.opponentName === b.opponentName &&
    a.turn === b.turn &&
    a.event === b.event &&
    a.sideboard === b.sideboard &&
    a.note === b.note &&
    a.opponentLegends.length === b.opponentLegends.length &&
    a.opponentLegends.every((key, index) => key === b.opponentLegends[index])
  );
}

export function sameGameLog(a: GameLog, b: GameLog): boolean {
  return a.games.length === b.games.length && a.games.every((game, index) => sameGame(game, b.games[index]));
}

/** The games of one deck, in log order. */
export function gamesOfDeck(log: GameLog, deckId: DeckId): GameRecord[] {
  return log.games.filter((game) => game.deckId === deckId);
}

/** The log without the games of decks that no longer exist (orphans of a deck deleted on another device). */
export function withoutOrphans(log: GameLog, deckIds: ReadonlySet<DeckId>): GameLog {
  const games = log.games.filter((game) => deckIds.has(game.deckId));
  return games.length === log.games.length ? log : { games };
}

/** The log without the games of one deck. Same object when the deck has none. */
export function withoutDeck(log: GameLog, deckId: DeckId): GameLog {
  const games = log.games.filter((game) => game.deckId !== deckId);
  return games.length === log.games.length ? log : { games };
}

/** The log with `game` added or replaced by id, in order. */
export function withGame(log: GameLog, game: GameRecord): GameLog {
  return { games: [...log.games.filter((item) => item.id !== game.id), game].sort(compareGames) };
}
