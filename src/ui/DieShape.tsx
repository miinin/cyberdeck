/** Outline and facet lines of each Gig die in a 100 x 100 box. The outlines are the real silhouettes of the dice. */
const SHAPES: Record<number, { outline: string; facets: string; textY: number }> = {
  4: { outline: '50,6 95,90 5,90', facets: 'M50 6 L50 90 M5 90 L72 48 M95 90 L28 48', textY: 68 },
  6: { outline: '16,10 84,10 90,16 90,84 84,90 16,90 10,84 10,16', facets: 'M24 24 H76 V76 H24 Z', textY: 52 },
  8: { outline: '50,4 93,50 50,96 7,50', facets: 'M7 50 L93 50 M50 4 L30 50 L50 96 M50 4 L70 50 L50 96', textY: 52 },
  10: { outline: '50,3 94,38 50,97 6,38', facets: 'M6 38 L94 38 M50 3 L30 38 L50 97 M50 3 L70 38 L50 97', textY: 56 },
  12: { outline: '50,4 95,37 78,92 22,92 5,37', facets: 'M50 4 L50 28 M95 37 L72 42 M78 92 L66 68 M22 92 L34 68 M5 37 L28 42 M28 42 L50 28 L72 42 L66 68 L34 68 Z', textY: 58 },
  20: { outline: '50,3 92,27 92,73 50,97 8,73 8,27', facets: 'M50 3 L50 30 M92 27 L68 40 M92 73 L68 60 M50 97 L50 70 M8 73 L32 60 M8 27 L32 40 M32 40 L68 40 L50 70 Z', textY: 56 },
};

/**
 * One Gig die as an SVG: d4 triangle, d6 square, d8 diamond, d10 kite, d12 pentagon and d20 hexagon with the value in
 * the middle. Decorative: the button or text around it names the die and the value.
 */
export function DieShape({ die, value }: { die: number; value: number | null }) {
  const shape = SHAPES[die];
  if (shape === undefined) return null;
  return (
    <svg className="gf-die-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <polygon className="gf-die-body" points={shape.outline} strokeLinejoin="round" />
      <path className="gf-die-facets" d={shape.facets} />
      <text className="gf-die-value" x="50" y={shape.textY} textAnchor="middle" dominantBaseline="central">
        {value ?? '?'}
      </text>
    </svg>
  );
}
