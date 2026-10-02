import { useLayoutEffect, useRef } from 'react';
import { playsetSize } from '../domain/card';
import type { Card } from '../domain/card';
import { MAX_COLLECTION_COUNT } from '../domain/collection';
import { CardName } from './CardName';
import { copiesSuffix, texts } from './texts';

export type CountControlMode = 'loading' | 'ready' | 'locked';

export interface CountControlProps {
  card: Card;
  /** The count on screen: the newest target, or the saved count. */
  count: number;
  mode: CountControlMode;
  onChange: (card: Card, count: number) => void;
  /** "+" pressed at the maximum count. */
  onLimit: (card: Card) => void;
  /** false = browsing: only the count and its state are shown, no buttons (T-040). */
  editable?: boolean;
}

/** The count with its spoken equivalents and the playset mark (✓). */
function CountValue({ card, count }: { card: Card; count: number }) {
  return (
    <span className="count">
      {count > 0 ? (
        <>
          <span className="visually-hidden">{texts.countPrefix}</span>
          {count}
          <span className="visually-hidden">{copiesSuffix(count)}</span>
        </>
      ) : (
        <>
          <span aria-hidden="true">0</span>
          <span className="visually-hidden">{texts.notOwned}</span>
        </>
      )}
      {count >= playsetSize(card) && (
        <>
          <span aria-hidden="true" className="playset-mark">
            {' ✓'}
          </span>
          <span className="visually-hidden">. {texts.playsetFull}</span>
        </>
      )}
    </span>
  );
}

/**
 * "[−] n [+]" for one card row (UX.md 6.4). "+" is always the last child and keeps its position
 * in the children list, so React keeps the same element (and focus) when "−" appears or goes.
 */
export function CountControl({ card, count, mode, onChange, onLimit, editable = true }: CountControlProps) {
  const plusRef = useRef<HTMLButtonElement>(null);
  const minusRef = useRef<HTMLButtonElement>(null);
  /** Which button of this row had focus last. */
  const lastFocused = useRef<'minus' | 'plus' | null>(null);

  // "−" became disabled while focused (another tab, or a rollback): keep focus in the row (UX.md 6.9).
  useLayoutEffect(() => {
    if (count !== 0 || lastFocused.current !== 'minus') return;
    lastFocused.current = null;
    const active = document.activeElement;
    if (active === null || active === document.body || active === minusRef.current) plusRef.current?.focus();
  }, [count]);

  if (mode === 'loading') {
    return (
      <div className="count-control">
        <span className="visually-hidden">{texts.countLoading}</span>
      </div>
    );
  }
  if (mode === 'locked') {
    return (
      <div className="count-control">
        <span aria-hidden="true">{texts.missingValue}</span>
        <span className="visually-hidden">{texts.notEditable}</span>
      </div>
    );
  }

  if (!editable) {
    return (
      <div className="count-control count-control--readonly">
        <CountValue card={card} count={count} />
      </div>
    );
  }

  const atMax = count >= MAX_COLLECTION_COUNT;

  const decrease = () => {
    if (count === 1) {
      // Move focus before "−" is removed (UX.md 6.4.2).
      lastFocused.current = 'plus';
      plusRef.current?.focus();
    }
    onChange(card, count - 1);
  };

  const increase = () => {
    if (atMax) onLimit(card);
    else onChange(card, count + 1);
  };

  return (
    <div className="count-control">
      <button
        type="button"
        ref={minusRef}
        className="step step-minus"
        disabled={count === 0}
        onFocus={() => (lastFocused.current = 'minus')}
        onClick={decrease}
      >
        <span className="visually-hidden">
          {texts.decreaseOne}
          <CardName card={card} />
        </span>
        <span aria-hidden="true">{texts.minusSymbol}</span>
      </button>
      <CountValue card={card} count={count} />
      <button
        ref={plusRef}
        type="button"
        className="step step-plus"
        aria-disabled={atMax ? 'true' : undefined}
        onFocus={() => (lastFocused.current = 'plus')}
        onClick={increase}
      >
        <span className="visually-hidden">
          {texts.increaseOne}
          <CardName card={card} />
        </span>
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
