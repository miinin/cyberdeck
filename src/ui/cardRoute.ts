/**
 * T-188: a card clicked in a view other than Cards (Have/Want) opens the card dialog at #/kortti/<key>, which the Cards view shows.
 * Closing it takes the user back to the view the click came from, not to Cards. The return address is kept per card key, so a
 * stale one never sends a direct link somewhere.
 */
let origin: { key: string; hash: string } | null = null;

/** Goes to the card dialog of `key` and remembers where to come back to. */
export function openCardPage(key: string): void {
  origin = { key, hash: window.location.hash === '' ? '#/' : window.location.hash };
  window.location.hash = `#/kortti/${encodeURIComponent(key)}`;
}

/** Where closing the dialog of `key` leads: the view that opened it, else Cards. */
export function takeCardReturnHash(key: string): string {
  const back = origin !== null && origin.key === key ? origin.hash : '#/';
  origin = null;
  return back;
}
