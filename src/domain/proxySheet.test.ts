import type { Card } from './card';
import type { Printing } from './printing';
import {
  addToQueue,
  CARD_HEIGHT_MM,
  CARD_WIDTH_MM,
  gridOrigin,
  layoutSheets,
  MAX_PROXY_CARDS,
  parseProxyQueue,
  queueCopies,
  queueTotal,
  sheetCount,
} from './proxySheet';

function printing(setCode: string, number: string, rarity: string): Printing {
  return { key: `${setCode}:${number}`, setCode, setName: 'Retail Starter', number, rarity, language: 'en', artist: null, imageKey: `x__${setCode}-${number}` };
}

const PLAIN: Card = { id: '1', slug: 'detonate', name: 'Detonate', subname: null, displayName: 'Detonate', type: 'Program', color: 'Red', cost: 1, power: null, ram: null, rarity: 'Common', key: 'detonate' };
const WITH_ARTS: Card = {
  ...PLAIN,
  id: '2',
  slug: 'chrome-fang',
  name: 'Chrome Fang',
  displayName: 'Chrome Fang',
  key: 'chrome-fang',
  printings: [printing('retail', '001', 'Common'), printing('nova', '002', 'Nova Rare')],
};
const BY_KEY = new Map([PLAIN, WITH_ARTS].map((card) => [card.key, card]));
const NO_ART = () => null;

describe('gridOrigin', () => {
  it('centres the 3 x 3 grid on the A4 sheet', () => {
    expect(gridOrigin(0)).toEqual({ xMm: 10.5, yMm: 16.5 });
    expect(gridOrigin(2)).toEqual({ xMm: 8.5, yMm: 14.5 });
  });
});

describe('layoutSheets', () => {
  const cards = (n: number) => Array.from({ length: n }, (_, i) => i);

  it('places nine cards per sheet, row by row, 63 x 88 mm apart without a gap', () => {
    const [sheet] = layoutSheets(cards(9), { gapMm: 0, cutMarks: false });
    expect(sheet?.cards).toHaveLength(9);
    expect(sheet?.cards[0]).toEqual({ card: 0, xMm: 10.5, yMm: 16.5 });
    expect(sheet?.cards[1]).toEqual({ card: 1, xMm: 10.5 + CARD_WIDTH_MM, yMm: 16.5 });
    expect(sheet?.cards[3]).toEqual({ card: 3, xMm: 10.5, yMm: 16.5 + CARD_HEIGHT_MM });
    expect(sheet?.cards[8]).toEqual({ card: 8, xMm: 10.5 + 2 * CARD_WIDTH_MM, yMm: 16.5 + 2 * CARD_HEIGHT_MM });
  });

  it('adds the gap between cards and keeps the grid on the sheet', () => {
    const [sheet] = layoutSheets(cards(9), { gapMm: 2, cutMarks: false });
    expect(sheet?.cards[1]?.xMm).toBe(8.5 + CARD_WIDTH_MM + 2);
    for (const placed of sheet?.cards ?? []) {
      expect(placed.xMm).toBeGreaterThanOrEqual(8);
      expect(placed.xMm + CARD_WIDTH_MM).toBeLessThanOrEqual(210 - 8);
      expect(placed.yMm + CARD_HEIGHT_MM).toBeLessThanOrEqual(297 - 14);
    }
  });

  it('starts a new sheet after nine cards and counts the sheets', () => {
    expect(layoutSheets(cards(10)).map((sheet) => sheet.cards.length)).toEqual([9, 1]);
    expect(layoutSheets(cards(0))).toEqual([]);
    expect(sheetCount(0)).toBe(0);
    expect(sheetCount(9)).toBe(1);
    expect(sheetCount(10)).toBe(2);
    expect(sheetCount(27)).toBe(3);
  });

  it('leaves out cards over the limit', () => {
    const sheets = layoutSheets(cards(MAX_PROXY_CARDS + 50));
    expect(sheets.reduce((sum, sheet) => sum + sheet.cards.length, 0)).toBe(MAX_PROXY_CARDS);
    expect(sheetCount(MAX_PROXY_CARDS + 50)).toBe(Math.ceil(MAX_PROXY_CARDS / 9));
  });

  it('draws no cut marks when they are off', () => {
    expect(layoutSheets(cards(9), { gapMm: 0, cutMarks: false })[0]?.marks).toEqual([]);
  });

  it('draws cut marks outside the cards only, around the used part of the grid', () => {
    const [full] = layoutSheets(cards(9), { gapMm: 1, cutMarks: true });
    // 3 columns x 2 edges x 2 ends + 3 rows x 2 edges x 2 ends
    expect(full?.marks).toHaveLength(24);
    const { xMm, yMm } = gridOrigin(1);
    const gridRight = xMm + 3 * CARD_WIDTH_MM + 2;
    const gridBottom = yMm + 3 * CARD_HEIGHT_MM + 2;
    for (const mark of full?.marks ?? []) {
      const vertical = mark.x1 === mark.x2;
      const inside = vertical
        ? mark.y2 > yMm && mark.y1 < gridBottom
        : mark.x2 > xMm && mark.x1 < gridRight;
      expect(inside).toBe(false);
      for (const value of [mark.x1, mark.x2]) expect(value).toBeGreaterThan(4);
      for (const value of [mark.y1, mark.y2]) expect(value).toBeLessThan(297 - 4);
    }
    const [partial] = layoutSheets(cards(2), { gapMm: 0, cutMarks: true });
    // 2 columns, 1 row
    expect(partial?.marks).toHaveLength(2 * 2 * 2 + 1 * 2 * 2);
  });
});

