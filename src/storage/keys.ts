/** Storage keys and schema versions (ARCHITECTURE.md 12.2). The version lives in the envelope, not in the key. */
export const COLLECTION_KEY = 'cyberdeck:collection';
export const DECKS_KEY = 'cyberdeck:decks';
/** Followed by `<aggregate>:<ISO timestamp>`. Only keys with this prefix are ever pruned (SR-13). */
export const BACKUP_PREFIX = 'cyberdeck:backup:';

export const COLLECTION_SCHEMA_VERSION = 1;
export const DECKS_SCHEMA_VERSION = 1;
export const MAX_BACKUPS_PER_AGGREGATE = 3;
