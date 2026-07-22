# Pango Revamp Phase 5 — Quote Implementation Plan (final phase)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin `/quote` — the file-upload, configuration, pricing, address, and checkout page — in the dark/teal Pango-inspired palette, wrap the file dropzone in the already-built cosmetic `AgentInput` typewriter component, and add scroll-in reveals — while keeping every hook, reducer dispatch, validation rule, and the entire checkout flow (`createOrder` → `loadRazorpay` → `openCheckout` → `pollUntilPaid`) byte-for-byte identical. This is the highest-risk phase in the revamp: `/quote` sits directly adjacent to real payment/order-creation code.

**Architecture:** Same characterize-first discipline as Phases 3-4, applied more thoroughly given this component's size (499 lines) and stakes. Task 1 writes a comprehensive characterization suite against today's `QuotePage`, mocking every I/O boundary (`useStlParser`, `parseModel`, `@/lib/checkout`, `fetch` for the PDF endpoint) so tests never touch a real worker, network, or the real database — and never call the real `openCheckout`/Razorpay. Task 2 reskins: a new CSS Module replaces every `quote-*`/`checkout-banner*`/`btn*` reference except the one spot that renders `StlViewer`'s loading placeholder (left as-is, since `StlViewer.tsx` itself — a separate `@react-three/fiber` 3D component — is explicitly out of scope and still uses the old global `.quote-viewer*` classes; the placeholder must keep matching it). The dropzone gets wrapped in `AgentInput` (Phase 1, purely cosmetic, already built and unused until now). `quote/page.tsx` (the thin route wrapper, NOT `state.ts`) drops its `<Section bg="ink">` wrapper — the only other consumer check confirms nothing else uses `Section`, and this makes `/quote`'s background consistent with the new `--canvas` token used everywhere else, rather than the older `--ink`/`--paper`-swap "ink" convention. Task 3 validates: automated suite + typecheck + build, then the controller drives a REAL upload (a hand-built minimal valid binary STL, so the real STL parser worker actually runs) in a real browser to see the full upload → parse → price flow, but does **not** click "Continue to payment" (that would invoke the real Razorpay flow) — checkout-flow correctness is covered entirely by Task 1's mocked characterization tests and code review, not a live click.

**Tech Stack:** Next.js 14 App Router (Client Component, unchanged), `motion` (`Reveal`, `AgentInput` — already dependencies from Phases 1-2), CSS Modules, `clsx`, Vitest + `@testing-library/react`.

## Global Constraints

- **`apps/web/app/quote/state.ts` must not be opened for editing, at all, in any task.** Its exports (`initialState`, `reducer`) are imported unchanged.
- No changes to `apps/web/lib/server/**`, `apps/web/app/api/**`, `apps/web/app/quote/StlViewer.tsx`, `apps/web/app/v2/**`, or `apps/web/app/layout.tsx`.
- No changes to `apps/web/app/globals.css` — every `.quote-*`, `.checkout-banner*`, `.btn*` rule stays exactly as-is (nothing else references them after this phase, but they are left in place per the established "additive, don't delete" convention. Do not delete them either — leave the file alone entirely in this phase.)
- **No behavior change of any kind** to: `acceptFiles` (extension/size/duplicate/max-file validation), the parsing `useEffect` (including the `parsingRef` guard and the OBJ/3MF-vs-STL branch), the `result`/`canContinue`/`blockedReason` `useMemo`s, `onContinue` (the entire `createOrder`/`loadRazorpay`/`openCheckout`/`pollUntilPaid` sequence and its exact call arguments), `onDownloadPdf`, `onRemove`, every `dispatch({ type: ... })` call and payload shape, the address `field()` render-helper's validation-error display, or the promo apply/clear logic. Only `className`/`style` (replaced by a CSS Module + `clsx`) and two additive wrappers (`AgentInput` around the dropzone, `Reveal` around top-level sections) may change.
- Every animation must have a static, non-animated fallback under `prefers-reduced-motion: reduce` (both `AgentInput` and `Reveal` already handle this internally — no new reduced-motion code needs writing in this phase).
- Do not click "Continue to payment" / trigger `openCheckout` in any live/manual verification step in this plan — it invokes real Razorpay and real order creation. Checkout-flow correctness is verified by Task 1's mocked tests only.
- Design tokens available from Phase 1: `--canvas`, `--surface`, `--text`, `--text-secondary`, `--text-muted`, `--accent-teal`, `--accent-teal-strong`, `--line`, `--line-strong`, `--font-sans`, `--font-mono`. `Reveal` (`@/components/ui/Reveal`, props `{ children, className?, delay? }`) and `AgentInput` (`@/components/ui/AgentInput`, props `{ placeholders: readonly string[], children, className? }`) are both already built (Phases 1-2) and unused until this phase.

