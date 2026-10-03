import type { KeyboardEvent, MouseEvent } from 'react';

/** Buttons and other controls inside a row keep their own click; only the empty part of the row reacts. */
function onControl(event: MouseEvent<HTMLElement>): boolean {
  const target = event.target as Element;
  const control = target.closest('button, a, input, select, textarea, label');
  return control !== null && event.currentTarget.contains(control);
}

/**
 * Mouse and keyboard shortcuts of one search result (T-050b): a click adds (only when `clickAdds`, i.e. a
 * fine pointer), Shift+click and right click remove, "+" or "=" adds and "-" removes while focus is inside.
 * The browser menu is kept when there is nothing to remove.
 */
export function pickGestures(count: number, onChange: (count: number) => void, clickAdds: boolean) {
  const remove = () => {
    if (count > 0) onChange(count - 1);
  };
  return {
    onClick: (event: MouseEvent<HTMLElement>) => {
      if (onControl(event)) return;
      if (event.shiftKey) remove();
      else if (clickAdds) onChange(count + 1);
    },
    onContextMenu: (event: MouseEvent<HTMLElement>) => {
      if (count === 0) return;
      event.preventDefault();
      remove();
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        onChange(count + 1);
      } else if (event.key === '-') {
        event.preventDefault();
        remove();
      }
    },
  };
}
