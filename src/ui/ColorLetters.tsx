/** Card colours as coloured letters ("GGR"), the way the deck colour code is written (T-117, T-122). Decoration plus a spoken list. */
export function ColorLetters({ colours }: { colours: readonly string[] }) {
  return (
    <>
      <span className="visually-hidden">{colours.join(', ')}</span>
      <span className="deck-color-code" aria-hidden="true">
        {colours.map((colour, index) => (
          <span key={index} className={`deck-color-letter is-${colour.toLowerCase()}`}>
            {colour.charAt(0).toUpperCase()}
          </span>
        ))}
      </span>
    </>
  );
}
