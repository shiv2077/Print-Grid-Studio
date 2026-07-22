// apps/web/tests/materials-explorer.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MaterialsExplorer } from '@/app/materials/MaterialsExplorer';

function getRow(materialName: string): HTMLElement {
  const cell = screen.getByText(materialName);
  const row = cell.closest('tr');
  if (!row) throw new Error(`Row for ${materialName} not found`);
  return row;
}

describe('MaterialsExplorer', () => {
  it('renders all 7 materials by default', () => {
    render(<MaterialsExplorer />);
    for (const name of ['PLA+', 'PLA LW', 'PETG', 'ABS', 'TPU 95A', 'PA6', 'PA-CF']) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('filters to only the Flexible material when the Flexible chip is clicked', () => {
    render(<MaterialsExplorer />);
    fireEvent.click(screen.getByRole('button', { name: 'Flexible' }));
    expect(screen.getByText('TPU 95A')).toBeInTheDocument();
    expect(screen.queryByText('PLA+')).not.toBeInTheDocument();
    expect(screen.queryByText('PA-CF')).not.toBeInTheDocument();
  });

  it('returns to showing all materials when "All" is clicked after a filter', () => {
    render(<MaterialsExplorer />);
    fireEvent.click(screen.getByRole('button', { name: 'Flexible' }));
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByText('PLA+')).toBeInTheDocument();
    expect(screen.getByText('PA-CF')).toBeInTheDocument();
  });

  it('filters by search query matching the "use" text', () => {
    render(<MaterialsExplorer />);
    const input = screen.getByLabelText('Search materials') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'gasket' } } as any);
    expect(screen.getByText('TPU 95A')).toBeInTheDocument();
    expect(screen.queryByText('PLA+')).not.toBeInTheDocument();
  });

  it('shows the empty-state message when no material matches the search', () => {
    render(<MaterialsExplorer />);
    const input = screen.getByLabelText('Search materials') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'zzznomatch' } } as any);
    expect(screen.getByText('No materials match that filter.')).toBeInTheDocument();
  });

  it('sorts by cost ascending on first click, descending on a second click', () => {
    const { container } = render(<MaterialsExplorer />);
    const costHeader = screen.getByRole('button', { name: /Cost \/ g/ });
    fireEvent.click(costHeader);
    let dataRows = container.querySelectorAll('tbody tr[role="button"]');
    expect(dataRows[0]!.textContent).toContain('PLA+');
    fireEvent.click(costHeader);
    dataRows = container.querySelectorAll('tbody tr[role="button"]');
    expect(dataRows[0]!.textContent).toContain('PA-CF');
  });

  it('expands a row to show its detail panel on click, and collapses on a second click', () => {
    render(<MaterialsExplorer />);
    const row = getRow('PLA+');
    expect(row).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Drone frames, brackets, and mechanical mounts/)).toBeInTheDocument();
    fireEvent.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Drone frames, brackets, and mechanical mounts/)).not.toBeInTheDocument();
  });

  it('expands a row via the Enter key and collapses via a second Enter', () => {
    render(<MaterialsExplorer />);
    const row = getRow('ABS');
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(row).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(row).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands a row via the Space key', () => {
    render(<MaterialsExplorer />);
    const row = getRow('PETG');
    fireEvent.keyDown(row, { key: ' ' });
    expect(row).toHaveAttribute('aria-expanded', 'true');
  });
});
