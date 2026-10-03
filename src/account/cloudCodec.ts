/*
 * Cloud documents <-> domain values (D-017 kohta 3, SR-23). Shared by the Firestore store and the memory
 * store, so both validate and encode the same way. Pure functions: cloud data is untrusted, read through
 * decodeEnvelopeValue and the same parse functions as localStorage, and never copied or spread.
 */
import type { Collection } from '../domain/collection';
import { MAX_DECKS } from '../domain/deck';
import type { Deck, DeckId } from '../domain/deck';
import { isDeckId, isRecord, parseCollection, parseDeck } from '../domain/validate';
import { COLLECTION_ENVELOPE_SPEC, decodeEnvelopeValue } from '../storage';
import type { EnvelopeSpec } from '../storage';
import { CloudError } from './cloudError';
import type { CloudChange, CloudDoc, CloudMeta, CloudSnapshot } from './types';

/** The same root in both projects (D-017 Muutos K-P8). */
export const CLOUD_ROOT = 'users';
export const META_SCHEMA_VERSION = 1;
export const DECK_DOC_SCHEMA_VERSION = 1;
/** D-017 kohta 3: Firestore allows 1 MiB per document; the encoded collection must stay below this. */
export const MAX_COLLECTION_BYTES = 900_000;
/** Firestore's limit of writes in one transaction. */
export const MAX_TRANSACTION_WRITES = 500;

/** A deck document's data has no id: it comes from the document id (SR-23 kohta 1). */
function deckDocSpec(id: DeckId): EnvelopeSpec<Deck> {
  return {
    currentVersion: DECK_DOC_SCHEMA_VERSION,
    migrations: [],
    parse: (data) =>
      isRecord(data)
        ? parseDeck({ id, name: data.name, sections: data.sections, createdAt: data.createdAt, updatedAt: data.updatedAt })
        : null,
  };
}

/** Throws CloudError('unknown') for a meta the rules would never allow. */
export function decodeMeta(raw: unknown): CloudMeta {
  if (isRecord(raw)) {
    const { schemaVersion, rev } = raw;
    if (
      typeof schemaVersion === 'number' &&
      Number.isInteger(schemaVersion) &&
      schemaVersion >= 1 &&
      typeof rev === 'number' &&
      Number.isSafeInteger(rev) &&
      rev >= 1
    ) {
      return { rev, newer: schemaVersion > META_SCHEMA_VERSION };
    }
  }
  throw new CloudError('unknown');
}

/**
 * `deckDocs` are the documents of `users/{uid}/decks` (at most MAX_DECKS + 1 are read), `collection` is
 * `users/{uid}/collection/main` (undefined = missing).
 */
export function buildSnapshot(
  meta: CloudMeta | null,
  deckDocs: readonly { id: string; data: unknown }[],
  collection: unknown,
): CloudSnapshot {
  let dropped = 0;
  let locked = meta?.newer ?? false;
  const decks: Deck[] = [];
  const invalidDeckIds: DeckId[] = [];

  for (const doc of deckDocs.slice(0, MAX_DECKS)) {
    if (!isDeckId(doc.id)) {
      dropped += 1;
      continue;
    }
    const decoded = decodeEnvelopeValue(doc.data, deckDocSpec(doc.id));
    if (decoded.kind === 'ok') {
      decks.push(decoded.value);
      dropped += decoded.dropped;
    } else {
      // Newer or invalid: the deck exists, so the merge must not delete or overwrite it (SR-23 kohta 3–4).
      if (decoded.kind === 'newer') locked = true;
      else dropped += 1;
      invalidDeckIds.push(doc.id);
    }
  }

  let collectionDoc: CloudDoc<Collection> = { kind: 'missing' };
  if (collection !== undefined) {
    const decoded = decodeEnvelopeValue(collection, COLLECTION_ENVELOPE_SPEC);
    if (decoded.kind === 'ok') {
      collectionDoc = { kind: 'ok', value: decoded.value };
      dropped += decoded.dropped;
    } else {
      if (decoded.kind === 'newer') locked = true;
      else dropped += 1;
      collectionDoc = { kind: 'invalid' };
    }
  }

  return {
    meta,
    decks,
    invalidDeckIds,
    collection: collectionDoc,
    dropped,
    locked,
    limitExceeded: deckDocs.length > MAX_DECKS,
  };
}

/** Whitelisted fields only, so nothing extra from the caller reaches the cloud (the rules allow exact keys). */
export function encodeDeckDoc(deck: Deck, savedAt: string) {
  return {
    schemaVersion: DECK_DOC_SCHEMA_VERSION,
    savedAt,
    data: {
      name: deck.name,
      sections: deck.sections.map((section) => ({
        name: section.name,
        cards: section.cards.map((row) => ({ card: row.card, count: row.count })),
      })),
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
    },
  };
}

export function encodeCollectionDoc(collection: Collection, savedAt: string) {
  return {
    schemaVersion: COLLECTION_ENVELOPE_SPEC.currentVersion,
    savedAt,
    data: { entries: collection.entries.map((entry) => ({ card: entry.card, count: entry.count })) },
  };
}

/** UTF-8 size of the JSON encoding, a close upper estimate of Firestore's document size. */
export function encodedSize(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

/**
 * Checks a change before anything is sent (SR-23 kohta 6): valid decks and ids, at most one transaction of
 * writes, and a collection document below MAX_COLLECTION_BYTES. Throws CloudError.
 */
export function checkChange(change: CloudChange, maxCollectionBytes = MAX_COLLECTION_BYTES): void {
  const writes = change.putDecks.length + change.deleteDecks.length + (change.collection === undefined ? 0 : 1) + 1;
  if (writes > MAX_TRANSACTION_WRITES) throw new CloudError('too-large');

  for (const deck of change.putDecks) {
    const parsed = parseDeck(deck);
    if (parsed === null || parsed.dropped > 0) throw new CloudError('unknown');
  }
  if (!change.deleteDecks.every(isDeckId)) throw new CloudError('unknown');

  if (change.collection !== undefined) {
    const parsed = parseCollection(change.collection);
    if (parsed === null || parsed.dropped > 0) throw new CloudError('unknown');
    const doc = encodeCollectionDoc(change.collection, new Date(0).toISOString());
    if (encodedSize(doc) >= maxCollectionBytes) throw new CloudError('too-large');
  }
}
