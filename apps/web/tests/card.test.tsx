import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, getHoverAnimation } from '@/components/ui/Card';

describe('getHoverAnimation', () => {
  it('returns a lift + accent border when motion is allowed', () => {
    expect(getHoverAnimation(false)).toEqual({
      y: -4,
      borderColor: 'var(--accent-teal)',
    });
  });

  it('returns undefined when reduced motion is preferred', () => {
    expect(getHoverAnimation(true)).toBeUndefined();
  });
});

describe('Card', () => {
  it('renders its children', () => {
    render(<Card>hello card</Card>);
    expect(screen.getByText('hello card')).toBeInTheDocument();
  });

  it('applies a custom className alongside the base card class', () => {
    render(<Card className="extra-class">content</Card>);
    expect(screen.getByText('content').className).toContain('extra-class');
  });
});
