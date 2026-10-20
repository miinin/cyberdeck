/**
 * T-188: a card clicked in a view other than Cards (Have/Want, the deck editor) opens the card dialog at #/kortti/<key>.
 * The view it came from stays mounted behind the dialog (App renders it from the remembered address and CatalogView shows only
 * the dialog), so its state (search, filters, tab, scroll position) is untouched. Closing returns to that view's address and
 * puts focus back on the clicked card. The origin is kept per card key; App forgets it when the route leaves the dialog.
 */
interface Origin {
  key: string;
  hash: string;
  opener: HTMLElement | null;
}

let origin: Origin | null = null;

/** Goes to the card dialog of `key` and remembers where to come back to and which element was clicked. */
export function openCardPage(key: string, opener?: HTMLElement | null): void {
  const active = document.activeElement;
  origin = {
    key,
    hash: window.location.hash === '' ? '#/' : window.location.hash,
    opener: opener ?? (active instanceof HTMLElement && active !== document.body ? active : null),
  };
  window.location.hash = `#/kortti/${encodeURIComponent(key)}`;
}

/** The address of the view that opened the dialog of `key`, or null for a direct link. */
export function cardOriginHash(key: string): string | null {
  return origin !== null && origin.key === key ? origin.hash : null;
}

/** The element that opened the dialog of `key`. */
export function cardOriginOpener(key: string): HTMLElement | null {
  return origin !== null && origin.key === key ? origin.opener : null;
}

export function forgetCardOrigin(): void {
  origin = null;
}
