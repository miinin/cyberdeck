/*
 * Firestore Lite behind the TradeShareStore contract (T-178, D-037). Mirrors firestorePublicDecks: reads use a
 * named app without sign-in, writes use the default app of the signed-in user. The id is computed from the uid
 * (SR-50), a malformed id never reaches doc() (SR-53), and nothing is logged (SR-58).
 */
import { isUid } from '../../domain/uid';
import { isTradeShareId, parseTradeShareDoc, TRADE_SHARE_SCHEMA_VERSION, tradeShareId } from '../../domain/tradeLink';
import { TRADE_COLLECTION } from '../cloudCodec';
import { CloudError, toCloudError } from '../cloudError';
import type { TradeShareStore } from '../types';
import { FIREBASE_ENV } from './config';
import { loadFirestore } from './loadFirebase';
import type { FirestoreModules } from './loadFirebase';

const READ_APP_NAME = 'public-read';

export function createFirestoreTradeShares(options: {
  /** The signed-in uid, or null for reading only. */
  uid: string | null;
  load?: () => Promise<FirestoreModules>;
}): TradeShareStore {
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

  function ownId(): Promise<string> {
    if (uid === null) throw new CloudError('denied');
    return tradeShareId(uid);
  }

  return {
    get: (shareId: string) =>
      guard(async () => {
        if (!isTradeShareId(shareId)) return null;
        const { fs, db } = await readSession();
        const snap = await fs.getDoc(fs.doc(db, TRADE_COLLECTION, shareId));
        return snap.exists() ? parseTradeShareDoc(snap.data()) : null;
      }),

    ownId: () => guard(ownId),

    publish: (data: string) =>
      guard(async () => {
        const id = await ownId();
        const { fs, db } = await writeSession();
        // Exactly the keys the rules accept; no uid, no nickname.
        await fs.setDoc(fs.doc(db, TRADE_COLLECTION, id), {
          schemaVersion: TRADE_SHARE_SCHEMA_VERSION,
          data,
          updatedAt: fs.serverTimestamp(),
        });
      }),

    update: (data: string) =>
      guard(async () => {
        const id = await ownId();
        const { fs, db } = await writeSession();
        const ref = fs.doc(db, TRADE_COLLECTION, id);
        // Read first and write an update only to an existing document: the automatic refresh never creates (SR-54).
        return fs.runTransaction(db, async (tx) => {
          const existing = await tx.get(ref);
          if (!existing.exists()) return false;
          tx.update(ref, { schemaVersion: TRADE_SHARE_SCHEMA_VERSION, data, updatedAt: fs.serverTimestamp() });
          return true;
        });
      }),

    remove: () =>
      guard(async () => {
        const id = await ownId();
        const { fs, db } = await writeSession();
        await fs.deleteDoc(fs.doc(db, TRADE_COLLECTION, id));
      }),
  };
}
