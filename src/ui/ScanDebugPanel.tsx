import { useEffect, useRef, useState } from 'react';

/*
 * Scan diagnostics (T-113a): a developer panel under the scanner frame, only with `?scandebug=1` in the address.
 * Nothing is stored or sent: the samples live in this component's state until the page closes, and the user copies
 * them by hand. The texts are hard-coded English on purpose (developer mode, not translated).
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

export function ScanDebugPanel({ measure }: { measure: () => DebugReading | null }) {
  const measureRef = useRef(measure);
  useEffect(() => {
    measureRef.current = measure;
  });
  const [reading, setReading] = useState<DebugReading | null>(null);
  const [frozen, setFrozen] = useState<DebugReading | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [fallback, setFallback] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setReading(measureRef.current()), TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  const save = (correct: 0 | 1 | 2 | 3) => {
    if (frozen === null) return;
    setSamples((list) => [
      ...list,
      {
        correct,
        top3: frozen.top3.map((m) => ({ name: m.name, id: m.id, distance: m.distance })),
        gap: frozen.gap,
        sharpness: round(frozen.sharpness),
        resolution: frozen.resolution,
      },
    ]);
    setFrozen(null);
  };

  const copy = () => {
    const json = JSON.stringify(samples, null, 1);
    const written = typeof navigator.clipboard?.writeText === 'function' ? navigator.clipboard.writeText(json) : Promise.reject(new Error('no clipboard'));
    written.then(
      () => setFallback(null),
      () => setFallback(json),
    );
  };

  return (
    <section className="scanner-debug" aria-label="Scan diagnostics">
      <p className="scanner-debug-line" role="status">
        {reading === null
          ? 'Waiting for a picture...'
          : `${reading.top3.map((m, i) => `${i + 1}. ${m.name} ${m.distance}`).join(' | ')} | gap ${reading.gap ?? '-'} | confident ${reading.confident ? 'yes' : 'no'} | sharp ${round(reading.sharpness)} | ${reading.resolution} | focus ${reading.focus}`}
      </p>
      {frozen === null ? (
        <button type="button" className="button-secondary" disabled={reading === null} onClick={() => setFrozen(reading)}>
          Save sample
        </button>
      ) : (
        <div className="scanner-debug-pick">
          <p>Which card is it?</p>
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
      <p>{`${samples.length} samples`}</p>
      {samples.length > 0 && (
        <button type="button" className="button-secondary" onClick={copy}>
          Copy results
        </button>
      )}
      {fallback !== null && <textarea className="scanner-debug-json" readOnly aria-label="Results" rows={fallback.split('\n').length} value={fallback} />}
    </section>
  );
}
