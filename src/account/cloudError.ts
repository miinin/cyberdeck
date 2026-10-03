export type CloudErrorKind =
  /** The cloud rev changed after it was read: another device synced first. */
  | 'conflict'
  /** No connection, or the SDK chunk did not load. */
  | 'offline'
  /** The rules refused the request (signed out, wrong account, invalid document). */
  | 'denied'
  /** The Spark daily quota is used up. */
  | 'quota'
  /** The collection document would be 900 000 bytes or more, or the change is too big for one transaction. */
  | 'too-large'
  /** The cloud meta has a newer schema version than this app knows: no writes (SR-23 kohta 4). */
  | 'locked'
  | 'unknown';

/**
 * Error from the cloud store (D-017 kohta 8). The UI picks its text from `kind`; `cause` is never shown or
 * logged (SR-27).
 */
export class CloudError extends Error {
  readonly kind: CloudErrorKind;

  constructor(kind: CloudErrorKind, options?: { cause?: unknown }) {
    super(`Cloud store: ${kind}`, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'CloudError';
    this.kind = kind;
  }
}

const KIND_BY_CODE: Readonly<Partial<Record<string, CloudErrorKind>>> = {
  unavailable: 'offline',
  'deadline-exceeded': 'offline',
  'permission-denied': 'denied',
  unauthenticated: 'denied',
  'resource-exhausted': 'quota',
  // Firestore gave up on a contended transaction: the same as a changed rev.
  aborted: 'conflict',
};

/** Maps any thrown value to a CloudError. Reads only the Firestore error `code`, never its message. */
export function toCloudError(error: unknown): CloudError {
  if (error instanceof CloudError) return error;
  const code =
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : '';
  const kind = Object.hasOwn(KIND_BY_CODE, code) ? KIND_BY_CODE[code] : undefined;
  return new CloudError(kind ?? 'unknown', { cause: error });
}
