import { useEffect, useRef } from 'react';
import { deckTexts } from './deckTexts';

/**
 * Native modal dialog that asks before something is deleted. Esc, "Peruuta" and the backdrop cancel;
 * every way ends in the dialog's close event, which calls `onCancel` (T-013). `name` null = closed.
 * It asks about a deck unless the texts are given (T-122: a game); `extra` is a second paragraph.
 */
export function ConfirmDeleteDialog({
  name,
  onConfirm,
  onCancel,
  title = deckTexts.deleteTitle,
  body = deckTexts.deleteBody,
  confirmLabel = deckTexts.deleteConfirm,
  cancelLabel = deckTexts.cancel,
  extra,
}: {
  name: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  /** The question, given the name. */
  body?: (name: string) => string;
  confirmLabel?: string;
  cancelLabel?: string;
  extra?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (name !== null && !dialog.open) dialog.showModal();
    else if (name === null && dialog.open) dialog.close();
  }, [name]);

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="confirm-dialog-title"
      onClose={onCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
    >
      {name !== null && (
        <div className="confirm-dialog-body">
          <h2 id="confirm-dialog-title">{title}</h2>
          <p>{body(name)}</p>
          {extra !== undefined && <p>{extra}</p>}
          <div className="row-actions">
            <button type="button" className="button-secondary" onClick={() => dialogRef.current?.close()}>
              {cancelLabel}
            </button>
            <button type="button" className="button-danger" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
