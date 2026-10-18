import { useEffect, useMemo, useRef, useState } from 'react';
import type { CardKey } from '../domain/cardKey';
import type { Collection } from '../domain/collection';
import { TRADE_SHARE_UPDATE_DELAY_MS } from '../domain/tradeLink';
import { encodeTradeShare } from '../domain/tradeShare';
import type { WantList } from '../domain/wants';
import type { PreferencesRepository, TradeShareSource } from '../storage';
import { deckTexts } from './deckTexts';
import { usePublicDecks } from './PublicDecksContext';
import { QrButton } from './QrDialog';
import { texts } from './texts';

/** A second press with unchanged content soon after a write only copies: the rules refuse writes less than 10 s apart. */
const RECENT_WRITE_MS = 20_000;

type Status = 'copied' | 'failed' | 'share-failed' | 'stopped' | null;

/**
 * The trade link (collection + want list) in a link box with a copy button (T-062, T-129). Signed in (T-178, D-037)
 * the button writes the account's short link `#/v/<id>`, which the app then keeps up to date while this device has
 * shared it (SR-54); "Lopeta jakaminen" deletes it (SR-55). Signed out the long link `#/vaihto/<data>` is shown.
 */
export function ShareTradeButton({
  have,
  want,
  tradeable,
  note = texts.tradeShareNote,
  shortNote = texts.tradeShortWarning,
  source = 'collection',
  preferences,
}: {
  have: Collection;
  want: WantList;
  /** The tradeable copies under the user's trade rule (T-135); the receiver sees these instead of the playset rule. */
  tradeable?: ReadonlyMap<CardKey, number>;
  /** What the receiver of the long link sees; default: the whole collection and the want list. */
  note?: string;
  /** What the receiver of the short link sees, including that it follows later changes (SR-57). */
  shortNote?: string;
  /** Where the Have side comes from; the automatic refresh runs only for the source that was shared (SEC-178-1). */
  source?: TradeShareSource;
  /** Where "shared from this device" is remembered (per account, SR-54). Without it nothing is remembered. */
  preferences?: PreferencesRepository;
}) {
  const { ownTradeShares: store = null, signInAvailable } = usePublicDecks();
  const [status, setStatus] = useState<Status>(null);
  /** UX-18 (T-174): the link field appears only after "Jaa", as a copyable field (not always, with a long raw URL). */
  const [revealed, setRevealed] = useState(false);
  const [sharedSource, setSharedSource] = useState<TradeShareSource | null>(() => (store === null ? null : (preferences?.loadTradeShared() ?? null)));
  const shared = sharedSource !== null;
  /** The shared link comes from the other source: nothing is written until the user presses Share (SEC-178-1). */
  const otherSource = shared && sharedSource !== source;
  const [shortId, setShortId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const data = useMemo(() => encodeTradeShare(have, want, tradeable), [have, want, tradeable]);
  /** What the server holds from this device, and when this device last wrote it. */
  const synced = useRef<{ data: string | null; at: number }>({ data: null, at: 0 });

  // A link shared earlier from this device is shown again (the id is computed from the uid, nothing is read).
  useEffect(() => {
    if (store === null || !shared) return;
    let active = true;
    store.ownId().then(
      (id) => active && setShortId(id),
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [store, shared]);

  // SR-54: the automatic refresh only updates. A missing document means sharing was stopped elsewhere: forget it.
  useEffect(() => {
    if (store === null || !shared || otherSource || data === null || synced.current.data === data) return;
    let active = true;
    const forget = () => {
      preferences?.saveTradeShared(null);
      setSharedSource(null);
      setShortId(null);
    };
    const timer = setTimeout(() => {
      void (async () => {
        try {
          if (synced.current.data === null) {
            // First check on this page: is the document there, and does it already hold this content?
            const current = await store.get(await store.ownId());
            if (!active) return;
            if (current === null) {
              forget();
              return;
            }
            // SEC-178-3: a document from a newer app version is never overwritten.
            if (current.kind === 'newer') return;
            if (current.data === data) {
              synced.current = { data, at: synced.current.at };
              return;
            }
          }
          const updated = await store.update(data);
          if (!active) return;
          if (updated) synced.current = { data, at: Date.now() };
          else forget();
        } catch {
          // The next change or visit tries again; nothing is shown for a background refresh.
        }
      })();
    }, TRADE_SHARE_UPDATE_DELAY_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [store, shared, otherSource, data, preferences]);

  const longLink = data === null ? '' : `${window.location.origin}/#/vaihto/${data}`;
  const shortLink = shortId === null ? '' : `${window.location.origin}/#/v/${shortId}`;
  const link = store === null ? longLink : shortLink;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  };

  const share = async () => {
    if (store === null) {
      setRevealed(true);
      await copy(longLink);
      return;
    }
    if (data === null || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const recent = synced.current.data === data && Date.now() - synced.current.at < RECENT_WRITE_MS;
      if (!recent) {
        await store.publish(data);
        synced.current = { data, at: Date.now() };
      }
      const id = await store.ownId();
      preferences?.saveTradeShared(source);
      setSharedSource(source);
      setShortId(id);
      setRevealed(true);
      await copy(`${window.location.origin}/#/v/${id}`);
    } catch {
      setStatus('share-failed');
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    if (store === null || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      await store.remove();
      preferences?.saveTradeShared(null);
      synced.current = { data: null, at: 0 };
      setSharedSource(null);
      setShortId(null);
      setRevealed(false);
      setStatus('stopped');
    } catch {
      // SR-55: a failed stop is shown, and sharing stays on.
      setStatus('share-failed');
    } finally {
      setBusy(false);
    }
  };

  const stopButton = shared && store !== null && (
    <button type="button" className="button-secondary" disabled={busy} onClick={() => void stop()}>
      {texts.tradeStopSharing}
    </button>
  );
  const statusLine = (
    <p role="status" className="trade-share-status">
      {status === 'copied'
        ? texts.tradeShareCopied
        : status === 'failed'
          ? texts.tradeShareCopyFailed
          : status === 'share-failed'
            ? texts.tradeShareFailed
            : status === 'stopped'
              ? texts.tradeSharingStopped
              : ''}
    </p>
  );

  if (data === null) {
    return (
      <div className="trade-share">
        <p className="hint">{texts.tradeShareTooBig}</p>
        {stopButton}
        {statusLine}
      </div>
    );
  }
  return (
    <div className="trade-share">
      <div className="trade-share-row">
        {revealed && link !== '' && (
          <input
            type="text"
            readOnly
            className="trade-share-link"
            value={link}
            aria-label={texts.tradeShareLinkLabel}
            onFocus={(e) => e.target.select()}
          />
        )}
        <button type="button" className="button-secondary" disabled={busy} onClick={() => void share()}>
          {texts.tradeShareButton}
        </button>
        {link !== '' && <QrButton link={link} title={deckTexts.qrFor(texts.tradeShareLinkLabel)} name={deckTexts.qrFor(texts.tradeShareLinkLabel)} />}
        {stopButton}
      </div>
      <p className="hint">{store === null ? note : shortNote}</p>
      {otherSource && <p className="hint">{texts.tradeShareOtherSource}</p>}
      {store === null && signInAvailable && <p className="hint">{texts.tradeSignInForShort}</p>}
      {statusLine}
    </div>
  );
}
