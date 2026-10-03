/*
 * Firestore Lite behind the CloudStore contract (D-017 kohdat 3, 5 ja 8, SR-22, SR-23). Paths
 * `users/{uid}`, `users/{uid}/decks/{deckId}` and `users/{uid}/collection/main` (D-017 Muutos K-P8).
 * Validation and encoding are shared with the memory store (cloudCodec.ts). Errors become CloudError
 * kinds; nothing is logged (SR-27).
 */
import { MAX_DECKS } from '../../domain/deck';
import { isUid } from '../../domain/uid';
import {
  buildSnapshot,
  checkChange,
  CLOUD_ROOT,
  decodeMeta,
  encodeCollectionDoc,
  encodeDeckDoc,
  META_SCHEMA_VERSION,
} from '../cloudCodec';
import { CloudError, toCloudError } from '../cloudError';
import type { CloudStore } from '../types';
import { loadFirestore } from './loadFirebase';
import type { FirestoreModules } from './loadFirebase';

type Session = {
  fs: FirestoreModules['firestore'];
  db: ReturnType<FirestoreModules['firestore']['getFirestore']>;
};

export function createFirestoreCloudStore(options: {
  uid: string;
  /** Tests pass fake modules; the default loads the SDK lazily. */
  load?: () => Promise<FirestoreModules>;
  now?: () => Date;
}): CloudStore {
  const { uid, load = loadFirestore, now = () => new Date() } = options;
  // SR-23 kohta 8: the uid goes into a path only after this check.
  if (!isUid(uid)) throw new CloudError('unknown');
  let session: Promise<Session> | null = null;

  function open(): Promise<Session> {
    if (session === null) {
      const pending = load().then(
        // The auth client created the default app; Firestore uses its signed-in user.
        ({ app, firestore }) => ({ fs: firestore, db: firestore.getFirestore(app.getApp()) }),
        (error: unknown) => {
          throw new CloudError('offline', { cause: error });
        },
      );
      session = pending;
      pending.catch(() => {
        if (session === pending) session = null;
      });
    }
    return session;
  }

  async function guard<T>(run: (session: Session) => Promise<T>): Promise<T> {
    try {
      return await run(await open());
    } catch (error) {
      throw toCloudError(error);
    }
  }

  const metaRef = ({ fs, db }: Session) => fs.doc(db, CLOUD_ROOT, uid);
  const deckRef = ({ fs, db }: Session, id: string) => fs.doc(db, CLOUD_ROOT, uid, 'decks', id);
  const collectionRef = ({ fs, db }: Session) => fs.doc(db, CLOUD_ROOT, uid, 'collection', 'main');

  return {
    readMeta: () =>
      guard(async (s) => {
        const snap = await s.fs.getDoc(metaRef(s));
        return snap.exists() ? decodeMeta(snap.data()) : null;
      }),

    readAll: () =>
      guard(async (s) => {
        const { fs, db } = s;
        const [meta, decks, collection] = await Promise.all([
          fs.getDoc(metaRef(s)),
          // SR-23 kohta 5: one more than allowed, so too many decks is noticed instead of cut silently.
          fs.getDocs(fs.query(fs.collection(db, CLOUD_ROOT, uid, 'decks'), fs.limit(MAX_DECKS + 1))),
          fs.getDoc(collectionRef(s)),
        ]);
        return buildSnapshot(
          meta.exists() ? decodeMeta(meta.data()) : null,
          decks.docs.map((doc) => ({ id: doc.id, data: doc.data() })),
          collection.exists() ? collection.data() : undefined,
        );
      }),

    deleteAll: () =>
      guard(async (s) => {
        const { fs, db } = s;
        // Decks in batches of 400 (a transaction takes 500 writes), then the collection and the meta document.
        for (let round = 0; round < 10; round += 1) {
          const decks = await fs.getDocs(fs.query(fs.collection(db, CLOUD_ROOT, uid, 'decks'), fs.limit(400)));
          if (decks.docs.length === 0) break;
          await fs.runTransaction(db, async (tx) => {
            for (const doc of decks.docs) tx.delete(deckRef(s, doc.id));
          });
        }
        await fs.runTransaction(db, async (tx) => {
          tx.delete(collectionRef(s));
          tx.delete(metaRef(s));
        });
      }),

    async commit(requested, expectedRev) {
      // Encode only the validated values (SR-23 kohta 6).
      const change = checkChange(requested);
      return guard((s) =>
        s.fs.runTransaction(s.db, async (tx) => {
          // Read again inside the transaction: another device may have synced after our read (D-017 kohta 5).
          const snap = await tx.get(metaRef(s));
          const meta = snap.exists() ? decodeMeta(snap.data()) : null;
          if (meta?.newer) throw new CloudError('locked');
          const rev = meta?.rev ?? 0;
          if (rev !== expectedRev) throw new CloudError('conflict');

          const savedAt = now().toISOString();
          for (const deck of change.putDecks) tx.set(deckRef(s, deck.id), encodeDeckDoc(deck, savedAt));
          for (const id of change.deleteDecks) tx.delete(deckRef(s, id));
          if (change.collection !== undefined) tx.set(collectionRef(s), encodeCollectionDoc(change.collection, savedAt));
          // The rules accept exactly these keys, rev + 1 and the server time (SR-22).
          tx.set(metaRef(s), { schemaVersion: META_SCHEMA_VERSION, rev: rev + 1, updatedAt: s.fs.serverTimestamp() });
          return rev + 1;
        }),
      );
    },
  };
}
