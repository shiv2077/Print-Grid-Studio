'use client';

import clsx from 'clsx';
import styles from './SegmentedControl.module.css';

export interface SegmentedOption<V extends string> {
  value: V;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<V extends string> {
  options: ReadonlyArray<SegmentedOption<V>>;
  value: V;
  onChange: (next: V) => void;
  ariaLabel: string;
  mono?: boolean;
  className?: string;
}

export function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  mono = false,
  className,
}: SegmentedControlProps<V>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={clsx(styles.group, mono && styles.mono, className)}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={opt.disabled}
            onClick={() => {
              if (!opt.disabled && !selected) onChange(opt.value);
            }}
            className={clsx(styles.option, selected && styles.selected)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
