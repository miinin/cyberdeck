import {
  compareGames,
  gameLogBytes,
  gameLogFits,
  isPlayedOn,
  localDay,
  MAX_GAMES,
  MAX_GAME_LOG_BYTES,
  parseGameLog,
  parseGameRecord,
  sameGame,
  sameGameLog,
  withGame,
  withoutDeck,
  withoutOrphans,
} from './games';
import type { GameRecord } from './games';

function game(id: string, patch: Partial<GameRecord> = {}): GameRecord {
  return {
    id,
    deckId: 'deck1',
    playedOn: '2026-10-05',
    createdAt: '2026-10-05T18:00:00.000Z',
    result: 'win',
    opponentName: null,
    opponentLegends: [],
    turn: null,
    event: null,
    sideboard: false,
    note: null,
    ...patch,
  };
}

describe('parseGameRecord', () => {
  it('accepts a complete row and builds a new object', () => {
    const raw = game('g1', { opponentName: 'Blue aggro', opponentLegends: ['v-streetkid', 'detonate'], turn: 'second', note: 'Close' });
    const parsed = parseGameRecord(raw);
    expect(parsed).toEqual(raw);
    expect(parsed).not.toBe(raw);
  });

  it('rejects a row with an unknown field, __proto__, constructor, or a missing field', () => {
    expect(parseGameRecord({ ...game('g1'), extra: 1 })).toBeNull();
    expect(parseGameRecord(JSON.parse(`{"id":"g1","__proto__":{"x":1}}`))).toBeNull();
    const withProto: unknown = JSON.parse(JSON.stringify(game('g1')).replace('{', '{"__proto__":{"polluted":true},'));
    expect(parseGameRecord(withProto)).toBeNull();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(parseGameRecord({ ...game('g1'), constructor: 'x' })).toBeNull();
    const missing: Record<string, unknown> = { ...game('g1') };
    delete missing.note;
    expect(parseGameRecord(missing)).toBeNull();
    expect(parseGameRecord(null)).toBeNull();
    expect(parseGameRecord([])).toBeNull();
  });

  it.each([
    ['id', { id: 'a b' }],
    ['id too long', { id: 'a'.repeat(65) }],
    ['deckId', { deckId: '../x' }],
    ['deckId __proto__', { deckId: '__proto__' }],
    ['playedOn', { playedOn: '2026-10-5' }],
    ['playedOn not a day', { playedOn: '2026-02-30' }],
    ['createdAt', { createdAt: 'yesterday' }],
    ['createdAt too long', { createdAt: '2026-10-05T18:00:00.000Z' + ' '.repeat(30) }],
    ['result', { result: 'won' as never }],
    ['turn', { turn: 'third' as never }],
    ['sideboard', { sideboard: 'yes' as never }],
    ['legends over three', { opponentLegends: ['a', 'b', 'c', 'd'] }],
    ['repeated legend', { opponentLegends: ['a', 'a'] }],
    ['legend not a key', { opponentLegends: ['A B'] }],
    ['legend over 64 characters', { opponentLegends: ['a'.repeat(65)] }],
    ['opponent too long', { opponentName: 'x'.repeat(61) }],
    ['event too long', { event: 'x'.repeat(61) }],
    ['note too long', { note: 'x'.repeat(501) }],
    ['opponent not text', { opponentName: 5 as never }],
  ])('rejects a bad %s', (_name, patch) => {
    expect(parseGameRecord(game('g1', patch))).toBeNull();
  });

  it('removes control and direction characters, trims, and checks the length afterwards', () => {
    const parsed = parseGameRecord(game('g1', { opponentName: '  Blue\n‮aggro\u0007  ', note: '\n\t ', event: `${'x'.repeat(60)}‎` }));
    expect(parsed?.opponentName).toBe('Blueaggro');
    expect(parsed?.note).toBeNull();
    expect(parsed?.event).toBe('x'.repeat(60));
    // An empty text after cleaning is null, not an error.
    expect(parseGameRecord(game('g1', { opponentName: '' }))?.opponentName).toBeNull();
  });
});

