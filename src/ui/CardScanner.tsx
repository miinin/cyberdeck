import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';
import { getCardImage } from '../data/cardImages';
import { loadFingerprintIndex } from '../data/fingerprintIndex';
import { variantImageUrl } from '../data/variantImages';
import { artsOf } from '../domain/arts';
import { BINDER_COLUMNS, binderAspect, binderRows } from '../domain/binderPage';
import type { Art } from '../domain/arts';
import type { Card } from '../domain/card';
import { CARD_IMAGE_ASPECT } from '../domain/cardImage';
import { frameSharpness, isConfident, queryFingerprints, rankFingerprints } from '../domain/cardFingerprint';
import type { FingerprintMatch, IndexedFingerprint, PixelImage } from '../domain/cardFingerprint';
import {
  SCAN_INTERVAL_MS,
  candidateInWindow,
  initialContinuousState,
  initialSuggestionState,
  isSharpEnough,
  stepContinuous,
  stepSuggestion,
} from '../domain/continuousScan';
import type { Edition } from '../domain/edition';
import { coverCropSource } from '../domain/scanCrop';
import type { PreferencesRepository, ScanGrid, ScanMode } from '../storage';
import { BinderPageFlow } from './BinderScan';
import { grabPixels, readImageFile } from './binderImage';
import { CameraIcon } from './CameraIcon';
import { SegmentedChoice } from './SegmentedChoice';
import { MAX_COPIES, addCopies, removeCopies } from './collectionEntry';
import type { CollectionSnapshot, CollectionStore } from './collectionStore';
import { markEditionConfirmed } from './EditionConfirmDialog';
import { scannerTexts } from './scannerTexts';
import { cardNameText } from './CardName';
import { texts } from './texts';
import { ScanDebugPanel, scanDebugRequested } from './ScanDebugPanel';
import type { DebugReading } from './ScanDebugPanel';
import { useScanGrid } from './useScanGrid';
import { useScanMode } from './useScanMode';

/** Width of the picture the frame is copied to; the height follows the card shape (63:88). */
const CAPTURE_WIDTH = 360;
const CAPTURE_HEIGHT = Math.round((CAPTURE_WIDTH * 88) / 63);
const MAX_SCAN_COPIES = 99;
const DESTINATION_OPTIONS = [
  ['deck', scannerTexts.destinationDeck],
  ['both', scannerTexts.destinationBoth],
] as const;
const GRID_OPTIONS = [
  ['3x3', scannerTexts.grid3x3],
  ['3x4', scannerTexts.grid3x4],
] as const;
const PART_OPTIONS = [
  ['main', scannerTexts.partMain],
  ['side', scannerTexts.partSide],
] as const;

/** Whether this browser can open a camera at all (the Scan button is left out when it cannot). */
export function cameraSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function';
}

/** The part of a deck a scanned card goes to. */
export type DeckPart = 'main' | 'side';

/**
 * A deck the scanner fills (T-119). The editor that owns the deck implements it with its own rules, so the scanner
 * never decides what the deck allows: `add` returns the reason text when the cards do not fit (nothing is added), else null.
 */
export interface ScanDeckTarget {
  name: string;
  add: (card: Card, part: DeckPart, copies: number) => string | null;
  remove: (card: Card, part: DeckPart, copies: number) => void;
}

type ScanDestination = 'deck' | 'both';

