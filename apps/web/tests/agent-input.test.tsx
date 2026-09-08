import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  AgentInput,
  nextTypewriterState,
  HOLD_TICKS,
  GAP_TICKS,
  type TypewriterState,
} from '@/components/ui/AgentInput';

vi.mock('motion/react', () => ({
  useReducedMotion: () => false,
}));

describe('nextTypewriterState', () => {
  const phrases = ['ab', 'c'];

  it('types one character per tick', () => {
    const s0: TypewriterState = { phraseIndex: 0, charCount: 0, phase: 'typing', counter: 0 };
    const s1 = nextTypewriterState(s0, phrases);
    expect(s1).toEqual({ phraseIndex: 0, charCount: 1, phase: 'typing', counter: 0 });
    const s2 = nextTypewriterState(s1, phrases);
    expect(s2).toEqual({ phraseIndex: 0, charCount: 2, phase: 'typing', counter: 0 });
  });

  it('switches to holding once the phrase is fully typed', () => {
    const typed: TypewriterState = { phraseIndex: 0, charCount: 2, phase: 'typing', counter: 0 };
    const held = nextTypewriterState(typed, phrases);
    expect(held.phase).toBe('holding');
  });

  it('switches from holding to deleting after the hold duration elapses', () => {
    const held: TypewriterState = { phraseIndex: 0, charCount: 2, phase: 'holding', counter: HOLD_TICKS - 1 };
    const next = nextTypewriterState(held, phrases);
    expect(next.phase).toBe('deleting');
    expect(next.counter).toBe(0);
  });

  it('deletes back to zero, then gaps', () => {
    let s: TypewriterState = { phraseIndex: 0, charCount: 2, phase: 'deleting', counter: 0 };
    s = nextTypewriterState(s, phrases);
    expect(s).toEqual({ phraseIndex: 0, charCount: 1, phase: 'deleting', counter: 0 });
    s = nextTypewriterState(s, phrases);
    expect(s).toEqual({ phraseIndex: 0, charCount: 0, phase: 'deleting', counter: 0 });
    s = nextTypewriterState(s, phrases);
    expect(s.phase).toBe('gap');
  });

  it('wraps from the last phrase back to the first after the gap elapses', () => {
    const lastPhraseGap: TypewriterState = { phraseIndex: 1, charCount: 0, phase: 'gap', counter: GAP_TICKS - 1 };
    const advanced = nextTypewriterState(lastPhraseGap, phrases);
    expect(advanced).toEqual({ phraseIndex: 0, charCount: 0, phase: 'typing', counter: 0 });
  });
});

describe('AgentInput', () => {
  it('renders children alongside the typed hint', () => {
    render(
      <AgentInput placeholders={['drop_model.stl_']}>
        <input aria-label="file" />
      </AgentInput>
    );
    expect(screen.getByLabelText('file')).toBeInTheDocument();
  });
});
