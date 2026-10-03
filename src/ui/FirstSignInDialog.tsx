import { useEffect, useRef } from 'react';
import type { FirstSignInChoice } from '../account';
import { texts } from './texts';

/**
 * First sign-in with data in the browser and in the account (T-054c, D-017 kohta 6): merge, use only the
 * account's data, or cancel (which signs out). Closing the dialog any other way counts as cancel.
 */
export function FirstSignInDialog({
  onChoose,
  onCancel,
}: {
  onChoose: (choice: FirstSignInChoice) => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const answered = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog !== null && !dialog.open) dialog.showModal();
  }, []);

  function answer(choice: FirstSignInChoice | null) {
    answered.current = true;
    dialogRef.current?.close();
    if (choice === null) onCancel();
    else onChoose(choice);
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="first-sign-in-title"
      onClose={() => {
        if (!answered.current) onCancel();
      }}
    >
      <div className="confirm-dialog-body">
        <h2 id="first-sign-in-title">{texts.accountChooseTitle}</h2>
        <p>{texts.accountChooseBody}</p>
        <div className="row-actions">
          <button type="button" className="button-secondary" onClick={() => answer(null)}>
            {texts.accountCancel}
          </button>
          <button type="button" className="button-secondary" onClick={() => answer('account-only')}>
            {texts.accountChooseAccountOnly}
          </button>
          <button type="button" className="button-primary" onClick={() => answer('merge')}>
            {texts.accountChooseMerge}
          </button>
        </div>
      </div>
    </dialog>
  );
}
