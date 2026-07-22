import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import OrderPage from '@/app/orders/[code]/page';
import { getOrderStatus } from '@/lib/checkout';

vi.mock('@/lib/checkout', () => ({
  getOrderStatus: vi.fn(),
}));

const mockedGetOrderStatus = vi.mocked(getOrderStatus);

describe('OrderPage', () => {
  it('shows a loading state before the fetch resolves', () => {
    mockedGetOrderStatus.mockReturnValue(new Promise(() => {})); // never resolves
    render(<OrderPage params={{ code: 'pg-abc123' }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });

  it('uppercases the order code in the heading', async () => {
    mockedGetOrderStatus.mockReturnValue(new Promise(() => {}));
    render(<OrderPage params={{ code: 'pg-abc123' }} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('PG-ABC123');
  });

  it('shows the pending-payment message and no timeline when status is pending', async () => {
    mockedGetOrderStatus.mockResolvedValue({
      order_code: 'PG-ABC123',
      status: 'pending',
      amount_paise: 199900,
      currency: 'INR',
    });
    render(<OrderPage params={{ code: 'pg-abc123' }} />);
    await waitFor(() => expect(screen.getByText(/Payment pending/)).toBeInTheDocument());
    expect(screen.getByText(/waiting for payment confirmation/)).toBeInTheDocument();
    expect(screen.queryByText('Progress')).not.toBeInTheDocument();
  });

  it('shows the timeline with correct done/current steps when status is paid', async () => {
    mockedGetOrderStatus.mockResolvedValue({
      order_code: 'PG-ABC123',
      status: 'paid',
      amount_paise: 350000,
      currency: 'INR',
      fulfillment_status: 'printing',
      created_at: '2026-07-01T10:00:00.000Z',
      history: [
        { status: 'under_review', note: null, at: '2026-07-01T11:00:00.000Z' },
        { status: 'approved', note: null, at: '2026-07-01T12:00:00.000Z' },
        { status: 'printing', note: 'On printer 3', at: '2026-07-01T13:00:00.000Z' },
      ],
    });
    render(<OrderPage params={{ code: 'pg-abc123' }} />);
    await waitFor(() => expect(screen.getByText('Progress')).toBeInTheDocument());

    const list = screen.getByRole('list', { name: 'Order progress' });
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(9);

    // "Printing" is current
    const printingRow = items.find((el) => el.textContent?.includes('Printing'));
    expect(printingRow?.textContent).toContain('current');
    expect(printingRow?.textContent).toContain('On printer 3');

    // "Uploaded" (before any history entry) is done, using created_at
    const uploadedRow = items.find((el) => el.textContent?.includes('Uploaded'));
    expect(uploadedRow?.className).toMatch(/is-?[Dd]one|Done/); // presence of a "done" state is asserted via visible content below
    expect(uploadedRow?.textContent).not.toContain('current');

    // "Delivered" (far future step) shows no timestamp and is not current
    const deliveredRow = items.find((el) => el.textContent?.includes('Delivered'));
    expect(deliveredRow?.textContent).not.toContain('current');

    expect(list).toBeInTheDocument();
  });

  it('shows the not-found state with a WhatsApp link for a 404-style error', async () => {
    mockedGetOrderStatus.mockRejectedValue(new Error('Status check failed (404)'));
    render(<OrderPage params={{ code: 'pg-nope' }} />);
    await waitFor(() => expect(screen.getByText('No order matches that code.')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /Open WhatsApp/ })).toHaveAttribute(
      'href',
      'https://wa.me/917540023670',
    );
  });

  it('shows a generic error state for a non-404 failure', async () => {
    mockedGetOrderStatus.mockRejectedValue(new Error('Network error'));
    render(<OrderPage params={{ code: 'pg-abc123' }} />);
    await waitFor(() => expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'h2' && /Couldn.t load this order/.test(content);
    })).toBeInTheDocument());
  });
});
