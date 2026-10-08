import { useEffect, useMemo, useRef, useState } from 'react';
import { getCardImage } from '../data/cardImages';
import { loadFingerprintIndex } from '../data/fingerprintIndex';
import { variantImageUrl } from '../data/variantImages';
import { artsOf } from '../domain/arts';
import type { Art } from '../domain/arts';
import type { Card } from '../domain/card';
import { CARD_IMAGE_ASPECT } from '../domain/cardImage';
import { isConfident, queryFingerprints, rankFingerprints } from '../domain/cardFingerprint';
import type { IndexedFingerprint } from '../domain/cardFingerprint';
import type { Edition } from '../domain/edition';
import { coverCropSource } from '../domain/scanCrop';
import { MAX_COPIES, addCopies } from './collectionEntry';
import type { CollectionSnapshot, CollectionStore } from './collectionStore';
import { markEditionConfirmed } from './EditionConfirmDialog';
import { scannerTexts } from './scannerTexts';
import { cardNameText } from './CardName';
import { texts } from './texts';

/** Width of the picture the frame is copied to; the height follows the card shape (63:88). */
const CAPTURE_WIDTH = 360;
const CAPTURE_HEIGHT = Math.round((CAPTURE_WIDTH * 88) / 63);
const MAX_SCAN_COPIES = 99;

/** Whether this browser can open a camera at all (the Scan button is left out when it cannot). */
export function cameraSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function';
}

/** One picture the scanner can recognise: a card and the art the picture shows. */
interface Target {
  card: Card;
  arts: readonly Art[];
  /** Null for a card without arts (then the copies go to the card's total). */
  art: Art | null;
  imageUrl: string | null;
  /** The special rarity of the art, or null for the base art. */
  rarity: string | null;
}

/** Fingerprint id (`<card key>` or `<card key>__<rarity slug>`) -> what it is. */
function buildTargets(cards: readonly Card[]): Map<string, Target> {
  const targets = new Map<string, Target>();
  const hasArt = (key: string, rarity: string) => variantImageUrl(key, rarity) !== null;
  for (const card of cards) {
    const arts = artsOf(card, hasArt);
    const baseImage = getCardImage(card.key)?.medium ?? null;
    for (const art of arts) {
      targets.set(art.artId, {
        card,
        arts,
        art,
        imageUrl: art.rarity === null ? baseImage : variantImageUrl(card.key, art.rarity),
        rarity: art.rarity,
      });
    }
    // The card picture itself: a card without a base art (all its printings are special) still has one.
    if (!targets.has(card.key)) {
      targets.set(card.key, { card, arts, art: arts[0] ?? null, imageUrl: baseImage, rarity: null });
    }
  }
  return targets;
}

type Stage = 'edition' | 'starting' | 'camera' | 'result' | 'error';

interface ScanResult {
  options: Target[];
  /** The best match is clearly ahead: it is offered alone first. */
  sure: boolean;
}

