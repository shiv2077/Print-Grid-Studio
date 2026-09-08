'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import clsx from 'clsx';
import styles from './AgentInput.module.css';

export const TICK_MS = 40;
export const HOLD_TICKS = 35; // ~1400ms pause once fully typed
export const GAP_TICKS = 8; // ~320ms pause once fully deleted

type Phase = 'typing' | 'holding' | 'deleting' | 'gap';

export interface TypewriterState {
  phraseIndex: number;
  charCount: number;
  phase: Phase;
  counter: number;
}

/** Pure state-machine step, testable without timers. */
export function nextTypewriterState(
  state: TypewriterState,
  phrases: readonly string[]
): TypewriterState {
  const phrase = phrases[state.phraseIndex] ?? '';
  switch (state.phase) {
    case 'typing': {
      if (state.charCount < phrase.length) {
        return { ...state, charCount: state.charCount + 1 };
      }
      return { ...state, phase: 'holding', counter: 0 };
    }
    case 'holding': {
      if (state.counter + 1 < HOLD_TICKS) {
        return { ...state, counter: state.counter + 1 };
      }
      return { ...state, phase: 'deleting', counter: 0 };
    }
    case 'deleting': {
      if (state.charCount > 0) {
        return { ...state, charCount: state.charCount - 1 };
      }
      return { ...state, phase: 'gap', counter: 0 };
    }
    case 'gap': {
      if (state.counter + 1 < GAP_TICKS) {
        return { ...state, counter: state.counter + 1 };
      }
      return {
        phraseIndex: (state.phraseIndex + 1) % phrases.length,
        charCount: 0,
        phase: 'typing',
        counter: 0,
      };
    }
  }
}

export interface AgentInputProps {
  placeholders: readonly string[];
  children: React.ReactNode;
  className?: string;
}

/**
 * Cosmetic-only wrapper: renders `children` (the real dropzone/config
 * markup) unchanged, plus an animated typed hint above it. No new state,
 * no fetch calls — purely decorative.
 */
export function AgentInput({ placeholders, children, className }: AgentInputProps) {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState<TypewriterState>({
    phraseIndex: 0,
    charCount: 0,
    phase: 'typing',
    counter: 0,
  });

  useEffect(() => {
    if (reduceMotion || placeholders.length === 0) return;
    const id = setInterval(() => {
      setState((s) => nextTypewriterState(s, placeholders));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [reduceMotion, placeholders]);

  const phrase = placeholders[state.phraseIndex] ?? '';
  const shown = reduceMotion ? phrase : phrase.slice(0, state.charCount);

  return (
    <div className={clsx(styles.shell, className)}>
      <div className={styles.hint} aria-hidden="true">
        <span className={styles.mono}>{shown}</span>
        {!reduceMotion && <span className={styles.cursor} />}
      </div>
      {children}
    </div>
  );
}
