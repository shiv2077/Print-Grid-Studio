'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { MATERIALS, formatINR, type MaterialKey } from '@printgrid/pricing';
import styles from './MaterialDropdown.module.css';

const MATERIAL_KEYS: MaterialKey[] = [
  'pla-plus',
  'pla-lw',
  'petg',
  'abs',
  'tpu-95a',
  'pa6',
  'pa-cf',
];

export interface MaterialDropdownProps {
  value: MaterialKey;
  onChange: (next: MaterialKey) => void;
  ariaLabel?: string;
}

export function MaterialDropdown({
  value,
  onChange,
  ariaLabel = 'Material',
}: MaterialDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const current = MATERIALS[value];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <button
        type="button"
        className={clsx(styles.button, open && styles.buttonOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.label}>
          <span className={styles.materialName}>{current.name}</span>
          <span className={styles.materialRate}>
            {formatINR(current.ratePerGramPaise)} / g
          </span>
        </span>
        <ChevronDown size={16} aria-hidden className={styles.chevron} />
      </button>
      {open && (
        <ul className={styles.menu} role="listbox" aria-label={ariaLabel}>
          {MATERIAL_KEYS.map((k) => {
            const m = MATERIALS[k];
            const selected = k === value;
            return (
              <li key={k}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={clsx(
                    styles.option,
                    selected && styles.optionSelected
                  )}
                  onClick={() => {
                    onChange(k);
                    setOpen(false);
                  }}
                >
                  <span>{m.name}</span>
                  <span className={styles.optionRate}>
                    {formatINR(m.ratePerGramPaise)} / g
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
