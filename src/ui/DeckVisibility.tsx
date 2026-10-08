import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { PublishState } from '../account';
import type { DeckPublish } from '../domain/deck';
import { cleanNickname } from '../domain/validate';
import { intlLocale } from '../locale';
import { deckTexts } from './deckTexts';

export type PublishResult = 'ok' | 'empty' | 'too-large' | 'failed';

const timeFormat = new Intl.DateTimeFormat(intlLocale, { dateStyle: 'short', timeStyle: 'short' });

function statusText(publish: DeckPublish, state: PublishState): string {
  switch (state.kind) {
    case 'pending':
      return deckTexts.visStatusPending;
    case 'sending':
      return deckTexts.visStatusSending;
    case 'error':
      return deckTexts.visStatusError;
    case 'done':
      return deckTexts.visStatusPublic(timeFormat.format(new Date(state.at)));
    default:
      return publish.public ? deckTexts.visStatusPublicNoTime : '';
  }
}

/**
 * Visibility of a deck (T-098, D-025): private by default. Publishing asks first, warns about what becomes
 * visible and keeps the nickname hidden unless the owner ticks "Näytä nimimerkkini" and types one; the
 * Google account name is never used (SR-38). Without a signed-in account "Julkinen" is off and says why.
 */
export function DeckVisibility({
  publish,
  signedIn,
  signInAvailable,
  state,
  onPublish,
  onMakePrivate,
  onRetry,
}: {
  publish: DeckPublish | undefined;
  signedIn: boolean;
  signInAvailable: boolean;
  state: PublishState;
  /** Publishes or updates the nickname; resolves with the outcome. */
  onPublish: (nickname: string | null) => Promise<PublishResult>;
  /** Deletes the public copy first, then marks the deck private; false = the copy could not be deleted (SR-35). */
  onMakePrivate: () => Promise<boolean>;
  onRetry: () => void;
}) {
  const isPublic = publish?.public === true;
  const id = useId();
  const [choosing, setChoosing] = useState(false);
  // The nickname is hidden unless the owner turns it on: no pre-filled name, ever (SR-38).
  const [showNick, setShowNick] = useState((publish?.nickname ?? null) !== null);
  const [nickText, setNickText] = useState(publish?.nickname ?? '');
  const [nickError, setNickError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState('');
  const nickRef = useRef<HTMLInputElement>(null);
  const publishButtonRef = useRef<HTMLButtonElement>(null);
  const switchRef = useRef<HTMLButtonElement>(null);

  const formOpen = choosing || isPublic;
  const wanted = showNick ? cleanNickname(nickText) : null;
  const dirty = isPublic && (publish?.nickname ?? null) !== wanted;

  const selectPublic = () => {
    if (!signedIn || isPublic) return;
    setError(null);
    setChoosing(true);
  };

  const selectPrivate = async () => {
    setError(null);
    if (!isPublic) {
      setChoosing(false);
      setNickError(false);
      return;
    }
    setBusy(true);
    const ok = await onMakePrivate();
    setBusy(false);
    if (ok) {
      setChoosing(false);
      setLive(deckTexts.visPrivateLive);
      setTimeout(() => switchRef.current?.focus());
    } else {
      setError(deckTexts.visRemoveFailed);
      setTimeout(() => switchRef.current?.focus());
    }
  };

  const toggle = () => {
    if (formOpen) void selectPrivate();
    else selectPublic();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (showNick && wanted === null) {
      setNickError(true);
      nickRef.current?.focus();
      return;
    }
    setNickError(false);
    setError(null);
    setBusy(true);
    const wasPublic = isPublic;
    const result = await onPublish(wanted);
    setBusy(false);
    if (result === 'ok') {
      setChoosing(false);
      setLive(wasPublic ? deckTexts.visNicknameSavedLive : deckTexts.visPublishedLive);
      // The publish button is replaced by "Päivitä nimimerkki": focus goes back to the switch.
      setTimeout(() => switchRef.current?.focus());
    } else {
      setError(result === 'empty' ? deckTexts.visEmpty : result === 'too-large' ? deckTexts.visTooLarge : deckTexts.visFailed);
      publishButtonRef.current?.focus();
    }
  };

  const status = publish === undefined || !isPublic ? '' : statusText(publish, state);

  return (
    <section className="deck-visibility" aria-label={deckTexts.visHeading}>
      <div className="visibility-switch-row">
        <div className={`visibility-switch-wrap${formOpen ? ' is-public' : ''}`}>
          <span className="visibility-switch-label visibility-switch-private" aria-hidden="true">
            {deckTexts.visPrivate}
          </span>
          <button
            ref={switchRef}
            type="button"
            role="switch"
            className="edit-switch visibility-switch"
            aria-checked={formOpen}
            aria-labelledby={`${id}-public`}
            aria-describedby={signedIn ? `${id}-hint` : `${id}-signin`}
            disabled={busy || !signedIn}
            onClick={toggle}
          >
            <span className="edit-switch-track" aria-hidden="true">
              <span className="edit-switch-thumb" />
            </span>
          </button>
          <span id={`${id}-public`} className="visibility-switch-label visibility-switch-public">
            {deckTexts.visPublic}
          </span>
        </div>
        <p id={`${id}-hint`} className="hint visibility-hint">
          {formOpen ? deckTexts.visPublicHint : deckTexts.visPrivateHint}
        </p>
      </div>
      <div className="deck-visibility-body">
        {!signedIn && (
          <p id={`${id}-signin`} className="hint">
            {signInAvailable ? deckTexts.visNeedSignIn : deckTexts.visSignInUnavailable}
          </p>
        )}

        {formOpen && (
          <form className="visibility-form" onSubmit={(event) => void submit(event)} noValidate>
            <p className="notice notice-warning visibility-warning">{deckTexts.visWarning}</p>
            <label className="visibility-check">
              <input
                type="checkbox"
                checked={showNick}
                onChange={(event) => {
                  setShowNick(event.target.checked);
                  setNickError(false);
                  if (event.target.checked) setTimeout(() => nickRef.current?.focus());
                }}
              />
              {deckTexts.visShowNickname}
            </label>
            <div className="visibility-nick">
              <label htmlFor={`${id}-nick`}>{deckTexts.visNicknameLabel}</label>
              <input
                ref={nickRef}
                id={`${id}-nick`}
                type="text"
                autoComplete="off"
                maxLength={60}
                value={nickText}
                disabled={!showNick}
                aria-invalid={nickError ? 'true' : undefined}
                aria-describedby={nickError ? `${id}-nick-error` : `${id}-nick-hint`}
                onChange={(event) => {
                  setNickText(event.target.value);
                  setNickError(false);
                }}
              />
              <p id={`${id}-nick-hint`} className="hint">
                {deckTexts.visNicknameHint}
              </p>
              {nickError && (
                <p id={`${id}-nick-error`} className="field-error">
                  {deckTexts.visNicknameError}
                </p>
              )}
            </div>
            <div className="row-actions">
              {isPublic ? (
                <button ref={publishButtonRef} type="submit" className="button-primary" disabled={busy || !dirty}>
                  {deckTexts.visSaveNickname}
                </button>
              ) : (
                <>
                  <button ref={publishButtonRef} type="submit" className="button-primary" disabled={busy}>
                    {deckTexts.visPublishButton}
                  </button>
                  <button type="button" className="button-secondary" disabled={busy} onClick={() => setChoosing(false)}>
                    {deckTexts.visCancel}
                  </button>
                </>
              )}
              {isPublic && (
                <button type="button" className="button-secondary" disabled={busy} onClick={() => void selectPrivate()}>
                  {deckTexts.visMakePrivate}
                </button>
              )}
            </div>
          </form>
        )}

        {error !== null && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        {status !== '' && (
          <p className="visibility-status" aria-live="polite">
            {status}{' '}
            {state.kind === 'error' && (
              <button type="button" className="link-button" onClick={onRetry}>
                {deckTexts.visRetry}
              </button>
            )}
          </p>
        )}
        <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
          {live}
        </div>
      </div>
    </section>
  );
}