/** One picture the scanner can recognise: a card and the art the picture shows. */
export interface Target {
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
        imageUrl: art.image === null ? baseImage : variantImageUrl(card.key, art.image),
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

type Stage = 'edition' | 'starting' | 'camera' | 'result' | 'binder' | 'error';

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

/** How long the green flash and the card name stay on the frame after an automatic add. */
const FLASH_MS = 1400;

/** One card the continuous mode added in this session (what Undo takes back). */
interface SessionEntry {
  uid: number;
  target: Target;
  edition: Edition;
  /** The deck part the copy went to, or null when it did not go to a deck. */
  inDeck: DeckPart | null;
  inCollection: boolean;
}

/** Copies the frame to a canvas and ranks it against the index; null when there is no picture yet, 'failed' without a canvas. */
function readFrame(
  video: HTMLVideoElement,
  viewport: HTMLElement,
  frame: HTMLElement,
  index: readonly IndexedFingerprint[],
  withSharpness = false,
): { matches: FingerprintMatch[]; sharpness: number } | 'failed' | null {
  const box = viewport.getBoundingClientRect();
  const rect = frame.getBoundingClientRect();
  const crop = coverCropSource(
    { width: video.videoWidth, height: video.videoHeight },
    { width: box.width, height: box.height },
    { x: rect.left - box.left, y: rect.top - box.top, width: rect.width, height: rect.height },
  );
  if (crop === null) return null;
  const canvas = document.createElement('canvas');
  canvas.width = CAPTURE_WIDTH;
  canvas.height = CAPTURE_HEIGHT;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (context === null) return 'failed';
  context.drawImage(video, crop.x, crop.y, crop.width, crop.height, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT);
  const pixels = context.getImageData(0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT);
  return { matches: rankFingerprints(queryFingerprints(pixels), index, 3), sharpness: withSharpness ? frameSharpness(pixels) : 0 };
}

function rankFrame(
  video: HTMLVideoElement,
  viewport: HTMLElement,
  frame: HTMLElement,
  index: readonly IndexedFingerprint[],
): FingerprintMatch[] | 'failed' | null {
  const read = readFrame(video, viewport, frame, index);
  return read === null || read === 'failed' ? read : read.matches;
}

/** Asks the camera to keep focusing on its own; a device without the setting is left as it is (T-113). */
async function requestContinuousFocus(stream: MediaStream) {
  try {
    const track = stream.getTracks()[0];
    const capabilities = track?.getCapabilities?.() as { focusMode?: string[] } | undefined;
    if (track === undefined || !capabilities?.focusMode?.includes('continuous')) return;
    await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] });
  } catch {
    // Not supported or refused: the scanner works without it.
  }
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
  store,
  edition: defaultEdition,
  onEditionChange,
  mode,
  onModeChange,
  grid,
  onGridChange,
  deck,
  onClose,
}: {
  cards: readonly Card[];
  snapshot: CollectionSnapshot;
  store: CollectionStore;
  edition: Edition;
  onEditionChange: (edition: Edition) => void;
  mode: ScanMode;
  onModeChange: (mode: ScanMode) => void;
  grid: ScanGrid;
  onGridChange: (grid: ScanGrid) => void;
  /** Set when the scanner fills a deck (T-119); without it the cards go to the collection only. */
  deck?: ScanDeckTarget;
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
  const [destination, setDestination] = useState<ScanDestination>('deck');
  const [part, setPart] = useState<DeckPart>('main');
  const [session, setSession] = useState<SessionEntry[]>([]);
  const [flashName, setFlashName] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);
  const [suggestion, setSuggestion] = useState<{ id: string; target: Target } | null>(null);
  const tappedSuggestion = useRef<string | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);
  const nextUid = useRef(1);
  const targets = useMemo(() => buildTargets(cards), [cards]);
  const [fileProblem, setFileProblem] = useState<string | null>(null);
  const [binderPicture, setBinderPicture] = useState<{ image: PixelImage; fromCamera: boolean } | null>(null);
  // A deck is filled one card at a time: the binder page mode belongs to the collection only (T-179).
  const active: ScanMode = deck !== undefined && mode === 'binder' ? 'single' : mode;

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
      window.clearTimeout(flashTimer.current);
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
      setBinderPicture(null);
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (!mounted.current) {
        stopStream(stream);
        return;
      }
      stopStream(streamRef.current);
      streamRef.current = stream;
      await requestContinuousFocus(stream);
      if (!mounted.current || streamRef.current !== stream) return;
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
    const ranked = rankFrame(video, viewport, frame, index);
    if (ranked === 'failed') {
      fail(scannerTexts.failed);
      return;
    }
    if (ranked === null) return;
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

  const modeText = (value: ScanMode) => (value === 'single' ? scannerTexts.modeSingle : value === 'continuous' ? scannerTexts.modeContinuous : scannerTexts.modeBinder);
  const fileInputId = useId();

  /** Binder page mode: the frame area of the video at full resolution becomes the page picture (T-179). */
  const takeBinderPhoto = () => {
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
    const image = grabPixels(video, crop);
    if (image === null) {
      fail(scannerTexts.failed);
      return;
    }
    setBinderPicture({ image, fromCamera: true });
    setStage('binder');
  };

  /** Binder page mode: a picture file from the camera app or the gallery; it is read here and never uploaded. */
  const chooseBinderFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (file === undefined) return;
    try {
      const image = await readImageFile(file);
      if (!mounted.current) return;
      setFileProblem(null);
      setBinderPicture({ image, fromCamera: false });
      setStage('binder');
    } catch {
      if (mounted.current) setFileProblem(scannerTexts.imageUnreadable);
    }
  };

  const toCollection = deck === undefined || destination === 'both';
  /** A Legend always takes the Legend slot, whatever part is chosen (the sideboard allows none). */
  const partOf = (card: Card): DeckPart => (card.type === 'Legend' ? 'main' : part);

  /**
   * Puts copies where the user chose (T-119): the deck first, by the editor's own rules, then the collection. If the
   * collection refuses, the deck change is taken back, so the two never differ. Returns the problem text, or null.
   */
  const place = (target: Target, copies: number, limitText: string): string | null => {
    const deckPart = deck === undefined ? null : partOf(target.card);
    if (deck !== undefined && deckPart !== null) {
      const blocked = deck.add(target.card, deckPart, copies);
      if (blocked !== null) return blocked;
    }
    if (toCollection) {
      const outcome = addCopies(store.getSnapshot(), store, target.card, target.arts, target.art, edition, copies);
      if (outcome !== 'added') {
        if (deck !== undefined && deckPart !== null) deck.remove(target.card, deckPart, copies);
        return outcome === 'limit' ? limitText : scannerTexts.collectionNotReady;
      }
    }
    return null;
  };

  /** Continuous mode: one copy of a card the camera has recognised twice in a row (T-108). */
  const autoAdd = (id: string) => {
    const target = targets.get(id);
    if (target === undefined) return;
    const name = cardNameText(target.card);
    const problemText = place(target, 1, scannerTexts.atLimit(name));
    if (problemText !== null) {
      setNotice(problemText);
      return;
    }
    const uid = nextUid.current;
    nextUid.current += 1;
    const inDeck = deck === undefined ? null : partOf(target.card);
    setSession((list) => [{ uid, target, edition, inDeck, inCollection: toCollection }, ...list]);
    setNotice(null);
    setFlashName(name);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashName(null), FLASH_MS);
    if (typeof navigator.vibrate === 'function') navigator.vibrate(60);
  };

  /** The "Add" button under the frame: one copy of the offered match, like an automatic add (T-113b). */
  const addSuggested = () => {
    if (suggestion === null) return;
    tappedSuggestion.current = suggestion.id;
    setSuggestion(null);
    autoAdd(suggestion.id);
  };

  const undo = (entry: SessionEntry) => {
    const { card, arts, art } = entry.target;
    const outcome = entry.inCollection ? removeCopies(store.getSnapshot(), store, card, arts, art, entry.edition, 1) : 'added';
    if (outcome === 'added') {
      if (entry.inDeck !== null) deck?.remove(card, entry.inDeck, 1);
      setSession((list) => list.filter((item) => item.uid !== entry.uid));
      setNotice(null);
    } else {
      setNotice(scannerTexts.collectionNotReady);
    }
  };

  // The newest handlers for the timer below, which must not restart whenever the screen changes.
  const handlers = useRef({ autoAdd, fail });
  useEffect(() => {
    handlers.current = { autoAdd, fail };
  });

  // Continuous mode (T-108): look at the frame a few times a second while the camera is on. The timer lives and dies
  // with the camera stage, so it stops with the stream (SEC-106): on close, on a hidden tab and on every error.
  useEffect(() => {
    if (stage !== 'camera' || active !== 'continuous' || index === null) return;
    let state = initialContinuousState;
    let offer = initialSuggestionState;
    const measuring = scanDebugRequested();
    const timer = window.setInterval(() => {
      const video = videoRef.current;
      const viewport = viewportRef.current;
      const frame = frameRef.current;
      if (document.hidden || streamRef.current === null || video === null || viewport === null || frame === null) return;
      const read = readFrame(video, viewport, frame, index, true);
      if (read === 'failed') {
        handlers.current.fail(scannerTexts.failed);
        return;
      }
      // A blurred picture is no observation at all (T-113b).
      if (read === null || !isSharpEnough(read.sharpness)) return;
      const ranked = read.matches;
      const best = ranked[0];
      const sure = best !== undefined && isConfident(ranked) && targets.has(best.id);
      const sureId = sure ? best.id : null;
      const now = Date.now();
      const step = stepContinuous(state, sureId, now);
      state = step.state;
      // The diagnostics measure only: nothing is added to the collection while ?scandebug=1 is on (T-113a).
      if (step.add !== null && !measuring) handlers.current.autoAdd(step.add);
      setHolding(step.add === null && candidateInWindow(state) !== null);
      if (measuring) return;
      offer = stepSuggestion(offer, best?.id ?? null, best?.distance ?? Infinity, sure, now);
      if (offer.best !== tappedSuggestion.current) tappedSuggestion.current = null;
      const shownId = offer.shown !== null && offer.shown !== tappedSuggestion.current ? offer.shown : null;
      const found = shownId === null ? undefined : targets.get(shownId);
      setSuggestion((current) => (current?.id === shownId ? current : shownId !== null && found !== undefined ? { id: shownId, target: found } : null));
    }, SCAN_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
      setHolding(false);
      setSuggestion(null);
    };
  }, [stage, active, index, targets]);

  /** One diagnostics reading of the current frame (T-113a, only used with ?scandebug=1). */
  const measureDebug = (): DebugReading | null => {
    const video = videoRef.current;
    const viewport = viewportRef.current;
    const frame = frameRef.current;
    if (document.hidden || streamRef.current === null || video === null || viewport === null || frame === null || index === null) return null;
    const read = readFrame(video, viewport, frame, index, true);
    if (read === null || read === 'failed') return null;
    const [first, second] = read.matches;
    const focus = (streamRef.current.getTracks()[0]?.getSettings?.() as { focusMode?: string } | undefined)?.focusMode;
    return {
      top3: read.matches.map((m) => {
        const card = targets.get(m.id)?.card;
        return { id: m.id, name: card === undefined ? m.id : cardNameText(card), distance: m.distance };
      }),
      gap: first !== undefined && second !== undefined ? second.distance - first.distance : null,
      confident: isConfident(read.matches),
      sharpness: read.sharpness,
      resolution: `${video.videoWidth}x${video.videoHeight}`,
      focus: focus ?? 'unknown',
    };
  };
  const debug = useMemo(() => scanDebugRequested(), []);

  const backToCamera = () => {
    setResult(null);
    setStage('camera');
  };

  const partText = (value: DeckPart) => (value === 'main' ? scannerTexts.partMain : scannerTexts.partSide);
  const editionName = edition === 'beta' ? texts.editionBeta : texts.editionRetail;
  const shown = result === null ? [] : result.sure && !expanded ? result.options.slice(0, 1) : result.options;
  const picked = result !== null && selected !== null ? (result.options[selected] ?? null) : null;

  const add = () => {
    if (picked === null) return;
    const problemText = place(picked, copies, scannerTexts.limit);
    if (problemText === null) {
      const name = cardNameText(picked.card);
      setLastAdded(
        deck === undefined
          ? scannerTexts.lastAdded(copies, name, editionName)
          : scannerTexts.lastAddedDeck(copies, name, deck.name, partText(partOf(picked.card)), toCollection ? editionName : null),
      );
      backToCamera();
    } else {
      setAddProblem(problemText);
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
        <h2 id="scanner-title">{deck === undefined ? scannerTexts.title : scannerTexts.titleDeck(deck.name)}</h2>

        {stage === 'edition' && (
          <>
            {deck !== undefined && (
              <>
                <SegmentedChoice
                  legend={scannerTexts.destinationLabel}
                  name="scan-destination"
                  value={destination}
                  options={DESTINATION_OPTIONS}
                  onChange={setDestination}
                  legendVisible
                  fill
                />
                <SegmentedChoice
                  legend={scannerTexts.partLabel}
                  name="scan-part"
                  value={part}
                  options={PART_OPTIONS}
                  onChange={setPart}
                  legendVisible
                  fill
                />
                <p className="hint">{scannerTexts.partNote}</p>
              </>
            )}
            {toCollection && (
              <>
                <p>
                  <strong>{scannerTexts.editionIntro}</strong>
                </p>
                <p className="hint">{scannerTexts.editionNote}</p>
              </>
            )}
            <div className="segmented segmented--fill" role="group" aria-label={scannerTexts.modeLabel}>
              {(deck === undefined ? (['single', 'continuous', 'binder'] as const) : (['single', 'continuous'] as const)).map((option) => (
                <button
                  key={option}
                  type="button"
                  className="segmented-option"
                  aria-pressed={active === option}
                  onClick={() => onModeChange(option)}
                >
                  {modeText(option)}
                </button>
              ))}
            </div>
            <p className="hint">{active === 'binder' ? scannerTexts.modeNoteBinder : scannerTexts.modeNote}</p>
            {active === 'binder' && (
              <SegmentedChoice legend={scannerTexts.gridLabel} name="scan-grid" value={grid} options={GRID_OPTIONS} onChange={onGridChange} legendVisible fill />
            )}
            <div className="row-actions scanner-actions scanner-actions--cancel-first">
              <button type="button" className="button-secondary" onClick={() => dialogRef.current?.close()}>
                {scannerTexts.cancel}
              </button>
              {toCollection ? (
                <>
                  <button type="button" className="button-primary" onClick={() => void start('beta')}>
                    {scannerTexts.startWith(texts.editionBeta)}
                  </button>
                  <button type="button" className="button-primary" onClick={() => void start('retail')}>
                    {scannerTexts.startWith(texts.editionRetail)}
                  </button>
                </>
              ) : (
                <button type="button" className="button-primary" onClick={() => void start(edition)}>
                  {scannerTexts.startDeck}
                </button>
              )}
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
            <div className="scanner-status">
              <p className="scanner-edition">
                {scannerTexts.modeStatus(
                  modeText(active),
                  toCollection ? editionName : null,
                )}
              </p>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  releaseCamera();
                  setStage('edition');
                }}
              >
                {scannerTexts.changeMode}
              </button>
            </div>
            {deck !== undefined && <p className="hint scanner-deck-status">{scannerTexts.deckStatus(deck.name, partText(part))}</p>}
            <div
              ref={viewportRef}
              className={active === 'binder' ? 'scanner-viewport scanner-viewport--binder' : 'scanner-viewport'}
              style={active === 'binder' ? ({ '--binder-aspect': binderAspect(grid) } as CSSProperties) : undefined}
              onClick={active === 'single' ? capture : undefined}
            >
              <video ref={videoRef} className="scanner-video" aria-label={scannerTexts.videoLabel} autoPlay muted playsInline />
              <div
                ref={frameRef}
                className={active === 'binder' ? 'scanner-frame scanner-frame--binder' : 'scanner-frame'}
                data-flash={flashName !== null || undefined}
                data-hold={(holding && flashName === null) || undefined}
                aria-hidden="true"
              >
                {active === 'binder' &&
                  Array.from({ length: BINDER_COLUMNS - 1 }, (_, i) => (
                    <span key={`c${i}`} className="binder-line binder-line--column" style={{ left: `${(100 * (i + 1)) / BINDER_COLUMNS}%` }} />
                  ))}
                {active === 'binder' &&
                  Array.from({ length: binderRows(grid) - 1 }, (_, i) => (
                    <span key={`r${i}`} className="binder-line binder-line--row" style={{ top: `${(100 * (i + 1)) / binderRows(grid)}%` }} />
                  ))}
              </div>
              {active !== 'binder' && (
                <p className="scanner-frame-label" aria-hidden="true">
                  {flashName !== null ? scannerTexts.addedFlash(flashName) : holding ? scannerTexts.holdStill : scannerTexts.fillFrame}
                </p>
              )}
            </div>
            {active === 'continuous' && (
              <div className="scanner-suggest">
                {suggestion !== null && (
                  <>
                    {suggestion.target.imageUrl !== null ? (
                      <img src={suggestion.target.imageUrl} alt="" width={36} height={Math.round(36 * CARD_IMAGE_ASPECT)} />
                    ) : (
                      <span className="card-image card-image--missing" aria-hidden="true" />
                    )}
                    <span className="scanner-session-name">{cardNameText(suggestion.target.card)}</span>
                    <button type="button" className="button-primary" onClick={addSuggested}>
                      {scannerTexts.suggestAdd}
                    </button>
                  </>
                )}
              </div>
            )}
            <p className="hint">{active === 'single' ? scannerTexts.frameHint : active === 'binder' ? scannerTexts.binderHint : scannerTexts.continuousHint}</p>
            {active === 'binder' && fileProblem !== null && (
              <p role="alert" className="field-error">
                {fileProblem}
              </p>
            )}
            {active === 'binder' ? null : active === 'single' ? (
              lastAdded !== null && <p role="status">{lastAdded}</p>
            ) : (
              <p role="status" className="scanner-live">
                {notice ?? (flashName !== null ? scannerTexts.addedFlash(flashName) : '')}
              </p>
            )}
            {debug && index !== null && <ScanDebugPanel measure={measureDebug} />}
            {active === 'continuous' && session.length > 0 && (
              <section className="scanner-session" aria-label={scannerTexts.sessionTitle}>
                <h3 className="scanner-subtitle">{scannerTexts.cardsAdded(session.length)}</h3>
                <ul className="scanner-session-list">
                  {session.map((entry) => (
                    <li key={entry.uid} className="scanner-session-item">
                      {entry.target.imageUrl !== null ? (
                        <img src={entry.target.imageUrl} alt="" width={36} height={Math.round(36 * CARD_IMAGE_ASPECT)} />
                      ) : (
                        <span className="card-image card-image--missing" aria-hidden="true" />
                      )}
                      <span className="scanner-session-name">
                        {cardNameText(entry.target.card)}
                        {entry.target.rarity !== null && <span className="scanner-option-art"> · {entry.target.rarity}</span>}
                      </span>
                      <button
                        type="button"
                        className="button-secondary scanner-undo"
                        aria-label={scannerTexts.undoLabel(cardNameText(entry.target.card))}
                        onClick={() => undo(entry)}
                      >
                        {scannerTexts.undo}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <div className="row-actions scanner-actions">
              {active === 'single' && (
                <button type="button" className="button-primary" disabled={index === null} onClick={capture}>
                  {scannerTexts.capture}
                </button>
              )}
              {active === 'binder' && (
                <>
                  <button type="button" className="button-primary" disabled={index === null} onClick={takeBinderPhoto}>
                    {scannerTexts.takePhoto}
                  </button>
                  <div className="file-input">
                    <input
                      id={fileInputId}
                      className="visually-hidden"
                      type="file"
                      accept="image/*"
                      disabled={index === null}
                      onChange={(event) => void chooseBinderFile(event)}
                    />
                    <label htmlFor={fileInputId} className="button-secondary" aria-hidden="true">
                      {scannerTexts.chooseImage}
                    </label>
                  </div>
                </>
              )}
              <button type="button" className={active === 'continuous' ? 'button-primary' : 'button-secondary'} onClick={() => dialogRef.current?.close()}>
                {scannerTexts.close}
              </button>
            </div>
          </>
        )}

        {stage === 'binder' && binderPicture !== null && index !== null && (
          <BinderPageFlow
            picture={binderPicture.image}
            fromCamera={binderPicture.fromCamera}
            grid={grid}
            index={index}
            cards={cards}
            targets={targets}
            store={store}
            edition={edition}
            onNextPage={() => {
              setBinderPicture(null);
              setStage('camera');
            }}
            onCancel={() => {
              setBinderPicture(null);
              setStage('camera');
            }}
          />
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
                  {deck === undefined
                    ? scannerTexts.add(copies, editionName)
                    : scannerTexts.addToDeck(copies, deck.name, toCollection ? editionName : null)}
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
  preferences: PreferencesRepository;
  /** primary: the main action of the view (T-108). */
  variant?: 'secondary' | 'primary';
  /** The deck the scanner fills (T-119); the collection need not be ready then, as a deck can be scanned alone. */
  deck?: ScanDeckTarget;
  /** Opens the scanner at once (the "Scan a new deck" start, T-119). */
  openAtStart?: boolean;
}) {
  const { variant = 'secondary', preferences, openAtStart = false, ...dialogProps } = props;
  const [open, setOpen] = useState(openAtStart);
  const [mode, setMode] = useScanMode(preferences);
  const [grid, setGrid] = useScanGrid(preferences);
  if (!cameraSupported() || (props.deck === undefined && props.snapshot.phase !== 'ready')) return null;
  const className = `${variant === 'primary' ? 'button-primary' : 'button-secondary'} scan-open`;
  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={variant === 'secondary' ? (props.deck === undefined ? scannerTexts.open : scannerTexts.openDeck) : undefined}
        onClick={() => setOpen(true)}
      >
        <CameraIcon />
        <span className="scan-open-label">{variant === 'secondary' ? scannerTexts.openShort : scannerTexts.open}</span>
      </button>
      {open && <CardScannerDialog {...dialogProps} mode={mode} onModeChange={setMode} grid={grid} onGridChange={setGrid} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Big invitation to scan on an empty collection (T-108); leaves itself out where there is no camera. */
export function ScanPrompt(props: Omit<Parameters<typeof ScanCardsButton>[0], 'variant'>) {
  if (!cameraSupported() || props.snapshot.phase !== 'ready') return null;
  return (
    <div className="scan-prompt">
      <span className="scan-prompt-icon">
        <CameraIcon size={40} />
      </span>
      <h2 className="scan-prompt-title">{scannerTexts.promptTitle}</h2>
      <p>{scannerTexts.promptBody}</p>
      <ScanCardsButton {...props} variant="primary" />
    </div>
  );
}
