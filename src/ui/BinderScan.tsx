import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { BINDER_COLUMNS, CORNERS, binderRows, cornerPoint, cropResample, moveCorner, pocketRects, readPocket } from '../domain/binderPage';
import type { Corner, PocketState } from '../domain/binderPage';
import type { Card } from '../domain/card';
import { CARD_IMAGE_ASPECT } from '../domain/cardImage';
import type { IndexedFingerprint, PixelImage } from '../domain/cardFingerprint';
import type { Edition } from '../domain/edition';
import type { Rect } from '../domain/scanCrop';
import type { ScanGrid } from '../storage';
import { cardNameText } from './CardName';
import type { Target } from './CardScanner';
import { addCopies, removeCopies } from './collectionEntry';
import type { AddResult } from './collectionEntry';
import type { CollectionStore } from './collectionStore';
import { scannerTexts } from './scannerTexts';

/** Size of the pocket picture kept for the result grid (the card shape, 63:88). */
const THUMB_WIDTH = 120;
const THUMB_HEIGHT = Math.round(THUMB_WIDTH / CARD_IMAGE_ASPECT);
const SEARCH_LIMIT = 6;

/** One pocket of the page after recognising. */
interface Pocket {
  picture: PixelImage;
  state: PocketState;
  /** The closest cards, closest first. */
  options: Target[];
  /** What goes to the collection, or null (empty, or not recognised and not chosen yet). */
  chosen: Target | null;
  /** The user chose or confirmed this pocket by hand. */
  byHand: boolean;
}

/** What the pocket is called in the grid: a pocket the user has set by hand counts as sure. */
function stateOf(pocket: Pocket): PocketState {
  if (pocket.byHand) return pocket.chosen === null ? 'empty' : 'sure';
  return pocket.state;
}

const STATE_TEXT: Record<PocketState, () => string> = {
  sure: () => scannerTexts.stateSure,
  check: () => scannerTexts.stateCheck,
  empty: () => scannerTexts.stateEmpty,
  unknown: () => scannerTexts.stateUnknown,
};

function tick(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

/** Draws a picture on a canvas; a browser without canvas support (or a failing draw) leaves it blank. */
function PictureCanvas({ picture, className, label }: { picture: PixelImage; className?: string; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    try {
      const context = ref.current?.getContext('2d');
      context?.putImageData(new ImageData(new Uint8ClampedArray(picture.data), picture.width, picture.height), 0, 0);
    } catch {
      // Nothing to draw on: the canvas stays blank.
    }
  }, [picture]);
  return (
    <canvas
      ref={ref}
      className={className}
      width={picture.width}
      height={picture.height}
      role={label === undefined ? undefined : 'img'}
      aria-label={label}
      aria-hidden={label === undefined ? 'true' : undefined}
    />
  );
}

function CardThumb({ target }: { target: Target }) {
  return target.imageUrl !== null ? (
    <img src={target.imageUrl} alt="" width={72} height={Math.round(72 * CARD_IMAGE_ASPECT)} />
  ) : (
    <span className="card-image card-image--missing" aria-hidden="true" />
  );
}

