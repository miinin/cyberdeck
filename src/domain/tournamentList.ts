import type { DeckContent } from './deck';
import { listName, singleLine } from './deckExport';
import { deckCounts, sideboardCounts } from './deckRules';
import type { CardsByKey } from './deckRules';

/** Groups of the printed tournament list, in print order (T-168). */
export type TournamentGroupId = 'legend' | 'unit' | 'program' | 'gear' | 'other' | 'sideboard';

export interface TournamentRow {
  readonly count: number;
  readonly name: string;
}

export interface TournamentGroup {
  readonly id: TournamentGroupId;
  readonly total: number;
  readonly rows: readonly TournamentRow[];
}

export interface TournamentList {
  readonly deckName: string;
  /** Only the groups that have cards. */
  readonly groups: readonly TournamentGroup[];
  /** Main deck without the Legends, Legends, sideboard. */
  readonly totals: { readonly main: number; readonly legends: number; readonly sideboard: number };
}

const ORDER: readonly TournamentGroupId[] = ['legend', 'unit', 'program', 'gear', 'other', 'sideboard'];
const TYPE_GROUP: Readonly<Record<string, TournamentGroupId>> = { Legend: 'legend', Unit: 'unit', Program: 'program', Gear: 'gear' };

/** The deck as a printable tournament list: groups by card type, rows in alphabetical order, totals. */
export function tournamentList(deck: DeckContent, cardsByKey: CardsByKey): TournamentList {
  const rows = new Map<TournamentGroupId, TournamentRow[]>(ORDER.map((id) => [id, []]));
  const rowOf = (key: string, count: number): TournamentRow => {
    const card = cardsByKey.get(key);
    return { count, name: singleLine(card === undefined ? key : listName(card)) };
  };
  for (const [key, count] of deckCounts(deck)) {
    const type = cardsByKey.get(key)?.type ?? '';
    rows.get(TYPE_GROUP[type] ?? 'other')?.push(rowOf(key, count));
  }
  for (const [key, count] of sideboardCounts(deck)) rows.get('sideboard')?.push(rowOf(key, count));
  const groups = ORDER.map((id): TournamentGroup => {
    const list = [...(rows.get(id) ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'en'));
    return { id, rows: list, total: list.reduce((sum, row) => sum + row.count, 0) };
  }).filter((group) => group.rows.length > 0);
  const totalOf = (id: TournamentGroupId) => groups.find((group) => group.id === id)?.total ?? 0;
  const legends = totalOf('legend');
  const sideboard = totalOf('sideboard');
  const main = groups.reduce((sum, group) => sum + group.total, 0) - legends - sideboard;
  return { deckName: singleLine(deck.name), groups, totals: { main, legends, sideboard } };
}
