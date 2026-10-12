import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CardKey } from '../domain/cardKey';
import type { Collection } from '../domain/collection';
import type { CardsByKey } from '../domain/deckRules';
import { DEFAULT_TRADE_RULE, deckUse, tradeableWithRule } from '../domain/tradeRule';
import type { TradeRule } from '../domain/tradeRule';
import type { Repositories } from '../storage';
import { useDecks } from './useDecks';

/**
 * The user's trade rule (T-135): loaded once, saved on change (a failed save only means it is not remembered), and the
 * tradeable copies of a collection under it. While the decks load, or when they cannot be read, the deck part is left out.
 */
export function useTradeRule(repositories: Repositories, cardsByKey: CardsByKey) {
  const { preferences } = repositories;
  const [rule, setRuleState] = useState<TradeRule>(DEFAULT_TRADE_RULE);
  const chosen = useRef(false);
  const { phase: decksPhase, decks } = useDecks(repositories.decks);

  useEffect(() => {
    preferences.loadTradeRule().then(
      (saved) => {
        if (!chosen.current) setRuleState(saved);
      },
      () => undefined,
    );
  }, [preferences]);

  const setRule = useCallback(
    (next: TradeRule) => {
      chosen.current = true;
      setRuleState(next);
      preferences.saveTradeRule(next).catch(() => undefined);
    },
    [preferences],
  );

  const use = useMemo(() => (decksPhase === 'ready' ? deckUse(decks) : new Map<CardKey, number>()), [decksPhase, decks]);
  const tradeableOf = useCallback((collection: Collection) => tradeableWithRule(collection, cardsByKey, rule, use), [cardsByKey, rule, use]);
  return { rule, setRule, tradeableOf };
}
