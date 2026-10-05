/*
 * Three-way merge of the local data and the cloud copy against the base (the state both had at the last
 * sync). Pure functions, no storage and no network (D-017 kohta 6). Nothing here deletes because a cloud
 * document was invalid: the caller passes those ids separately and the local copy stays (SR-23 kohta 3).
 */
import { compareCardKeys } from '../../domain/collection';
import type { Collection, CollectionEntry, Versions } from '../../domain/collection';
import type { Deck, DeckId } from '../../domain/deck';

export interface DeckMerge {
  /** The decks the device should have after the sync, in stored order. */
  decks: Deck[];
  /** Decks to write to the cloud. */
  put: Deck[];
  /** Deck ids to delete from the cloud. */
  remove: DeckId[];
}

type BaseDeck = { id: DeckId; updatedAt: string };

/**
 * Per deck: only one side changed since the base → that side wins (a deletion counts as a change); both
 * changed → the later updatedAt wins, a tie goes to the cloud; edited vs deleted → the edited one stays.
 * An empty base (first sync) treats every deck as changed on the side that has it.
 */
export function mergeDecks(
  local: readonly Deck[],
  cloud: readonly Deck[],
  base: readonly BaseDeck[],
  invalidCloudIds: readonly DeckId[] = [],
): DeckMerge {
  const localById = new Map(local.map((deck) => [deck.id, deck]));
  const cloudById = new Map(cloud.map((deck) => [deck.id, deck]));
  const baseById = new Map(base.map((deck) => [deck.id, deck.updatedAt]));
  const invalid = new Set(invalidCloudIds);
  const cloudOnly = cloud
    .filter((deck) => !localById.has(deck.id))
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : a.id < b.id ? -1 : 1));
  const ids = [...local.map((deck) => deck.id), ...cloudOnly.map((deck) => deck.id)];

  const result: DeckMerge = { decks: [], put: [], remove: [] };
  for (const id of ids) {
    const mine = localById.get(id);
    const theirs = cloudById.get(id);
    if (invalid.has(id)) {
      if (mine !== undefined) result.decks.push(mine);
      continue;
    }
    const baseStamp = baseById.get(id);
    const mineChanged = mine === undefined ? baseStamp !== undefined : mine.updatedAt !== baseStamp;
    const theirsChanged = theirs === undefined ? baseStamp !== undefined : theirs.updatedAt !== baseStamp;

    let winner: Deck | undefined;
    if (mineChanged && !theirsChanged) winner = mine;
    else if (!mineChanged && theirsChanged) winner = theirs;
    else if (mine !== undefined && theirs !== undefined) winner = mine.updatedAt > theirs.updatedAt ? mine : theirs;
    else winner = mine ?? theirs;

    if (winner !== undefined) result.decks.push(winner);
    // The cloud is written only when the cloud copy differs from the winner.
    if (winner === undefined) {
      if (theirs !== undefined) result.remove.push(id);
    } else if (theirs === undefined || theirs.updatedAt !== winner.updatedAt) {
      if (winner === mine) result.put.push(winner);
    }
  }
  return result;
}

export interface CollectionMerge {
  collection: Collection;
  /** The cloud copy differs from the result and must be written. */
  writeCloud: boolean;
}

function toMap(collection: Collection): Map<string, number> {
  return new Map(collection.entries.map((entry) => [entry.card, entry.count]));
}

function versionMap(collection: Collection): Map<string, Versions> {
  return new Map(collection.entries.map((entry) => [entry.card, entry.versions ?? {}]));
}

/** Per printing, the same rule as for counts; then the sum is cut down to `count` (D-020: the sum never exceeds the count). */
function mergeVersions(mine: Versions, theirs: Versions, base: Versions, count: number): Versions | undefined {
  const keys = [...new Set([...Object.keys(mine), ...Object.keys(theirs), ...Object.keys(base)])].sort();
  const result: Record<string, number> = {};
  let room = count;
  for (const key of keys) {
    const m = mine[key] ?? 0;
    const b = base[key] ?? 0;
    const n = Math.min(m !== b ? m : (theirs[key] ?? 0), room);
    if (n > 0) {
      result[key] = n;
      room -= n;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Per card: only one side changed → that side; both changed → the local count. The breakdown by printing is
 * merged per printing the same way and limited to the count. A cloud collection that is
 * invalid (`cloud` null) is never overwritten: the result is the local collection and nothing is written.
 */
export function mergeCollection(local: Collection, cloud: Collection | null, base: Collection): CollectionMerge {
  if (cloud === null) return { collection: local, writeCloud: false };
  const mine = toMap(local);
  const theirs = toMap(cloud);
  const before = toMap(base);
  const mineVersions = versionMap(local);
  const theirVersions = versionMap(cloud);
  const baseVersions = versionMap(base);
  const cards = new Set([...mine.keys(), ...theirs.keys(), ...before.keys()]);
  const entries: CollectionEntry[] = [];
  for (const card of cards) {
    const m = mine.get(card) ?? 0;
    const t = theirs.get(card) ?? 0;
    const b = before.get(card) ?? 0;
    const count = m !== b ? m : t;
    if (count <= 0) continue;
    const versions = mergeVersions(mineVersions.get(card) ?? {}, theirVersions.get(card) ?? {}, baseVersions.get(card) ?? {}, count);
    entries.push(versions === undefined ? { card, count } : { card, count, versions });
  }
  entries.sort((a, b) => compareCardKeys(a.card, b.card));
  const merged: Collection = { entries };
  return { collection: merged, writeCloud: !sameCollection(merged, cloud) };
}

function sameVersions(a: Versions | undefined, b: Versions | undefined): boolean {
  const left = Object.entries(a ?? {});
  const right = b ?? {};
  return left.length === Object.keys(right).length && left.every(([key, n]) => right[key] === n);
}

export function sameCollection(a: Collection, b: Collection): boolean {
  return (
    a.entries.length === b.entries.length &&
    a.entries.every((entry, index) => {
      const other = b.entries[index];
      return entry.card === other?.card && entry.count === other.count && sameVersions(entry.versions, other.versions);
    })
  );
}
