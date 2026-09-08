import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/layout/Header';

describe('Header', () => {
  it('renders the wordmark link to home', () => {
    render(<Header />);
    expect(
      screen.getByRole('link', { name: /printgrid studio home/i })
    ).toHaveAttribute('href', '/');
  });

  it('does not render a theme toggle', () => {
    render(<Header />);
    expect(
      screen.queryByRole('button', { name: /toggle colour theme/i })
    ).not.toBeInTheDocument();
  });

  it('renders the primary nav links plus the quote CTA', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Materials' })).toHaveAttribute(
      'href',
      '/materials'
    );
    expect(screen.getByRole('link', { name: 'Get a quote' })).toHaveAttribute(
      'href',
      '/quote'
    );
  });
});
