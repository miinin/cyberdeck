import { useId } from 'react';
import type { ReactNode } from 'react';
import { officialRarity } from '../domain/cardSearch';
import { texts } from './texts';

/**
 * The seven official rarity symbols (T-079, redrawn in T-082 from the official rarity system picture).
 * Chevron arms are parallel bands with flat cut ends; the shapes keep the picture's proportions.
 */
type Point = readonly [number, number];
const poly = (points: readonly Point[]) => 'M' + points.map(([x, y]) => `${x} ${y}`).join('L') + 'Z';
const flipY = (points: readonly Point[]) => points.map(([x, y]) => [x, 24 - y] as const);
const flipX = (points: readonly Point[], width: number) => points.map(([x, y]) => [width - x, y] as const);
const shiftX = (points: readonly Point[], dx: number) => points.map(([x, y]) => [x + dx, y] as const);

const COMMON: Point[] = [[2.5, 7], [7, 7], [12, 12], [17, 7], [21.5, 7], [12, 16.5]];
const RARE_TOP: Point[] = [[12, 1.5], [21.5, 11], [17, 11], [12, 6], [7, 11], [2.5, 11]];
const EPIC_TOP: Point[] = [[12, 2.5], [20.5, 11], [16.2, 11], [12, 6.8], [7.8, 11], [3.5, 11]];
const EPIC_GEM: Point[] = [[12, 9], [15, 12], [12, 15], [9, 12]];
const EPIC = [EPIC_TOP, flipY(EPIC_TOP), EPIC_GEM];
const WING: Point[] = [[2, 12], [7.2, 3.6], [7.2, 8.2], [4.8, 12], [7.2, 15.8], [7.2, 20.4]];
const ICONIC_TOP: Point[] = [[12, 0.8], [13.6, 2.8], [13.6, 5.6], [17.4, 10.8], [14.6, 10.8], [12, 7.24], [9.4, 10.8], [6.6, 10.8], [10.4, 5.6], [10.4, 2.8]];
const ICONIC_BAR: Point[] = [[1.6, 10.8], [7.2, 3.1], [7.2, 7], [4.4, 10.8]];
const ICONIC_GEM: Point[] = [[12, 9.2], [14.8, 12], [12, 14.8], [9.2, 12]];

/** Nova: 45° warning stripes clipped to a square frame, around a small square. */
const NOVA_RING = 'M1 1H23V23H1ZM6 6V18H18V6Z';
// Five bands x + y = c, symmetric about the centre (c = 24): corner triangles plus two wide pieces per side.
const NOVA_STRIPES = [0, 1, 2, 3, 4]
  .map((k) => 4.25 + k * 9.875)
  .map((c) => poly([[c - 2.8 + 2, -2], [c + 2.8 + 2, -2], [-2, c + 2.8 + 2], [-2, c - 2.8 + 2]]))
  .join('');
const NOVA_CORE = 'M9.2 9.2h5.6v5.6h-5.6Z';

const paths = (...shapes: (readonly Point[])[]) => shapes.map(poly).join('');

interface SymbolShape {
  viewBox: string;
  width: number;
  path: string;
  /** Stripes drawn through this evenodd clip (Nova). */
  clip?: { ring: string; stripes: string };
}

const SYMBOLS: Record<string, SymbolShape> = {
  Common: { viewBox: '0 0 24 24', width: 24, path: paths(COMMON) },
  Uncommon: { viewBox: '0 0 24 24', width: 24, path: paths(flipY(COMMON)) },
  Rare: { viewBox: '0 0 24 24', width: 24, path: paths(RARE_TOP, flipY(RARE_TOP)) },
  'Epic Rare': { viewBox: '0 0 24 24', width: 24, path: paths(...EPIC) },
  'Secret Rare': {
    viewBox: '0 0 32 24',
    width: 32,
    path: paths(...EPIC.map((shape) => shiftX(shape, 4)), WING, flipX(WING, 32)),
  },
  'Iconic Rare': {
    viewBox: '0 0 24 24',
    width: 24,
    path: paths(
      ICONIC_TOP,
      flipY(ICONIC_TOP),
      ICONIC_GEM,
      ICONIC_BAR,
      flipX(ICONIC_BAR, 24),
      flipY(ICONIC_BAR),
      flipY(flipX(ICONIC_BAR, 24)),
    ),
  },
  'Nova Rare': { viewBox: '0 0 24 24', width: 24, path: NOVA_CORE, clip: { ring: NOVA_RING, stripes: NOVA_STRIPES } },
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
  const clipId = useId();
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
        {symbol.clip !== undefined && (
          <>
            <clipPath id={clipId}>
              <path d={symbol.clip.ring} clipRule="evenodd" />
            </clipPath>
            <path d={symbol.clip.stripes} clipPath={`url(#${clipId})`} />
          </>
        )}
        <path d={symbol.path} />
      </svg>
      <span lang="en" className={showName ? 'rarity-name' : 'visually-hidden'}>
        {name}
      </span>
    </span>
  );
}
