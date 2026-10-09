/**
 * "Scan a new deck" on the deck list (T-119) creates the deck and opens its editor; the editor then opens the scanner
 * at once. The wish is passed in memory (the route is only the deck id): the editor reads it when it mounts and
 * clears it on unmount, so a later visit to the same deck does not open the camera again.
 */
let wanted: string | null = null;

export function requestDeckScan(deckId: string): void {
  wanted = deckId;
}

export function deckScanRequested(deckId: string): boolean {
  return wanted === deckId;
}

export function clearDeckScan(): void {
  wanted = null;
}
