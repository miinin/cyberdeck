/*
 * Statistics of a deck's game results (T-122). Pure functions over the games of one deck. Free text is grouped
 * with a Map and never with the text as an object key, so a name like `__proto__` is only a name (SR-46).
 */
import type { CardKey } from './cardKey';
import type { GameRecord } from './games';

export interface Tally {
  readonly games: number;
  readonly wins: number;
  readonly losses: number;
  readonly draws: number;
  /** Wins of all games as a whole percent, or null without games. A draw counts as a game. */
  readonly winRate: number | null;
}

export function tally(games: readonly Pick<GameRecord, 'result'>[]): Tally {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  for (const game of games) {
    if (game.result === 'win') wins += 1;
    else if (game.result === 'loss') losses += 1;
    else draws += 1;
  }
  const total = games.length;
  return { games: total, wins, losses, draws, winRate: total === 0 ? null : Math.round((wins / total) * 100) };
}

export interface TurnRates {
  /** The win percent when going first / second, or null when no game with that turn is recorded. */
  readonly first: number | null;
  readonly second: number | null;
  /** True when at least one game has a recorded turn. */
  readonly recorded: boolean;
}

export function turnRates(games: readonly GameRecord[]): TurnRates {
  const first = tally(games.filter((game) => game.turn === 'first'));
  const second = tally(games.filter((game) => game.turn === 'second'));
  return { first: first.winRate, second: second.winRate, recorded: first.games + second.games > 0 };
}

/** The grouping key of a free text: case and repeated spaces do not matter. */
export function textKey(text: string): string {
  return text.normalize('NFC').toLocaleLowerCase('en').replace(/\s+/g, ' ').trim();
}

export type OpponentKind = 'name' | 'legends' | 'unknown';

export interface OpponentRow extends Tally {
  readonly kind: OpponentKind;
  /** The name as the newest game spelled it, the Legend names joined, or null for "unknown". */
  readonly label: string | null;
}

export interface ColourRow extends Tally {
  /** The colours of the Legends, each once, in a fixed order. */
  readonly colours: readonly string[];
}

export interface EventRow extends Tally {
  readonly label: string;
}

/** Name of a Legend card, or null when the key is not a known card (such Legends are kept but not shown). */
export type LegendInfo = (key: CardKey) => { name: string; colour: string | null } | null;

const COLOUR_ORDER = ['Red', 'Yellow', 'Green', 'Blue'];

function compareRows(a: Tally & { label?: string | null }, b: Tally & { label?: string | null }): number {
  if (a.games !== b.games) return b.games - a.games;
  // A row without a label ("unknown") goes last among equals.
  const left = a.label ?? '￿';
  const right = b.label ?? '￿';
  return left < right ? -1 : left > right ? 1 : 0;
}

/** The Legend names of a game that are known, sorted. */
function legendNames(game: GameRecord, info: LegendInfo): string[] {
  const names: string[] = [];
  for (const key of game.opponentLegends) {
    const legend = info(key);
    if (legend !== null) names.push(legend.name);
  }
  return names.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** One row per opponent: the name, else the Legends, else "unknown". Most games first. */
export function byOpponent(games: readonly GameRecord[], info: LegendInfo): OpponentRow[] {
  const groups = new Map<string, { kind: OpponentKind; label: string | null; games: GameRecord[] }>();
  for (const game of games) {
    const name = game.opponentName === null ? '' : textKey(game.opponentName);
    let key: string;
    let kind: OpponentKind;
    let label: string | null;
    if (name !== '') {
      key = `n:${name}`;
      kind = 'name';
      label = game.opponentName;
    } else {
      const names = legendNames(game, info);
      kind = names.length > 0 ? 'legends' : 'unknown';
      key = names.length > 0 ? `l:${names.join('\u0000')}` : 'u';
      label = names.length > 0 ? names.join(', ') : null;
    }
    const group = groups.get(key);
    if (group === undefined) groups.set(key, { kind, label, games: [game] });
    else group.games.push(game);
  }
  return [...groups.values()].map((group) => ({ kind: group.kind, label: group.label, ...tally(group.games) })).sort(compareRows);
}

/** One row per set of Legend colours, from the games that have Legends of known colours. */
export function byColour(games: readonly GameRecord[], info: LegendInfo): ColourRow[] {
  const groups = new Map<string, { colours: string[]; games: GameRecord[] }>();
  for (const game of games) {
    const colours = new Set<string>();
    for (const key of game.opponentLegends) {
      const colour = info(key)?.colour;
      if (colour !== null && colour !== undefined) colours.add(colour);
    }
    if (colours.size === 0) continue;
    const ordered = [...colours].sort((a, b) => {
      const left = COLOUR_ORDER.indexOf(a);
      const right = COLOUR_ORDER.indexOf(b);
      return (left === -1 ? COLOUR_ORDER.length : left) - (right === -1 ? COLOUR_ORDER.length : right) || (a < b ? -1 : a > b ? 1 : 0);
    });
    const key = ordered.join('\u0000');
    const group = groups.get(key);
    if (group === undefined) groups.set(key, { colours: ordered, games: [game] });
    else group.games.push(game);
  }
  return [...groups.values()]
    .map((group) => ({ colours: group.colours, ...tally(group.games) }))
    .sort((a, b) => b.games - a.games || a.colours.join().localeCompare(b.colours.join()));
}

/** One row per event, from the games that have one. */
export function byEvent(games: readonly GameRecord[]): EventRow[] {
  const groups = new Map<string, { label: string; games: GameRecord[] }>();
  for (const game of games) {
    if (game.event === null) continue;
    const key = textKey(game.event);
    if (key === '') continue;
    const group = groups.get(key);
    if (group === undefined) groups.set(key, { label: game.event, games: [game] });
    else group.games.push(game);
  }
  return [...groups.values()].map((group) => ({ label: group.label, ...tally(group.games) })).sort(compareRows);
}

/** The distinct texts of `pick`, newest first (the log order), at most `limit`. Case and spaces do not separate them. */
export function recentTexts(games: readonly GameRecord[], pick: (game: GameRecord) => string | null, limit = 50): string[] {
  const seen = new Map<string, string>();
  for (const game of games) {
    const text = pick(game);
    if (text === null) continue;
    const key = textKey(text);
    if (key !== '' && !seen.has(key)) seen.set(key, text);
    if (seen.size >= limit) break;
  }
  return [...seen.values()];
}

/** The Legends of the newest game against an opponent of this name, or [] when there is none or it had none. */
export function legendsAgainst(games: readonly GameRecord[], name: string): readonly CardKey[] {
  const key = textKey(name);
  if (key === '') return [];
  const found = games.find(
    (game) => game.opponentName !== null && game.opponentLegends.length > 0 && textKey(game.opponentName) === key,
  );
  return found?.opponentLegends ?? [];
}
