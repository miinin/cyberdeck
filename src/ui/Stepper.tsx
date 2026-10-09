import { deckTexts } from './deckTexts';
import { texts } from './texts';

/** − n + for one card. "−" stays focusable at 0 (aria-disabled) so focus is never lost. */
export function Stepper({
  name,
  count,
  onChange,
  addLabel,
  removeLabel,
  countLabel,
  describedBy,
  showCount = true,
  shortcuts = false,
}: {
  name: string;
  count: number;
  onChange: (count: number) => void;
  addLabel?: string;
  removeLabel?: string;
  /** Spoken count, e.g. "Sideboardissa 2"; defaults to the deck wording. */
  countLabel?: string;
  /** Id of a visible text that explains why adding breaks a rule. */
  describedBy?: string;
  /** False when the count is shown elsewhere (deck rows): only the spoken count stays. */
  showCount?: boolean;
  /** True where the surrounding row handles "+" and "-" (T-050b): the buttons say so. */
  shortcuts?: boolean;
}) {
  return (
    <div className="card-row-controls">
      <button
        type="button"
        className="step step--compact step-minus"
        aria-disabled={count === 0 ? 'true' : undefined}
        aria-label={removeLabel ?? deckTexts.removeCard(name)}
        aria-keyshortcuts={shortcuts ? '-' : undefined}
        onClick={() => count > 0 && onChange(count - 1)}
      >
        <span aria-hidden="true">{texts.minusSymbol}</span>
      </button>
      <span className={showCount ? 'deck-card-count' : 'deck-card-count-spoken'}>
        {showCount && <span aria-hidden="true">{count}</span>}
        <span className="visually-hidden">{countLabel ?? deckTexts.inDeck(count)}</span>
      </span>
      <button
        type="button"
        className="step step--compact step-plus"
        aria-label={addLabel ?? deckTexts.addCard(name)}
        aria-describedby={describedBy}
        aria-keyshortcuts={shortcuts ? '+' : undefined}
        onClick={() => onChange(count + 1)}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
