import { useEffect, useId, useRef, useState } from 'react';
import { matrixToPath, QR_DENSE_LINK_LENGTH, QR_MAX_BYTES } from '../domain/qrPath';
import type { QrPath } from '../domain/qrPath';
import { deckTexts } from './deckTexts';

type QrState = { kind: 'loading' } | { kind: 'ready'; qr: QrPath } | { kind: 'too-long' } | { kind: 'failed' };

/** Encodes with error correction M, then L if it does not fit; uqr is loaded only now (own chunk). */
async function buildQr(link: string): Promise<QrState> {
  if (new TextEncoder().encode(link).length > QR_MAX_BYTES) return { kind: 'too-long' };
  const { encode } = await import('uqr');
  for (const ecc of ['M', 'L'] as const) {
    try {
      return { kind: 'ready', qr: matrixToPath(encode(link, { ecc, border: 0 }).data) };
    } catch {
      // Does not fit at this level: try the next.
    }
  }
  return { kind: 'too-long' };
}

/** Link shown as a large QR code in a modal dialog (T-165). Always dark on light, also in the dark theme. */
export function QrDialog({ open, title, link, onClose }: { open: boolean; title: string; link: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [built, setBuilt] = useState<{ link: string; state: QrState } | null>(null);
  const state: QrState = built !== null && built.link === link ? built.state : { kind: 'loading' };
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    let current = true;
    buildQr(link).then(
      (next) => current && setBuilt({ link, state: next }),
      () => current && setBuilt({ link, state: { kind: 'failed' } }),
    );
    return () => {
      current = false;
    };
  }, [open, link]);
  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog qr-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
    >
      {open && (
        <div className="confirm-dialog-body qr-dialog-body">
          <h2 id={titleId}>{title}</h2>
          {state.kind === 'loading' && <p role="status">{deckTexts.qrLoading}</p>}
          {state.kind === 'ready' && (
            <svg
              className="qr-code"
              viewBox={`0 0 ${state.qr.size} ${state.qr.size}`}
              role="img"
              aria-label={deckTexts.qrImageLabel}
              shapeRendering="crispEdges"
            >
              <rect width={state.qr.size} height={state.qr.size} fill="#fff" />
              <path d={state.qr.path} fill="#000" />
            </svg>
          )}
          {state.kind === 'too-long' && <p className="notice notice-warning">{deckTexts.qrTooLong}</p>}
          {state.kind === 'failed' && <p className="field-error" role="alert">{deckTexts.qrFailed}</p>}
          {state.kind === 'ready' && link.length > QR_DENSE_LINK_LENGTH && <p className="hint">{deckTexts.qrDense}</p>}
          <p className="qr-link">{link}</p>
          <div className="row-actions">
            <button type="button" className="button-primary" onClick={() => dialogRef.current?.close()}>
              {deckTexts.qrClose}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

/** "QR-koodi" button that opens the dialog; focus returns here when it closes. */
export function QrButton({ link, title, name, className = 'button-secondary' }: { link: string; title: string; name?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={buttonRef} type="button" className={className} aria-label={name} onClick={() => setOpen(true)}>
        {deckTexts.qrButton}
      </button>
      <QrDialog
        open={open}
        title={title}
        link={link}
        onClose={() => {
          setOpen(false);
          buttonRef.current?.focus();
        }}
      />
    </>
  );
}
