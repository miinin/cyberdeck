import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { texts } from './texts';

/**
 * A small (i) button that opens a help text as a popover (T-116): tap or Enter toggles it, Esc or a tap elsewhere
 * closes it, and on a desktop it also shows while the pointer rests on the button. The popover is placed against the
 * nearest `.has-info-tip` ancestor, so it never runs off a narrow screen.
 */
export function InfoTip({ children, label = texts.infoTipLabel }: { children: ReactNode; label?: string }) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const open = pinned || hovered;

  useEffect(() => {
    if (!pinned) return;
    const away = (event: Event) => {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      setPinned(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [pinned]);

  return (
    <span
      ref={rootRef}
      className="info-tip"
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !open) return;
        event.stopPropagation();
        setPinned(false);
        setHovered(false);
        buttonRef.current?.focus();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="info-tip-button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setPinned((on) => !on)}
        onPointerEnter={(event) => event.pointerType === 'mouse' && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <span aria-hidden="true">i</span>
      </button>
      <span id={id} role="note" className="info-tip-pop" hidden={!open}>
        {children}
      </span>
    </span>
  );
}
