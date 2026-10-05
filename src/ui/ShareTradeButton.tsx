import { useState } from 'react';
import type { Collection } from '../domain/collection';
import { encodeTradeShare } from '../domain/tradeShare';
import type { WantList } from '../domain/wants';
import { texts } from './texts';

/** Copies a trade link (collection + want list) to the clipboard; shows the link in a field when copying fails (T-062). */
export function ShareTradeButton({ have, want }: { have: Collection; want: WantList }) {
  const [state, setState] = useState<'copied' | 'failed' | 'too-big' | null>(null);
  const [link, setLink] = useState('');
  const share = async () => {
    const data = encodeTradeShare(have, want);
    if (data === null) {
      setState('too-big');
      return;
    }
    const url = `${window.location.origin}/#/vaihto/${data}`;
    setLink(url);
    try {
      await navigator.clipboard.writeText(url);
      setState('copied');
    } catch {
      setState('failed');
    }
  };
  return (
    <div className="trade-share">
      <button type="button" className="button-secondary" onClick={() => void share()}>
        {texts.tradeShareButton}
      </button>{' '}
      <span className="hint">{texts.tradeShareNote}</span>
      {state === 'too-big' && <p role="alert">{texts.tradeShareTooBig}</p>}
      {(state === 'copied' || state === 'failed') && (
        <p role="status">
          {state === 'copied' ? texts.tradeShareCopied : texts.tradeShareCopyFailed}
          <input
            type="text"
            readOnly
            className="trade-share-link"
            value={link}
            aria-label={texts.tradeShareLinkLabel}
            onFocus={(e) => e.target.select()}
          />
        </p>
      )}
    </div>
  );
}
