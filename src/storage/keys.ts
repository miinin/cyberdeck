/** Storage keys and schema versions (ARCHITECTURE.md 12.2). The version lives in the envelope, not in the key. */
export const COLLECTION_KEY = 'cyberdeck:collection';
export const DECKS_KEY = 'cyberdeck:decks';
/**
 * Theme preference: the raw string 'light' or 'dark', no envelope, so public/theme-init.js can read it
 * before the first paint without parsing anything (UX.md 8.7, T-025 A2). That script repeats this key.
 */
export const THEME_KEY = 'cyberdeck:theme';
/** Browser-list preferences (T-040): raw strings like the theme, no envelope. */
export const VIEW_KEY = 'cyberdeck:view';
export const EDIT_MODE_KEY = 'cyberdeck:edit-mode';
export const DECK_PICK_VIEW_KEY = 'cyberdeck:deck-pick-view';
/**
 * Account hints (T-054a, D-017 kohta 1, SR-29 kohta 1): the uid of the last signed-in account, so the
 * Firebase SDK loads at startup only for users who have signed in, and a flag set just before a sign-in
 * redirect, so the redirect result is read on return. Raw strings, no envelope, no other personal data.
 */
export const ACCOUNT_LAST_UID_KEY = 'cyberdeck:account:last-uid';
export const ACCOUNT_REDIRECT_PENDING_KEY = 'cyberdeck:account:redirect-pending';
/** Followed by `<aggregate>:<ISO timestamp>`. Only keys with this prefix are ever pruned (SR-13). */
export const BACKUP_PREFIX = 'cyberdeck:backup:';

export const COLLECTION_SCHEMA_VERSION = 1;
export const DECKS_SCHEMA_VERSION = 1;
export const MAX_BACKUPS_PER_AGGREGATE = 3;