---

### Task 1: Characterization tests for today's `QuotePage` (no production code changes)

**Files:**
- Create: `apps/web/tests/quote-page.test.tsx`

**Interfaces:**
- Consumes: `QuotePage` from `apps/web/app/quote/QuotePage.tsx`, unchanged in this task. Mocks `@/lib/use-stl-parser`, `@/lib/parse-model`, `@/lib/checkout`, and `global.fetch` (for the PDF endpoint). Uses the REAL `@printgrid/pricing` package (the actual pricing engine — not a boundary-restricted path, and using the real thing is what makes the price assertions meaningful) and the REAL `./state` reducer (importing/using it is fine; only *editing* `state.ts` is forbidden).

- [ ] **Step 1: Write the test file**

```tsx
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
```

- [ ] **Step 2: Run the tests against today's unmodified component**

Run: `pnpm --filter web test -- quote-page`
Expected: PASS (10/10) — characterization suite, not RED/GREEN TDD. If a test's assumption about exact current text/labels is wrong, fix the TEST to match reality — do not touch `QuotePage.tsx` or `state.ts`. The three promo tests assert exact real strings (`FIRSTPRINT applied`, `That code does not match any active promo.`) taken directly from reading `state.ts` (read-only, for test accuracy — not edited).

- [ ] **Step 3: Commit**

```bash
git add apps/web/tests/quote-page.test.tsx
git commit -m "test: characterize current QuotePage behavior before Pango reskin (excludes state.ts)"
```

---

### Task 2: Reskin `QuotePage` and `quote/page.tsx`

**Files:**
- Create: `apps/web/app/quote/QuotePage.module.css`
- Modify: `apps/web/app/quote/QuotePage.tsx` (full replacement)
- Create: `apps/web/app/quote/page.module.css`
- Modify: `apps/web/app/quote/page.tsx` (full replacement)

**Interfaces:**
- Consumes: `Reveal` (`@/components/ui/Reveal`) and `AgentInput` (`@/components/ui/AgentInput`, props `{ placeholders, children, className? }`), both from Phases 1-2.

- [ ] **Step 1: Confirm the characterization suite from Task 1 is still green before starting**

Run: `pnpm --filter web test -- quote-page`
Expected: PASS (10/10)

- [ ] **Step 2: Create `QuotePage.module.css`**

