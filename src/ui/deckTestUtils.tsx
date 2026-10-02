import { render } from '@testing-library/react';
import { App } from '../App';
import type { Card } from '../domain/card';
import { createMemoryRepositories } from '../storage';
import type { Repositories } from '../storage';

/** Shared fixtures for the deck view tests (T-013). */
export function card(key: string, overrides: Partial<Card> = {}): Card {
  return {
    id: `id-${key}`,
    slug: key,
    name: key,
    subname: null,
    displayName: key,
    type: 'Unit',
    color: 'Red',
    cost: 1,
    power: 1,
    ram: 1,
    rarity: 'Common',
    key,
    ...overrides,
  };
}

export const legendCards = ['l1', 'l2', 'l3'].map((key) =>
  card(key, { name: key.toUpperCase(), displayName: key.toUpperCase(), type: 'Legend', ram: 2 }),
);
export const unitCards = Array.from({ length: 14 }, (_, i) =>
  card(`u${i}`, { name: `Unit ${i}`, displayName: `Unit ${i}` }),
);
export const testCards: Card[] = [
  ...legendCards,
  ...unitCards,
  card('big', { name: 'Big', displayName: 'Big', ram: 9 }),
];

export const DECKS_KEY = 'cyberdeck:decks';
export const COLLECTION_KEY = 'cyberdeck:collection';

export interface StoredDeck {
  id: string;
  name: string;
  cards: [string, number][];
}

export function storedDecks(decks: StoredDeck[]): Record<string, string> {
  return {
    [DECKS_KEY]: JSON.stringify({
      schemaVersion: 1,
      savedAt: '2026-10-01T10:00:00.000Z',
      data: {
        decks: decks.map((deck) => ({
          id: deck.id,
          name: deck.name,
          createdAt: '2026-10-01T09:00:00.000Z',
          updatedAt: '2026-10-01T10:00:00.000Z',
          sections: [{ name: '', cards: deck.cards.map(([key, count]) => ({ card: key, count })) }],
        })),
      },
    }),
  };
}

export function storedCollection(entries: [string, number][]): Record<string, string> {
  return {
    [COLLECTION_KEY]: JSON.stringify({
      schemaVersion: 1,
      savedAt: '2026-10-01T10:00:00.000Z',
      data: { entries: entries.map(([card, count]) => ({ card, count })) },
    }),
  };
}

/** 3 Legends and 40 main cards (13 x 3 + 1). */
export function legalCards(): [string, number][] {
  const rows: [string, number][] = [
    ['l1', 1],
    ['l2', 1],
    ['l3', 1],
  ];
  for (let i = 0; i < 13; i += 1) rows.push([`u${i}`, 3]);
  rows.push(['u13', 1]);
  return rows;
}

export function renderRoute(hash: string, repositories: Repositories = createMemoryRepositories()): Repositories {
  window.location.hash = hash;
  render(<App cards={testCards} repositories={repositories} />);
  return repositories;
}
