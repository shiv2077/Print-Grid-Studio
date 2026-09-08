import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Reveal } from '@/components/ui/Reveal';

const useReducedMotionMock = vi.fn();

vi.mock('motion/react', async () => {
  const actual = await vi.importActual<typeof import('motion/react')>('motion/react');
  return { ...actual, useReducedMotion: () => useReducedMotionMock() };
});

describe('Reveal', () => {
  it('renders its children', () => {
    useReducedMotionMock.mockReturnValue(false);
    render(
      <Reveal>
        <p>Hello from Reveal</p>
      </Reveal>
    );
    expect(screen.getByText('Hello from Reveal')).toBeInTheDocument();
  });

  it('applies the passed className to the wrapper', () => {
    useReducedMotionMock.mockReturnValue(false);
    const { container } = render(
      <Reveal className="my-class">
        <p>content</p>
      </Reveal>
    );
    expect(container.firstElementChild).toHaveClass('my-class');
  });

  it('animates in (starts hidden via inline style) when motion is allowed', () => {
    useReducedMotionMock.mockReturnValue(false);
    const { container } = render(
      <Reveal>
        <p>content</p>
      </Reveal>
    );
    // jsdom never fires the IntersectionObserver that triggers whileInView,
    // so the initial (pre-animation) inline style must still be present.
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.opacity).toBe('0');
  });

  it('renders a plain, unanimated wrapper when reduced motion is preferred', () => {
    useReducedMotionMock.mockReturnValue(true);
    const { container } = render(
      <Reveal>
        <p>content</p>
      </Reveal>
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.opacity).toBe('');
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
