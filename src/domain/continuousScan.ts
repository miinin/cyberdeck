/*
 * Decision logic of the continuous scan mode (T-108): pure functions, no camera and no clock of their own.
 * Each picture taken from the frame becomes one observation: the id of the art when the match was sure
 * (`isConfident`), otherwise null. A card is added when the same art is sure in two pictures in a row, and not
 * again until the frame has shown something else (another card or no sure match) for long enough.
 */

/** How long something else must be in the frame before the same card may be added again. */
export const AWAY_MS = 700;
/** Pictures per second the scanner aims for in the continuous mode. */
export const SCAN_INTERVAL_MS = 280;

export interface ContinuousState {
  /** Sure in the previous picture and not added yet. */
  readonly pending: string | null;
  /** The card added last; it is still in the frame until it has been away for AWAY_MS. */
  readonly blocked: string | null;
  /** When something else than the blocked card first showed up in the frame, or null. */
  readonly awaySince: number | null;
}

export const initialContinuousState: ContinuousState = { pending: null, blocked: null, awaySince: null };

export interface ContinuousStep {
  readonly state: ContinuousState;
  /** The art id to add now (one copy), or null. */
  readonly add: string | null;
}

/** Takes one observation (`id` null = no sure match) taken at time `at` (ms) and tells whether to add a card. */
export function stepContinuous(state: ContinuousState, id: string | null, at: number): ContinuousStep {
  let { blocked, awaySince } = state;
  if (blocked !== null && id === blocked) {
    // The added card is still there: the away timer starts over, nothing else happens.
    return { state: { pending: null, blocked, awaySince: null }, add: null };
  }
  if (blocked !== null) {
    awaySince ??= at;
    if (at - awaySince >= AWAY_MS) {
      blocked = null;
      awaySince = null;
    }
  }
  if (id === null) return { state: { pending: null, blocked, awaySince }, add: null };
  if (state.pending === id) return { state: { pending: null, blocked: id, awaySince: null }, add: id };
  return { state: { pending: id, blocked, awaySince }, add: null };
}
