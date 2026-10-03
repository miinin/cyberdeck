import { parseCollection } from '../domain/validate';
import type { Collection } from '../domain/collection';
import { decodeEnvelope, decodeEnvelopeValue, encodeEnvelope } from './envelope';
import type { EnvelopeSpec, Migration } from './envelope';

const collectionSpec: EnvelopeSpec<Collection> = { currentVersion: 1, migrations: [], parse: parseCollection };
const SAVED_AT = new Date('2026-10-01T12:00:00.000Z');

function envelope(schemaVersion: unknown, data: unknown): string {
  return JSON.stringify({ schemaVersion, savedAt: SAVED_AT.toISOString(), data });
}

describe('decodeEnvelope', () => {
  it('returns empty for a missing value', () => {
    expect(decodeEnvelope(null, collectionSpec)).toEqual({ kind: 'empty' });
  });

  it('decodes a valid envelope', () => {
    expect(decodeEnvelope(envelope(1, { entries: [{ card: 'detonate', count: 2 }] }), collectionSpec)).toEqual({
      kind: 'ok',
      value: { entries: [{ card: 'detonate', count: 2 }] },
      dropped: 0,
      fromVersion: 1,
    });
  });

  it('reports dropped rows from partly broken data', () => {
    const decoded = decodeEnvelope(envelope(1, { entries: [{ card: 'detonate', count: 2 }, 'x'] }), collectionSpec);
    expect(decoded).toMatchObject({ kind: 'ok', dropped: 1 });
  });

  it.each([
    ['invalid JSON', '{"schemaVersion":1,'],
    ['empty string', ''],
    ['JSON null', 'null'],
    ['JSON array', '[1]'],
    ['JSON string', '"text"'],
    ['missing schemaVersion', JSON.stringify({ data: { entries: [] } })],
    ['string schemaVersion', envelope('1', { entries: [] })],
    ['decimal schemaVersion', envelope(1.5, { entries: [] })],
    ['zero schemaVersion', envelope(0, { entries: [] })],
    ['negative schemaVersion', envelope(-1, { entries: [] })],
    ['missing data', JSON.stringify({ schemaVersion: 1 })],
    ['wrong data', envelope(1, { entries: 'x' })],
  ])('returns corrupt for %s', (_label, raw) => {
    expect(decodeEnvelope(raw, collectionSpec)).toEqual({ kind: 'corrupt' });
  });

  it('returns newer for a version above the current one', () => {
    expect(decodeEnvelope(envelope(2, { anything: true }), collectionSpec)).toEqual({ kind: 'newer', version: 2 });
  });

  it('runs migrations in order from the stored version', () => {
    const calls: string[] = [];
    const migrations: Migration[] = [
      (data) => {
        calls.push('1→2');
        return { items: data };
      },
      (data) => {
        calls.push('2→3');
        return { entries: (data as { items: unknown }).items };
      },
    ];
    const spec: EnvelopeSpec<Collection> = { currentVersion: 3, migrations, parse: parseCollection };

    expect(decodeEnvelope(envelope(1, [{ card: 'detonate', count: 1 }]), spec)).toEqual({
      kind: 'ok',
      value: { entries: [{ card: 'detonate', count: 1 }] },
      dropped: 0,
      fromVersion: 1,
    });
    expect(calls).toEqual(['1→2', '2→3']);

    calls.length = 0;
    expect(decodeEnvelope(envelope(2, { items: [] }), spec)).toMatchObject({ kind: 'ok', fromVersion: 2 });
    expect(calls).toEqual(['2→3']);
  });

  it('returns corrupt when a migration throws or is missing', () => {
    const throwing: EnvelopeSpec<Collection> = {
      currentVersion: 2,
      migrations: [
        () => {
          throw new Error('broken');
        },
      ],
      parse: parseCollection,
    };
    expect(decodeEnvelope(envelope(1, { entries: [] }), throwing)).toEqual({ kind: 'corrupt' });

    const missing: EnvelopeSpec<Collection> = { currentVersion: 2, migrations: [], parse: parseCollection };
    expect(decodeEnvelope(envelope(1, { entries: [] }), missing)).toEqual({ kind: 'corrupt' });
  });
});

describe('encodeEnvelope', () => {
  it('round-trips through decodeEnvelope', () => {
    const value: Collection = { entries: [{ card: 'detonate', count: 3 }] };
    const raw = encodeEnvelope(value, 1, SAVED_AT);

    expect(JSON.parse(raw)).toEqual({ schemaVersion: 1, savedAt: '2026-10-01T12:00:00.000Z', data: value });
    expect(decodeEnvelope(raw, collectionSpec)).toEqual({ kind: 'ok', value, dropped: 0, fromVersion: 1 });
  });
});

describe('decodeEnvelopeValue', () => {
  it('decodes a parsed object like decodeEnvelope decodes its JSON', () => {
    const value = { schemaVersion: 1, savedAt: SAVED_AT.toISOString(), data: { entries: [{ card: 'detonate', count: 2 }] } };
    expect(decodeEnvelopeValue(value, collectionSpec)).toEqual(decodeEnvelope(JSON.stringify(value), collectionSpec));
  });

  it('rejects non-objects and reports newer versions', () => {
    expect(decodeEnvelopeValue(null, collectionSpec)).toEqual({ kind: 'corrupt' });
    expect(decodeEnvelopeValue([], collectionSpec)).toEqual({ kind: 'corrupt' });
    expect(decodeEnvelopeValue({ schemaVersion: 2, data: {} }, collectionSpec)).toEqual({ kind: 'newer', version: 2 });
  });
});
