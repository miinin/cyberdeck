import { useMemo, useState } from 'react';
import type { Collection } from '../domain/collection';
import { encodeTradeShare } from '../domain/tradeShare';
import type { WantList } from '../domain/wants';
import { texts } from './texts';

/**
 * The trade link (collection + want list) in a link box with a copy button (T-062, T-129): the link is always visible, the
 * button copies it to the clipboard.
 */
export function ShareTradeButton({ have, want }: { have: Collection; want: WantList }) {
  const [state, setState] = useState<'copied' | 'failed' | null>(null);
  const data = useMemo(() => encodeTradeShare(have, want), [have, want]);
  const link = data === null ? '' : `${window.location.origin}/#/vaihto/${data}`;
  const share = async () => {
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
        <input
          type="text"
          readOnly
          className="trade-share-link"
          value={link}
          aria-label={texts.tradeShareLinkLabel}
          onFocus={(e) => e.target.select()}
        />
        <button type="button" className="button-secondary" onClick={() => void share()}>
          {texts.tradeShareButton}
        </button>
      </div>
      <p className="hint">{texts.tradeShareNote}</p>
      <p role="status" className="trade-share-status">
        {state === 'copied' ? texts.tradeShareCopied : state === 'failed' ? texts.tradeShareCopyFailed : ''}
      </p>
    </div>
  );
}
