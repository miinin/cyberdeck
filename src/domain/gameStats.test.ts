import { byColour, byEvent, byOpponent, legendsAgainst, recentTexts, recordText, tally, textKey, turnRates } from './gameStats';
import type { LegendInfo } from './gameStats';
import type { GameRecord } from './games';

let counter = 0;
function game(patch: Partial<GameRecord> = {}): GameRecord {
  counter += 1;
  return {
    id: `g${counter}`,
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

const LEGENDS: Record<string, { name: string; colour: string | null }> = {
  'v-streetkid': { name: 'V — Streetkid', colour: 'Red' },
  'jackie-welles': { name: 'Jackie Welles', colour: 'Green' },
  'rogue-queen': { name: 'Rogue', colour: 'Blue' },
  'colourless-one': { name: 'Colourless', colour: null },
};
const info: LegendInfo = (key) => LEGENDS[key] ?? null;

describe('tally', () => {
  it('counts the results and the win percent as a whole number', () => {
    const t = tally([game(), game(), game({ result: 'loss' }), game({ result: 'draw' })]);
    expect(t).toEqual({ games: 4, wins: 2, losses: 1, draws: 1, winRate: 50 });
    expect(tally([game(), game({ result: 'loss' }), game({ result: 'loss' })]).winRate).toBe(33);
    expect(tally([game(), game(), game({ result: 'loss' })]).winRate).toBe(67);
  });

  it('has no win percent without games', () => {
    expect(tally([])).toEqual({ games: 0, wins: 0, losses: 0, draws: 0, winRate: null });
  });
});

describe('turnRates', () => {
  it('is not recorded without any turn', () => {
    expect(turnRates([game(), game()])).toEqual({ first: null, second: null, recorded: false });
  });

  it('gives the win percent per turn, and null for a turn never played', () => {
    const games = [
      game({ turn: 'first' }),
      game({ turn: 'first', result: 'loss' }),
      game({ turn: 'first' }),
      game({ turn: 'first' }),
      game(),
    ];
    expect(turnRates(games)).toEqual({ first: 75, second: null, recorded: true });
    expect(turnRates([...games, game({ turn: 'second', result: 'loss' })]).second).toBe(0);
  });
});

describe('byOpponent', () => {
  it('groups names without regard to case or repeated spaces and shows the newest spelling', () => {
    const rows = byOpponent(
      [game({ opponentName: 'Blue  Aggro' }), game({ opponentName: 'blue aggro', result: 'loss' }), game({ opponentName: ' BLUE AGGRO ' })],
      info,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: 'name', label: 'Blue  Aggro', games: 3, wins: 2, losses: 1, winRate: 67 });
  });

  it('falls back to the Legend names, alphabetically, then to unknown', () => {
    const rows = byOpponent(
      [
        game({ opponentLegends: ['v-streetkid', 'jackie-welles'] }),
        game({ opponentLegends: ['jackie-welles', 'v-streetkid'], result: 'loss' }),
        game(),
        game({ opponentLegends: ['not-a-card'] }),
      ],
      info,
    );
    expect(rows.map((row) => [row.kind, row.label, row.games])).toEqual([
      ['legends', 'Jackie Welles, V — Streetkid', 2],
      ['unknown', null, 2],
    ]);
  });

  it('prefers the name over the Legends', () => {
    const rows = byOpponent([game({ opponentName: 'Sam', opponentLegends: ['v-streetkid'] })], info);
    expect(rows.map((row) => row.label)).toEqual(['Sam']);
  });

  it('orders by games, then by label', () => {
    const rows = byOpponent(
      [game({ opponentName: 'B' }), game({ opponentName: 'A' }), game({ opponentName: 'C' }), game({ opponentName: 'C' })],
      info,
    );
    expect(rows.map((row) => row.label)).toEqual(['C', 'A', 'B']);
  });

  it('groups opponents named __proto__, constructor and toString as ordinary names (SR-46)', () => {
    const rows = byOpponent(
      ['__proto__', 'constructor', 'toString', '__proto__'].map((opponentName) => game({ opponentName })),
      info,
    );
    expect(rows.map((row) => [row.label, row.games])).toEqual([
      ['__proto__', 2],
      ['constructor', 1],
      ['toString', 1],
    ]);
    expect(({} as Record<string, unknown>).games).toBeUndefined();
  });
});

describe('byColour', () => {
  it('groups by the set of Legend colours and skips games without coloured Legends', () => {
    const rows = byColour(
      [
        game({ opponentLegends: ['jackie-welles', 'v-streetkid'] }),
        game({ opponentLegends: ['v-streetkid', 'jackie-welles', 'rogue-queen'], result: 'loss' }),
        game({ opponentLegends: ['v-streetkid'] }),
        game({ opponentLegends: ['v-streetkid'], result: 'loss' }),
        game({ opponentLegends: ['v-streetkid'], result: 'loss' }),
        game({ opponentLegends: ['colourless-one'] }),
        game({ opponentLegends: ['not-a-card'] }),
        game(),
      ],
      info,
    );
    expect(rows.map((row) => [row.colours, row.games, row.winRate])).toEqual([
      [['Red'], 3, 33],
      [['Red', 'Green'], 1, 100],
      [['Red', 'Green', 'Blue'], 1, 0],
    ]);
  });
});

describe('byEvent', () => {
  it('lists only games with an event, grouped like the opponents', () => {
    const rows = byEvent([game({ event: 'Store Cup' }), game({ event: 'store  cup', result: 'loss' }), game(), game({ event: 'Home' })]);
    expect(rows.map((row) => [row.label, row.games, row.winRate])).toEqual([
      ['Store Cup', 2, 50],
      ['Home', 1, 100],
    ]);
    expect(byEvent([game()])).toEqual([]);
  });
});

describe('suggestions', () => {
  it('lists distinct texts newest first, at most the limit', () => {
    const games = [game({ opponentName: 'Sam' }), game({ opponentName: 'sam' }), game({ opponentName: null }), game({ opponentName: 'Alex' })];
    expect(recentTexts(games, (g) => g.opponentName)).toEqual(['Sam', 'Alex']);
    const many = Array.from({ length: 80 }, (_, i) => game({ opponentName: `Opponent ${i}` }));
    expect(recentTexts(many, (g) => g.opponentName)).toHaveLength(50);
    expect(recentTexts(many, (g) => g.opponentName, 3)).toEqual(['Opponent 0', 'Opponent 1', 'Opponent 2']);
  });

  it('finds the Legends of the newest game against the same name', () => {
    const games = [
      game({ opponentName: 'Sam' }),
      game({ opponentName: 'sam', opponentLegends: ['v-streetkid'] }),
      game({ opponentName: 'SAM', opponentLegends: ['rogue-queen'] }),
    ];
    expect(legendsAgainst(games, ' SAM ')).toEqual(['v-streetkid']);
    expect(legendsAgainst(games, 'Alex')).toEqual([]);
    expect(legendsAgainst(games, '   ')).toEqual([]);
  });

  it('compares texts in one form', () => {
    expect(textKey('  Blue \n Aggro ')).toBe('blue aggro');
  });
});

describe('recordText', () => {
  it('writes wins, losses and draws', () => {
    expect(recordText(tally([game(), game(), game({ result: 'loss' }), game({ result: 'draw' })]))).toBe('2–1–1');
  });
});
