// apps/web/tests/quote-page.test.tsx
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuotePage } from '@/app/quote/QuotePage';

const mockParse = vi.fn();
vi.mock('@/lib/use-stl-parser', () => ({
  useStlParser: () => ({ parse: mockParse, result: null, error: null, isLoading: false, reset: vi.fn() }),
}));

vi.mock('@/lib/parse-model', () => ({
  parseModel: vi.fn(),
  // StlViewer.tsx (dynamically imported by QuotePage) also imports loadModelObject
  // from this module to build the 3D preview. It isn't under test here — the
  // preview canvas relies on WebGL/three.js which jsdom can't render — so it's
  // stubbed to reject; StlViewer already handles that by showing a "Could not
  // render preview" message instead of crashing the tree.
  loadModelObject: vi.fn().mockRejectedValue(new Error('preview not available in tests')),
}));

const mockCreateOrder = vi.fn();
const mockLoadRazorpay = vi.fn();
const mockOpenCheckout = vi.fn();
const mockPollUntilPaid = vi.fn();
vi.mock('@/lib/checkout', () => ({
  createOrder: (...args: unknown[]) => mockCreateOrder(...args),
  loadRazorpay: (...args: unknown[]) => mockLoadRazorpay(...args),
  openCheckout: (...args: unknown[]) => mockOpenCheckout(...args),
  pollUntilPaid: (...args: unknown[]) => mockPollUntilPaid(...args),
}));

function makeFile(name: string, size = 1024): File {
  return new File([new Uint8Array(size)], name, { type: 'application/octet-stream' });
}

const PARSE_RESULT = {
  volumeMm3: 8000,
  bboxSize: [20, 20, 20] as [number, number, number],
  triangleCount: 1200,
};

