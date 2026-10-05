import { useCallback, useSyncExternalStore } from 'react';
import { isDeckId } from '../domain/validate';

/** Views of the app. The route lives in the URL hash, so Back and Forward work and no router is needed. */
export type Route =
  { name: 'cards' } | { name: 'card'; key: string } | { name: 'decks' } | { name: 'deck'; id: string } | { name: 'share'; data: string }
  | { name: 'trade'; data: string } | { name: 'havewant' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/');
  // Shared deck link (T-056): the data is validated by decodeDeckShare, not here.
  if (parts[0] === 'jaa') return { name: 'share', data: parts.length === 2 ? (parts[1] ?? '') : '' };
  // "#/vaihto" is the Have/Want section (T-065); "#/vaihto/<data>" is a shared trade link.
  if (parts[0] === 'vaihto') {
    if (parts.length === 1 || (parts.length === 2 && parts[1] === '')) return { name: 'havewant' };
    return { name: 'trade', data: parts.length === 2 ? (parts[1] ?? '') : '' };
  }
  // "#/kortti/<cardKey>": the Cards view with that card's details open (T-081). An unknown key is handled by the view.
  if (parts[0] === 'kortti' && parts.length === 2 && parts[1] !== undefined && parts[1] !== '') {
    try {
      return { name: 'card', key: decodeURIComponent(parts[1]) };
    } catch {
      return { name: 'cards' };
    }
  }
  if (parts[0] !== 'pakat') return { name: 'cards' };
  const id = parts[1];
  if (parts.length === 2 && id !== undefined && isDeckId(id)) return { name: 'deck', id };
  return { name: 'decks' };
}

export function routeHash(route: Route): string {
  if (route.name === 'cards') return '#/';
  if (route.name === 'card') return `#/kortti/${encodeURIComponent(route.key)}`;
  if (route.name === 'share') return `#/jaa/${route.data}`;
  if (route.name === 'havewant') return '#/vaihto';
  if (route.name === 'trade') return `#/vaihto/${route.data}`;
  return route.name === 'decks' ? '#/pakat' : `#/pakat/${route.id}`;
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
  return { route: parseHash(hash), navigate };
}
