import { describe, expect, it } from 'vitest';
import { parseHash, routeHash, sectionOf } from './useHashRoute';

describe('card route (T-081)', () => {
  it('parses #/kortti/<key> and round-trips', () => {
    expect(parseHash('#/kortti/welcome-to-night-city')).toEqual({ name: 'card', key: 'welcome-to-night-city' });
    expect(routeHash({ name: 'card', key: 'a b' })).toBe('#/kortti/a%20b');
    expect(parseHash('#/kortti/a%20b')).toEqual({ name: 'card', key: 'a b' });
  });

  it('falls back to the cards view without a key or with a bad escape', () => {
    expect(parseHash('#/kortti')).toEqual({ name: 'cards' });
    expect(parseHash('#/kortti/')).toEqual({ name: 'cards' });
    expect(parseHash('#/kortti/%E0%A4%A')).toEqual({ name: 'cards' });
  });
});

describe('deck building route (T-164)', () => {
  it('parses and round-trips', () => {
    expect(parseHash('#/pakat/kokoaminen')).toEqual({ name: 'deckBuild' });
    expect(parseHash('#/pakat/kokoaminen/')).toEqual({ name: 'deckBuild' });
    expect(routeHash({ name: 'deckBuild' })).toBe('#/pakat/kokoaminen');
    expect(sectionOf({ name: 'deckBuild' })).toBe('decks');
  });
});

describe('public deck routes (T-098)', () => {
  const pubId = 'ab'.repeat(32);

  it('parses the public list and one public deck and round-trips', () => {
    expect(parseHash('#/pakat/julkiset')).toEqual({ name: 'publicDecks' });
    expect(routeHash({ name: 'publicDecks' })).toBe('#/pakat/julkiset');
    expect(parseHash(`#/pakat/julkinen/${pubId}`)).toEqual({ name: 'publicDeck', id: pubId });
    expect(routeHash({ name: 'publicDeck', id: pubId })).toBe(`#/pakat/julkinen/${pubId}`);
  });

  it('falls back to the deck list for a bad id and keeps own deck ids working', () => {
    expect(parseHash('#/pakat/julkinen/nope')).toEqual({ name: 'decks' });
    expect(parseHash(`#/pakat/julkinen/${pubId.toUpperCase()}`)).toEqual({ name: 'decks' });
    expect(parseHash(`#/pakat/julkinen/${pubId}/x`)).toEqual({ name: 'decks' });
    expect(parseHash('#/pakat/abc-123')).toEqual({ name: 'deck', id: 'abc-123' });
  });
});

describe('section of a route (T-142)', () => {
  it('groups the routes into the five sections', () => {
    const of = (hash: string) => sectionOf(parseHash(hash));
    expect([of('#/'), of('#/kortti/v')]).toEqual(['cards', 'cards']);
    expect(of('#/kokoelma')).toBe('collection');
    expect([of('#/pakat'), of('#/jaa/x')]).toEqual(['decks', 'decks']);
    expect([of('#/vaihto'), of('#/vaihto/x')]).toEqual(['havewant', 'havewant']);
    expect(of('#/proxy')).toBe('proxy');
  });
});
