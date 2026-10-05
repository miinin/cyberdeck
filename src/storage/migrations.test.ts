import { CARDS } from '../data/cards';
import { betaPrintingKeys } from '../domain/betaMigration';
import { COLLECTION_ENVELOPE_SPEC, WANTS_ENVELOPE_SPEC, decodeEnvelopeValue } from './index';
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

describe('collection 2 -> 3 on the bundled cards (D-022)', () => {
  const raw = (schemaVersion: number, entries: unknown[]) => ({ schemaVersion, savedAt: '2026-10-06T00:00:00.000Z', data: { entries } });
  const decode = (envelope: unknown) => decodeEnvelopeValue(envelope, COLLECTION_ENVELOPE_SPEC);

  it('moves the unversioned copies of every card with a Beta printing to it, and nothing else', () => {
    const entries = CARDS.map((card) => ({ card: card.key, count: 3 }));
    const decoded = decode(raw(2, entries));
    expect(decoded).toMatchObject({ kind: 'ok', dropped: 0, fromVersion: 2 });
    if (decoded.kind !== 'ok') return;
    const beta = betaPrintingKeys(CARDS);
    expect(decoded.value.entries).toHaveLength(CARDS.length);
    for (const entry of decoded.value.entries) {
      expect(entry.count).toBe(3);
      const key = beta.get(entry.card);
      if (key === undefined) expect(entry.versions).toBeUndefined();
      else expect(entry.versions).toEqual({ [key]: 3 });
    }
    expect([...beta.values()].some((key) => key === 'welcometonightcitybeta:005a')).toBe(true);
  });

  it('never converts a version 3 document again', () => {
    const entries = [{ card: 'detonate', count: 3 }, { card: 'v-streetkid', count: 2, versions: { 'welcometonightcityretail:005a': 1 } }];
    const decoded = decode(raw(3, entries));
    expect(decoded).toMatchObject({ kind: 'ok', fromVersion: 3, value: { entries: [...entries].sort((a, b) => (a.card < b.card ? -1 : 1)) } });
  });

  it('converts version 1 data too, and a second pass over the result changes nothing', () => {
    const first = decode(raw(1, [{ card: 'detonate', count: 2 }]));
    expect(first).toMatchObject({ kind: 'ok', value: { entries: [{ card: 'detonate', count: 2, versions: { 'welcometonightcitybeta:031': 2 } }] } });
    if (first.kind !== 'ok') return;
    const again = decode(raw(3, first.value.entries.map((e) => ({ ...e }))));
    expect(again).toMatchObject({ kind: 'ok', value: first.value });
  });

  it('keeps the card count, the intact rows and the breakdown sum under the count with mixed input', () => {
    const entries = [
      { card: 'v-streetkid', count: 4, versions: { 'welcometonightcitybeta:144': 1, 'welcometonightcityretail:005a': 1 } },
      { card: 'detonate', count: 999 },
      { card: 'minotaur', count: 2 },
      { card: 'Bad Key', count: 2 },
    ];
    const decoded = decode(raw(2, entries));
    if (decoded.kind !== 'ok') throw new Error('not ok');
    expect(decoded.dropped).toBe(1);
    const byCard = new Map(decoded.value.entries.map((e) => [e.card, e]));
    expect(byCard.get('v-streetkid')).toEqual({
      card: 'v-streetkid',
      count: 4,
      versions: { 'welcometonightcitybeta:144': 1, 'welcometonightcityretail:005a': 1, 'welcometonightcitybeta:005a': 2 },
    });
    expect(byCard.get('detonate')).toEqual({ card: 'detonate', count: 999, versions: { 'welcometonightcitybeta:031': 999 } });
    expect(byCard.get('minotaur')).toEqual({ card: 'minotaur', count: 2 });
  });

  it('leaves the want list alone', () => {
    const entries = [{ card: 'detonate', count: 3 }];
    expect(decodeEnvelopeValue(raw(1, entries), WANTS_ENVELOPE_SPEC)).toMatchObject({ kind: 'ok', value: { entries } });
  });

  it('shows a version 4 document as newer (an old client locks)', () => {
    expect(decode(raw(4, []))).toEqual({ kind: 'newer', version: 4 });
  });
});
