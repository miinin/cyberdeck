import { describe, expect, it } from 'vitest';
import { bookViews, placeableCopies, sheetOfView, turnBook, viewIndexOfSheet } from './binder';
import {
  addPage,
  canPlaceCard,
  canRemovePage,
  initialBinderLayout,
  layoutPageCount,
  MAX_BINDER_POCKETS,
  normalizeBinderLayout,
  placedCounts,
  pocketsBacked,
  removePage,
  setPocket,
  swapOrMovePocket,
} from './binderLayout';
import type { Card } from './card';
import type { Collection } from './collection';
import type { Printing } from './printing';

const empty = (n: number) => Array.from({ length: n }, () => null);

describe('initialBinderLayout', () => {
  it('puts the cards in order, one to a pocket, and fills the last page with empty pockets', () => {
    const layout = initialBinderLayout(['a', 'b', 'c'], '  Mine ');
    expect(layout.name).toBe('Mine');
    expect(layout.pockets).toEqual(['a', 'b', 'c', ...empty(6)]);
  });

  it('is one empty page without cards and never exceeds the largest book', () => {
    expect(initialBinderLayout([], '').pockets).toEqual(empty(9));
    const many = Array.from({ length: 1200 }, (_, i) => `k${i}`);
    expect(initialBinderLayout(many, '').pockets).toHaveLength(MAX_BINDER_POCKETS);
  });
});

describe('normalizeBinderLayout', () => {
  it('accepts a layout and pads it to whole pages', () => {
    expect(normalizeBinderLayout({ v: 1, name: 'x', pockets: ['a', null] })).toEqual({ v: 1, name: 'x', pockets: ['a', null, ...empty(7)] });
  });

  it('refuses anything else instead of reading part of it', () => {
    expect(normalizeBinderLayout(null)).toBeNull();
    expect(normalizeBinderLayout('x')).toBeNull();
    expect(normalizeBinderLayout({ v: 1, name: 'x', pockets: [1] })).toBeNull();
    expect(normalizeBinderLayout({ v: 1, name: 'x', pockets: ['UPPER'] })).toBeNull();
    expect(normalizeBinderLayout({ v: 1, name: 'x', pockets: empty(MAX_BINDER_POCKETS + 1) })).toBeNull();
    expect(normalizeBinderLayout({ v: 1, name: 'x', pockets: empty(MAX_BINDER_POCKETS) })?.pockets).toHaveLength(MAX_BINDER_POCKETS);
  });
});

describe('editing the pockets', () => {
  const pockets = ['a', 'b', null, ...empty(6)];

  it('swaps two cards and moves a card to an empty pocket', () => {
    expect(swapOrMovePocket(pockets, 0, 1).slice(0, 3)).toEqual(['b', 'a', null]);
    expect(swapOrMovePocket(pockets, 0, 2).slice(0, 3)).toEqual([null, 'b', 'a']);
    expect(swapOrMovePocket(pockets, 0, 0)).toEqual(pockets);
    expect(swapOrMovePocket(pockets, 0, 99)).toEqual(pockets);
  });

  it('puts a card in, or empties, a pocket, and leaves the input alone', () => {
    expect(setPocket(pockets, 2, 'c')[2]).toBe('c');
    expect(setPocket(pockets, 0, null)[0]).toBeNull();
    expect(setPocket(pockets, 50, 'c')).toEqual(pockets);
    expect(pockets[2]).toBeNull();
  });

  it('adds an empty page until the largest size', () => {
    expect(addPage(pockets)).toHaveLength(18);
    expect(addPage(empty(MAX_BINDER_POCKETS))).toHaveLength(MAX_BINDER_POCKETS);
  });

  it('removes a page only when it is empty, and keeps the last page', () => {
    const book = [...pockets, ...empty(9), 'z', ...empty(8)];
    expect(layoutPageCount(book)).toBe(3);
    expect(canRemovePage(book, 0)).toBe(false);
    expect(canRemovePage(book, 1)).toBe(true);
    expect(removePage(book, 1)).toEqual([...pockets, 'z', ...empty(8)]);
    expect(removePage(book, 0)).toEqual(book);
    expect(canRemovePage(empty(9), 0)).toBe(false);
  });
});

