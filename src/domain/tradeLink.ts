/*
 * Short trade links (T-178, D-037, SR-50, SR-53). The document `tradeShares/{shareId}` holds the trade data
 * (encodeTradeShare output) and nothing that identifies the owner. shareId = the first 16 hex characters of
 * sha256(uid + '#trade'), the value the rules compute. Everything read back is untrusted (parseTradeShareDoc).
 */
import { MAX_SHARE_DATA_LENGTH } from './deckShare';
import { isRecord } from './validate';

export const TRADE_SHARE_SCHEMA_VERSION = 1;
/** SR-54: an automatic update waits at least this long; the rules require 10 s between updates. */
export const TRADE_SHARE_UPDATE_DELAY_MS = 15_000;

const SHARE_ID = /^[0-9a-f]{16}$/;
const BASE64URL = /^[A-Za-z0-9_-]+$/;

export function isTradeShareId(value: unknown): value is string {
  return typeof value === 'string' && SHARE_ID.test(value);
}

/** shareId = first 16 hex characters of sha256(uid + '#trade'). '#' is not in a deckId, so it never collides with publicDeckId (SR-50). */
export async function tradeShareId(uid: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${uid}#trade`));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

export type TradeShareDoc = { kind: 'ok'; data: string } | { kind: 'newer' };

/**
 * Validates a document read from `tradeShares/{shareId}` (SR-53). Null = invalid, shown as "not found".
 * A newer schema version is reported separately, so the app can ask for an update.
 */
export function parseTradeShareDoc(raw: unknown): TradeShareDoc | null {
  if (!isRecord(raw)) return null;
  const version = raw.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1 || version > 1000) return null;
  if (version > TRADE_SHARE_SCHEMA_VERSION) return { kind: 'newer' };
  const data = raw.data;
  if (typeof data !== 'string' || data === '' || data.length > MAX_SHARE_DATA_LENGTH || !BASE64URL.test(data)) return null;
  return { kind: 'ok', data };
}
