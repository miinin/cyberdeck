import type { Card } from './card';
import { isCardKey } from './cardKey';
import { editionPrinting } from './edition';
import { isRecord } from './validate';
import { isPrintingKey, MAX_VERSIONS_PER_CARD } from './printing';

/*
 * The one-time conversion of collection schema 2 -> 3 (D-022): every copy of a card whose printing is not known
 * (count minus the breakdown) is recorded as the card's Beta printing, when the card has one. The count never
 * changes. Pure functions on untrusted stored or cloud data; the result is parsed by parseCollection afterwards.
 */

/** card key -> key of its ordinary-rarity Beta printing (the first by collector number), only for cards that have one. */
export function betaPrintingKeys(cards: readonly Card[]): Map<string, string> {
  const result = new Map<string, string>();
  for (const card of cards) {
    const beta = editionPrinting(card, 'beta');
    if (beta !== null) result.set(card.key, beta.key);
  }
  return result;
}

/** Same reading of the breakdown as parseCollection: invalid pairs are skipped; a breakdown that is too big or over the count counts as none. */
function readVersions(raw: unknown, count: number): Record<string, number> {
  if (!isRecord(raw)) return {};
  const pairs = Object.entries(raw);
  if (pairs.length > MAX_VERSIONS_PER_CARD) return {};
  const versions: Record<string, number> = {};
  let total = 0;
  for (const [key, n] of pairs) {
    if (!isPrintingKey(key) || typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > 999) continue;
    versions[key] = n;
    total += n;
  }
  return total > count ? {} : versions;
}

/**
 * Returns the collection data `{ entries }` with the unversioned copies moved to the Beta printing. Data that is
 * not shaped `{ entries: [...] }` is returned as it is (the parser then rejects it). Rows that cannot or need not
 * change are passed on untouched. Running it on its own result changes nothing more only because the result has
 * no unversioned copies left of cards that have a Beta printing; the schema version guards against a second run.
 */
export function migrateCollectionToBeta(data: unknown, beta: ReadonlyMap<string, string>): unknown {
  if (!isRecord(data) || !Array.isArray(data.entries)) return data;
  const entries: unknown[] = (data.entries as unknown[]).map((item) => {
    if (!isRecord(item) || !isCardKey(item.card) || typeof item.count !== 'number' || !Number.isInteger(item.count)) return item;
    if (item.count < 1 || item.count > 999) return item;
    const betaKey = beta.get(item.card);
    if (betaKey === undefined) return item;
    const versions = readVersions(item.versions, item.count);
    const unknown = item.count - Object.values(versions).reduce((sum, n) => sum + n, 0);
    if (unknown <= 0) return item;
    if (versions[betaKey] === undefined && Object.keys(versions).length >= MAX_VERSIONS_PER_CARD) return item;
    return { card: item.card, count: item.count, versions: { ...versions, [betaKey]: (versions[betaKey] ?? 0) + unknown } };
  });
  return { entries };
}
