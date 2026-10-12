/*
 * Reading and writing one card of the collection as the screen shows it (D-020, D-021, D-022). Shared by the
 * Cards view counters and the card scanner (T-106), so both add copies through the same path.
 */
import type { Card } from '../domain/card';
import { entryChanges, isBaseArt, ownedPerArt, setArtCount } from '../domain/arts';
import type { Art } from '../domain/arts';
import type { CollectionEntry } from '../domain/collection';
import { setCopiesByEdition, targetPrinting } from '../domain/edition';
import type { Edition } from '../domain/edition';
import { countIn, versionCountIn } from './collectionStore';
import type { CollectionSnapshot, CollectionStore } from './collectionStore';

/** The most copies of one card the collection holds. */
export const MAX_COPIES = 999;

/** The card's row as shown now, with unsaved changes. */
export function entryOf(snapshot: CollectionSnapshot, card: Card): CollectionEntry | undefined {
  const count = countIn(snapshot, card.key);
  if (count === 0) return undefined;
  const versions: Record<string, number> = {};
  for (const printing of card.printings ?? []) {
    const n = versionCountIn(snapshot, card.key, printing.key);
    if (n > 0) versions[printing.key] = n;
  }
  return Object.keys(versions).length > 0 ? { card: card.key, count, versions } : { card: card.key, count };
}

/** Saves the change from `before` to `after`: the version counters first (the total follows them), then a count that still differs. */
export function writeEntry(store: CollectionStore, card: Card, before: CollectionEntry | undefined, after: CollectionEntry | undefined): void {
  const changes = entryChanges(before, after);
  let count = before?.count ?? 0;
  for (const [printing, n] of changes.versions) {
    count += n - (before?.versions?.[printing] ?? 0);
    store.setVersionCount(card.key, printing, n);
  }
  const wanted = after?.count ?? 0;
  if (count !== wanted) store.setCount(card.key, wanted);
}

export type AddResult = 'added' | 'limit' | 'unavailable';

/**
 * Adds `copies` of one art of a card (D-021): the base art of a Welcome to Night City card goes to the edition's
 * printing (D-022), a special art to its default printing. `art` null (a card without arts) adds to the total.
 */
export function addCopies(
  snapshot: CollectionSnapshot,
  store: CollectionStore,
  card: Card,
  arts: readonly Art[],
  art: Art | null,
  edition: Edition,
  copies: number,
): AddResult {
  if (snapshot.phase !== 'ready') return 'unavailable';
  const before = entryOf(snapshot, card);
  if ((before?.count ?? 0) + copies > MAX_COPIES) return 'limit';
  if (art === null) {
    store.setCount(card.key, (before?.count ?? 0) + copies);
    return 'added';
  }
  try {
    const start = { entries: before === undefined ? [] : [before] };
    const edited =
      isBaseArt(art) && targetPrinting(card, edition) !== null
        ? setCopiesByEdition(start, card, edition, (before?.count ?? 0) + copies)
        : setArtCount(start, card, art.artId, (ownedPerArt(before, card, arts).get(art.artId) ?? 0) + copies, arts);
    writeEntry(store, card, before, edited.entries[0]);
    return 'added';
  } catch {
    return 'limit';
  }
}

/** Takes back `copies` of one art that `addCopies` added (the scanner's Undo, T-108): the same path, the other way. */
export function removeCopies(
  snapshot: CollectionSnapshot,
  store: CollectionStore,
  card: Card,
  arts: readonly Art[],
  art: Art | null,
  edition: Edition,
  copies: number,
): AddResult {
  if (snapshot.phase !== 'ready') return 'unavailable';
  const before = entryOf(snapshot, card);
  const total = before?.count ?? 0;
  if (art === null) {
    store.setCount(card.key, Math.max(0, total - copies));
    return 'added';
  }
  try {
    const start = { entries: before === undefined ? [] : [before] };
    const owned = ownedPerArt(before, card, arts).get(art.artId) ?? 0;
    const edited =
      isBaseArt(art) && targetPrinting(card, edition) !== null
        ? setCopiesByEdition(start, card, edition, Math.max(0, total - copies))
        : setArtCount(start, card, art.artId, Math.max(0, owned - copies), arts);
    writeEntry(store, card, before, edited.entries[0]);
    return 'added';
  } catch {
    return 'limit';
  }
}
