import type { ReactNode } from 'react';
import { officialRarity } from '../domain/cardSearch';
import { texts } from './texts';

/** The seven official rarity symbols (T-079), drawn after the rarity system picture. */
const WIDE = '0 0 32 24';

const up = (y: number) => `M4 ${y}l8-8.5 8 8.5h-4l-4-4.5-4 4.5z`;
const down = (y: number) => `M4 ${y}l8 8.5 8-8.5h-4l-4 4.5-4-4.5z`;

/** Nova: a square frame of slanted warning stripes around a small square. */
const NOVA_STRIPES = [
  ...[2, 8, 14].flatMap((x) => [`M${x + 2} 2h4l-2 4h-4z`, `M${x + 2} 18h4l-2 4h-4z`]),
  ...[8, 14].flatMap((y) => [`M4 ${y}h4l-2 4H2z`, `M20 ${y}h4l-2 4h-4z`]),
  'M10 10h4v4h-4z',
].join('');

const SYMBOLS: Record<string, { viewBox: string; width: number; path: string; evenodd?: boolean }> = {
  Common: { viewBox: '0 0 24 24', width: 24, path: down(7.5) },
  Uncommon: { viewBox: '0 0 24 24', width: 24, path: up(16.5) },
  Rare: { viewBox: '0 0 24 24', width: 24, path: up(10) + down(14) },
  'Epic Rare': { viewBox: '0 0 24 24', width: 24, path: up(9.5) + down(14.5) + 'M12 9.5l2.5 2.5-2.5 2.5-2.5-2.5z' },
  'Secret Rare': {
    viewBox: WIDE,
    width: 32,
    evenodd: true,
    path: 'M10 3L1 12l9 9h4L5 12l9-9zM22 3l9 9-9 9h-4l9-9-9-9zM16 6l6 6-6 6-6-6zM16 9l3 3-3 3-3-3z',
  },
  'Iconic Rare': {
    viewBox: '0 0 24 24',
    width: 24,
    evenodd: true,
    path:
      'M12 .5l3 4H9zM12 23.5l3-4H9zM3 6h4v2H5v8h2v2H3zM21 6h-4v2h2v8h-2v2h4zM12 8l4 4-4 4-4-4zM12 10.5l1.5 1.5-1.5 1.5-1.5-1.5z',
  },
  'Nova Rare': { viewBox: '0 0 24 24', width: 24, path: NOVA_STRIPES },
};

export const RARITY_KEYS = Object.keys(SYMBOLS);

/** Name plus a short explanation, used as the tooltip. */
export function rarityTitle(rarity: string): string {
  const hint = texts.rarityHints[rarity];
  return hint === undefined ? rarity : `${rarity} – ${hint}`;
}

/**
 * A rarity symbol. `showName`: the name is shown beside it (the symbol is then decoration);
 * otherwise the symbol is alone and carries the name as visually hidden text. `size` is the height in px.
 * An unknown rarity falls back to its plain name.
 */
export function RaritySymbol({
  rarity,
  showName = false,
  size = 16,
}: {
  rarity: string;
  showName?: boolean;
  size?: number;
}): ReactNode {
  const name = officialRarity(rarity);
  const symbol = SYMBOLS[name];
  if (symbol === undefined) return <span lang="en">{name}</span>;
  return (
    <span className="rarity-symbol" title={rarityTitle(name)}>
      <svg
        viewBox={symbol.viewBox}
        width={Math.round((size * symbol.width) / 24)}
        height={size}
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path d={symbol.path} fillRule={symbol.evenodd ? 'evenodd' : undefined} />
      </svg>
      <span lang="en" className={showName ? 'rarity-name' : 'visually-hidden'}>
        {name}
      </span>
    </span>
  );
}
