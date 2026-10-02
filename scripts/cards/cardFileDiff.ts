import type { Card } from '../../src/domain/card';
import type { CardKey } from '../../src/domain/cardKey';

export interface CardFileDiff {
  /** Keys in the new data only, in new data order. */
  added: CardKey[];
  /** Keys in the old data only, in old data order. Saved collections may still refer to these. */
  removed: CardKey[];
  /** Keys in both whose fields differ, in new data order, with the names of the changed fields. */
  changed: { key: CardKey; fields: (keyof Card)[] }[];
}

const COMPARED_FIELDS: readonly (keyof Card)[] = ['id', 'slug', 'name', 'subname', 'displayName', 'type', 'color', 'cost', 'power', 'ram'];

/** Compares two validated card lists by key (D-008: the key is the card's identity). */
export function diffCardFiles(previous: readonly Card[], next: readonly Card[]): CardFileDiff {
  const before = new Map(previous.map((card) => [card.key, card]));
  const after = new Set(next.map((card) => card.key));
  const diff: CardFileDiff = { added: [], removed: [], changed: [] };

  for (const card of next) {
    const old = before.get(card.key);
    if (old === undefined) {
      diff.added.push(card.key);
      continue;
    }
    const fields = COMPARED_FIELDS.filter((field) => old[field] !== card[field]);
    if (fields.length > 0) diff.changed.push({ key: card.key, fields });
  }
  diff.removed = previous.filter((card) => !after.has(card.key)).map((card) => card.key);
  return diff;
}