```css
/* apps/web/app/quote/QuotePage.module.css */
.head {
  padding: 32px 0 40px;
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent-teal);
  margin-bottom: 16px;
}

.title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: clamp(2rem, 4vw, 3rem);
  letter-spacing: -0.01em;
  color: var(--text);
  margin: 0 0 16px;
}

.lede {
  font-size: 17px;
  line-height: 1.6;
  color: var(--text-secondary);
  max-width: 65ch;
  margin: 0;
}

.section {
  padding: 0 0 96px;
}

.banner {
  margin: 0 0 24px;
  padding: 14px 18px;
  border-radius: 8px;
  border: 1px solid var(--line-strong);
  background: var(--surface);
  font-size: 14px;
  line-height: 1.5;
  color: var(--text);
}

.banner strong {
  font-weight: 600;
}

.bannerPaid {
  border-color: var(--accent-teal);
  background: color-mix(in srgb, var(--accent-teal) 12%, var(--surface));
}

.bannerError {
  border-color: #f87171;
  background: color-mix(in srgb, #f87171 10%, var(--surface));
  color: #f87171;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 900px) {
  .grid {
    grid-template-columns: 3fr 2fr;
    align-items: start;
  }
}

.col {
  min-width: 0;
}

.dropzone {
  display: block;
  border: 1px dashed var(--line-strong);
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  background: var(--surface);
  transition: border-color 150ms ease, background 150ms ease;
}

.dropzone:hover,
.dropzone:focus-within,
.dropzoneOver {
  border-color: var(--accent-teal);
}

.dropzoneTitle {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 18px;
  color: var(--text);
  margin-bottom: 4px;
}

.dropzoneSub {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 16px;
}

.dropzoneHint {
  color: var(--text-muted);
  font-size: 12px;
}

.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.dropErrors {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.files {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fileCard {
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: var(--surface);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: border-color 150ms ease;
}

.fileCard:hover {
  border-color: var(--accent-teal);
}

.addressCard {
  margin-top: 16px;
}

.fileCardHeader {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.fileCardName {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 14px;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.fileCardStats {
  font-size: 11px;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
}

.fileRemove {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--line-strong);
  background: var(--surface);
  font-size: 16px;
  line-height: 1;
  color: var(--text-secondary);
  cursor: pointer;
  flex-shrink: 0;
}

.fileRemove:hover {
  color: var(--accent-teal);
  border-color: var(--accent-teal);
}

.row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rowLabel {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-secondary);
}

.row select,
.row input[type='text'],
.row input[type='number'],
.row input[type='tel'],
.row input[type='email'] {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--text);
  background: var(--canvas);
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  padding: 8px 10px;
}

.row select:focus,
.row input:focus {
  outline: none;
  border-color: var(--accent-teal);
}

.rowCheck {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.rowCheck input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-teal);
}

.rowCheck span {
  font-size: 14px;
  color: var(--text);
}

.rushRow {
  margin-top: 8px;
}

.controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.totalHeadline {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: clamp(34px, 4vw, 44px);
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  margin-top: 6px;
  margin-bottom: 4px;
}

.totalCaption {
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-secondary);
  margin-bottom: 18px;
}

.cardLine {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid var(--line);
  padding-top: 12px;
}

.rowLine {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: 15px;
  line-height: 1.55;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.rowLine .mono {
  color: var(--text);
  font-weight: 500;
}

.rowLineStrong,
.rowLineStrong .mono {
  color: var(--text);
  font-weight: 600;
}

.rowLineStrong {
  font-size: 17px;
}

.rowLineDiscount .mono {
  color: var(--accent-teal);
}

.cardCaption {
  color: var(--text-secondary);
  font-size: 12px;
  letter-spacing: 0.06em;
}

.cardEmpty {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.cta {
  margin-top: 16px;
  width: 100%;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 15px;
  padding: 14px 24px;
  border-radius: 10px;
  border: none;
  background: var(--accent-teal-strong);
  color: #fff;
  cursor: pointer;
}

.cta:hover:not(:disabled) {
  background: var(--accent-teal);
}

.cta:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ctaSecondary {
  width: 100%;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 14px;
  padding: 10px 18px;
  border-radius: 8px;
  border: 1px solid var(--line-strong);
  background: transparent;
  color: var(--text);
  cursor: pointer;
}

.ctaSecondary:hover {
  border-color: var(--accent-teal);
  color: var(--accent-teal);
}

.promoRow {
  display: flex;
  gap: 8px;
}

.promoInput {
  text-transform: uppercase;
}

.promoNote {
  margin-top: 6px;
}

.warning {
  font-size: 12px;
  color: #f87171;
  background: color-mix(in srgb, #f87171 10%, var(--surface));
  padding: 6px 8px;
  border-radius: 4px;
  border-left: 2px solid #f87171;
}

.warningError {
  font-weight: 600;
}

.warningInfo {
  color: var(--text-secondary);
  background: var(--surface);
  border-left-color: var(--line-strong);
}

.fieldError {
  margin-top: 4px;
}

.mono {
  font-family: var(--font-mono);
}
```

- [ ] **Step 3: Replace `QuotePage.tsx` in full**

