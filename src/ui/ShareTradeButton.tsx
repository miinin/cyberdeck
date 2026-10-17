import { useMemo, useState } from 'react';
import type { CardKey } from '../domain/cardKey';
import type { Collection } from '../domain/collection';
import { encodeTradeShare } from '../domain/tradeShare';
import type { WantList } from '../domain/wants';
import { deckTexts } from './deckTexts';
import { QrButton } from './QrDialog';
import { texts } from './texts';

/**
 * The trade link (collection + want list) in a link box with a copy button (T-062, T-129): the link is always visible, the
 * button copies it to the clipboard.
 */
export function ShareTradeButton({
  have,
  want,
  tradeable,
  note = texts.tradeShareNote,
}: {
  have: Collection;
  want: WantList;
  /** The tradeable copies under the user's trade rule (T-135); the receiver sees these instead of the playset rule. */
  tradeable?: ReadonlyMap<CardKey, number>;
  /** What the receiver sees; default: the whole collection and the want list. */
  note?: string;
}) {
  const [state, setState] = useState<'copied' | 'failed' | null>(null);
  /** UX-18 (T-174): the link field appears only after "Jaa", as a copyable field (not always, with a long raw URL). */
  const [revealed, setRevealed] = useState(false);
  const data = useMemo(() => encodeTradeShare(have, want, tradeable), [have, want, tradeable]);
  const link = data === null ? '' : `${window.location.origin}/#/vaihto/${data}`;
  const share = async () => {
    setRevealed(true);
    try {
      await navigator.clipboard.writeText(link);
      setState('copied');
    } catch {
      setState('failed');
    }
  };
  if (data === null) return <p className="trade-share hint">{texts.tradeShareTooBig}</p>;
  return (
    <div className="trade-share">
      <div className="trade-share-row">
        {revealed && (
          <input
            type="text"
            readOnly
            className="trade-share-link"
            value={link}
            aria-label={texts.tradeShareLinkLabel}
            onFocus={(e) => e.target.select()}
          />
        )}
        <button type="button" className="button-secondary" onClick={() => void share()}>
          {texts.tradeShareButton}
        </button>
        <QrButton link={link} title={deckTexts.qrFor(texts.tradeShareLinkLabel)} name={deckTexts.qrFor(texts.tradeShareLinkLabel)} />
      </div>
      <p className="hint">{note}</p>
      <p role="status" className="trade-share-status">
        {state === 'copied' ? texts.tradeShareCopied : state === 'failed' ? texts.tradeShareCopyFailed : ''}
      </p>
    </div>
  );
}
