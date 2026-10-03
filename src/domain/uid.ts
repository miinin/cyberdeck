/** Firebase Auth uid as used in storage keys and paths (D-017 kohta 4, SR-23 kohta 8). */
const UID_PATTERN = /^[A-Za-z0-9]{1,128}$/;

export function isUid(value: unknown): value is string {
  return typeof value === 'string' && UID_PATTERN.test(value);
}