```tsx
// apps/web/app/quote/QuotePage.tsx
'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import { useStlParser } from '@/lib/use-stl-parser';
import {
  quote,
  computeMass,
  formatINR,
  MATERIALS,
  FINISHES,
  type FileInput,
  type QuoteResult,
  type MaterialKey,
  type LayerHeight,
  type Finish,
} from '@printgrid/pricing';
import { createOrder, loadRazorpay, openCheckout, pollUntilPaid } from '@/lib/checkout';
import { parseModel } from '@/lib/parse-model';
import { analyzeManufacturability } from '@/lib/manufacturability';
import { validateAddress, type ShippingAddress, type AddressField } from '@/lib/address';
import { initialState, reducer } from './state';
import { Reveal } from '@/components/ui/Reveal';
import { AgentInput } from '@/components/ui/AgentInput';
import styles from './QuotePage.module.css';

const EMPTY_ADDRESS: ShippingAddress = {
  name: '', phone: '', email: '', line1: '', line2: '', city: '', state: '', pincode: '',
};

type CheckoutState =
  | { phase: 'idle' }
  | { phase: 'creating' }
  | { phase: 'awaiting' }
  | { phase: 'confirming'; code: string }
  | { phase: 'paid'; code: string }
  | { phase: 'error'; message: string };

const MATERIAL_KEYS: MaterialKey[] = ['pla-plus', 'pla-lw', 'petg', 'abs', 'tpu-95a', 'pa6', 'pa-cf'];
const LAYER_HEIGHTS: LayerHeight[] = ['0.12', '0.16', '0.20', '0.24', '0.28'];
const FINISH_KEYS = Object.keys(FINISHES) as Finish[];
const FINISH_LABELS: Record<Finish, string> = {
  'as-printed': 'As printed',
  sanded: 'Sanded',
  primer: 'Primer',
  gloss: 'Gloss',
};

const DROPZONE_HINTS = [
  'Drop an STL to see the real price…',
  'Upload OBJ or 3MF too…',
  'Nothing leaves your device until checkout…',
] as const;

const MAX_FILES = 10;
const MAX_BYTES = 100 * 1024 * 1024;

// three.js viewer is browser-only — load it client-side, never on the server.
const StlViewer = dynamic(() => import('./StlViewer').then((m) => m.StlViewer), {
  ssr: false,
  loading: () => (
    <div className="quote-viewer">
      <div className="quote-viewer__empty">Loading preview…</div>
    </div>
  ),
});

let idCounter = 0;
const nextId = () => `f${++idCounter}-${Date.now().toString(36)}`;

export function QuotePage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { parse } = useStlParser();
  const filesRef = useRef<Map<string, File>>(new Map());
  const parsingRef = useRef<Set<string>>(new Set());
  const [dropActive, setDropActive] = useState(false);
  const [dropErrors, setDropErrors] = useState<string[]>([]);

  const acceptFiles = useCallback((files: File[]) => {
    const errs: string[] = [];
    const ok: File[] = [];
    const remaining = MAX_FILES - filesRef.current.size;
    const seen = new Set(Array.from(filesRef.current.values()).map((x) => `${x.name}:${x.size}`));
    for (const f of files) {
      const sig = `${f.name}:${f.size}`;
      if (ok.length >= remaining) { errs.push(`Only ${MAX_FILES} files per quote — ${f.name} dropped`); continue; }
      if (!/\.(stl|obj|3mf)$/i.test(f.name)) { errs.push(`${f.name}: must be STL, OBJ or 3MF`); continue; }
      if (f.size > MAX_BYTES) { errs.push(`${f.name}: exceeds 100MB`); continue; }
      if (f.size === 0) { errs.push(`${f.name}: file is empty`); continue; }
      if (seen.has(sig) || ok.some((o) => `${o.name}:${o.size}` === sig)) { errs.push(`${f.name}: already added — skipped duplicate`); continue; }
      ok.push(f);
    }
    setDropErrors(errs);
    if (ok.length) {
      const additions = ok.map((file) => {
        const id = nextId();
        filesRef.current.set(id, file);
        return { id, file };
      });
      dispatch({ type: 'ADD_FILES', payload: additions });
    }
  }, []);

  // Parse newly-added rows (the hook serialises internally).
  useEffect(() => {
    state.files.forEach((row) => {
      if (row.parse.status !== 'parsing' || parsingRef.current.has(row.id)) return;
      const file = filesRef.current.get(row.id);
      if (!file) return;
      parsingRef.current.add(row.id);
      const ext = file.name.toLowerCase().split('.').pop();
      // STL uses the fast off-thread worker; OBJ/3MF parse via three loaders.
      const parsing = ext === 'obj' || ext === '3mf' ? parseModel(file) : parse(file);
      parsing
        .then((result) => dispatch({ type: 'FILE_PARSED', id: row.id, result }))
        .catch((err: { message?: string }) =>
          dispatch({ type: 'FILE_PARSE_ERROR', id: row.id, message: String(err?.message ?? 'Parse failed') }),
        );
    });
  }, [state.files, parse]);

  const result: QuoteResult | null = useMemo(() => {
    const parsed = state.files.filter((f) => f.parse.status === 'done');
    if (parsed.length === 0) return null;
    const fileInputs: FileInput[] = parsed.map((row) => {
      if (row.parse.status !== 'done') throw new Error('unreachable');
      return {
        massGrams: computeMass(row.parse.result.volumeMm3, row.config.materialKey),
        materialKey: row.config.materialKey,
        layerHeight: row.config.layerHeight,
        finish: row.config.finish,
        multicolor: row.config.multicolor,
        qty: row.config.qty,
      };
    });
    try {
      return quote({ files: fileInputs, rush: state.rush, promo: state.appliedPromo });
    } catch {
      return null;
    }
  }, [state.files, state.rush, state.appliedPromo]);

  const { canContinue, blockedReason } = useMemo(() => {
    if (state.files.length === 0) return { canContinue: false, blockedReason: null };
    if (state.files.find((f) => f.parse.status === 'parsing'))
      return { canContinue: false, blockedReason: 'Wait for parsing to finish.' };
    if (state.files.find((f) => f.parse.status === 'error'))
      return { canContinue: false, blockedReason: 'One or more files failed to parse.' };
    const oversized = state.files.find(
      (f) => f.parse.status === 'done' && f.parse.result.bboxSize.some((d) => d > 256),
    );
    if (oversized) return { canContinue: false, blockedReason: 'A part exceeds the 256mm build envelope.' };
    return { canContinue: true, blockedReason: null };
  }, [state.files]);

  const [checkout, setCheckout] = useState<CheckoutState>({ phase: 'idle' });
  const [addr, setAddr] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [addrErrors, setAddrErrors] = useState<Partial<Record<AddressField, string>>>({});
  const setField = (k: AddressField) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddr((a) => ({ ...a, [k]: e.target.value }));
  const field = (k: AddressField, label: string, placeholder?: string, inputMode?: 'numeric' | 'tel' | 'email') => (
    <label className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <input type="text" value={addr[k] ?? ''} onChange={setField(k)} placeholder={placeholder} inputMode={inputMode} />
      {addrErrors[k] && <span className={clsx(styles.warning, styles.fieldError)}>{addrErrors[k]}</span>}
    </label>
  );
  const busy = checkout.phase === 'creating' || checkout.phase === 'awaiting' || checkout.phase === 'confirming';

  const onContinue = useCallback(async () => {
    const doneFiles = state.files.filter((f) => f.parse.status === 'done');
    if (doneFiles.length === 0) {
      setCheckout({ phase: 'error', message: 'Add at least one file before checking out.' });
      return;
    }
    const orderFiles = doneFiles
      .map((row) => ({ file: filesRef.current.get(row.id), config: row.config }))
      .filter((x): x is { file: File; config: typeof x.config } => !!x.file);
    if (orderFiles.length !== doneFiles.length) {
      setCheckout({ phase: 'error', message: 'Could not read one of the files. Please re-add it.' });
      return;
    }
    const av = validateAddress(addr);
    setAddrErrors(av.fieldErrors);
    if (!av.ok) {
      setCheckout({ phase: 'error', message: 'Please complete the shipping address below.' });
      return;
    }
    setCheckout({ phase: 'creating' });
    try {
      // The SERVER reprices from its own volume measurement of every file; we send no amount.
      const order = await createOrder(orderFiles, { rush: state.rush, promo: state.appliedPromo, address: addr });
      await loadRazorpay();
      setCheckout({ phase: 'awaiting' });
      openCheckout({
        order,
        onSuccess: async () => {
          // The browser cannot self-confirm — poll until the verified webhook flips it.
          setCheckout({ phase: 'confirming', code: order.order_code });
          const outcome = await pollUntilPaid(order.order_code);
          setCheckout(outcome === 'paid' ? { phase: 'paid', code: order.order_code } : { phase: 'confirming', code: order.order_code });
        },
        onDismiss: () => setCheckout({ phase: 'idle' }),
      });
    } catch (err) {
      setCheckout({ phase: 'error', message: (err as Error).message });
    }
  }, [state.files, state.rush, state.appliedPromo, addr]);

  const onDownloadPdf = useCallback(async () => {
    const files = state.files
      .map((r) =>
        r.parse.status === 'done'
          ? {
              filename: r.fileName,
              volumeMm3: r.parse.result.volumeMm3,
              bboxSize: r.parse.result.bboxSize,
              triangleCount: r.parse.result.triangleCount,
              config: r.config,
            }
          : null,
      )
      .filter(Boolean);
    if (!files.length) return;
    const res = await fetch('/api/quote/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files, rush: state.rush, promo: state.appliedPromo }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'printgrid-quote.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [state.files, state.rush, state.appliedPromo]);

  const onRemove = useCallback((id: string) => {
    filesRef.current.delete(id);
    parsingRef.current.delete(id);
    dispatch({ type: 'REMOVE_FILE', id });
  }, []);

  const fileCount = state.files.filter((f) => f.parse.status === 'done').length;
  const activeRow = state.files.find((f) => f.parse.status === 'done');
  const activeFile = activeRow ? filesRef.current.get(activeRow.id) : undefined;

  return (
    <>
      <section className={styles.head}>
        <div className="wrap">
          <Reveal>
            <div className={styles.eyebrow}>Quote · live calculator</div>
            <h1 className={styles.title}>Drop a file. See a price.</h1>
            <p className={styles.lede}>
              STLs are parsed in your browser. Nothing leaves your device until you check out. The
              number on the right is the number you pay — including 18% GST and the 2% payment fee.
            </p>
          </Reveal>
        </div>
      </section>

      <section className={styles.section}>
        <div className="wrap">
          {checkout.phase !== 'idle' && (
            <div
              role="status"
              aria-live="polite"
              className={clsx(
                styles.banner,
                checkout.phase === 'paid' && styles.bannerPaid,
                checkout.phase === 'error' && styles.bannerError,
              )}
            >
              {checkout.phase === 'creating' && 'Creating your order…'}
              {checkout.phase === 'awaiting' && 'Opening the secure Razorpay window…'}
              {checkout.phase === 'confirming' && (
                <>
                  <strong>Payment received — confirming with our server.</strong> Your order isn&rsquo;t
                  marked paid until we verify it. This updates automatically (order {checkout.code}).
                </>
              )}
              {checkout.phase === 'paid' && (
                <>
                  <strong>Paid ✓</strong> Order {checkout.code} is confirmed — a confirmation email is
                  on its way.
                </>
              )}
              {checkout.phase === 'error' && <>Checkout error: {checkout.message}</>}
            </div>
          )}

          <div className={styles.grid}>
            {/* Left: upload + per-file controls */}
            <Reveal className={styles.col}>
              {activeRow && activeRow.parse.status === 'done' && activeFile && (
                <StlViewer
                  file={activeFile}
                  materialKey={activeRow.config.materialKey}
                  triangleCount={activeRow.parse.result.triangleCount}
                />
              )}
              <AgentInput placeholders={DROPZONE_HINTS}>
                <label
                  className={clsx(styles.dropzone, dropActive && styles.dropzoneOver)}
                  onDrop={(e) => { e.preventDefault(); setDropActive(false); acceptFiles(Array.from(e.dataTransfer.files)); }}
                  onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDropActive(false); }}
                >
                  <p className={styles.dropzoneTitle}>Drop STL, OBJ or 3MF files here</p>
                  <p className={styles.dropzoneSub}>Or click to browse</p>
                  <p className={clsx(styles.dropzoneHint, styles.mono)}>Max 100 MB each · up to 10 files</p>
                  <input
                    type="file"
                    accept=".stl,.obj,.3mf,model/stl,application/octet-stream"
                    multiple
                    className={styles.srOnly}
                    aria-label="Upload STL, OBJ or 3MF files"
                    onChange={(e) => { acceptFiles(e.target.files ? Array.from(e.target.files) : []); e.target.value = ''; }}
                  />
                </label>
              </AgentInput>

              {dropErrors.length > 0 && (
                <div role="alert" className={styles.dropErrors}>
                  {dropErrors.map((e, i) => (
                    <p className={styles.warning} key={i}>{e}</p>
                  ))}
                </div>
              )}

              {state.files.length > 0 && (
                <div className={styles.files}>
                  {state.files.map((row) => {
                    const done = row.parse.status === 'done' ? row.parse.result : null;
                    const warnings = done
                      ? analyzeManufacturability({ volumeMm3: done.volumeMm3, bboxSize: done.bboxSize, triangleCount: done.triangleCount })
                      : [];
                    return (
                      <div className={styles.fileCard} key={row.id}>
                        <div className={styles.fileCardHeader}>
                          <span className={styles.fileCardName}>{row.fileName}</span>
                          <button className={styles.fileRemove} type="button" aria-label="Remove file" onClick={() => onRemove(row.id)}>×</button>
                        </div>
                        <div className={clsx(styles.fileCardStats, styles.mono)}>
                          {row.parse.status === 'parsing' && 'Parsing…'}
                          {row.parse.status === 'error' && row.parse.message}
                          {done && `${done.triangleCount.toLocaleString()} tris · ${(done.volumeMm3 / 1000).toFixed(1)} cm³ · ${done.bboxSize.map((d) => d.toFixed(0)).join('×')} mm`}
                        </div>
                        {warnings.map((w) => (
                          <p className={clsx(styles.warning, w.severity === 'error' && styles.warningError, w.severity === 'info' && styles.warningInfo)} key={w.code}>{w.message}</p>
                        ))}

                        <div className={styles.controls}>
                          <label className={styles.row}>
                            <span className={styles.rowLabel}>Material</span>
                            <select
                              value={row.config.materialKey}
                              onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', id: row.id, patch: { materialKey: e.target.value as MaterialKey } })}
                            >
                              {MATERIAL_KEYS.map((k) => (
                                <option key={k} value={k}>{MATERIALS[k].name} · {formatINR(MATERIALS[k].ratePerGramPaise)}/g</option>
                              ))}
                            </select>
                          </label>
                          <label className={styles.row}>
                            <span className={styles.rowLabel}>Layer height</span>
                            <select
                              value={row.config.layerHeight}
                              onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', id: row.id, patch: { layerHeight: e.target.value as LayerHeight } })}
                            >
                              {LAYER_HEIGHTS.map((h) => <option key={h} value={h}>{h} mm</option>)}
                            </select>
                          </label>
                          <label className={styles.row}>
                            <span className={styles.rowLabel}>Finish</span>
                            <select
                              value={row.config.finish}
                              onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', id: row.id, patch: { finish: e.target.value as Finish } })}
                            >
                              {FINISH_KEYS.map((f) => (
                                <option key={f} value={f}>{FINISH_LABELS[f]}{FINISHES[f] ? ` · +${formatINR(FINISHES[f])}` : ''}</option>
                              ))}
                            </select>
                          </label>
                          <label className={styles.row}>
                            <span className={styles.rowLabel}>Quantity</span>
                            <input
                              type="number"
                              min={1}
                              value={row.config.qty}
                              onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', id: row.id, patch: { qty: Math.max(1, parseInt(e.target.value, 10) || 1) } })}
                            />
                          </label>
                        </div>
                        <label className={clsx(styles.row, styles.rowCheck)}>
                          <input
                            type="checkbox"
                            checked={row.config.multicolor}
                            onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', id: row.id, patch: { multicolor: e.target.checked } })}
                          />
                          <span>Multi-colour (+20%)</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}

              {state.files.length > 0 && (
                <div className={clsx(styles.fileCard, styles.addressCard)}>
                  <div className={styles.fileCardHeader}>
                    <span className={styles.fileCardName}>Shipping address</span>
                  </div>
                  <div className={styles.controls}>
                    {field('name', 'Full name')}
                    {field('phone', 'Phone', '10-digit mobile', 'tel')}
                  </div>
                  {field('email', 'Email (for confirmation)', 'you@example.com', 'email')}
                  {field('line1', 'Address line 1')}
                  {field('line2', 'Address line 2 (optional)')}
                  <div className={styles.controls}>
                    {field('city', 'City')}
                    {field('state', 'State')}
                  </div>
                  {field('pincode', 'PIN code', '6 digits', 'numeric')}
                </div>
              )}
            </Reveal>

            {/* Right: price card */}
            <Reveal className={styles.col} delay={0.1}>
              <div className={styles.card}>
                <div className="quote-print-only">
                  <strong>PrintGrid Studio — Quote</strong>
                  <div className={clsx(styles.mono, styles.cardCaption)}>FDM 3D printing · Chennai · printgrid.co.in</div>
                </div>
                <div className={styles.totalHeadline}>{result ? formatINR(result.grandTotalPaise) : '—'}</div>
                <div className={styles.totalCaption}>Total · incl. GST</div>

                {!result && <p className={styles.cardEmpty}>Upload an STL to see your price.</p>}

                {result && (
                  <>
                    <div className={styles.cardLine}>
                      <div className={styles.rowLine}><span>Subtotal ({fileCount} file{fileCount === 1 ? '' : 's'})</span><span className={styles.mono}>{formatINR(result.subtotalPaise)}</span></div>
                      {result.rushFeePaise > 0 && <div className={styles.rowLine}><span>Rush (+25%)</span><span className={styles.mono}>{formatINR(result.rushFeePaise)}</span></div>}
                      {result.promoDiscountPaise > 0 && <div className={clsx(styles.rowLine, styles.rowLineDiscount)}><span>Promo {result.appliedPromo}</span><span className={styles.mono}>−{formatINR(result.promoDiscountPaise)}</span></div>}
                      <div className={styles.rowLine}><span>Shipping</span><span className={styles.mono}>{result.shippingPaise === 0 ? 'Free' : formatINR(result.shippingPaise)}</span></div>
                      <div className={styles.rowLine}><span>GST (18%)</span><span className={styles.mono}>{formatINR(result.gstTotalPaise)}</span></div>
                      <div className={styles.rowLine}><span>Payment fee (2%)</span><span className={styles.mono}>{formatINR(result.paymentFeePaise)}</span></div>
                    </div>
                    <div className={styles.cardLine}>
                      <div className={clsx(styles.rowLine, styles.rowLineStrong)}><span>Total</span><span className={styles.mono}>{formatINR(result.grandTotalPaise)}</span></div>
                    </div>
                  </>
                )}

                <label className={clsx(styles.row, styles.rowCheck, styles.rushRow)}>
                  <input type="checkbox" checked={state.rush} onChange={() => dispatch({ type: 'TOGGLE_RUSH' })} />
                  <span>Rush — print first (+25%)</span>
                </label>

                <div className={styles.row}>
                  <span className={styles.rowLabel}>Promo code</span>
                  <div className={styles.promoRow}>
                    <input
                      type="text"
                      value={state.promoInput}
                      placeholder="FIRSTPRINT"
                      onChange={(e) => dispatch({ type: 'SET_PROMO_INPUT', value: e.target.value })}
                      className={styles.promoInput}
                    />
                    {state.appliedPromo ? (
                      <button type="button" className={styles.ctaSecondary} onClick={() => dispatch({ type: 'CLEAR_PROMO' })}>Clear</button>
                    ) : (
                      <button type="button" className={styles.ctaSecondary} onClick={() => dispatch({ type: 'APPLY_PROMO' })}>Apply</button>
                    )}
                  </div>
                  {state.promoError && <p className={clsx(styles.warning, styles.promoNote)}>{state.promoError}</p>}
                  {state.appliedPromo && <p className={clsx(styles.cardCaption, styles.mono, styles.promoNote)}>{state.appliedPromo} applied</p>}
                </div>

                <button type="button" className={styles.cta} onClick={onContinue} disabled={!canContinue || busy}>
                  {busy ? 'Working…' : 'Continue to payment'}
                </button>
                {blockedReason && <p className={styles.cardCaption}>{blockedReason}</p>}
                {result && (
                  <button type="button" className={clsx(styles.ctaSecondary, 'quote-print-hide')} onClick={onDownloadPdf}>
                    Download PDF report
                  </button>
                )}
                {result && (
                  <button type="button" className={clsx(styles.ctaSecondary, 'quote-print-hide')} onClick={() => window.print()}>
                    Print quote
                  </button>
                )}
                <p className={styles.cardCaption}>
                  The charged amount is recomputed on our server from the file&rsquo;s true volume.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Create `apps/web/app/quote/page.module.css`**

```css
/* apps/web/app/quote/page.module.css */
.page {
  background: var(--canvas);
  color: var(--text);
  min-height: 100vh;
}
```

- [ ] **Step 5: Replace `apps/web/app/quote/page.tsx` in full**

```tsx
// apps/web/app/quote/page.tsx
import type { Metadata } from 'next';
import { QuotePage } from './QuotePage';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Quote',
  description:
    'Drop an STL, pick material and finish, see the price. PrintGrid Studio quotes are calculated in your browser — nothing uploads until you check out.',
};

