/*
 * Firestore Lite behind the PublicDeckStore contract (T-098, D-025, SEC-098). Reads use a named app without
 * sign-in, so they work signed out and never touch the sign-in app's options. Writes use the default app,
 * which the auth client created for the signed-in user. Documents are validated on read (SR-37); nothing is
 * logged (SR-27). No onSnapshot: one page per request (SR-33).
 */
import { isUid } from '../../domain/uid';
import { isPubId, PUBLIC_DECK_SCHEMA_VERSION, PUBLIC_PAGE_SIZE, parsePublicDeck, publicDeckId } from '../../domain/publicDeck';
import type { PublicDeck, PublicDeckInput } from '../../domain/publicDeck';
import { isDeckId } from '../../domain/validate';
import { PUBLIC_COLLECTION } from '../cloudCodec';
import { CloudError, toCloudError } from '../cloudError';
import type { PublicDeckCursor, PublicDeckPage, PublicDeckStore } from '../types';
import { FIREBASE_ENV } from './config';
import { loadFirestore } from './loadFirebase';
import type { FirestoreModules } from './loadFirebase';

const READ_APP_NAME = 'public-read';
/** Firestore allows 500 writes in a transaction; a deletion batch stays well below it. */
const DELETE_BATCH = 400;

/** A server timestamp as an ISO string, or undefined when the value is not a timestamp. */
function isoOf(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('toDate' in value) || typeof value.toDate !== 'function') {
    return undefined;
  }
  try {
    const date: unknown = value.toDate();
    return date instanceof Date && Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
  } catch {
    return undefined;
  }
}

/** Replaces the two server timestamps with ISO strings, so the domain parser sees plain values. */
function withIsoTimes(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  const record = raw as Record<string, unknown>;
  return { ...record, publishedAt: isoOf(record.publishedAt), updatedAt: isoOf(record.updatedAt) };
}

export function createFirestorePublicDecks(options: {
  /** The signed-in uid, or null for reading only. */
  uid: string | null;
  /** Tests pass fake modules; the default loads the SDK lazily. */
  load?: () => Promise<FirestoreModules>;
}): PublicDeckStore {
  const { uid, load = loadFirestore } = options;
  if (uid !== null && !isUid(uid)) throw new CloudError('unknown');
  let modules: Promise<FirestoreModules> | null = null;

  function sdk(): Promise<FirestoreModules> {
    if (modules === null) {
      const pending = load().catch((error: unknown) => {
        throw new CloudError('offline', { cause: error });
      });
      modules = pending;
      pending.catch(() => {
        if (modules === pending) modules = null;
      });
    }
    return modules;
  }

  async function readSession() {
    const m = await sdk();
    const existing = m.app.getApps().find((app) => app.name === READ_APP_NAME);
    const app =
      existing ??
      m.app.initializeApp(
        {
          apiKey: FIREBASE_ENV.apiKey,
          projectId: FIREBASE_ENV.projectId,
          appId: FIREBASE_ENV.appId,
          messagingSenderId: FIREBASE_ENV.messagingSenderId,
        },
        READ_APP_NAME,
      );
    return { fs: m.firestore, db: m.firestore.getFirestore(app) };
  }

  async function writeSession() {
    // Only a signed-in account writes; the default app exists after sign-in.
    if (uid === null) throw new CloudError('denied');
    const m = await sdk();
    return { fs: m.firestore, db: m.firestore.getFirestore(m.app.getApp()) };
  }

  async function guard<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      throw toCloudError(error);
    }
  }

  function pubIdOf(deckId: string): Promise<string> {
    if (uid === null || !isDeckId(deckId)) throw new CloudError('unknown');
    return publicDeckId(uid, deckId);
  }

  return {
    list: (cursor: PublicDeckCursor | null) =>
      guard(async (): Promise<PublicDeckPage> => {
        const { fs, db } = await readSession();
        // The cursor is the last document snapshot of the previous page.
        const after = cursor === null ? [] : [fs.startAfter(cursor)];
        const snap = await fs.getDocs(
          fs.query(fs.collection(db, PUBLIC_COLLECTION), fs.orderBy('updatedAt', 'desc'), ...after, fs.limit(PUBLIC_PAGE_SIZE)),
        );
        let dropped = 0;
        const items: PublicDeck[] = [];
        for (const doc of snap.docs) {
          const parsed = parsePublicDeck(doc.id, withIsoTimes(doc.data()));
          if (parsed === null) dropped += 1;
          else items.push(parsed);
        }
        const last = snap.docs.at(-1);
        return { items, next: snap.docs.length >= PUBLIC_PAGE_SIZE && last !== undefined ? last : null, dropped };
      }),

    get: (pubId: string) =>
      guard(async () => {
        if (!isPubId(pubId)) return null;
        const { fs, db } = await readSession();
        const snap = await fs.getDoc(fs.doc(db, PUBLIC_COLLECTION, pubId));
        return snap.exists() ? parsePublicDeck(pubId, withIsoTimes(snap.data())) : null;
      }),

    publish: (input: PublicDeckInput) =>
      guard(async () => {
        const pubId = await pubIdOf(input.deckId);
        const { fs, db } = await writeSession();
        const ref = fs.doc(db, PUBLIC_COLLECTION, pubId);
        await fs.runTransaction(db, async (tx) => {
          // Create or update: publishedAt is set once and then never changes (rules, SR-31).
          const existing = await tx.get(ref);
          const publishedAt = existing.exists() ? (existing.data() as { publishedAt?: unknown }).publishedAt : undefined;
          // Exactly the keys the rules accept, built from the validated input; no uid.
          tx.set(ref, {
            schemaVersion: PUBLIC_DECK_SCHEMA_VERSION,
            deckId: input.deckId,
            name: input.name,
            legends: input.legends,
            cardCount: input.cardCount,
            deck: input.deck,
            nickname: input.nickname,
            publishedAt: publishedAt ?? fs.serverTimestamp(),
            updatedAt: fs.serverTimestamp(),
          });
        });
      }),

    remove: (deckId: string) =>
      guard(async () => {
        const pubId = await pubIdOf(deckId);
        const { fs, db } = await writeSession();
        await fs.deleteDoc(fs.doc(db, PUBLIC_COLLECTION, pubId));
      }),

    removeMany: (deckIds: readonly string[]) =>
      guard(async () => {
        const pubIds = await Promise.all([...new Set(deckIds)].filter(isDeckId).map(pubIdOf));
        const { fs, db } = await writeSession();
        for (let i = 0; i < pubIds.length; i += DELETE_BATCH) {
          const batch = pubIds.slice(i, i + DELETE_BATCH);
          await fs.runTransaction(db, async (tx) => {
            for (const pubId of batch) tx.delete(fs.doc(db, PUBLIC_COLLECTION, pubId));
          });
        }
      }),
  };
}
