# Pango Revamp Phase 4 — Orders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin `/orders/[code]` in the dark/teal Pango-inspired palette and turn the fulfillment timeline into an animated, scroll-revealed connective path ("the order status feels like a live journey"), while keeping the fetch/state logic, the timeline's done/current computation, and every rendered fact (status, amount, timestamps, notes, links) exactly as they are today.

**Architecture:** Task 1 writes NEW characterization tests against today's `OrderPage` (no test currently exists for this component — only `lib/server/fulfillment.ts`'s admin-update logic is tested, which is unrelated and off-limits). `getOrderStatus` (from `@/lib/checkout`, a client-side `fetch('/api/orders/...')` wrapper) is mocked so the tests never hit a real network or database. Task 2 reskins the component: a new CSS Module replaces `.page-head`/`.order-card`/`.order-status`/`.timeline__*`/`.quote-card__total-*` references (all left untouched in `globals.css` since `about`/`contact`/`terms`/`privacy`/`refund`/`shipping`/`quote/QuotePage.tsx` still depend on them), and each timeline row's existing connecting-line pseudo-element becomes a real `motion.span` that grows in via `whileInView` (reusing the exact proven pattern from `Reveal` and the Materials detail-panel), plus a pulsing ring on the current step. Task 3 validates with a real browser check — using Playwright's request mocking (`page.route`) to fake `/api/orders/*` responses for several fulfillment states, since this project's dev environment points at a real, live database that must not be touched for a visual check.

**Tech Stack:** Next.js 14 App Router (Client Component, unchanged), `motion` (already a dependency), CSS Modules, Vitest + `@testing-library/react`.

## Global Constraints

