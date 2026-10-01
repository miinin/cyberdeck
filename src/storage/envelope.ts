/*
 * Versioned envelope { schemaVersion, savedAt, data } around every stored value (D-008 kohta 4, SR-11).
 * Pure functions: they never touch storage and never throw.
 */
import { isRecord } from '../domain/validate';
import type { Parsed } from '../domain/validate';

/** migrations[i] turns data of version i + 1 into version i + 2. */
export type Migration = (data: unknown) => unknown;

export interface EnvelopeSpec<T> {
  currentVersion: number;
  migrations: readonly Migration[];
  parse: (data: unknown) => Parsed<T> | null;
}

export type Decoded<T> =
  | { kind: 'empty' }
  | { kind: 'ok'; value: T; dropped: number; fromVersion: number }
  /** Invalid JSON, envelope or data, or a migration threw. */
  | { kind: 'corrupt' }
  | { kind: 'newer'; version: number };

export function decodeEnvelope<T>(raw: string | null, spec: EnvelopeSpec<T>): Decoded<T> {
  if (raw === null) return { kind: 'empty' };

  let envelope: unknown;
  try {
    envelope = JSON.parse(raw);
  } catch {
    return { kind: 'corrupt' };
  }
  if (!isRecord(envelope)) return { kind: 'corrupt' };

  const version = envelope.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return { kind: 'corrupt' };
  if (version > spec.currentVersion) return { kind: 'newer', version };

  let data = envelope.data;
  try {
    for (let from = version; from < spec.currentVersion; from += 1) {
      const migrate = spec.migrations[from - 1];
      if (migrate === undefined) return { kind: 'corrupt' };
      data = migrate(data);
    }
  } catch {
    return { kind: 'corrupt' };
  }

  const parsed = spec.parse(data);
  if (parsed === null) return { kind: 'corrupt' };
  return { kind: 'ok', value: parsed.value, dropped: parsed.dropped, fromVersion: version };
}

export function encodeEnvelope(data: unknown, version: number, savedAt: Date): string {
  return JSON.stringify({ schemaVersion: version, savedAt: savedAt.toISOString(), data });
}
