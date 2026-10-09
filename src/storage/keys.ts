/** Storage keys and schema versions (ARCHITECTURE.md 12.2). The version lives in the envelope, not in the key. */
export const COLLECTION_KEY = 'cyberdeck:collection';
export const DECKS_KEY = 'cyberdeck:decks';
/** Want list (T-064a, D-018): the same shape as the collection, with its own key, envelope and cloud document. */
export const WANTS_KEY = 'cyberdeck:wants';
/** Proxy print queue (T-102): the collection's shape (a count per card, the art as a breakdown), local only, never synced. */
export const PROXY_KEY = 'cyberdeck:proxy';
/**
 * Theme preference: the raw string 'light' or 'dark', no envelope, so public/theme-init.js can read it
 * before the first paint without parsing anything (UX.md 8.7, T-025 A2). That script repeats this key.
 */
export const THEME_KEY = 'cyberdeck:theme';
/** Browser-list preferences (T-040): raw strings like the theme, no envelope. */
export const VIEW_KEY = 'cyberdeck:view';
export const EDIT_MODE_KEY = 'cyberdeck:edit-mode';
export const DECK_PICK_VIEW_KEY = 'cyberdeck:deck-pick-view';
/** The deck column view of the editor (T-115): the raw string 'list', 'stacks' or 'cards'. */
export const DECK_LIST_VIEW_KEY = 'cyberdeck:deck-list-view';
/** Default edition of the card boxes' + and − (T-083, D-022): the raw string 'beta' or 'retail'. */
export const DEFAULT_EDITION_KEY = 'cyberdeck:default-edition';
/** Card scanner mode (T-108): the raw string 'single' or 'continuous'. */
export const SCAN_MODE_KEY = 'cyberdeck:scan-mode';
/** Collection page choices (T-109): a small JSON object { view, art, showMissing }. */
export const COLLECTION_PREFS_KEY = 'cyberdeck:collection-prefs';
/** The own binder's layout (T-120): { v: 1, name, pockets }. Local only, never synced. */
export const BINDER_LAYOUT_KEY = 'cyberdeck:binder-layout';
/**
 * Account hints (T-054a, D-017 kohta 1, SR-29 kohta 1): the uid of the last signed-in account, so the
 * Firebase SDK loads at startup only for users who have signed in, and a flag set just before a sign-in
 * redirect, so the redirect result is read on return. Raw strings, no envelope, no other personal data.
 */
export const ACCOUNT_LAST_UID_KEY = 'cyberdeck:account:last-uid';
export const ACCOUNT_REDIRECT_PENDING_KEY = 'cyberdeck:account:redirect-pending';
/** Set while "Poista tilin tiedot" waits for a re-login redirect: the account is deleted when the user returns (T-054d). */
export const ACCOUNT_DELETE_PENDING_KEY = 'cyberdeck:account:delete-pending';
/** Key prefix of one account's data in this browser (T-054c, D-017 kohta 4). The uid must be valid (isUid). */
export function accountKeyPrefix(uid: string): string {
  return `cyberdeck:u:${uid}:`;
}
/** Followed by `<aggregate>:<ISO timestamp>`. Only keys with this prefix are ever pruned (SR-13). */
export const BACKUP_PREFIX = 'cyberdeck:backup:';

/** 2 = entries may carry a breakdown by printing (`versions`, D-020). 3 = the unversioned copies were recorded as Beta (D-022). */
export const COLLECTION_SCHEMA_VERSION = 3;
export const DECKS_SCHEMA_VERSION = 1;
export const WANTS_SCHEMA_VERSION = 1;
export const PROXY_SCHEMA_VERSION = 1;
export const MAX_BACKUPS_PER_AGGREGATE = 3;
/** UI language, the raw string 'fi' or 'en' (T-068, D-019). Read synchronously at startup (src/locale.ts); not personal data, never synced. */
export const LOCALE_KEY = 'cyberdeck:locale';