- No changes to `apps/web/lib/server/**`, `apps/web/app/api/**`, or `apps/web/app/quote/state.ts`.
- No changes to `apps/web/app/v2/**`, `apps/web/app/layout.tsx`, or `apps/web/app/globals.css` — `.page-head`, `.quote-card__total-headline`, `.quote-card__total-caption`, `.btn`/`.btn-ghost` there are shared by other still-light pages (`about`, `contact`, `terms`, `privacy`, `refund`, `shipping`, `quote/QuotePage.tsx`); this phase only stops referencing them from `orders/[code]/page.tsx`.
- **No behavior change** to: `params.code.toUpperCase()`, the `loading`/`found`/`notfound`/`error` state machine, the `useEffect` fetch (including its `active` cleanup-flag guard against a stale response after unmount), `getOrderStatus`'s call signature, the `Timeline` component's `currentIdx`/`byStatus`/`done`/`isCurrent` computation, `PAYMENT_LABEL`, or `fmt()`. Only `className` (via a new CSS Module) and additive `motion` wrappers around the connecting line and the current-step indicator may change.
- Every animation must have a static, non-animated fallback under `prefers-reduced-motion: reduce`.
- Do not seed, query, or write to the real database configured in this environment (`apps/web/.env.local`'s `DATABASE_URL` points at a live Supabase Postgres instance) for any verification step — the controller's browser check in Task 3 uses request mocking instead.
- Design tokens available from Phase 1: `--canvas`, `--surface`, `--text`, `--text-secondary`, `--text-muted`, `--accent-teal`, `--accent-teal-strong`, `--line`, `--line-strong`, `--font-sans`, `--font-mono`.
- The 9 fixed fulfillment statuses, in order (from `apps/web/lib/fulfillment-status.ts`, unchanged): `uploaded, under_review, approved, printing, post_processing, quality_check, packed, shipped, delivered`.

---

### Task 1: Characterization tests for today's `OrderPage` (no production code changes)

**Files:**
- Create: `apps/web/tests/order-page.test.tsx`

**Interfaces:**
- Consumes: `OrderPage` (default export) from `apps/web/app/orders/[code]/page.tsx`, unchanged in this task — `import OrderPage from '@/app/orders/[code]/page'`. Mocks `getOrderStatus` from `@/lib/checkout`.

- [ ] **Step 1: Write the test file**

```tsx
// apps/web/tests/order-page.test.tsx
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
    await waitFor(() => expect(screen.getByText("Couldn't load this order.")).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run the tests against today's unmodified component**

Run: `pnpm --filter web test -- order-page`
Expected: PASS (6/6) — this is a characterization suite, not classic TDD. If a test's assumption about current rendering is wrong (e.g., exact text), fix the TEST to match actual current behavior — do not change `OrderPage`/`Timeline` in this task. (Note: the `uploadedRow?.className` assertion is intentionally loose (`is-?[Dd]one|Done`) since Task 2 will rename the done-state className — if it fails to match today's `is-done` string, adjust the regex to fit today's exact className, not the component.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/tests/order-page.test.tsx
git commit -m "test: characterize current OrderPage/Timeline behavior before Pango reskin"
```

---

### Task 2: Reskin `OrderPage` with an animated connective timeline

**Files:**
- Create: `apps/web/app/orders/[code]/page.module.css`
- Modify: `apps/web/app/orders/[code]/page.tsx` (full replacement)

**Interfaces:**
- No new exports consumed from elsewhere; this is a leaf page.

- [ ] **Step 1: Confirm the characterization suite from Task 1 is still green before starting**

Run: `pnpm --filter web test -- order-page`
Expected: PASS (6/6)

- [ ] **Step 2: Create the CSS Module**

```css
/* apps/web/app/orders/[code]/page.module.css */
.head {
  background: var(--canvas);
  color: var(--text);
  border-bottom: 1px solid var(--line);
  padding: 64px 0;
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
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  color: var(--text);
  margin: 0 0 16px;
}

.lede {
  font-size: 17px;
  line-height: 1.6;
  color: var(--text-secondary);
  max-width: 60ch;
  margin: 0;
}

.section {
  background: var(--canvas);
  padding: 0 0 96px;
}

.loading {
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.card {
  max-width: 520px;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: var(--surface);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cardTitle {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 22px;
  color: var(--text);
  margin: 0;
}

.mutedText {
  color: var(--text-secondary);
  margin: 0;
}

.mono {
  font-family: var(--font-mono);
}

.linkGhost {
  display: inline-block;
  align-self: flex-start;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 14px;
  padding: 10px 18px;
  border-radius: 8px;
  border: 1px solid var(--line-strong);
  color: var(--text);
}

.linkGhost:hover {
  border-color: var(--accent-teal);
  color: var(--accent-teal);
}

.status {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  color: var(--text-secondary);
}

.statusPaid {
  color: var(--canvas);
  background: var(--accent-teal);
  border-color: var(--accent-teal);
}

.totalHeadline {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 32px;
  color: var(--text);
}

.totalCaption {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: -12px;
}

.timelineHeading {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 14px;
  margin-top: 8px;
  color: var(--text);
}

.timeline {
  display: flex;
  flex-direction: column;
  margin-top: 4px;
}

.row {
  position: relative;
  display: flex;
  gap: 14px;
  padding-bottom: 22px;
}

.row:last-child {
  padding-bottom: 0;
}

.connector {
  position: absolute;
  left: 5px;
  top: 16px;
  bottom: -6px;
  width: 2px;
  background: var(--line-strong);
}

.connectorDone {
  background: var(--accent-teal);
}

.dotWrap {
  position: relative;
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  margin-top: 3px;
}

.dot {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid var(--line-strong);
  background: var(--surface);
  z-index: 1;
}

.dotDone {
  background: var(--accent-teal);
  border-color: var(--accent-teal);
}

.dotPulse {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: var(--accent-teal);
}

.body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.label {
  font-size: 14px;
  color: var(--text-secondary);
}

.labelDone {
  color: var(--text);
  font-weight: 500;
}

.currentTag {
  color: var(--accent-teal);
  font-weight: 600;
}

.time {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

.note {
  font-size: 12px;
  color: var(--text-secondary);
}
```

- [ ] **Step 3: Replace `page.tsx` in full**

```tsx
// apps/web/app/orders/[code]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { formatINR } from '@printgrid/pricing';
import { getOrderStatus, type OrderStatus } from '@/lib/checkout';
import { FULFILLMENT_STATUSES, STATUS_LABELS, type FulfillmentStatus } from '@/lib/fulfillment-status';
import styles from './page.module.css';

const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Payment pending',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

function fmt(at?: string | null): string {
  if (!at) return '';
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Timeline({ order }: { order: OrderStatus }) {
  const reduceMotion = useReducedMotion();
  const current = (order.fulfillment_status ?? 'uploaded') as FulfillmentStatus;
  const currentIdx = Math.max(0, FULFILLMENT_STATUSES.indexOf(current));
  // last event per status
  const byStatus = new Map<string, { at: string; note: string | null }>();
  for (const h of order.history ?? []) byStatus.set(h.status, { at: h.at, note: h.note });

  return (
    <div className={styles.timeline} role="list" aria-label="Order progress">
      {FULFILLMENT_STATUSES.map((s, i) => {
        const ev = s === 'uploaded' ? { at: order.created_at ?? null, note: null } : byStatus.get(s) ?? null;
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const isLast = i === FULFILLMENT_STATUSES.length - 1;
        return (
          <div key={s} role="listitem" className={styles.row}>
            {!isLast && (
              <motion.span
                className={done ? `${styles.connector} ${styles.connectorDone}` : styles.connector}
                initial={reduceMotion ? false : { scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: 'top' }}
              />
            )}
            <span className={styles.dotWrap}>
              <span className={done ? `${styles.dot} ${styles.dotDone}` : styles.dot} />
              {isCurrent && !reduceMotion && (
                <motion.span
                  className={styles.dotPulse}
                  animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </span>
            <div className={styles.body}>
              <span className={done ? `${styles.label} ${styles.labelDone}` : styles.label}>
                {STATUS_LABELS[s]}
                {isCurrent && <span className={styles.currentTag}> · current</span>}
              </span>
              {ev?.at && <span className={`${styles.time} ${styles.mono}`}>{fmt(ev.at)}</span>}
              {ev?.note && <span className={styles.note}>{ev.note}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderPage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const [state, setState] = useState<'loading' | 'found' | 'notfound' | 'error'>('loading');
  const [order, setOrder] = useState<OrderStatus | null>(null);

  useEffect(() => {
    let active = true;
    getOrderStatus(code)
      .then((o) => { if (active) { setOrder(o); setState('found'); } })
      .catch((e: Error) => { if (active) setState(/not found/i.test(e.message) || /404/.test(e.message) ? 'notfound' : 'error'); });
    return () => { active = false; };
  }, [code]);

  return (
    <>
      <section className={styles.head}>
        <div className="wrap">
          <div className={styles.eyebrow}>Order</div>
          <h1 className={styles.title}>{code}</h1>
          <p className={styles.lede}>Track the status of your PrintGrid Studio order.</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className="wrap">
          {state === 'loading' && <p className={styles.loading} role="status">Loading…</p>}

          {state === 'error' && (
            <div className={styles.card} role="alert">
              <h2 className={styles.cardTitle}>Couldn&rsquo;t load this order.</h2>
              <p className={styles.mutedText}>Something went wrong reaching the server. Please try again in a moment.</p>
            </div>
          )}

          {state === 'notfound' && (
            <div className={styles.card} role="alert">
              <h2 className={styles.cardTitle}>No order matches that code.</h2>
              <p className={styles.mutedText}>
                Order codes look like <span className={styles.mono}>PG-XXXXXXXX</span>. Check the link in your
                confirmation email, or reach us on WhatsApp.
              </p>
              <a className={styles.linkGhost} href="https://wa.me/917540023670" target="_blank" rel="noopener noreferrer">
                Open WhatsApp →
              </a>
            </div>
          )}

          {state === 'found' && order && (
            <div className={styles.card}>
              <span className={order.status === 'paid' ? `${styles.status} ${styles.statusPaid}` : styles.status}>
                {PAYMENT_LABEL[order.status] ?? order.status}
              </span>
              <div className={styles.totalHeadline}>{formatINR(order.amount_paise)}</div>
              <div className={styles.totalCaption}>Order total · incl. GST</div>

              {order.status === 'pending' && (
                <p className={styles.mutedText}>
                  We&rsquo;re waiting for payment confirmation. This page updates once your payment is verified.
                </p>
              )}

              {order.status === 'paid' && (
                <>
                  <h2 className={styles.timelineHeading}>Progress</h2>
                  <Timeline order={order} />
                </>
              )}

              <a
                className={styles.linkGhost}
                href={`https://wa.me/917540023670?text=${encodeURIComponent(`Hi — about order ${code}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Question about this order →
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Run the characterization suite and confirm it is still fully green**

Run: `pnpm --filter web test -- order-page`
Expected: PASS (6/6) — if the loose `className` regex assertion from Task 1 Step 2's note needs adjusting because classNames changed shape (CSS Modules hash them, and "done" is now expressed via a second appended class rather than a suffixed string), update ONLY that one assertion's matcher in the test to check for the new done-state signal (e.g., assert on the rendered content/attributes that indicate "done" rather than parsing hashed class names) — this is adjusting a test's implementation-detail assertion, not its behavioral intent, and is allowed since Task 1 already flagged this exact class as the one hashed-classname-sensitive check.

- [ ] **Step 5: Run typecheck**

Run: `pnpm --filter web typecheck`
Expected: exit 0

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/orders/[code]/page.tsx apps/web/app/orders/[code]/page.module.css apps/web/tests/order-page.test.tsx
git commit -m "feat: reskin Orders page with animated connective fulfillment timeline"
```

(Note: Step 6 includes the test file only if Step 4 required the one allowed adjustment; if no test changes were needed, omit it from the `git add`.)

---

### Task 3: Phase 4 validation gate

**Files:** None (verification only, no commit).

- [ ] **Step 1: Full test suite**

Run: `pnpm --filter web test`
Expected: all test files pass, including every pre-existing suite plus the 6 new `order-page` tests.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: exit 0

- [ ] **Step 3: Build**

Run: `pnpm --filter web build`
Expected: exit 0, all routes compile including `/orders/[code]`.

- [ ] **Step 4: Report**

Report the exact pass/fail counts. A real-browser check of `/orders/PG-TEST1234` is done separately by the controller, using Playwright's `page.route()` to mock `/api/orders/*` responses for several fulfillment states (e.g. `printing` mid-way and `delivered` complete) and the not-found case — this project's dev environment points at a live database, so no real order lookups are performed for this check.
