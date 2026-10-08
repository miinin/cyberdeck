import { useEffect, useRef } from 'react';
import { deckTexts } from './deckTexts';

/**
 * Native modal dialog that asks before a deck is deleted. Esc, "Peruuta" and the backdrop cancel;
 * every way ends in the dialog's close event, which calls `onCancel` (T-013). `name` null = closed.
 */
export function ConfirmDeleteDialog({
  name,
  onConfirm,
  onCancel,
}: {
  name: string | null;
  onConfirm: () => void;
  onCancel: () => void;
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
          <h2 id="confirm-dialog-title">{deckTexts.deleteTitle}</h2>
          <p>{deckTexts.deleteBody(name)}</p>
          <div className="row-actions">
            <button type="button" className="button-secondary" onClick={() => dialogRef.current?.close()}>
              {deckTexts.cancel}
            </button>
            <button type="button" className="button-danger" onClick={onConfirm}>
              {deckTexts.deleteConfirm}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