/** The rectangle the user fits to the page: draggable corners (mouse, touch) and arrow keys on a focused corner. */
function CropEditor({ picture, grid, rect, onRect }: { picture: PixelImage; grid: ScanGrid; rect: Rect; onRect: (next: Rect) => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<Corner | null>(null);
  const rows = binderRows(grid);
  const percent = (value: number, whole: number) => `${(100 * value) / whole}%`;

  const pointTo = (corner: Corner, clientX: number, clientY: number) => {
    const box = boxRef.current?.getBoundingClientRect();
    if (box === undefined || box.width <= 0 || box.height <= 0) return;
    onRect(moveCorner(rect, corner, ((clientX - box.left) / box.width) * picture.width, ((clientY - box.top) / box.height) * picture.height, picture));
  };
  const onKey = (corner: Corner, event: ReactKeyboardEvent) => {
    const step = (event.shiftKey ? 0.05 : 0.01) * Math.max(picture.width, picture.height);
    const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
    const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
    if (dx === 0 && dy === 0) return;
    event.preventDefault();
    const point = cornerPoint(rect, corner);
    onRect(moveCorner(rect, corner, point.x + dx, point.y + dy, picture));
  };
  const down = (corner: Corner, event: ReactPointerEvent<HTMLButtonElement>) => {
    dragging.current = corner;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  return (
    <div ref={boxRef} className="binder-crop" style={{ aspectRatio: `${picture.width} / ${picture.height}` }}>
      <div className="binder-crop-stage">
        <PictureCanvas picture={picture} className="binder-crop-picture" label={scannerTexts.cropImageLabel} />
        <div
          className="binder-crop-rect"
          aria-hidden="true"
          style={{ left: percent(rect.x, picture.width), top: percent(rect.y, picture.height), width: percent(rect.width, picture.width), height: percent(rect.height, picture.height) }}
        >
          {Array.from({ length: BINDER_COLUMNS - 1 }, (_, i) => (
            <span key={`c${i}`} className="binder-line binder-line--column" style={{ left: `${(100 * (i + 1)) / BINDER_COLUMNS}%` }} />
          ))}
          {Array.from({ length: rows - 1 }, (_, i) => (
            <span key={`r${i}`} className="binder-line binder-line--row" style={{ top: `${(100 * (i + 1)) / rows}%` }} />
          ))}
        </div>
      </div>
      {CORNERS.map((corner) => {
        const point = cornerPoint(rect, corner);
        return (
          <button
            key={corner}
            type="button"
            className="binder-handle"
            aria-label={scannerTexts.cornerLabel(corner)}
            style={{ left: percent(point.x, picture.width), top: percent(point.y, picture.height) }}
            onPointerDown={(event) => down(corner, event)}
            onPointerMove={(event) => {
              if (dragging.current === corner) pointTo(corner, event.clientX, event.clientY);
            }}
            onPointerUp={() => {
              dragging.current = null;
            }}
            onPointerCancel={() => {
              dragging.current = null;
            }}
            onKeyDown={(event) => onKey(corner, event)}
          />
        );
      })}
    </div>
  );
}

/** Edit panel of one pocket: the closest cards, a search by name and "empty pocket". */
function PocketEditor({
  number,
  pocket,
  cards,
  targets,
  onChange,
  onDone,
}: {
  number: number;
  pocket: Pocket;
  cards: readonly Card[];
  targets: ReadonlyMap<string, Target>;
  onChange: (next: Pocket) => void;
  onDone: () => void;
}) {
  const [query, setQuery] = useState('');
  const searchId = useId();
  const needle = query.trim().toLowerCase();
  const found = useMemo(() => {
    if (needle.length < 2) return [];
    return cards
      .filter((card) => cardNameText(card).toLowerCase().includes(needle))
      .sort((a, b) => cardNameText(a).localeCompare(cardNameText(b)))
      .slice(0, SEARCH_LIMIT)
      .map((card) => targets.get(card.key))
      .filter((target): target is Target => target !== undefined);
  }, [cards, targets, needle]);
  const pick = (target: Target) => onChange({ ...pocket, chosen: target, byHand: true });
  const isChosen = (target: Target) => pocket.chosen !== null && pocket.chosen.card.key === target.card.key && pocket.chosen.art?.artId === target.art?.artId;
  const option = (target: Target) => (
    <li key={`${target.card.key}-${target.rarity ?? 'base'}`}>
      <button type="button" className="scanner-option" aria-pressed={isChosen(target)} onClick={() => pick(target)}>
        {target.imageUrl !== null ? (
          <img src={target.imageUrl} alt="" width={120} height={Math.round(120 * CARD_IMAGE_ASPECT)} />
        ) : (
          <span className="card-image card-image--missing" aria-hidden="true" />
        )}
        <span className="scanner-option-name">
          {cardNameText(target.card)}
          {target.rarity !== null && <span className="scanner-option-art"> · {target.rarity}</span>}
        </span>
      </button>
    </li>
  );
  return (
    <section className="binder-editor" aria-label={scannerTexts.pocketTitle(number)}>
      <h3 className="scanner-subtitle">{scannerTexts.pocketTitle(number)}</h3>
      {pocket.options.length > 0 && (
        <>
          <p className="hint">{scannerTexts.pocketSuggestions}</p>
          <ul className="scanner-options">{pocket.options.map(option)}</ul>
        </>
      )}
      <div className="field">
        <label htmlFor={searchId}>{scannerTexts.pocketSearch}</label>
        <input id={searchId} type="search" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      {needle.length >= 2 && (found.length > 0 ? <ul className="scanner-options">{found.map(option)}</ul> : <p className="hint">{scannerTexts.pocketNoMatches}</p>)}
      <div className="row-actions scanner-actions">
        <button type="button" className="button-secondary" aria-pressed={pocket.byHand && pocket.chosen === null} onClick={() => onChange({ ...pocket, chosen: null, byHand: true })}>
          {scannerTexts.pocketEmpty}
        </button>
        <button type="button" className="button-primary" onClick={onDone}>
          {scannerTexts.pocketDone}
        </button>
      </div>
    </section>
  );
}

/** One art of one card and how many copies of it the page holds. */
interface Batch {
  target: Target;
  copies: number;
}

/** The pockets' cards counted per art, in the order they first appear. */
function batchesOf(list: readonly Target[]): Batch[] {
  const batches = new Map<string, Batch>();
  for (const target of list) {
    const key = `${target.card.key}|${target.art?.artId ?? ''}`;
    const found = batches.get(key);
    if (found === undefined) batches.set(key, { target, copies: 1 });
    else found.copies += 1;
  }
  return [...batches.values()];
}

/** Resolves when the store has saved what it was given (a second change to the same card must start from the saved count). */
function whenSaved(store: CollectionStore): Promise<void> {
  if (!store.isSaving()) return Promise.resolve();
  return new Promise((resolve) => {
    const off = store.onEvent((event) => {
      if (event.type === 'idle' || event.type === 'save-failed') {
        off();
        resolve();
      }
    });
  });
}

/**
 * Adds or takes back the copies of a page through the same path as the other scanner modes. Each art is changed once
 * with its whole count; two arts of one card wait for the first save, so the second starts from the saved count.
 * Stops at the first one that does not fit and returns it with the batches that were done (the caller takes them back).
 */
async function apply(
  store: CollectionStore,
  edition: Edition,
  batches: readonly Batch[],
  direction: 'add' | 'remove',
): Promise<{ done: Batch[]; failed: { batch: Batch; outcome: AddResult } | null }> {
  const done: Batch[] = [];
  const touched = new Set<string>();
  for (const batch of batches) {
    const { card, arts, art } = batch.target;
    if (touched.has(card.key)) await whenSaved(store);
    touched.add(card.key);
    const change = direction === 'add' ? addCopies : removeCopies;
    const outcome = change(store.getSnapshot(), store, card, arts, art, edition, batch.copies);
    if (outcome !== 'added') return { done, failed: { batch, outcome } };
    done.push(batch);
  }
  return { done, failed: null };
}

type Step = 'crop' | 'work' | 'result';

/**
 * The binder page scan after the picture is taken or chosen (T-179): fit the rectangle (a chosen file only), recognise
 * the pockets one at a time without freezing the screen, correct them, and add all of them to the collection at once.
 * The picture only lives in memory; nothing is stored or sent.
 */
export function BinderPageFlow({
  picture,
  fromCamera,
  grid,
  index,
  cards,
  targets,
  store,
  edition,
  onNextPage,
  onCancel,
}: {
  picture: PixelImage;
  /** A camera frame is already cut to the page; a chosen file needs the rectangle first. */
  fromCamera: boolean;
  grid: ScanGrid;
  index: readonly IndexedFingerprint[];
  cards: readonly Card[];
  targets: ReadonlyMap<string, Target>;
  store: CollectionStore;
  edition: Edition;
  onNextPage: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<Step>(fromCamera ? 'work' : 'crop');
  const [rect, setRect] = useState<Rect>({ x: 0, y: 0, width: picture.width, height: picture.height });
  const [progress, setProgress] = useState(1);
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [added, setAdded] = useState<Batch[] | null>(null);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  const [message, setMessage] = useState<string | null>(null);
  const total = BINDER_COLUMNS * binderRows(grid);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (step !== 'work') return;
    let stopped = false;
    void (async () => {
      const rects = pocketRects(grid, rect);
      const read: Pocket[] = [];
      for (let i = 0; i < rects.length; i++) {
        setProgress(i + 1);
        // Let the screen draw between pockets: reading one takes a moment.
        await tick();
        if (stopped) return;
        const area = rects[i];
        if (area === undefined) continue;
        const reading = readPocket(picture, area, index);
        const options = reading.matches.map((match) => targets.get(match.id)).filter((target): target is Target => target !== undefined);
        const known = reading.state === 'sure' || reading.state === 'check';
        read.push({
          picture: cropResample(picture, area, THUMB_WIDTH, THUMB_HEIGHT),
          state: reading.state,
          options,
          chosen: known ? (options[0] ?? null) : null,
          byHand: false,
        });
      }
      setPockets(read);
      setStep('result');
    })();
    return () => {
      stopped = true;
    };
  }, [step, grid, rect, picture, index, targets]);

  const chosenCount = pockets.filter((pocket) => pocket.chosen !== null).length;

  /** Adds one copy per recognised pocket in one go; if any does not fit, everything added so far is taken back. */
  const addAll = async () => {
    const batches = batchesOf(pockets.flatMap((pocket) => (pocket.chosen === null ? [] : [pocket.chosen])));
    if (batches.length === 0) {
      setMessage(scannerTexts.pageNothing);
      return;
    }
    setBusy(true);
    const result = await apply(store, edition, batches, 'add');
    if (result.failed !== null) {
      await apply(store, edition, result.done, 'remove');
      if (mounted.current) {
        setMessage(result.failed.outcome === 'limit' ? scannerTexts.pageLimit(cardNameText(result.failed.batch.target.card)) : scannerTexts.collectionNotReady);
        setBusy(false);
      }
      return;
    }
    if (!mounted.current) return;
    setAdded(result.done);
    setOpen(null);
    setMessage(null);
    setBusy(false);
  };

  const undo = async () => {
    if (added === null) return;
    setBusy(true);
    const result = await apply(store, edition, added, 'remove');
    if (!mounted.current) return;
    setBusy(false);
    if (result.failed !== null) {
      setMessage(scannerTexts.collectionNotReady);
      return;
    }
    setAdded(null);
    setMessage(scannerTexts.pageUndone);
  };

  const change = (position: number, next: Pocket) => {
    setPockets((list) => list.map((pocket, i) => (i === position ? next : pocket)));
    setMessage(null);
  };

  if (step === 'crop') {
    return (
      <>
        <h3 className="scanner-subtitle">{scannerTexts.cropTitle}</h3>
        <p className="hint">{scannerTexts.cropHint}</p>
        <CropEditor picture={picture} grid={grid} rect={rect} onRect={setRect} />
        <div className="row-actions scanner-actions scanner-actions--cancel-first">
          <button type="button" className="button-secondary" onClick={onCancel}>
            {scannerTexts.backToCamera}
          </button>
          <button
            type="button"
            className="button-primary"
            onClick={() => {
              setProgress(1);
              setStep('work');
            }}
          >
            {scannerTexts.recognize}
          </button>
        </div>
      </>
    );
  }

  if (step === 'work') {
    return (
      <>
        <p role="status">{scannerTexts.recognizing(progress, total)}</p>
        <progress className="binder-progress" max={total} value={progress} aria-hidden="true" />
        <div className="row-actions scanner-actions">
          <button type="button" className="button-secondary" onClick={onCancel}>
            {scannerTexts.cancelRecognition}
          </button>
        </div>
      </>
    );
  }

  if (added !== null) {
    return (
      <>
        <p role="status">{scannerTexts.pageAdded(added.reduce((sum, batch) => sum + batch.copies, 0))}</p>
        <div className="row-actions scanner-actions">
          <button type="button" className="button-secondary" disabled={busy} onClick={() => void undo()}>
            {scannerTexts.undo}
          </button>
          <button type="button" className="button-primary" onClick={onNextPage}>
            {scannerTexts.nextPage}
          </button>
        </div>
      </>
    );
  }

  const opened = open === null ? undefined : pockets[open];
  return (
    <>
      <h3 className="scanner-subtitle">{scannerTexts.resultsTitle}</h3>
      <ul className="binder-grid" aria-label={scannerTexts.resultsLabel}>
        {pockets.map((pocket, position) => {
          const state = stateOf(pocket);
          const name = pocket.chosen === null ? null : cardNameText(pocket.chosen.card);
          return (
            <li key={position}>
              <button
                type="button"
                className="binder-cell"
                data-state={state}
                aria-pressed={open === position}
                aria-label={scannerTexts.pocketLabel(position + 1, name, STATE_TEXT[state]())}
                onClick={() => setOpen(open === position ? null : position)}
              >
                <span className="binder-cell-pictures" aria-hidden="true">
                  <PictureCanvas picture={pocket.picture} className="binder-cell-picture" />
                  {pocket.chosen === null ? <span className="card-image card-image--missing" /> : <CardThumb target={pocket.chosen} />}
                </span>
                <span className="binder-cell-name" aria-hidden="true">
                  {name ?? ' '}
                </span>
                <span className="binder-cell-state" aria-hidden="true">
                  {STATE_TEXT[state]()}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {open !== null && opened !== undefined && (
        <PocketEditor key={open} number={open + 1} pocket={opened} cards={cards} targets={targets} onChange={(next) => change(open, next)} onDone={() => setOpen(null)} />
      )}
      {message !== null && (
        <p role="status" className="hint">
          {message}
        </p>
      )}
      <div className="row-actions scanner-actions">
        <button type="button" className="button-secondary" onClick={onNextPage}>
          {scannerTexts.backToCamera}
        </button>
        <button type="button" className="button-primary" disabled={busy} onClick={() => void addAll()}>
          {scannerTexts.addPage(chosenCount)}
        </button>
      </div>
    </>
  );
}