export default function QuoteRoute() {
  return (
    <div className={styles.page}>
      <QuotePage />
    </div>
  );
}
```

(Note: this drops the `<Section bg="ink" gridPaper>` wrapper — confirmed via grep that no other route imports `@/components/ui/Section`, so `Section.tsx` becomes unused-but-present, same "leave in place" convention as `ThemeToggle.tsx`. Do not delete `Section.tsx`.)

- [ ] **Step 6: Run the characterization suite and confirm it is still fully green**

Run: `pnpm --filter web test -- quote-page`
Expected: PASS (10/10) — unchanged from Task 1. If a label/placeholder-based query breaks because CSS-Module class hashing changed something the test located by class name (none should — the Task 1 suite was written to query by label/placeholder/role/text, not class name, specifically to survive this), investigate before assuming the test needs changing.

- [ ] **Step 7: Run typecheck**

Run: `pnpm --filter web typecheck`
Expected: exit 0

- [ ] **Step 8: Commit**

```bash
git add apps/web/app/quote/QuotePage.tsx apps/web/app/quote/QuotePage.module.css apps/web/app/quote/page.tsx apps/web/app/quote/page.module.css
git commit -m "feat: reskin Quote page with AgentInput dropzone and Pango-inspired dark theme"
```

---

### Task 3: Phase 5 validation gate (final phase)

**Files:** None (verification only, no commit).

- [ ] **Step 1: Full test suite**

Run: `pnpm --filter web test`
Expected: all test files pass, including every pre-existing suite plus the 10 new `quote-page` tests.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: exit 0

- [ ] **Step 3: Build**

Run: `pnpm --filter web build`
Expected: exit 0, all routes compile including `/quote`.

- [ ] **Step 4: Report**

Report the exact pass/fail counts. A real-browser check of `/quote` is done separately by the controller: a hand-built minimal valid binary STL file is uploaded through the real dropzone (exercising the real parser worker, real price computation, and real manufacturability warnings) to confirm the full upload → parse → price flow renders correctly end-to-end. The controller will NOT click "Continue to payment" (that invokes real Razorpay/order-creation) — checkout-flow correctness is already covered by Task 1's mocked tests and Task 2's code review.
