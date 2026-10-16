/*
 * Production migration chains (ARCHITECTURE.md 12.2, ARCH-007). migrations[i] turns data of
 * version i + 1 into version i + 2, so each chain has exactly SCHEMA_VERSION - 1 steps.
 * When a schema version in keys.ts is raised, add the matching step here; migrations.test.ts
 * fails until both agree.
 */
import { CARDS } from '../data/cards';
import { betaPrintingKeys, migrateCollectionToBeta } from '../domain/betaMigration';
import type { Migration } from './envelope';

let betaKeys: ReadonlyMap<string, string> | null = null;

/**
 * 2 -> 3 (D-022): copies without a recorded version become the card's Beta printing. The step needs the card
 * list, and the migration signature has none, so it reads the bundled card data directly (src/data/cards.json,
 * the same list the app shows). That keeps the conversion inside the envelope chain: it runs wherever data is
 * decoded, so local storage, the cloud copy and the sync base all go through the same code, and a v3 document
 * is never converted again because the chain only runs for versions below 3.
 */
export function migrateCollectionV2ToV3(data: unknown): unknown {
  betaKeys ??= betaPrintingKeys(CARDS);
  return migrateCollectionToBeta(data, betaKeys);
}

/**
 * 1 -> 2 (D-020): the optional `versions` field was added; version 1 data is valid as it is.
 * 2 -> 3 (D-022): the unversioned copies are recorded as Beta.
 */
export const COLLECTION_MIGRATIONS: readonly Migration[] = [(data) => data, migrateCollectionV2ToV3];
export const DECKS_MIGRATIONS: readonly Migration[] = [];
/** The want list is not converted: it stays at version 1 (D-022). */
export const WANTS_MIGRATIONS: readonly Migration[] = [];
export const PROXY_MIGRATIONS: readonly Migration[] = [];
export const HAVES_MIGRATIONS: readonly Migration[] = [];
export const GAMES_MIGRATIONS: readonly Migration[] = [];
export const SEALED_MIGRATIONS: readonly Migration[] = [];
