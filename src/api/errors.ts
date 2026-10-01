export type CardApiErrorKind = 'network' | 'timeout' | 'http' | 'invalid-response';

/**
 * Error from the card API layer. `message`, `status` and `cause` are for developers only;
 * the UI chooses its user-facing text from `kind`.
 */
export class CardApiError extends Error {
  readonly kind: CardApiErrorKind;
  readonly status?: number;

  constructor(kind: CardApiErrorKind, message: string, options?: { status?: number; cause?: unknown }) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'CardApiError';
    this.kind = kind;
    if (options?.status !== undefined) {
      this.status = options.status;
    }
  }
}
