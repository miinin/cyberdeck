import type { DeckContent } from './deck';
import { deckToText } from './deckExport';
import type { CardsByKey } from './deckRules';
import { MAX_IMPORT_BYTES } from './deckText';

/**
 * Deck share links (T-056): the deck list text, base64url-coded into the URL hash. The data is untrusted;
 * decode only checks the shape and size, and the text parser does the rest (SR-17, SR-1).
 */
export const MAX_SHARE_DATA_LENGTH = 16000;

const BASE64URL = /^[A-Za-z0-9_-]+$/;

/** The deck list without comment lines, so the link stays short. */
export function encodeDeckShare(deck: DeckContent, cardsByKey: CardsByKey): string {
  const text = deckToText(deck, cardsByKey)
    .split('\n')
    .filter((line) => line !== '' && (!line.startsWith('//') || line.startsWith('// Sideboard')))
    .join('\n');
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** The deck list text, or null when the data is empty, too long, not base64url or not UTF-8. */
export function decodeDeckShare(data: string): string | null {
  if (data === '' || data.length > MAX_SHARE_DATA_LENGTH || !BASE64URL.test(data)) return null;
  try {
    const binary = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    if (binary.length > MAX_IMPORT_BYTES) return null;
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}
