import { COLLECTION_SCHEMA_VERSION, DECKS_SCHEMA_VERSION, WANTS_SCHEMA_VERSION } from './keys';
import { COLLECTION_MIGRATIONS, DECKS_MIGRATIONS, WANTS_MIGRATIONS } from './migrations';

describe('migration chains', () => {
  it('has one collection migration for every schema version after the first', () => {
    expect(COLLECTION_MIGRATIONS.length + 1).toBe(COLLECTION_SCHEMA_VERSION);
  });

  it('has one deck migration for every schema version after the first', () => {
    expect(DECKS_MIGRATIONS.length + 1).toBe(DECKS_SCHEMA_VERSION);
  });

  it('has one want migration for every schema version after the first', () => {
    expect(WANTS_MIGRATIONS.length + 1).toBe(WANTS_SCHEMA_VERSION);
  });
});
