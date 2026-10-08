import { useEffect, useRef, useState } from 'react';

/*
 * Scan diagnostics (T-113a): a developer panel under the scanner frame, only with `?scandebug=1` in the address.
 * Nothing is stored or sent. The samples live in this module (not in the component), so closing the scanner, taking a
 * picture or switching modes does not lose them; only a page reload does. Every saved sample also copies all results to
 * the clipboard (the tap is the user gesture), so a reload loses nothing that was not already copied. The texts are hard-coded English on purpose (developer mode, not translated).
 */

export interface DebugReading {
  top3: { id: string; name: string; distance: number }[];
  gap: number | null;
  confident: boolean;
  sharpness: number;
  resolution: string;
  focus: string;
}

interface Sample {
  correct: 0 | 1 | 2 | 3;
  top3: { name: string; id: string; distance: number }[];
  gap: number | null;
  sharpness: number;
  resolution: string;
}

const TICK_MS = 330;

/** True when the address asks for the diagnostics (`?scandebug=1`, the query string, not the hash). */
export function scanDebugRequested(): boolean {
  return new URLSearchParams(window.location.search).get('scandebug') === '1';
}

const round = (value: number) => Math.round(value * 10) / 10;

/** The samples of this page load, kept outside the component so they survive the scanner closing (T-113a). */
let savedSamples: Sample[] = [];

/** For tests: forget the samples of earlier tests. */
export function resetScanDebugSamples() {
  savedSamples = [];
}

function writeClipboard(json: string): Promise<void> {
  return typeof navigator.clipboard?.writeText === 'function' ? navigator.clipboard.writeText(json) : Promise.reject(new Error('no clipboard'));
}

export function ScanDebugPanel({ measure }: { measure: () => DebugReading | null }) {
  const measureRef = useRef(measure);
  useEffect(() => {
    measureRef.current = measure;
  });
  const [reading, setReading] = useState<DebugReading | null>(null);
  const [frozen, setFrozen] = useState<DebugReading | null>(null);
  const [samples, setSamplesState] = useState<Sample[]>(savedSamples);
  const [fallback, setFallback] = useState<string | null>(null);

  // The live line stops while a sample is being labelled, so nothing moves under the user's finger.
  const picking = frozen !== null;
  useEffect(() => {
    if (picking) return;
    const timer = window.setInterval(() => setReading(measureRef.current()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [picking]);

  const setSamples = (next: Sample[]) => {
    savedSamples = next;
    setSamplesState(next);
  };

  // The automatic copy after a sample is silent; the text box for copying by hand only opens from "Copy results".
  const copy = (list: Sample[], showFallback: boolean) => {
    const json = JSON.stringify(list);
    writeClipboard(json).then(
      () => setFallback(null),
      () => {
        if (showFallback) setFallback(json);
      },
    );
  };

  const save = (correct: 0 | 1 | 2 | 3) => {
    if (frozen === null) return;
    const next = [
      ...samples,
      {
        correct,
        top3: frozen.top3.map((m) => ({ name: m.name, id: m.id, distance: m.distance })),
        gap: frozen.gap,
        sharpness: round(frozen.sharpness),
        resolution: frozen.resolution,
      },
    ];
    setSamples(next);
    setFrozen(null);
    copy(next, false);
  };

  return (
    <section className="scanner-debug" aria-label="Scan diagnostics">
      <p className="scanner-debug-line" role="status">
        {reading === null
          ? 'Waiting for a picture...'
          : `${reading.top3.map((m, i) => `${i + 1}. ${m.name} ${m.distance}`).join(' | ')} | gap ${reading.gap ?? '-'} | confident ${reading.confident ? 'yes' : 'no'} | sharp ${round(reading.sharpness)} | ${reading.resolution} | focus ${reading.focus}`}
      </p>
      <p className="scanner-debug-count">
        {`${samples.length} samples · copied to the clipboard after every sample`}
      </p>
      {frozen === null ? (
        <button type="button" className="button-secondary" disabled={reading === null} onClick={() => setFrozen(reading)}>
          Save sample
        </button>
      ) : (
        <div className="scanner-debug-pick">
          {frozen.top3.map((m, i) => (
            <button key={m.id} type="button" className="button-secondary" onClick={() => save((i + 1) as 1 | 2 | 3)}>
              {`${i + 1}. ${m.name} (${m.distance})`}
            </button>
          ))}
          <button type="button" className="button-secondary" onClick={() => save(0)}>
            None of these
          </button>
          <button type="button" className="link-button" onClick={() => setFrozen(null)}>
            Cancel
          </button>
        </div>
      )}
      {samples.length > 0 && (
        <div className="scanner-debug-tools">
          <button type="button" className="link-button" onClick={() => copy(samples, true)}>
            Copy results
          </button>
          <button type="button" className="link-button" onClick={() => setSamples(samples.slice(0, -1))}>
            Undo last sample
          </button>
        </div>
      )}
      {fallback !== null && <textarea className="scanner-debug-json" readOnly aria-label="Results" rows={Math.max(3, Math.ceil(fallback.length / 40))} value={fallback} />}
    </section>
  );
}