describe('parseGameLog', () => {
  it('returns rows newest first and counts what it drops', () => {
    const rows = [
      game('a', { playedOn: '2026-10-01' }),
      game('b', { playedOn: '2026-10-05', createdAt: '2026-10-05T10:00:00.000Z' }),
      game('c', { playedOn: '2026-10-05', createdAt: '2026-10-05T20:00:00.000Z' }),
      { nope: true },
    ];
    const parsed = parseGameLog({ games: rows });
    expect(parsed?.value.games.map((g) => g.id)).toEqual(['c', 'b', 'a']);
    expect(parsed?.dropped).toBe(1);
  });

  it('keeps the first row of a repeated id and drops the others', () => {
    const parsed = parseGameLog({ games: [game('a', { result: 'win' }), game('a', { result: 'loss' })] });
    expect(parsed?.value.games).toHaveLength(1);
    expect(parsed?.value.games[0]?.result).toBe('win');
    expect(parsed?.dropped).toBe(1);
  });

  it('is null for a wrong root and for more than MAX_GAMES rows', () => {
    expect(parseGameLog(null)).toBeNull();
    expect(parseGameLog({ games: 'x' })).toBeNull();
    expect(parseGameLog({})).toBeNull();
    expect(parseGameLog({ games: Array.from({ length: MAX_GAMES + 1 }, (_, i) => game(`g${i}`)) })).toBeNull();
    expect(parseGameLog({ games: Array.from({ length: MAX_GAMES }, (_, i) => game(`g${i}`)) })?.dropped).toBe(0);
  });
});

describe('dates', () => {
  it('checks real calendar days', () => {
    expect(isPlayedOn('2026-02-28')).toBe(true);
    expect(isPlayedOn('2028-02-29')).toBe(true);
    expect(isPlayedOn('2026-02-29')).toBe(false);
    expect(isPlayedOn('2026-13-01')).toBe(false);
    expect(isPlayedOn(20261001)).toBe(false);
  });

  it('writes the local day', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('log helpers', () => {
  it('orders by day, then entry time, then id', () => {
    const a = game('a', { playedOn: '2026-10-05' });
    const b = game('b', { playedOn: '2026-10-06' });
    expect([a, b].sort(compareGames).map((g) => g.id)).toEqual(['b', 'a']);
    expect(compareGames(a, a)).toBe(0);
  });

  it('compares rows by every field', () => {
    expect(sameGame(game('a'), game('a'))).toBe(true);
    expect(sameGame(game('a'), game('a', { note: 'x' }))).toBe(false);
    expect(sameGame(game('a'), game('a', { opponentLegends: ['x'] }))).toBe(false);
    expect(sameGame(undefined, undefined)).toBe(true);
    expect(sameGame(game('a'), undefined)).toBe(false);
    expect(sameGameLog({ games: [game('a')] }, { games: [game('a')] })).toBe(true);
    expect(sameGameLog({ games: [game('a')] }, { games: [] })).toBe(false);
  });

  it('measures UTF-8 bytes and both limits', () => {
    const small = { games: [game('a', { note: 'ä' })] };
    expect(gameLogBytes(small)).toBe(new TextEncoder().encode(JSON.stringify(small.games)).length);
    expect(gameLogFits(small)).toBe(true);
    // 999 rows with a 500 character ASCII note fit; the same in 2-byte characters do not.
    const rows = (note: string) => ({ games: Array.from({ length: MAX_GAMES - 1 }, (_, i) => game(`g${i}`, { note })) });
    expect(gameLogFits(rows('a'.repeat(500)))).toBe(true);
    expect(gameLogBytes(rows('ä'.repeat(500)))).toBeGreaterThan(MAX_GAME_LOG_BYTES);
    expect(gameLogFits(rows('ä'.repeat(500)))).toBe(false);
    expect(gameLogFits({ games: Array.from({ length: MAX_GAMES + 1 }, (_, i) => game(`g${i}`)) })).toBe(false);
  });

  it('adds, replaces, and removes by deck', () => {
    const log = { games: [game('a'), game('b', { deckId: 'deck2' })] };
    expect(withGame(log, game('a', { result: 'loss' })).games.find((g) => g.id === 'a')?.result).toBe('loss');
    expect(withGame(log, game('c')).games).toHaveLength(3);
    expect(withoutDeck(log, 'deck2').games.map((g) => g.id)).toEqual(['a']);
    expect(withoutDeck(log, 'nope')).toBe(log);
    expect(withoutOrphans(log, new Set(['deck1'])).games.map((g) => g.id)).toEqual(['a']);
    expect(withoutOrphans(log, new Set(['deck1', 'deck2']))).toBe(log);
  });
});
