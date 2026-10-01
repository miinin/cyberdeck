import { StorageError, toStorageError } from './errors';

describe('toStorageError', () => {
  it.each(['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'])('maps %s to quota', (name) => {
    const cause = new DOMException('full', name);
    const error = toStorageError(cause, 'write');
    expect(error).toBeInstanceOf(StorageError);
    expect(error.kind).toBe('quota');
    expect(error.cause).toBe(cause);
  });

  it.each([new DOMException('denied', 'SecurityError'), new TypeError('x'), 'string', null])(
    'maps %s to unavailable',
    (cause) => {
      expect(toStorageError(cause, 'read').kind).toBe('unavailable');
    },
  );

  it('passes a StorageError through unchanged', () => {
    const original = new StorageError('newer-version', 'newer');
    expect(toStorageError(original, 'write')).toBe(original);
  });
});
