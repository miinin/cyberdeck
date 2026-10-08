/*
 * Decision logic of the continuous scan mode (T-108, T-113b): pure functions, no camera and no clock of their own.
 * Each picture taken from the frame becomes one observation: the id of the art when the match was sure
 * (`isConfident`), otherwise null. A card is added when the same art was sure in WINDOW_HITS of the last
 * WINDOW_SIZE pictures, and not again until the frame has shown something else (another card or no sure match)
 * for long enough. Blurred pictures (below MIN_SHARPNESS) are not observations at all.
 */

/** How long something else must be in the frame before the same card may be added again. */
export const AWAY_MS = 700;
/** Pictures per second the scanner aims for in the continuous mode. */
export const SCAN_INTERVAL_MS = 280;
/** A card is added when it was sure in this many of the last WINDOW_SIZE pictures. */
export const WINDOW_HITS = 3;
export const WINDOW_SIZE = 4;
/** Pictures sharper than this count; blurrier ones are skipped (measured: sharpness 248..1803 on real cards). */
export const MIN_SHARPNESS = 150;
/** How long the same best match must stay before it is offered with an "Add" button. */
export const SUGGEST_MS = 1500;
/** The best match is offered only when it is at most this far (the sure limit is lower). */
export const SUGGEST_MAX_DISTANCE = 650;

export interface ContinuousState {
  /** The last observations, newest last (at most WINDOW_SIZE). */
  readonly window: readonly (string | null)[];
  /** The card added last; it is still in the frame until it has been away for AWAY_MS. */
  readonly blocked: string | null;
  /** When something else than the blocked card first showed up in the frame, or null. */
  readonly awaySince: number | null;
}

export const initialContinuousState: ContinuousState = { window: [], blocked: null, awaySince: null };

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
    return { state: { window: [], blocked, awaySince: null }, add: null };
  }
  if (blocked !== null) {
    awaySince ??= at;
    if (at - awaySince >= AWAY_MS) {
      blocked = null;
      awaySince = null;
    }
  }
  const window = [...state.window, id].slice(-WINDOW_SIZE);
  if (id !== null && window.filter((seen) => seen === id).length >= WINDOW_HITS) {
    return { state: { window: [], blocked: id, awaySince: null }, add: id };
  }
  return { state: { window, blocked, awaySince }, add: null };
}

/** The art the frame is "holding still" on: seen in the window but not often enough to add yet; null otherwise. */
export function candidateInWindow(state: ContinuousState): string | null {
  const last = state.window[state.window.length - 1];
  if (last === null || last === undefined || last === state.blocked) return null;
  return state.window.filter((seen) => seen === last).length < WINDOW_HITS ? last : null;
}

/** True when a picture is sharp enough to be an observation. */
export function isSharpEnough(sharpness: number): boolean {
  return sharpness >= MIN_SHARPNESS;
}

export interface SuggestionState {
  /** The best match now and since when it has been the best one. */
  readonly best: string | null;
  readonly since: number;
  /** The art offered with an "Add" button, or null. It changes only when another best match has stayed for SUGGEST_MS. */
  readonly shown: string | null;
}

export const initialSuggestionState: SuggestionState = { best: null, since: 0, shown: null };

/**
 * Takes the best match of a picture (`distance`, `sure` = it is a sure match) and returns the new state. The offer
 * follows the best match only after it has stayed for SUGGEST_MS, so nothing jumps under a finger.
 */
export function stepSuggestion(state: SuggestionState, best: string | null, distance: number, sure: boolean, at: number): SuggestionState {
  const id = best !== null && distance <= SUGGEST_MAX_DISTANCE ? best : null;
  const since = id === state.best ? state.since : at;
  if (at - since < SUGGEST_MS) return { best: id, since, shown: state.shown };
  // Stable for long enough: offer it when it is not already a sure match (that one is added by itself).
  return { best: id, since, shown: id !== null && !sure ? id : null };
}
