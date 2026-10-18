import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { isPubId } from '../domain/publicDeck';
import { isDeckId } from '../domain/validate';

/** Views of the app. The route lives in the URL hash, so Back and Forward work and no router is needed. */
export type Route =
  { name: 'cards' } | { name: 'card'; key: string } | { name: 'decks' } | { name: 'deck'; id: string } | { name: 'share'; data: string }
  | { name: 'trade'; data: string } | { name: 'havewant' }
  // Short trade link (T-178): the id is untrusted and checked by the view before any request.
  | { name: 'tradeLink'; id: string }
  // Public decks (T-098): the list tab and one public deck by its pubId.
  | { name: 'publicDecks' } | { name: 'publicDeck'; id: string }
  // Deck building tab (T-164): swap guide and compatibility of the user's decks.
  | { name: 'deckBuild' }
  // Play a deck alone, Goldfish (T-172).
  | { name: 'goldfish'; id: string }
  // Playtest section (T-176, D-036): sealed, single boosters, choosing a deck to play alone, and the solo play of the sealed deck.
  | { name: 'sealed' } | { name: 'sealedGoldfish' } | { name: 'boosters' } | { name: 'soloPick' }
  // Proxy print queue (T-102).
  | { name: 'proxy' }
  // Collection progress (T-105).
  | { name: 'collection' };

/**
 * The section a route belongs to (T-142): each has its own accent, one of the game's four colors, so the user always
 * sees where they are although the pages look alike. Proxy is a tool, not part of the game: a neutral accent.
 */
export type Section = 'cards' | 'collection' | 'decks' | 'havewant' | 'proxy';

export function sectionOf(route: Route): Section {
  switch (route.name) {
    case 'collection':
      return 'collection';
    case 'decks':
    case 'deck':
    case 'share':
    case 'publicDecks':
    case 'publicDeck':
    case 'deckBuild':
    case 'goldfish':
    case 'sealed':
    case 'sealedGoldfish':
    case 'boosters':
    case 'soloPick':
      return 'decks';
    case 'havewant':
    case 'trade':
    case 'tradeLink':
      return 'havewant';
    case 'proxy':
      return 'proxy';
    default:
      return 'cards';
  }
}

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/');
  // Shared deck link (T-056): the data is validated by decodeDeckShare, not here.
  if (parts[0] === 'jaa') return { name: 'share', data: parts.length === 2 ? (parts[1] ?? '') : '' };
  // "#/vaihto" is the Have/Want section (T-065); "#/vaihto/<data>" is a shared trade link.
  if (parts[0] === 'vaihto') {
    if (parts.length === 1 || (parts.length === 2 && parts[1] === '')) return { name: 'havewant' };
    return { name: 'trade', data: parts.length === 2 ? (parts[1] ?? '') : '' };
  }
  // "#/v/<id>": a short trade link (T-178). Only the shape of the route is decided here; the id is validated by the view.
  if (parts[0] === 'v') return { name: 'tradeLink', id: parts.length === 2 ? (parts[1] ?? '') : '' };
  // "#/proxy": the Proxy section (T-102).
  if (parts[0] === 'proxy') return { name: 'proxy' };
  // "#/kokoelma": the Collection progress section (T-105).
  if (parts[0] === 'kokoelma') return { name: 'collection' };
  // "#/kortti/<cardKey>": the Cards view with that card's details open (T-081). An unknown key is handled by the view.
  if (parts[0] === 'kortti' && parts.length === 2 && parts[1] !== undefined && parts[1] !== '') {
    try {
      return { name: 'card', key: decodeURIComponent(parts[1]) };
    } catch {
      return { name: 'cards' };
    }
  }
  // "#/testaa": the Playtest section (T-176). An unknown tab shows Sealed.
  if (parts[0] === 'testaa') {
    if (parts[1] === 'boosterit') return { name: 'boosters' };
    if (parts[1] === 'pelaa') return { name: 'soloPick' };
    if (parts[1] === 'sealed' && parts[2] === 'pelaa') return { name: 'sealedGoldfish' };
    return { name: 'sealed' };
  }
  if (parts[0] !== 'pakat') return { name: 'cards' };
  if (parts[1] === 'julkiset' && (parts.length === 2 || (parts.length === 3 && parts[2] === ''))) return { name: 'publicDecks' };
  if (parts[1] === 'kokoaminen' && (parts.length === 2 || (parts.length === 3 && parts[2] === ''))) return { name: 'deckBuild' };
  // The old sealed addresses (T-173) lead to the Playtest section; useHashRoute rewrites the hash.
  if (parts[1] === 'sealed' && (parts.length === 2 || (parts.length === 3 && parts[2] === ''))) return { name: 'sealed' };
  if (parts[1] === 'sealed' && parts.length === 3 && parts[2] === 'goldfish') return { name: 'sealedGoldfish' };
  if (parts[1] === 'julkinen' && parts.length === 3 && isPubId(parts[2])) return { name: 'publicDeck', id: parts[2] };
  const id = parts[1];
  if (parts.length === 3 && parts[2] === 'goldfish' && id !== undefined && isDeckId(id)) return { name: 'goldfish', id };
  if (parts.length === 2 && id !== undefined && isDeckId(id)) return { name: 'deck', id };
  return { name: 'decks' };
}

export function routeHash(route: Route): string {
  if (route.name === 'cards') return '#/';
  if (route.name === 'card') return `#/kortti/${encodeURIComponent(route.key)}`;
  if (route.name === 'share') return `#/jaa/${route.data}`;
  if (route.name === 'havewant') return '#/vaihto';
  if (route.name === 'proxy') return '#/proxy';
  if (route.name === 'collection') return '#/kokoelma';
  if (route.name === 'deckBuild') return '#/pakat/kokoaminen';
  if (route.name === 'publicDecks') return '#/pakat/julkiset';
  if (route.name === 'publicDeck') return `#/pakat/julkinen/${route.id}`;
  if (route.name === 'sealed') return '#/testaa/sealed';
  if (route.name === 'sealedGoldfish') return '#/testaa/sealed/pelaa';
  if (route.name === 'boosters') return '#/testaa/boosterit';
  if (route.name === 'soloPick') return '#/testaa/pelaa';
  if (route.name === 'goldfish') return `#/pakat/${route.id}/goldfish`;
  if (route.name === 'tradeLink') return `#/v/${route.id}`;
  if (route.name === 'trade') return `#/vaihto/${route.data}`;
  return route.name === 'decks' ? '#/pakat' : `#/pakat/${route.id}`;
}

/** The routes of the Playtest section (T-176): one address each. */
export function isPlaytestRoute(route: Route): boolean {
  return route.name === 'sealed' || route.name === 'sealedGoldfish' || route.name === 'boosters' || route.name === 'soloPick';
}

function subscribe(listener: () => void): () => void {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

const getHash = () => window.location.hash;

export function useHashRoute(): {
  route: Route;
  navigate: (route: Route) => void;
} {
  const hash = useSyncExternalStore(subscribe, getHash, () => '');
  const navigate = useCallback((route: Route) => {
    window.location.hash = routeHash(route);
  }, []);
  const route = parseHash(hash);
  // An old or loose sealed address is replaced (no extra history entry) by the address of the Playtest section (T-176).
  const canonical = isPlaytestRoute(route) ? routeHash(route) : null;
  useEffect(() => {
    if (canonical !== null && hash !== canonical) window.location.replace(canonical);
  }, [hash, canonical]);
  return { route, navigate };
}