function cameraProblem(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return scannerTexts.denied;
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return scannerTexts.noCamera;
  return scannerTexts.failed;
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

/**
 * The scanner (T-106, D-027): asks the edition, opens the camera, copies the card frame to a canvas on a tap,
 * recognises it by its fingerprint and, once the user confirms, adds it to the collection and returns to the camera.
 * Everything happens on the device: the picture is never stored or sent, and the camera stops when the dialog
 * closes or unmounts.
 */
export function CardScannerDialog({
  cards,
  snapshot,
  store,
  edition: defaultEdition,
  onEditionChange,
  onClose,
}: {
  cards: readonly Card[];
  snapshot: CollectionSnapshot;
  store: CollectionStore;
  edition: Edition;
  onEditionChange: (edition: Edition) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mounted = useRef(false);
  const [stage, setStage] = useState<Stage>('edition');
  const [edition, setEdition] = useState<Edition>(defaultEdition);
  const [problem, setProblem] = useState<string | null>(null);
  const [index, setIndex] = useState<IndexedFingerprint[] | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [copies, setCopies] = useState(1);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [addProblem, setAddProblem] = useState<string | null>(null);
  const targets = useMemo(() => buildTargets(cards), [cards]);

  useEffect(() => {
    mounted.current = true;
    const dialog = dialogRef.current;
    if (dialog !== null && !dialog.open) dialog.showModal();
    loadFingerprintIndex().then(
      (loaded) => {
        if (mounted.current) setIndex(loaded);
      },
      () => {
        if (!mounted.current) return;
        stopStream(streamRef.current);
        streamRef.current = null;
        setProblem(scannerTexts.indexFailed);
        setStage('error');
      },
    );
    return () => {
      mounted.current = false;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  // Never keep the camera on behind a hidden tab (SEC-106-1): release it and ask for the edition again.
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden || streamRef.current === null) return;
      stopStream(streamRef.current);
      streamRef.current = null;
      setResult(null);
      setStage('edition');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // The video element exists only in the camera stage; the stream lives on across stages.
  useEffect(() => {
    const video = videoRef.current;
    if (stage !== 'camera' || video === null) return;
    video.srcObject = streamRef.current;
    video.play().catch(() => undefined);
  }, [stage]);

  function releaseCamera() {
    stopStream(streamRef.current);
    streamRef.current = null;
  }

  // Every error path releases the camera (SEC-106-2).
  function fail(message: string) {
    releaseCamera();
    setProblem(message);
    setStage('error');
  }

  const start = async (chosen: Edition) => {
    markEditionConfirmed();
    onEditionChange(chosen);
    setEdition(chosen);
    setProblem(null);
    setStage('starting');
    try {
      // Started from the tap on the edition button: iOS only allows the camera after a user action.
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (!mounted.current) {
        stopStream(stream);
        return;
      }
      stopStream(streamRef.current);
      streamRef.current = stream;
      setStage('camera');
    } catch (error) {
      if (!mounted.current) return;
      fail(cameraProblem(error));
    }
  };

  const capture = () => {
    const video = videoRef.current;
    const viewport = viewportRef.current;
    const frame = frameRef.current;
    if (video === null || viewport === null || frame === null || index === null) return;
    const box = viewport.getBoundingClientRect();
    const rect = frame.getBoundingClientRect();
    const crop = coverCropSource(
      { width: video.videoWidth, height: video.videoHeight },
      { width: box.width, height: box.height },
      { x: rect.left - box.left, y: rect.top - box.top, width: rect.width, height: rect.height },
    );
    if (crop === null) return;
    const canvas = document.createElement('canvas');
    canvas.width = CAPTURE_WIDTH;
    canvas.height = CAPTURE_HEIGHT;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (context === null) {
      fail(scannerTexts.failed);
      return;
    }
    context.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT);
    const ranked = rankFingerprints(queryFingerprints(context.getImageData(0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT)), index, 3);
    const options = ranked.map((match) => targets.get(match.id)).filter((target): target is Target => target !== undefined);
    if (options.length === 0) return;
    const sure = isConfident(ranked);
    setResult({ options, sure });
    setExpanded(!sure);
    setSelected(sure ? 0 : null);
    setCopies(1);
    setAddProblem(null);
    setLastAdded(null);
    setStage('result');
  };

  const backToCamera = () => {
    setResult(null);
    setStage('camera');
  };

  const editionName = edition === 'beta' ? texts.editionBeta : texts.editionRetail;
  const shown = result === null ? [] : result.sure && !expanded ? result.options.slice(0, 1) : result.options;
  const picked = result !== null && selected !== null ? (result.options[selected] ?? null) : null;

  const add = () => {
    if (picked === null) return;
    const outcome = addCopies(snapshot, store, picked.card, picked.arts, picked.art, edition, copies);
    if (outcome === 'added') {
      setLastAdded(scannerTexts.lastAdded(copies, cardNameText(picked.card), editionName));
      backToCamera();
    } else {
      setAddProblem(outcome === 'limit' ? scannerTexts.limit : scannerTexts.collectionNotReady);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog scanner-dialog"
      aria-labelledby="scanner-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
    >
      <div className="confirm-dialog-body scanner-body">
        <h2 id="scanner-title">{scannerTexts.title}</h2>

        {stage === 'edition' && (
          <>
            <p>
              <strong>{scannerTexts.editionIntro}</strong>
            </p>
            <p className="hint">{scannerTexts.editionNote}</p>
            <div className="row-actions scanner-actions">
              <button type="button" className="button-primary" onClick={() => void start('beta')}>
                {scannerTexts.startWith(texts.editionBeta)}
              </button>
              <button type="button" className="button-primary" onClick={() => void start('retail')}>
                {scannerTexts.startWith(texts.editionRetail)}
              </button>
              <button type="button" className="button-secondary" onClick={() => dialogRef.current?.close()}>
                {scannerTexts.cancel}
              </button>
            </div>
          </>
        )}

        {stage === 'starting' && <p role="status">{scannerTexts.starting}</p>}

        {stage === 'error' && (
          <>
            <p role="alert" className="field-error">
              {problem}
            </p>
            <div className="row-actions scanner-actions">
              {problem !== scannerTexts.indexFailed && (
                <button type="button" className="button-primary" onClick={() => setStage('edition')}>
                  {scannerTexts.retry}
                </button>
              )}
              <button type="button" className="button-secondary" onClick={() => dialogRef.current?.close()}>
                {scannerTexts.close}
              </button>
            </div>
          </>
        )}

        {stage === 'camera' && (
          <>
            <p className="scanner-edition">{editionName}</p>
            <div ref={viewportRef} className="scanner-viewport" onClick={capture}>
              <video ref={videoRef} className="scanner-video" aria-label={scannerTexts.videoLabel} autoPlay muted playsInline />
              <div ref={frameRef} className="scanner-frame" aria-hidden="true" />
            </div>
            <p className="hint">{scannerTexts.frameHint}</p>
            {lastAdded !== null && <p role="status">{lastAdded}</p>}
            <div className="row-actions scanner-actions">
              <button type="button" className="button-primary" disabled={index === null} onClick={capture}>
                {scannerTexts.capture}
              </button>
              <button type="button" className="button-secondary" onClick={() => dialogRef.current?.close()}>
                {scannerTexts.close}
              </button>
            </div>
          </>
        )}

        {stage === 'result' && result !== null && (
          <>
            <h3 className="scanner-subtitle">{result.sure && !expanded ? scannerTexts.sureTitle : scannerTexts.chooseTitle}</h3>
            <ul className="scanner-options" data-count={shown.length}>
              {shown.map((target, position) => (
                <li key={`${target.card.key}-${target.rarity ?? 'base'}`}>
                  <button
                    type="button"
                    className="scanner-option"
                    aria-pressed={selected === position}
                    onClick={() => {
                      setSelected(position);
                      setAddProblem(null);
                    }}
                  >
                    {target.imageUrl !== null ? (
                      <img src={target.imageUrl} alt="" width={360} height={Math.round(360 * CARD_IMAGE_ASPECT)} />
                    ) : (
                      <span className="card-image card-image--missing" aria-hidden="true" />
                    )}
                    <span className="scanner-option-name">
                      {cardNameText(target.card)}
                      {target.rarity !== null && <span className="scanner-option-art"> · {target.rarity}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {result.sure && !expanded && (
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setExpanded(true);
                  setSelected(null);
                }}
              >
                {scannerTexts.showOthers}
              </button>
            )}
            {picked !== null && (
              <div className="scanner-confirm">
                <div className="scanner-count" role="group" aria-label={scannerTexts.copiesLabel}>
                  <button
                    type="button"
                    className="step step-minus"
                    aria-label={scannerTexts.fewer}
                    aria-disabled={copies <= 1 ? 'true' : undefined}
                    onClick={() => setCopies((n) => Math.max(1, n - 1))}
                  >
                    <span aria-hidden="true">{texts.minusSymbol}</span>
                  </button>
                  <output className="scanner-count-value" aria-live="polite">
                    {copies}
                  </output>
                  <button
                    type="button"
                    className="step step-plus"
                    aria-label={scannerTexts.more}
                    aria-disabled={copies >= Math.min(MAX_SCAN_COPIES, MAX_COPIES) ? 'true' : undefined}
                    onClick={() => setCopies((n) => Math.min(MAX_SCAN_COPIES, n + 1))}
                  >
                    <span aria-hidden="true">+</span>
                  </button>
                </div>
                <button type="button" className="button-primary" onClick={add}>
                  {scannerTexts.add(copies, editionName)}
                </button>
              </div>
            )}
            {addProblem !== null && (
              <p role="alert" className="field-error">
                {addProblem}
              </p>
            )}
            <div className="row-actions scanner-actions">
              <button type="button" className="button-secondary" onClick={backToCamera}>
                {scannerTexts.again}
              </button>
              <button type="button" className="button-secondary" onClick={() => dialogRef.current?.close()}>
                {scannerTexts.close}
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}

/** The Scan button of the Cards and Collection views: leaves itself out where there is no camera API. */
export function ScanCardsButton(props: {
  cards: readonly Card[];
  snapshot: CollectionSnapshot;
  store: CollectionStore;
  edition: Edition;
  onEditionChange: (edition: Edition) => void;
}) {
  const [open, setOpen] = useState(false);
  if (!cameraSupported() || props.snapshot.phase !== 'ready') return null;
  return (
    <>
      <button type="button" className="button-secondary scan-open" onClick={() => setOpen(true)}>
        {scannerTexts.open}
      </button>
      {open && <CardScannerDialog {...props} onClose={() => setOpen(false)} />}
    </>
  );
}
