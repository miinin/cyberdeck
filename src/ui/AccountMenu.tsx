import { intlLocale } from '../locale';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { AccountSession, AuthClient, AuthState, SessionStatus } from '../account';
import { texts } from './texts';

/**
 * Account control in the header (T-054a, D-017 kohta 1). Signed out: "Kirjaudu" opens a dialog with the
 * age limit and the privacy text before going to Google (SR-29 kohta 2); where sign-in is off (PR
 * previews) the same dialog says so. Signed in: a disclosure with the email (from memory only) and
 * "Kirjaudu ulos".
 */
export function AccountMenu({
  auth,
  session = null,
  onSignedOut,
  onAccountDeleted,
}: {
  auth: AuthClient;
  /** The sync session of the signed-in account (T-054c). */
  session?: AccountSession | null;
  /** Called after the user signed out with the menu (the app shows the notice). */
  onSignedOut?: () => void;
  /** Called after the account data and the account were deleted (T-054d). */
  onAccountDeleted?: () => void;
}) {
  const state = useSyncExternalStore(auth.onChange, auth.state);

  // Restores an earlier session; loads nothing for a user who never signed in (SR-21 kohta 5).
  useEffect(() => auth.start(), [auth]);

  // Separate components, so signing in or out resets the dialog and menu state by unmounting.
  if (state.status === 'signed-in' && state.user !== null) {
    return <SignedInMenu auth={auth} email={state.user.email} session={session} onSignedOut={onSignedOut} onAccountDeleted={onAccountDeleted} />;
  }
  return <SignInButton auth={auth} state={state} />;
}

/** Person icon; the text is the button's name and is visible from 40 rem up (like the theme toggle). */
function AccountLabel({ text }: { text: string }) {
  return (
    <>
      <svg className="account-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M4 21c1-4.5 4-6.5 8-6.5s7 2 8 6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span className="account-button-label">{text}</span>
    </>
  );
}

const timeFormat = new Intl.DateTimeFormat(intlLocale, { hour: 'numeric', minute: '2-digit' });

const NO_SESSION = () => () => {};

function syncText(status: SessionStatus | null): string {
  if (status === null) return texts.accountSyncWaiting;
  const { state, lastSyncedAt } = status.sync;
  if (state === 'offline') return texts.accountSyncOffline;
  if (state === 'error') return texts.accountSyncError;
  if (state === 'locked') return texts.accountSyncLocked;
  if (state === 'syncing' || status.phase !== 'running') return texts.accountSyncSyncing;
  return lastSyncedAt === null ? texts.accountSyncWaiting : texts.accountSyncSaved(timeFormat.format(lastSyncedAt));
}

