import { createContext, useContext } from 'react';
import type { PublicDeckPublisher, PublicDeckStore, TradeShareStore } from '../account';

/**
 * What the public decks UI needs from the account layer (T-098). `store` reads public decks (signed out too);
 * `publisher` exists only for a signed-in account and sends and deletes the account's public copies.
 * Outside the provider (most tests) there is no store: the public views show their error state.
 */
export interface PublicDecksApi {
  store: PublicDeckStore | null;
  publisher: PublicDeckPublisher | null;
  /** Short trade links (T-178): reads work signed out, the writes need an account. null = no account layer. */
  tradeShares?: TradeShareStore | null;
  /** The same store for the signed-in account's own link (T-178); null = signed out, so only the long link is offered. */
  ownTradeShares?: TradeShareStore | null;
  /** false = sign-in is off on this host (PR previews), so publishing is not possible either. */
  signInAvailable: boolean;
}

export const PublicDecksContext = createContext<PublicDecksApi>({ store: null, publisher: null, signInAvailable: false });

export function usePublicDecks(): PublicDecksApi {
  return useContext(PublicDecksContext);
}
