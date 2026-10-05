/*
 * Production migration chains (ARCHITECTURE.md 12.2, ARCH-007). migrations[i] turns data of
 * version i + 1 into version i + 2, so each chain has exactly SCHEMA_VERSION - 1 steps.
 * When a schema version in keys.ts is raised, add the matching step here; migrations.test.ts
 * fails until both agree.
 */
import type { Migration } from './envelope';

/** 1 -> 2 (D-020): the optional `versions` field was added; version 1 data is valid as it is. */
export const COLLECTION_MIGRATIONS: readonly Migration[] = [(data) => data];
export const DECKS_MIGRATIONS: readonly Migration[] = [];
export const WANTS_MIGRATIONS: readonly Migration[] = [];
