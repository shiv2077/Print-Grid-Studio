import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

vi.mock('motion/react', async () => {
  const actual = await vi.importActual<typeof import('motion/react')>('motion/react');
  return { ...actual, useReducedMotion: () => true };
});

describe('HomePage', () => {
  it('renders the hero heading and both CTAs with correct links', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'FDM 3D printing. Quoted live. Printed locally.' })
    ).toBeInTheDocument();
    const uploadLinks = screen.getAllByRole('link', { name: /Upload STL · See live price/ });
    expect(uploadLinks).toHaveLength(2);
    uploadLinks.forEach((link) => expect(link).toHaveAttribute('href', '/quote'));
    expect(screen.getByRole('link', { name: 'Browse materials' })).toHaveAttribute('href', '/materials');
  });

  it('renders the "How it works" section (id preserved) with all three steps', () => {
    const { container } = render(<HomePage />);
    expect(container.querySelector('#how-it-works')).not.toBeNull();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Three steps. No back-and-forth.' })
    ).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('Upload your STL')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('See a real price')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('Pay and we print')).toBeInTheDocument();
  });

  it('renders the materials teaser link', () => {
    render(<HomePage />);
    expect(screen.getByRole('link', { name: /See materials & specs/ })).toHaveAttribute(
      'href',
      '/materials'
    );
  });

  it('renders the pricing section (id preserved) with all six rows', () => {
    const { container } = render(<HomePage />);
    expect(container.querySelector('#pricing')).not.toBeNull();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Every rupee, on the table.' })
    ).toBeInTheDocument();
    const rows: [string, string][] = [
      ['Material', 'Per-gram rate × printed mass'],
      ['Setup fee', '₹100 / file'],
      ['Rush turnaround', '+25% (optional)'],
      ['GST', '18%'],
      ['Shipping', '₹120 · free over ₹2,500'],
      ['Payment processing', '2%'],
    ];
    for (const [label, value] of rows) {
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(value)).toBeInTheDocument();
    }
  });

  it('renders the final CTA band heading', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Got an STL? Get a price right now.' })
    ).toBeInTheDocument();
  });
});
