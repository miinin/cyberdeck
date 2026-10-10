/*
 * Cloud documents <-> domain values (D-017 kohta 3, SR-23). Shared by the Firestore store and the memory
 * store, so both validate and encode the same way. Pure functions: cloud data is untrusted, read through
 * decodeEnvelopeValue and the same parse functions as localStorage, and never copied or spread.
 */
import type { Collection } from '../domain/collection';
import { MAX_DECKS } from '../domain/deck';
import type { Deck, DeckId } from '../domain/deck';
import { gameLogFits, parseGameLog } from '../domain/games';
import type { GameLog } from '../domain/games';
import { isDeckId, isRecord, parseCollection, parseDeck } from '../domain/validate';
import { COLLECTION_ENVELOPE_SPEC, decodeEnvelopeValue, GAMES_ENVELOPE_SPEC, WANTS_ENVELOPE_SPEC } from '../storage';
import type { EnvelopeSpec } from '../storage';
import { CloudError } from './cloudError';
import type { CloudChange, CloudDoc, CloudMeta, CloudSnapshot } from './types';

/** The same root in both projects (D-017 Muutos K-P8). */
export const CLOUD_ROOT = 'users';
/** Public copies of decks (T-098): `publicDecks/{pubId}`, readable by everyone. */
export const PUBLIC_COLLECTION = 'publicDecks';
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
        ? parseDeck({
            id,
            name: data.name,
            sections: data.sections,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            // Stored flat as visibility + nickname; both are optional (decks from before T-098 are private).
            publish:
              data.visibility === undefined
                ? undefined
                : { public: data.visibility === 'public', nickname: data.nickname ?? null },
          })
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
 * `users/{uid}/collection/main`, `wants` is `users/{uid}/collection/want` and `games` is `users/{uid}/games/log`
 * (undefined = missing).
 */
export function buildSnapshot(
  meta: CloudMeta | null,
  deckDocs: readonly { id: string; data: unknown }[],
  collection: unknown,
  wants: unknown,
  games?: unknown,
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

  /** Collection-shaped documents: a newer version locks, an invalid one stays 'invalid' (never a deletion). */
  function decodeCollectionDoc(raw: unknown, spec: EnvelopeSpec<Collection>): CloudDoc<Collection> {
    if (raw === undefined) return { kind: 'missing' };
    const decoded = decodeEnvelopeValue(raw, spec);
    if (decoded.kind === 'ok') {
      dropped += decoded.dropped;
      return { kind: 'ok', value: decoded.value };
    }
    if (decoded.kind === 'newer') locked = true;
    else dropped += 1;
    return { kind: 'invalid' };
  }
  const collectionDoc = decodeCollectionDoc(collection, COLLECTION_ENVELOPE_SPEC);
  const wantsDoc = decodeCollectionDoc(wants, WANTS_ENVELOPE_SPEC);

  /** The game log: the same rules; more than MAX_GAMES rows make the whole document invalid, never a deletion. */
  function decodeGamesDoc(raw: unknown): CloudDoc<GameLog> {
    if (raw === undefined) return { kind: 'missing' };
    const decoded = decodeEnvelopeValue(raw, GAMES_ENVELOPE_SPEC);
    if (decoded.kind === 'ok') {
      dropped += decoded.dropped;
      return { kind: 'ok', value: decoded.value };
    }
    if (decoded.kind === 'newer') locked = true;
    else dropped += 1;
    return { kind: 'invalid' };
  }
  const gamesDoc = decodeGamesDoc(games);

  return {
    meta,
    decks,
    invalidDeckIds,
    collection: collectionDoc,
    wants: wantsDoc,
    games: gamesDoc,
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
      ...(deck.publish === undefined
        ? {}
        : { visibility: deck.publish.public ? 'public' : 'private', nickname: deck.publish.nickname }),
    },
  };
}

export function encodeCollectionDoc(collection: Collection, savedAt: string, spec = COLLECTION_ENVELOPE_SPEC) {
  return {
    schemaVersion: spec.currentVersion,
    savedAt,
    data: {
      entries: collection.entries.map((entry) =>
        entry.versions === undefined
          ? { card: entry.card, count: entry.count }
          : { card: entry.card, count: entry.count, versions: { ...entry.versions } },
      ),
    },
  };
}

/** The want list document: the collection's shape with the want schema version (D-018). */
export function encodeWantsDoc(wants: Collection, savedAt: string) {
  return encodeCollectionDoc(wants, savedAt, WANTS_ENVELOPE_SPEC);
}

/**
 * The game log document (T-122): every row is rebuilt field by field, so nothing extra reaches the cloud and the
 * rules' exact keys hold.
 */
export function encodeGamesDoc(log: GameLog, savedAt: string) {
  return {
    schemaVersion: GAMES_ENVELOPE_SPEC.currentVersion,
    savedAt,
    data: {
      games: log.games.map((game) => ({
        id: game.id,
        deckId: game.deckId,
        playedOn: game.playedOn,
        createdAt: game.createdAt,
        result: game.result,
        opponentName: game.opponentName,
        opponentLegends: [...game.opponentLegends],
        turn: game.turn,
        event: game.event,
        sideboard: game.sideboard,
        note: game.note,
      })),
    },
  };
}

/** UTF-8 size of the JSON encoding, a close upper estimate of Firestore's document size. */
export function encodedSize(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

/**
 * Checks a change before anything is sent (SR-23 kohta 6): valid decks and ids, at most one transaction of
 * writes, and a collection and a want document each below MAX_COLLECTION_BYTES. Returns the change rebuilt from the parsed
 * values only, so the caller encodes exactly what was validated (cleaned names, normalised timestamps).
 * Throws CloudError.
 */
export function checkChange(change: CloudChange, maxCollectionBytes = MAX_COLLECTION_BYTES): CloudChange {
  const writes = change.putDecks.length + change.deleteDecks.length + (change.collection === undefined ? 0 : 1) + (change.wants === undefined ? 0 : 1) + (change.games === undefined ? 0 : 1) + 1;
  if (writes > MAX_TRANSACTION_WRITES) throw new CloudError('too-large');

  const putDecks = change.putDecks.map((deck) => {
    const parsed = parseDeck(deck);
    if (parsed === null || parsed.dropped > 0) throw new CloudError('unknown');
    return parsed.value;
  });
  if (!change.deleteDecks.every(isDeckId)) throw new CloudError('unknown');
  const checked: CloudChange = { putDecks, deleteDecks: [...change.deleteDecks] };

  if (change.collection !== undefined) {
    const parsed = parseCollection(change.collection);
    if (parsed === null || parsed.dropped > 0) throw new CloudError('unknown');
    const doc = encodeCollectionDoc(parsed.value, new Date(0).toISOString());
    if (encodedSize(doc) >= maxCollectionBytes) throw new CloudError('too-large');
    checked.collection = parsed.value;
  }
  if (change.wants !== undefined) {
    const parsed = parseCollection(change.wants);
    if (parsed === null || parsed.dropped > 0) throw new CloudError('unknown');
    if (encodedSize(encodeWantsDoc(parsed.value, new Date(0).toISOString())) >= maxCollectionBytes) {
      throw new CloudError('too-large');
    }
    checked.wants = parsed.value;
  }
  if (change.games !== undefined) {
    // SR-45: the same row, count and byte limits as the device, before anything is sent.
    const parsed = parseGameLog(change.games);
    if (parsed === null || parsed.dropped > 0) throw new CloudError('unknown');
    if (!gameLogFits(parsed.value)) throw new CloudError('too-large');
    checked.games = parsed.value;
  }
  return checked;
}
