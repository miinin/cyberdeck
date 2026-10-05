import { MAX_COLLECTION_ENTRIES } from './collection';
import type { Collection } from './collection';
import { MAX_SHARE_DATA_LENGTH } from './deckShare';
import { TRADE_HEADER, decodeTradeShare, encodeTradeShare } from './tradeShare';

const col = (...rows: [string, number][]): Collection => ({
  entries: rows.map(([card, count]) => ({ card, count })),
});
const encodeText = (text: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const decodeText = (...lines: string[]) => decodeTradeShare(encodeText([TRADE_HEADER, ...lines].join('\n')));

describe('trade share', () => {
  it('round-trips have and want', () => {
    const have = col(['alpha', 4], ['beta-gamma', 999]);
    const want = col(['delta', 2]);
    const data = encodeTradeShare(have, want);
    expect(data).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeTradeShare(data ?? '')).toEqual({ have, want, dropped: 0 });
  });

  it('round-trips empty lists', () => {
    expect(decodeTradeShare(encodeTradeShare(col(), col()) ?? '')).toEqual({
      have: col(),
      want: col(),
      dropped: 0,
    });
  });

  it('returns null instead of a truncated link when the data is too long', () => {
    const rows = Array.from({ length: 1200 }, (_, i): [string, number] => [`card-number-${i}-aaaaaaaaaaaa`, 3]);
    expect(encodeTradeShare(col(...rows), col())).toBeNull();
  });

  it.each(['', '%%%', 'a b', 'AAAA', encodeText('wrong 1\nh 1 a'), encodeText('cyberdeck-vaihto 2\nh 1 a')])(
    'rejects invalid data "%s"',
    (bad) => {
      expect(decodeTradeShare(bad)).toBeNull();
    },
  );

  it('rejects data over the length limit and invalid UTF-8', () => {
    expect(decodeTradeShare('A'.repeat(MAX_SHARE_DATA_LENGTH + 1))).toBeNull();
    expect(decodeTradeShare('_w')).toBeNull(); // 0xFF is not UTF-8
  });

  it('rejects a link with too many lines', () => {
    const lines = Array.from({ length: 2 * MAX_COLLECTION_ENTRIES + 1 }, () => 'h 1 a');
    expect(decodeText(...lines)).toBeNull();
  });

  it('drops bad lines, duplicates and reserved keys and counts them', () => {
    const result = decodeText(
      'h 2 alpha',
      'h 3 alpha', // duplicate in the same list
      'w 3 alpha', // same key in the other list is fine
      'h 0 beta',
      'h 1000 beta',
      'h 01 beta',
      'h 1 Beta',
      'h 1 __proto__',
      'x 1 beta',
      'h 1 <b>x</b>',
      'h  1 beta',
      '',
      'h 1 ' + 'a'.repeat(101),
    );
    expect(result).toEqual({
      have: col(['alpha', 2]),
      want: col(['alpha', 3]),
      dropped: 11,
    });
  });

  it('ignores a single trailing newline', () => {
    expect(decodeText('h 1 a', '')).toEqual({
      have: col(['a', 1]),
      want: col(),
      dropped: 0,
    });
  });
});