describe('queueCopies', () => {
  it('prints a plain card as its own picture', () => {
    const copies = queueCopies({ entries: [{ card: 'detonate', count: 2 }] }, BY_KEY, NO_ART);
    expect(copies).toEqual([
      { key: 'detonate', name: 'Detonate', artUrl: null },
      { key: 'detonate', name: 'Detonate', artUrl: null },
    ]);
  });

  it('gives copies of a special art that art picture, the rest the card own', () => {
    const queue = { entries: [{ card: 'chrome-fang', count: 3, versions: { 'nova:002': 1 } }] };
    const copies = queueCopies(queue, BY_KEY, (_key, rarity) => (rarity === 'Nova Rare' ? '/nova.webp' : null));
    expect(copies.map((copy) => copy.artUrl).sort()).toEqual(['/nova.webp', null, null]);
  });

  it('treats a special rarity without a picture as the base art', () => {
    const queue = { entries: [{ card: 'chrome-fang', count: 2, versions: { 'nova:002': 1 } }] };
    expect(queueCopies(queue, BY_KEY, NO_ART).map((copy) => copy.artUrl)).toEqual([null, null]);
  });

  it('skips cards the data does not know', () => {
    expect(queueCopies({ entries: [{ card: 'unknown-card', count: 3 }] }, BY_KEY, NO_ART)).toEqual([]);
  });
});

describe('queue limits (SEC-102-1)', () => {
  it('stops expanding at the copy limit', () => {
    const queue = { entries: [{ card: 'detonate', count: 999 }] };
    expect(queueCopies(queue, BY_KEY, NO_ART)).toHaveLength(MAX_PROXY_CARDS);
  });

  it('drops stored rows over the limit', () => {
    const raw = { entries: [{ card: 'alpha', count: 150 }, { card: 'beta', count: 60 }, { card: 'delta', count: 500 }, { card: 'gamma', count: 50 }] };
    const parsed = parseProxyQueue(raw);
    expect(parsed?.value.entries).toEqual([{ card: 'alpha', count: 150 }, { card: 'gamma', count: 50 }]);
    expect(parsed?.dropped).toBe(2);
    expect(parseProxyQueue('x')).toBeNull();
  });
});

describe('addToQueue', () => {
  it('adds to the count of a card and keeps the order by key', () => {
    const first = addToQueue({ entries: [] }, [{ card: 'detonate', count: 2 }]);
    expect(first).toMatchObject({ added: 2, skipped: 0, queue: { entries: [{ card: 'detonate', count: 2 }] } });
    const second = addToQueue(first.queue, [
      { card: 'detonate', count: 1 },
      { card: 'chrome-fang', count: 4 },
    ]);
    expect(second.queue.entries).toEqual([
      { card: 'chrome-fang', count: 4 },
      { card: 'detonate', count: 3 },
    ]);
    expect(queueTotal(second.queue)).toBe(7);
  });

  it('ignores invalid rows', () => {
    const result = addToQueue({ entries: [] }, [
      { card: '__proto__', count: 1 },
      { card: 'Bad Key', count: 1 },
      { card: 'detonate', count: 0 },
      { card: 'detonate', count: 1.5 },
    ]);
    expect(result.added).toBe(0);
    expect(result.queue.entries).toEqual([]);
  });

  it('stops at the copy limit and counts what was left out', () => {
    const full = addToQueue({ entries: [] }, [{ card: 'detonate', count: MAX_PROXY_CARDS - 1 }]);
    expect(full.added).toBe(MAX_PROXY_CARDS - 1);
    const more = addToQueue(full.queue, [
      { card: 'chrome-fang', count: 5 },
      { card: 'detonate', count: 1 },
    ]);
    expect(more.added).toBe(1);
    expect(more.skipped).toBe(5);
    expect(queueTotal(more.queue)).toBe(MAX_PROXY_CARDS);
  });

  it('returns the same queue when nothing was added', () => {
    const queue = { entries: [{ card: 'detonate', count: 1 }] };
    expect(addToQueue(queue, []).queue).toBe(queue);
  });
});