function SignedInMenu({
  auth,
  email,
  session,
  onSignedOut,
  onAccountDeleted,
}: {
  auth: AuthClient;
  email: string | null;
  session: AccountSession | null;
  onSignedOut?: () => void;
  onAccountDeleted?: () => void;
}) {
  const status = useSyncExternalStore(session?.onChange ?? NO_SESSION, () => session?.status() ?? null);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function signOut() {
    await auth.signOut();
    if (auth.state().status === 'signed-out') onSignedOut?.();
  }
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'working' | 'reauth'>('idle');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function deleteEverything() {
    if (session === null) return;
    setDeleteStep('working');
    setDeleteError(null);
    if (!(await session.deleteAccountData())) {
      setDeleteStep('confirm');
      setDeleteError(texts.accountDeleteFailedCloud);
      return;
    }
    const result = await auth.deleteAccount();
    if (result === 'deleted') {
      onAccountDeleted?.();
    } else if (result === 'reauth') {
      setDeleteStep('reauth');
    } else {
      session.start(); // the data is gone but the account is not: sync keeps working
      setDeleteStep('confirm');
      setDeleteError(texts.accountDeleteFailedAccount);
    }
  }
  // Unsynced changes (or a failed last round) are warned about once before signing out.
  const unsynced = status !== null && (status.sync.pending || status.sync.state !== 'idle');

  const menuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    // The menu closes on Escape (focus back to its button) and when focus leaves it, e.g. a click outside.
    <div
      className="account"
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !menuOpen) return;
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false);
      }}
    >
      <button
        ref={menuButtonRef}
        type="button"
        className="account-button"
        aria-expanded={menuOpen}
        aria-controls="account-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <AccountLabel text={texts.accountMenu} />
      </button>
      <div id="account-menu" className="account-menu" hidden={!menuOpen}>
        <p className="account-email">{texts.accountSignedInAs(email)}</p>
        <p className="account-sync" role="status">
          {syncText(status)}
        </p>
        {session !== null && (
          <button type="button" className="button-secondary" onClick={() => void session.syncNow()}>
            {texts.accountSyncNow}
          </button>
        )}
        {session !== null && deleteStep === 'idle' && (
          <button type="button" className="button-secondary" onClick={() => setDeleteStep('confirm')}>
            {texts.accountDelete}
          </button>
        )}
        {deleteStep !== 'idle' && (
          <div role="alert">
            {deleteStep === 'reauth' ? (
              <p>{texts.accountDeleteReauth}</p>
            ) : (
              <>
                <p>
                  <strong>{texts.accountDeleteTitle}</strong>
                </p>
                <p>{texts.accountDeleteBody}</p>
                {deleteError !== null && <p className="account-error">{deleteError}</p>}
                <div className="row-actions">
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={deleteStep === 'working'}
                    onClick={() => {
                      setDeleteStep('idle');
                      setDeleteError(null);
                    }}
                  >
                    {texts.accountCancel}
                  </button>
                  <button
                    type="button"
                    className="button-primary"
                    disabled={deleteStep === 'working'}
                    onClick={() => void deleteEverything()}
                  >
                    {deleteStep === 'working' ? texts.accountDeleting : texts.accountDeleteConfirm}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {confirmingSignOut ? (
          <div role="alert">
            <p>
              <strong>{texts.accountSignOutWarnTitle}</strong>
            </p>
            <p>{texts.accountSignOutWarnBody}</p>
            <div className="row-actions">
              <button type="button" className="button-secondary" onClick={() => setConfirmingSignOut(false)}>
                {texts.accountCancel}
              </button>
              <button type="button" className="button-primary" onClick={() => void signOut()}>
                {texts.accountSignOutAnyway}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="button-secondary"
            onClick={() => {
              if (unsynced) setConfirmingSignOut(true);
              else void signOut();
            }}
          >
            {texts.accountSignOut}
          </button>
        )}
      </div>
    </div>
  );
}

function SignInButton({ auth, state }: { auth: AuthClient; state: AuthState }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  // A failed redirect sign-in comes back with an error and no open dialog: show it there once.
  const [errorDismissed, setErrorDismissed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { error } = state;
  const loading = state.status === 'loading';
  const open = dialogOpen || (error !== null && !errorDismissed);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <div className="account">
      <button
        type="button"
        className="account-button"
        aria-haspopup="dialog"
        aria-disabled={loading || undefined}
        onClick={() => {
          if (!loading) setDialogOpen(true);
        }}
      >
        <AccountLabel text={loading ? texts.accountSigningIn : texts.accountSignIn} />
      </button>
      <dialog
        ref={dialogRef}
        className="confirm-dialog"
        aria-labelledby="account-dialog-title"
        onClose={() => {
          setDialogOpen(false);
          setErrorDismissed(true);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        {open && (
          <div className="confirm-dialog-body">
            {auth.available ? (
              <>
                <h2 id="account-dialog-title">{texts.accountDialogTitle}</h2>
                <p>{texts.accountAgeLimit}</p>
                <p>{texts.accountPrivacy}</p>
                <p>{texts.accountPrivacyGoogle}</p>
                <p>{texts.accountPrivacyController}</p>
                {error !== null && (
                  <p className="account-error" role="alert">
                    {texts.accountErrors[error]}
                  </p>
                )}
                <div className="row-actions">
                  <button type="button" className="button-secondary" onClick={() => dialogRef.current?.close()}>
                    {texts.accountCancel}
                  </button>
                  <button
                    type="button"
                    className="button-primary"
                    aria-disabled={loading || undefined}
                    onClick={() => {
                      if (!loading) void auth.signIn();
                    }}
                  >
                    {loading ? texts.accountSigningIn : texts.accountContinue}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="account-dialog-title">{texts.accountUnavailableTitle}</h2>
                <p>{texts.accountUnavailableBody}</p>
                <div className="row-actions">
                  <button type="button" className="button-secondary" onClick={() => dialogRef.current?.close()}>
                    {texts.accountClose}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
