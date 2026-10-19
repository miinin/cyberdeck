import { describe, expect, it } from 'vitest';
import { parseHash, routeHash, sectionOf } from './useHashRoute';

describe('goldfish route (T-172)', () => {
  it('parses #/pakat/<id>/goldfish and round-trips', () => {
    expect(parseHash('#/pakat/a/goldfish')).toEqual({ name: 'goldfish', id: 'a' });
    expect(routeHash({ name: 'goldfish', id: 'a' })).toBe('#/pakat/a/goldfish');
    expect(sectionOf({ name: 'goldfish', id: 'a' })).toBe('playtest');
  });

  it('falls back to the deck list for a bad id or extra parts', () => {
    expect(parseHash('#/pakat/a/goldfish/x')).toEqual({ name: 'decks' });
    expect(parseHash('#/pakat/a/other')).toEqual({ name: 'decks' });
    expect(parseHash('#/pakat/bad id/goldfish')).toEqual({ name: 'decks' });
  });
});

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

describe('playtest routes (T-176)', () => {
  it('parses the tabs of the Playtest section and round-trips', () => {
    expect(parseHash('#/testaa/sealed')).toEqual({ name: 'sealed' });
    expect(parseHash('#/testaa/boosterit')).toEqual({ name: 'boosters' });
    expect(parseHash('#/testaa/pelaa')).toEqual({ name: 'soloPick' });
    expect(parseHash('#/testaa/sealed/pelaa')).toEqual({ name: 'sealedGoldfish' });
    for (const name of ['sealed', 'boosters', 'soloPick', 'sealedGoldfish'] as const) {
      expect(parseHash(routeHash({ name }))).toEqual({ name });
    }
  });

  it('shows Sealed for "#/testaa" and an unknown tab', () => {
    expect(parseHash('#/testaa')).toEqual({ name: 'sealed' });
    expect(parseHash('#/testaa/ei-ole')).toEqual({ name: 'sealed' });
  });

  it('leads the old sealed addresses to the same routes, which have the new address', () => {
    expect(parseHash('#/pakat/sealed')).toEqual({ name: 'sealed' });
    expect(parseHash('#/pakat/sealed/goldfish')).toEqual({ name: 'sealedGoldfish' });
    expect(routeHash(parseHash('#/pakat/sealed'))).toBe('#/testaa/sealed');
    expect(routeHash(parseHash('#/pakat/sealed/goldfish'))).toBe('#/testaa/sealed/pelaa');
  });

  it('keeps the deck solo play address and gives Testaa its own section, not the Decks colour', () => {
    expect(parseHash('#/pakat/abc-123/goldfish')).toEqual({ name: 'goldfish', id: 'abc-123' });
    expect(sectionOf(parseHash('#/testaa/boosterit'))).toBe('playtest');
    expect(sectionOf(parseHash('#/pakat'))).toBe('decks');
  });
});

describe('short trade link route (T-178)', () => {
  it('parses #/v/<id> and round-trips; the id is checked by the view, not here', () => {
    expect(parseHash('#/v/0123456789abcdef')).toEqual({ name: 'tradeLink', id: '0123456789abcdef' });
    expect(routeHash({ name: 'tradeLink', id: '0123456789abcdef' })).toBe('#/v/0123456789abcdef');
    expect(parseHash('#/v/')).toEqual({ name: 'tradeLink', id: '' });
    expect(parseHash('#/v/a/b')).toEqual({ name: 'tradeLink', id: '' });
  });

  it('forgives capitals, a trailing slash, mark, space and query in the short id (BRK-07)', () => {
    const id = '0123456789abcdef';
    for (const hash of [`#/v/${id.toUpperCase()}`, `#/v/${id}/`, `#/v/${id}.`, `#/v/${id})`, `#/v/${id},`, `#/v/${id}%20`, `#/v/${id}?x=1`]) {
      expect(parseHash(hash)).toEqual({ name: 'tradeLink', id });
    }
    // The strict shape is still the view's job: a short or odd id stays as it is.
    expect(parseHash('#/v/0123%ZZ')).toEqual({ name: 'tradeLink', id: '0123%zz' });
  });

  it('belongs to the Have/Want section, and the long link still works', () => {
    expect(sectionOf({ name: 'tradeLink', id: 'x' })).toBe('havewant');
    expect(parseHash('#/vaihto/QQ')).toEqual({ name: 'trade', data: 'QQ' });
  });
});
