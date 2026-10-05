import { isCardKey } from './cardKey';
import type { CardKey } from './cardKey';
import { MAX_COLLECTION_COUNT, MAX_COLLECTION_ENTRIES, compareCardKeys } from './collection';
import type { Collection, CollectionEntry } from './collection';
import { MAX_SHARE_DATA_LENGTH } from './deckShare';
import { MAX_IMPORT_BYTES } from './deckText';
import type { WantList } from './wants';

/**
 * Trade links (T-062, D-018 kohta 3): the whole collection ("have") and the want list as text, base64url-coded
 * into the URL hash. The data is untrusted (SR-17): size limits come before parsing, every line goes through
 * a linear regex and isCardKey, lookups use Map, and a bad line is dropped and counted instead of failing.
 */
export const TRADE_HEADER = 'cyberdeck-vaihto 1';

const LINE = /^([hw]) ([1-9][0-9]{0,2}) ([a-z0-9-]{1,100})$/;
const BASE64URL = /^[A-Za-z0-9_-]+$/;

export interface TradeShare {
  readonly have: Collection;
  readonly want: WantList;
  /** Lines that were left out: bad shape, bad key, or a key twice in the same list. */
  readonly dropped: number;
}

/** The link data, or null when it would not fit into a link (never a truncated link). */
export function encodeTradeShare(have: Collection, want: WantList): string | null {
  const lines = [TRADE_HEADER];
  for (const [prefix, list] of [
    ['h', have],
    ['w', want],
  ] as const) {
    for (const { card, count } of list.entries) lines.push(`${prefix} ${count} ${card}`);
  }
  const text = lines.join('\n');
  if (text.length > MAX_IMPORT_BYTES) return null;
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const data = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return data.length > MAX_SHARE_DATA_LENGTH ? null : data;
}

function toCollection(counts: ReadonlyMap<CardKey, number>): Collection {
  const entries: CollectionEntry[] = [...counts].map(([card, count]) => ({
    card,
    count,
  }));
  entries.sort((a, b) => compareCardKeys(a.card, b.card));
  return { entries };
}

/** The shared lists, or null when the link is empty, too long, not base64url, not UTF-8 or has a wrong header. */
export function decodeTradeShare(data: string): TradeShare | null {
  if (data === '' || data.length > MAX_SHARE_DATA_LENGTH || !BASE64URL.test(data)) return null;
  let text: string;
  try {
    const binary = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    if (binary.length > MAX_IMPORT_BYTES) return null;
    text = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
  } catch {
    return null;
  }
  const lines = text.split('\n');
  if (lines[0] !== TRADE_HEADER || lines.length > 2 * MAX_COLLECTION_ENTRIES + 1) return null;
  const lists = {
    h: new Map<CardKey, number>(),
    w: new Map<CardKey, number>(),
  };
  let dropped = 0;
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (line === '' && i === lines.length - 1) continue;
    const match = LINE.exec(line);
    const list = match === null ? undefined : lists[match[1] as 'h' | 'w'];
    const card = match?.[3];
    const count = Number(match?.[2]);
    if (
      list === undefined ||
      card === undefined ||
      !isCardKey(card) ||
      !(count >= 1 && count <= MAX_COLLECTION_COUNT) ||
      list.has(card) ||
      list.size >= MAX_COLLECTION_ENTRIES
    ) {
      dropped += 1;
      continue;
    }
    list.set(card, count);
  }
  return { have: toCollection(lists.h), want: toCollection(lists.w), dropped };
}
