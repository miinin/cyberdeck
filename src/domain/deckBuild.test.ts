import type { DeckContent } from './deck';
import { SIDEBOARD_SECTION_NAME } from './deck';
import { allMissing, competingPairs, deckMissing, pairMissing, swapPlan } from './deckBuild';

const deck = (name: string, cards: [string, number][], side: [string, number][] = []): DeckContent => ({
  name,
  sections: [
    { name: '', cards: cards.map(([card, count]) => ({ card, count })) },
    ...(side.length > 0
      ? [
          {
            name: SIDEBOARD_SECTION_NAME,
            cards: side.map(([card, count]) => ({ card, count })),
          },
        ]
      : []),
  ],
});
const ownedOf = (map: Record<string, number>) => (card: string) => map[card] ?? 0;
const row = (rows: ReturnType<typeof swapPlan>, card: string) => rows.find((r) => r.card === card);

describe('swapPlan', () => {
  it('keeps shared cards, returns the rest and takes from the binder', () => {
    const rows = swapPlan(
      deck('A', [
        ['x', 3],
        ['y', 2],
      ]),
      deck('B', [
        ['x', 1],
        ['z', 2],
      ]),
      [],
      ownedOf({ x: 3, y: 2, z: 5 }),
    );
    expect(row(rows, 'x')).toMatchObject({
      keep: 1,
      toBinder: 2,
      fromBinder: 0,
      missing: 0,
    });
    expect(row(rows, 'y')).toMatchObject({
      keep: 0,
      toBinder: 2,
      fromBinder: 0,
      missing: 0,
    });
    expect(row(rows, 'z')).toMatchObject({
      keep: 0,
      toBinder: 0,
      fromBinder: 2,
      missing: 0,
    });
  });

  it('takes only free binder copies and names the kept decks that hold the rest', () => {
    const c = deck('C', [['z', 2]]);
    const rows = swapPlan(null, deck('B', [['z', 3]]), [c], ownedOf({ z: 3 }));
    expect(row(rows, 'z')).toMatchObject({
      fromBinder: 1,
      missing: 2,
      inDecks: ['C'],
    });
  });

  it('counts proxies: owning fewer than the deck uses', () => {
    const rows = swapPlan(
      deck('A', [['x', 3]]),
      deck('B', [
        ['x', 3],
        ['y', 1],
      ]),
      [],
      ownedOf({ x: 1 }),
    );
    expect(row(rows, 'x')).toMatchObject({
      keep: 3,
      toBinder: 0,
      fromBinder: 0,
      missing: 0,
    });
    expect(row(rows, 'y')).toMatchObject({ missing: 1, inDecks: [] });
  });

  it('includes the sideboard and skips unknown cards', () => {
    const rows = swapPlan(
      null,
      deck(
        'B',
        [['x', 1]],
        [
          ['s', 2],
          ['gone', 1],
        ],
      ),
      [],
      ownedOf({ x: 1, s: 1, gone: 1 }),
      (k) => k !== 'gone',
    );
    expect(row(rows, 's')).toMatchObject({ fromBinder: 1, missing: 1 });
    expect(row(rows, 'gone')).toBeUndefined();
  });

  it('handles empty decks', () => {
    expect(swapPlan(null, deck('B', []), [], ownedOf({}))).toEqual([]);
    const rows = swapPlan(deck('A', [['x', 2]]), deck('B', []), [], ownedOf({ x: 2 }));
    expect(rows).toEqual([
      {
        card: 'x',
        keep: 0,
        toBinder: 2,
        fromBinder: 0,
        missing: 0,
        inDecks: [],
      },
    ]);
  });
});

describe('pairs and all decks', () => {
  const a = deck('A', [
    ['x', 3],
    ['y', 1],
  ]);
  const b = deck('B', [['x', 2]]);
  const c = deck('C', [['q', 1]]);
  const owned = ownedOf({ x: 4, y: 1, q: 1 });

  it('counts own and shared shortages', () => {
    expect(deckMissing(a, owned)).toBe(0);
    expect(pairMissing(a, b, owned)).toBe(1);
    expect(pairMissing(a, c, owned)).toBe(0);
  });

  it('lists only pairs that compete', () => {
    const pairs = competingPairs([a, b, c], owned);
    expect(pairs.map((p) => [p.first.name, p.second.name, p.together, p.extra])).toEqual([['A', 'B', 1, 1]]);
  });

  it('lists what is lacking when everything is built', () => {
    expect(allMissing([a, b, c], owned)).toEqual([{ card: 'x', missing: 1, need: 5, owned: 4 }]);
    expect(allMissing([a], owned)).toEqual([]);
  });
});
