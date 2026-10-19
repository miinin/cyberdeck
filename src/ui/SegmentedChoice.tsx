import type { ReactNode, Ref } from 'react';

/**
 * One single-choice control for the whole app (T-118, UX-118-06): a radio group drawn as a `.segmented` bar.
 * The native radios stay for keyboard and screen readers; the selected option is filled with the accent.
 * The legend is visually hidden unless `legendVisible` is set.
 */
export function SegmentedChoice<T extends string | number>({
  legend,
  name,
  value,
  options,
  onChange,
  className,
  legendVisible = false,
  fill = false,
  size = 'md',
  describedBy,
  inputRef,
  children,
  disabled,
}: {
  legend: string;
  name: string;
  value: T;
  options: readonly (readonly [T, ReactNode])[];
  onChange: (next: T) => void;
  className?: string;
  legendVisible?: boolean;
  /** The options share the full width of the row. */
  fill?: boolean;
  /** 'sm' is the 32 px size for tool rows (T-181); touch keeps 44 px. */
  size?: 'md' | 'sm';
  /** Id of a text that explains the group; set on every radio. */
  describedBy?: string;
  /** A ref for the radio of one option (the focus target after a reset). */
  inputRef?: (option: T) => Ref<HTMLInputElement> | undefined;
  children?: ReactNode;
  /** Greyed out but kept in place, so the row does not jump (T-126). */
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className={['view-select', legendVisible ? 'has-legend' : '', className ?? ''].filter(Boolean).join(' ')}>
      <legend>{legend}</legend>
      <div className={['segmented', fill ? 'segmented--fill' : '', size === 'sm' ? 'segmented--sm' : ''].filter(Boolean).join(' ')}>
        {options.map(([option, label]) => (
          <label key={option} className="segmented-option">
            <input
              ref={inputRef?.(option)}
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              aria-describedby={describedBy}
              onChange={() => onChange(option)}
            />
            {label}
          </label>
        ))}
      </div>
      {children}
    </fieldset>
  );
}