describe('QuotePage', () => {
  beforeEach(() => {
    mockParse.mockReset();
    mockCreateOrder.mockReset();
    mockLoadRazorpay.mockReset();
    mockOpenCheckout.mockReset();
    mockPollUntilPaid.mockReset();
  });

  it('rejects a file with a disallowed extension', async () => {
    render(<QuotePage />);
    const input = screen.getByLabelText('Upload STL, OBJ or 3MF files') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('model.png')] } } as unknown as Event);
    await waitFor(() => expect(screen.getByText(/must be STL, OBJ or 3MF/)).toBeInTheDocument());
  });

  it('rejects an empty file', async () => {
    render(<QuotePage />);
    const input = screen.getByLabelText('Upload STL, OBJ or 3MF files') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('model.stl', 0)] } } as unknown as Event);
    await waitFor(() => expect(screen.getByText(/file is empty/)).toBeInTheDocument());
  });

  it('accepts a valid STL, parses it, and shows the computed price', async () => {
    mockParse.mockResolvedValue(PARSE_RESULT);
    render(<QuotePage />);
    const input = screen.getByLabelText('Upload STL, OBJ or 3MF files') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('bracket.stl')] } } as unknown as Event);

    await waitFor(() => expect(screen.getByText('bracket.stl')).toBeInTheDocument());
    await waitFor(() => expect(mockParse).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/1,200 tris/)).toBeInTheDocument());
    // A price is now shown instead of the empty-state prompt.
    await waitFor(() => expect(screen.queryByText('Upload an STL to see your price.')).not.toBeInTheDocument());
  });

  it('shows a parse error for a file that fails to parse', async () => {
    mockParse.mockRejectedValue(new Error('Corrupt mesh'));
    render(<QuotePage />);
    const input = screen.getByLabelText('Upload STL, OBJ or 3MF files') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('broken.stl')] } } as unknown as Event);
    await waitFor(() => expect(screen.getByText('Corrupt mesh')).toBeInTheDocument());
  });

  it('removes a file via its remove button', async () => {
    mockParse.mockResolvedValue(PARSE_RESULT);
    render(<QuotePage />);
    const input = screen.getByLabelText('Upload STL, OBJ or 3MF files') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('bracket.stl')] } } as unknown as Event);
    await waitFor(() => expect(screen.getByText('bracket.stl')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Remove file' }));
    expect(screen.queryByText('bracket.stl')).not.toBeInTheDocument();
  });

  it('blocks checkout until required address fields are filled, showing field errors', async () => {
    mockParse.mockResolvedValue(PARSE_RESULT);
    render(<QuotePage />);
    const input = screen.getByLabelText('Upload STL, OBJ or 3MF files') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('bracket.stl')] } } as unknown as Event);
    await waitFor(() => expect(screen.getByText('bracket.stl')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Continue to payment/ }));
    await waitFor(() => expect(screen.getByText(/complete the shipping address/)).toBeInTheDocument());
    expect(mockCreateOrder).not.toHaveBeenCalled();
  });

  it('calls createOrder → loadRazorpay → openCheckout with a complete address, and never calls them before that', async () => {
    mockParse.mockResolvedValue(PARSE_RESULT);
    mockCreateOrder.mockResolvedValue({ order_code: 'PG-ABC123', razorpay_order_id: 'rzp_1', amount_paise: 100000, currency: 'INR', key_id: 'key_1' });
    mockLoadRazorpay.mockResolvedValue(undefined);

    render(<QuotePage />);
    const input = screen.getByLabelText('Upload STL, OBJ or 3MF files') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('bracket.stl')] } } as unknown as Event);
    await waitFor(() => expect(screen.getByText('bracket.stl')).toBeInTheDocument());

    // Fill every address field by locating each input via its sibling label text
    // (quote-row wraps a <span>label</span> and an <input> together, so this is
    // stable regardless of CSS-Module class hashing).
    const nameInput = screen.getByText('Full name').parentElement!.querySelector('input')!;
    const phoneInput = screen.getByText('Phone').parentElement!.querySelector('input')!;
    const emailInput = screen.getByText('Email (for confirmation)').parentElement!.querySelector('input')!;
    const line1Input = screen.getByText('Address line 1').parentElement!.querySelector('input')!;
    const cityInput = screen.getByText('City').parentElement!.querySelector('input')!;
    const stateInput = screen.getByText('State').parentElement!.querySelector('input')!;
    const pincodeInput = screen.getByText('PIN code').parentElement!.querySelector('input')!;

    fireEvent.change(nameInput, { target: { value: 'A Test' } });
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    fireEvent.change(emailInput, { target: { value: 'a@b.com' } });
    fireEvent.change(line1Input, { target: { value: '123 Main St' } });
    fireEvent.change(cityInput, { target: { value: 'Chennai' } });
    fireEvent.change(stateInput, { target: { value: 'Tamil Nadu' } });
    fireEvent.change(pincodeInput, { target: { value: '600001' } });

    fireEvent.click(screen.getByRole('button', { name: /Continue to payment/ }));

    await waitFor(() => expect(mockCreateOrder).toHaveBeenCalledTimes(1));
    expect(mockLoadRazorpay).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockOpenCheckout).toHaveBeenCalledTimes(1));
    const call = mockCreateOrder.mock.calls[0]!;
    expect(call[1].address.email).toBe('a@b.com');
  });

  it('applies a valid promo code and shows the applied caption', async () => {
    render(<QuotePage />);
    fireEvent.change(screen.getByPlaceholderText('FIRSTPRINT'), { target: { value: 'FIRSTPRINT' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(screen.getByText('FIRSTPRINT applied')).toBeInTheDocument());
  });

  it('shows an error for an unrecognized promo code', async () => {
    render(<QuotePage />);
    fireEvent.change(screen.getByPlaceholderText('FIRSTPRINT'), { target: { value: 'NOTAREALCODE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() =>
      expect(screen.getByText('That code does not match any active promo.')).toBeInTheDocument(),
    );
  });

  it('clears an applied promo code via the Clear button', async () => {
    render(<QuotePage />);
    fireEvent.change(screen.getByPlaceholderText('FIRSTPRINT'), { target: { value: 'FIRSTPRINT' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(screen.getByText('FIRSTPRINT applied')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByText('FIRSTPRINT applied')).not.toBeInTheDocument();
  });
});
