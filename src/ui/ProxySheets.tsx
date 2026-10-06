import { getCardImage } from '../data/cardImages';
import { CARD_HEIGHT_MM, CARD_WIDTH_MM, CARDS_PER_SHEET, gridOrigin, RULER_TICKS_MM } from '../domain/proxySheet';
import type { CutMark, ProxyCopy, Sheet } from '../domain/proxySheet';
import { proxyTexts } from './proxyTexts';

/** A length in millimetres. `--u` is 1 mm when printing and a fraction of it in the screen preview (styles.css). */
const mm = (value: number) => `calc(var(--u) * ${value})`;

function CutMarkLine({ mark }: { mark: CutMark }) {
  const vertical = mark.x1 === mark.x2;
  return (
    <span
      className="proxy-cut"
      aria-hidden="true"
      style={{
        left: mm(vertical ? mark.x1 - 0.1 : mark.x1),
        top: mm(vertical ? mark.y1 : mark.y1 - 0.1),
        width: mm(vertical ? 0.2 : mark.x2 - mark.x1),
        height: mm(vertical ? mark.y2 - mark.y1 : 0.2),
      }}
    />
  );
}

/** One card on a sheet: its picture at 63 × 88 mm and the small PROXY mark. */
function PlacedProxyCard({
  copy,
  index,
  xMm,
  yMm,
  showMark,
  onRemove,
}: {
  copy: ProxyCopy;
  index: number;
  xMm: number;
  yMm: number;
  showMark: boolean;
  onRemove?: (copy: ProxyCopy) => void;
}) {
  const src = copy.artUrl ?? getCardImage(copy.key)?.large ?? null;
  return (
    <div
      className="proxy-card"
      data-copy={index}
      style={{ left: mm(xMm), top: mm(yMm), width: mm(CARD_WIDTH_MM), height: mm(CARD_HEIGHT_MM) }}
    >
      {onRemove !== undefined && (
        // Screen only (proxy-screen is hidden in print): removes this copy from the sheet.
        <button type="button" className="proxy-card-remove proxy-screen" onClick={() => onRemove(copy)}>
          <span aria-hidden="true">×</span>
          <span className="visually-hidden">{proxyTexts.removeFromSheet(copy.name)}</span>
        </button>
      )}
      {src === null ? (
        <span className="proxy-card-missing">
          <span lang="en">{copy.name}</span>
          <span className="visually-hidden"> – {proxyTexts.imageMissing}</span>
        </span>
      ) : (
        // Eager: a lazy picture outside the screen would be empty in the printout.
        <img src={src} alt={copy.name} width={720} height={1006} loading="eager" decoding="async" />
      )}
      {showMark && (
        <span className="proxy-mark" aria-hidden="true">
          PROXY
        </span>
      )}
    </div>
  );
}

/** The calibration sheet (63 × 88 mm frame and a 100 mm ruler): the printout shows whether the size is scaled. */
function CalibrationSheet({ current }: { current: boolean }) {
  const { xMm, yMm } = gridOrigin(0);
  const rulerY = yMm + CARD_HEIGHT_MM + 24;
  return (
    <section className={current ? 'proxy-sheet proxy-sheet--calibration is-current' : 'proxy-sheet proxy-sheet--calibration'} aria-label={proxyTexts.calibrationSheetLabel}>
      <div
        className="proxy-calibration-frame"
        style={{ left: mm(xMm), top: mm(yMm), width: mm(CARD_WIDTH_MM), height: mm(CARD_HEIGHT_MM) }}
      >
        <span>{proxyTexts.calibrationFrame}</span>
      </div>
      <div className="proxy-ruler" style={{ left: mm(xMm), top: mm(rulerY), width: mm(100) }}>
        {RULER_TICKS_MM.map((tick) => (
          <span key={tick} className="proxy-ruler-tick" style={{ left: mm(tick) }} aria-hidden="true" />
        ))}
        <span className="proxy-ruler-label">{proxyTexts.calibrationRuler}</span>
      </div>
      <p className="proxy-calibration-note" style={{ left: mm(xMm), top: mm(rulerY + 14), width: mm(CARD_WIDTH_MM * 2 + 10) }}>
        {proxyTexts.calibrationBody}
      </p>
      <p className="proxy-calibration-footer" style={{ left: mm(xMm), top: mm(270) }}>
        {proxyTexts.calibrationFooter}
      </p>
    </section>
  );
}

/**
 * The sheets as they are printed and as the preview shows them (the same elements, T-102). Every sheet is an
 * A4 page of its own; positions come from the domain layout. `sheets` come from layoutSheets.
 */
export function ProxySheets({
  sheets,
  showMark,
  calibration,
  current,
  onRemove,
}: {
  sheets: readonly Sheet<ProxyCopy>[];
  showMark: boolean;
  calibration: boolean;
  /** The page the screen shows (the calibration sheet counts as page 0 when it is on); print shows all pages. */
  current: number;
  /** Adds the × buttons of the screen preview. */
  onRemove?: (copy: ProxyCopy) => void;
}) {
  const offset = calibration ? 1 : 0;
  return (
    <div className="proxy-sheets">
      {calibration && <CalibrationSheet current={current === 0} />}
      {sheets.map((sheet, index) => (
        <section
          key={index}
          className={current === index + offset ? 'proxy-sheet is-current' : 'proxy-sheet'}
          aria-label={proxyTexts.sheetLabel(index + 1, sheets.length)}
        >
          {sheet.cards.map((placed, cardIndex) => (
            <PlacedProxyCard
              key={cardIndex}
              copy={placed.card}
              index={index * CARDS_PER_SHEET + cardIndex}
              xMm={placed.xMm}
              yMm={placed.yMm}
              showMark={showMark}
              onRemove={onRemove}
            />
          ))}
          {sheet.marks.map((mark, markIndex) => (
            <CutMarkLine key={markIndex} mark={mark} />
          ))}
        </section>
      ))}
    </div>
  );
}