describe('copy limits', () => {
  it('counts the pockets of each card, leaving one out', () => {
    const counts = placedCounts(['a', 'a', 'b', null], 1);
    expect(counts.get('a')).toBe(1);
    expect(counts.get('b')).toBe(1);
  });

  it('lets a card in while fewer pockets hold it than copies', () => {
    expect(canPlaceCard(1, 2)).toBe(true);
    expect(canPlaceCard(2, 2)).toBe(false);
  });

  it('marks the pockets beyond the owned copies, and cards no longer owned, as not backed', () => {
    const copies: Record<string, number> = { a: 1, b: 0 };
    expect(pocketsBacked(['a', 'a', 'b', null, 'x'], (key) => copies[key] ?? 0)).toEqual([true, false, false, false, false]);
  });
});

describe('placeableCopies', () => {
  const printing = (setName: string): Printing => ({ key: 'p:1', setCode: 'p', setName, number: '001', rarity: 'Common', language: 'en', artist: null, imageKey: 'p' });
  const make = (printings: Printing[]): Card => ({ id: 'c', key: 'c', slug: 'c', name: 'c', subname: null, displayName: 'c', type: 'Unit', color: 'Red', cost: 1, power: null, ram: null, rarity: 'Common', printings });
  const owned = (count: number): Collection => ({ entries: [{ card: 'c', count }] });

  it('counts all copies of a card that has no printing in the main sets', () => {
    expect(placeableCopies(make([printing('Some Other Set')]), owned(3))).toBe(3);
  });

  it('counts the main set copies of a card that has one', () => {
    expect(placeableCopies(make([printing('Welcome to Night City — Retail')]), owned(2))).toBe(2);
  });
});

describe('the book with covers', () => {
  it('has the covers alone and the pages between them: one at a time or in spreads', () => {
    expect(bookViews(3, 1)).toEqual([{ kind: 'front' }, { kind: 'pages', pages: [0] }, { kind: 'pages', pages: [1] }, { kind: 'pages', pages: [2] }, { kind: 'back' }]);
    expect(bookViews(3, 2)).toEqual([{ kind: 'front' }, { kind: 'pages', pages: [0, 1] }, { kind: 'pages', pages: [2] }, { kind: 'back' }]);
    expect(bookViews(0, 2)).toEqual([{ kind: 'front' }, { kind: 'back' }]);
  });

  it('turns through the covers and stops at the ends', () => {
    expect(turnBook(0, -1, 4, 1)).toBe(0);
    expect(turnBook(0, 1, 4, 1)).toBe(1);
    expect(turnBook(4, 1, 4, 1)).toBe(5);
    expect(turnBook(5, 1, 4, 1)).toBe(5);
    expect(turnBook(0, 1, 4, 2)).toBe(1);
    expect(turnBook(1, 1, 4, 2)).toBe(3);
    expect(turnBook(3, 1, 4, 2)).toBe(5);
    expect(turnBook(5, -1, 4, 2)).toBe(3);
  });

  it('finds the view of a sheet and stays on the page when the screen widens', () => {
    const wide = bookViews(4, 2);
    expect(viewIndexOfSheet(wide, 2, 4)).toBe(1);
    expect(viewIndexOfSheet(wide, 3, 4)).toBe(2);
    expect(viewIndexOfSheet(wide, 99, 4)).toBe(3);
    expect(viewIndexOfSheet(wide, -4, 4)).toBe(0);
    expect(sheetOfView(wide[2] ?? { kind: 'front' }, 4)).toBe(3);
  });
});
