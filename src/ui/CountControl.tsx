import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { playsetSize } from '../domain/card';
import type { Card } from '../domain/card';
import { MAX_COLLECTION_COUNT } from '../domain/collection';
import { CardName } from './CardName';
import { proxyTexts } from './proxyTexts';
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
  /** 'want' = the want list (T-064b), 'have' = the own Have list (T-143), 'proxy' = the print queue (T-102): their own spoken texts and no playset mark. Default: the collection. */
  kind?: 'owned' | 'want' | 'have' | 'version' | 'proxy';
  /** The count cannot go below this (D-020: the sum of the versions). Default 0. */
  min?: number;
  /** Names the control for screen readers instead of the card name (a version row). */
  label?: ReactNode;
}

/** The count with its spoken equivalents and the playset mark (✓). */
function CountValue({ card, count, kind }: { card: Card; count: number; kind: 'owned' | 'want' | 'have' | 'version' | 'proxy' }) {
  const want = kind === 'want';
  const have = kind === 'have';
  const proxy = kind === 'proxy';
  return (
    <span className="count">
      {/* A want counter is marked with a star as well as its color (T-142): it never looks like the collection one. */}
      {(want || have) && (
        <span className="count-want-mark" aria-hidden="true">
          {want ? '★' : '⇄'}
        </span>
      )}
      {count > 0 ? (
        <>
          <span className="visually-hidden">{proxy ? proxyTexts.countPrefix : want ? texts.wantPrefix : have ? texts.havePrefix : texts.countPrefix}</span>
          {count}
          <span className="visually-hidden">{copiesSuffix(count)}</span>
        </>
      ) : (
        <>
          <span aria-hidden="true">0</span>
          <span className="visually-hidden">{proxy ? proxyTexts.notQueued : want ? texts.notWanted : have ? texts.notInHave : texts.notOwned}</span>
        </>
      )}
      {kind === 'owned' && count >= playsetSize(card) && (
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
export function CountControl({ card, count, mode, onChange, onLimit, editable = true, kind = 'owned', min = 0, label }: CountControlProps) {
  const plusRef = useRef<HTMLButtonElement>(null);
  const minusRef = useRef<HTMLButtonElement>(null);
  /** Which button of this row had focus last. */
  const lastFocused = useRef<'minus' | 'plus' | null>(null);

  // "−" became disabled while focused (another tab, or a rollback): keep focus in the row (UX.md 6.9).
  useLayoutEffect(() => {
    if (count > min || lastFocused.current !== 'minus') return;
    lastFocused.current = null;
    const active = document.activeElement;
    if (active === null || active === document.body || active === minusRef.current) plusRef.current?.focus();
  }, [count, min]);

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

  if (!editable && (kind === 'want' || kind === 'have') && count === 0) return null;
  const kindClass = kind === 'want' ? ' count-control--want' : kind === 'have' ? ' count-control--have' : '';

  if (!editable) {
    return (
      <div className={`count-control count-control--readonly${kindClass}`}>
        <CountValue card={card} count={count} kind={kind} />
      </div>
    );
  }

  const atMax = count >= MAX_COLLECTION_COUNT;

  const decrease = () => {
    if (count - 1 <= min) {
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
    <div className={`count-control${kindClass}`}>
      <button
        type="button"
        ref={minusRef}
        className="step step-minus"
        disabled={count <= min}
        onFocus={() => (lastFocused.current = 'minus')}
        onClick={decrease}
      >
        <span className="visually-hidden">
          {kind === 'proxy' ? proxyTexts.decreaseOne : kind === 'want' ? texts.decreaseWant : kind === 'have' ? texts.decreaseHave : texts.decreaseOne}
          {label ?? <CardName card={card} />}
        </span>
        <span aria-hidden="true">{texts.minusSymbol}</span>
      </button>
      <CountValue card={card} count={count} kind={kind} />
      <button
        ref={plusRef}
        type="button"
        className="step step-plus"
        aria-disabled={atMax ? 'true' : undefined}
        onFocus={() => (lastFocused.current = 'plus')}
        onClick={increase}
      >
        <span className="visually-hidden">
          {kind === 'proxy' ? proxyTexts.increaseOne : kind === 'want' ? texts.increaseWant : kind === 'have' ? texts.increaseHave : texts.increaseOne}
          {label ?? <CardName card={card} />}
        </span>
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
