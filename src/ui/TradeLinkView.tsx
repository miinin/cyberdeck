import { useEffect, useRef, useState } from 'react';
import type { Card } from '../domain/card';
import { isTradeShareId } from '../domain/tradeLink';
import type { Repositories } from '../storage';
import { deckTexts } from './deckTexts';
import { usePublicDecks } from './PublicDecksContext';
import { SharedTradeView } from './SharedTradeView';
import { texts } from './texts';
import { useNoIndex } from './useNoIndex';

type Load =
  | { phase: 'loading' }
  | { phase: 'ready'; data: string }
  | { phase: 'missing' }
  | { phase: 'newer' }
  | { phase: 'error' };

/**
 * A short trade link opened (T-178, D-037): reads `tradeShares/{id}` without signing in and shows the same read-only
 * view as the long link. The id comes from the URL, so it is checked before any request (SR-53); the document is
 * validated by the store and the trade text by decodeTradeShare. Nothing is saved, and the view is not indexed.
 * The caller keys the view by the id, so a new id starts from the loading state.
 */
export function TradeLinkView({ id, cards, repositories }: { id: string; cards: readonly Card[]; repositories: Repositories }) {
  useNoIndex();
  const { tradeShares } = usePublicDecks();
  const valid = isTradeShareId(id);
  const [load, setLoad] = useState<Load>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!valid || tradeShares === null || tradeShares === undefined) return;
    let active = true;
    tradeShares.get(id).then(
      (doc) => {
        if (!active) return;
        setLoad(doc === null ? { phase: 'missing' } : doc.kind === 'newer' ? { phase: 'newer' } : { phase: 'ready', data: doc.data });
      },
      () => active && setLoad({ phase: 'error' }),
    );
    return () => {
      active = false;
    };
  }, [tradeShares, id, valid, attempt]);

  // A malformed id shows "not found" without a request; without a store there is nothing to read.
  const state: Load = !valid ? { phase: 'missing' } : tradeShares == null ? { phase: 'error' } : load;

  useEffect(() => {
    if (state.phase !== 'loading' && state.phase !== 'ready') headingRef.current?.focus({ preventScroll: true });
  }, [state.phase]);

  if (state.phase === 'ready') {
    return <SharedTradeView data={state.data} cards={cards} repositories={repositories} intro={texts.tradeIntroShort} />;
  }
  if (state.phase === 'loading') {
    return (
      <>
        <h1>{texts.tradeHeading}</h1>
        <p className="status-line" role="status">
          {texts.tradeLinkLoading}
        </p>
      </>
    );
  }
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        {texts.tradeInvalidHeading}
      </h1>
      <div className="notice notice-danger" role="alert">
        <p>{state.phase === 'newer' ? texts.tradeLinkNewer : state.phase === 'error' ? texts.tradeLinkError : texts.tradeLinkNotFound}</p>
      </div>
      {state.phase === 'error' && (
        <p>
          <button type="button" className="button-secondary" onClick={() => {
              setLoad({ phase: 'loading' });
              setAttempt((n) => n + 1);
            }}>
            {deckTexts.publicRetry}
          </button>
        </p>
      )}
      <p>
        <a className="text-link" href="#/">
          {texts.tradeToCards}
        </a>
      </p>
    </>
  );
}
