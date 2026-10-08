/** One arrow shape for the whole app (T-118, UX-118-39): a 2 px stroke chevron, drawn with the text colour. */
export function Chevron({
  direction,
  size = 14,
  className,
}: {
  direction: 'left' | 'right' | 'down';
  size?: number;
  className?: string;
}) {
  const path = direction === 'left' ? 'M8 2L4 6l4 4' : direction === 'right' ? 'M4 2l4 4-4 4' : 'M2 4l4 4 4-4';
  return (
    <svg className={className} viewBox="0 0 12 12" width={size} height={size} aria-hidden="true" focusable="false">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
