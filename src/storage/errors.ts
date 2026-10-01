export type StorageErrorKind =
  /** Storage is blocked or threw some other error. */
  | 'unavailable'
  /** QuotaExceededError (also Firefox NS_ERROR_DOM_QUOTA_REACHED). */
  | 'quota'
  /** Stored data has a newer schema version than this app knows; writing is blocked. */
  | 'newer-version'
  /** The data given by the caller does not pass validation. */
  | 'invalid-input'
  /** MAX_DECKS or MAX_COLLECTION_ENTRIES is full. */
  | 'limit-reached'
  /** update() with an unknown id. */
  | 'not-found';

/**
 * Error from the storage layer. `message` and `cause` are for developers only;
 * the UI chooses its user-facing text from `kind`.
 */
export class StorageError extends Error {
  readonly kind: StorageErrorKind;

  constructor(kind: StorageErrorKind, message: string, options?: { cause?: unknown }) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'StorageError';
    this.kind = kind;
  }
}

/** Maps an exception thrown by the browser storage API to a StorageError. */
export function toStorageError(error: unknown, action: string): StorageError {
  if (error instanceof StorageError) return error;
  const kind = isQuotaError(error) ? 'quota' : 'unavailable';
  return new StorageError(kind, `Storage ${action} failed`, { cause: error });
}

export function isQuotaError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('name' in error)) return false;
  return error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED';
}
