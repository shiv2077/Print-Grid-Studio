# Pango Revamp Phase 2 — Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the homepage (`apps/web/app/page.tsx`) in the dark/teal Pango-inspired palette from Phase 1, with scroll-triggered reveals and spring-hover cards, while keeping every piece of content, every link/href, and both in-page anchor ids (`#how-it-works`, `#pricing`) byte-identical to today.

**Architecture:** A new page-scoped CSS Module (`page.module.css`) replaces the global `.hero`/`.section`/`.feature-grid` classnames for this page only — those globals stay untouched in `globals.css` since `app/v2/page.tsx` still depends on them. A new shared `Reveal` component (scroll-triggered fade/slide via `motion`'s `whileInView`, reduced-motion aware) wraps each section; the existing `Card` component (Phase 1) replaces the plain `.feature` divs in the "How it works" grid. `page.tsx` stays a Server Component — `Reveal` and `Card` each declare their own `'use client'` boundary, so no hook usage leaks into the page itself.

**Tech Stack:** Next.js 14 App Router, React Server Components, `motion` (already a dependency from Phase 1), CSS Modules, Vitest + `@testing-library/react`.

## Global Constraints

- No changes to `apps/web/lib/server/**`, `apps/web/app/api/**`, or `apps/web/app/quote/state.ts`.
- No changes to `apps/web/app/v2/**` or `apps/web/app/layout.tsx`.
- Do not modify or remove any existing rule in `apps/web/app/globals.css` (`.hero`, `.section`, `.feature-grid`, `.rowlist`, `.cta-band`, `.btn*`, etc.) — they are additive-only leftovers still used by `app/v2/page.tsx`; this phase only stops referencing them from `app/page.tsx`.
- Every new animation must have a static, non-animated fallback under `prefers-reduced-motion: reduce`, matching the `useReducedMotion` pattern already used in `Card.tsx` and `AgentInput.tsx`.
- Every existing piece of homepage copy, every link `href`, and the two anchor ids (`how-it-works`, `pricing`) referenced by `Header`'s nav (`/#how-it-works`, `/#pricing`) must be preserved exactly — this is the acceptance bar for "no fundamental logic/feature changed."
- Design tokens in use (already defined in `globals.css` from Phase 1): `--canvas`, `--surface`, `--text`, `--text-secondary`, `--text-muted`, `--accent-teal`, `--accent-teal-strong`, `--line`, `--line-strong`, `--font-sans`, `--font-mono`. The generic `.wrap` class (`apps/web/app/globals.css:96`) is purely structural (max-width + centering, no color) and is safe to keep reusing.

---

### Task 1: `Reveal` — shared scroll-triggered reveal wrapper

**Files:**
- Create: `apps/web/components/ui/Reveal.tsx`
- Test: `apps/web/tests/reveal.test.tsx`

**Interfaces:**
- Produces: `Reveal` — `function Reveal({ children, className, delay }: { children: React.ReactNode; className?: string; delay?: number }): JSX.Element`. Later tasks in this plan import it as `import { Reveal } from '@/components/ui/Reveal'`.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/tests/reveal.test.tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test -- reveal`
Expected: FAIL — `Cannot find module '@/components/ui/Reveal'` (or similar), since the file doesn't exist yet.

- [ ] **Step 3: Write the component**

```tsx
// apps/web/components/ui/Reveal.tsx
'use client';

import { motion, useReducedMotion } from 'motion/react';

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test -- reveal`
Expected: PASS (4/4)

- [ ] **Step 5: Run typecheck**

Run: `pnpm --filter web typecheck`
Expected: exit 0

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/ui/Reveal.tsx apps/web/tests/reveal.test.tsx
git commit -m "feat: add Reveal scroll-triggered animation wrapper for Pango-inspired revamp"
```

---

### Task 2: Homepage reskin — dark CSS Module + rewritten `page.tsx`

**Files:**
- Create: `apps/web/app/page.module.css`
- Modify: `apps/web/app/page.tsx` (full replacement)
- Test: `apps/web/tests/homepage.test.tsx`

**Interfaces:**
- Consumes: `Reveal` from Task 1 (`import { Reveal } from '@/components/ui/Reveal'`); `Card` from Phase 1 (`import { Card } from '@/components/ui/Card'`, props `{ children, className? }`).

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/tests/homepage.test.tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test -- homepage`
Expected: FAIL — the current `page.tsx` doesn't yet have the new structure (test file itself will still resolve since `app/page.tsx` already exists, but content/anchor assertions are fine either way this step just proves the harness runs; the meaningful RED is the *next* step's CSS Module import not existing yet inside the rewritten file). Note: this step is allowed to pass trivially against the OLD page.tsx (the copy/links/ids are today identical) — the real regression protection comes from keeping this test green through the rewrite in Step 3, run again in Step 4.

- [ ] **Step 3: Create the CSS Module**

```css
/* apps/web/app/page.module.css */
.page {
  background: var(--canvas);
  color: var(--text);
}

.hero {
  padding: 96px 0 80px;
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
  font-size: clamp(2.5rem, 5vw, 4rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--text);
  margin: 0 0 24px;
  max-width: 20ch;
}

.lede {
  font-size: 18px;
  line-height: 1.6;
  color: var(--text-secondary);
  max-width: 56ch;
  margin: 0 0 32px;
}

.actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.btnPrimary {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 15px;
  padding: 14px 24px;
  border-radius: 10px;
  background: var(--accent-teal-strong);
  color: #fff;
  display: inline-block;
}

.btnPrimary:hover {
  background: var(--accent-teal);
}

.btnGhost {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 15px;
  padding: 14px 24px;
  border-radius: 10px;
  border: 1px solid var(--line-strong);
  color: var(--text);
  display: inline-block;
}

.btnGhost:hover {
  border-color: var(--accent-teal);
  color: var(--accent-teal);
}

.section {
  padding: 80px 0;
  border-top: 1px solid var(--line);
}

.sectionHead {
  max-width: 640px;
  margin: 0 0 48px;
}

.sectionTitle {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  letter-spacing: -0.01em;
  color: var(--text);
  margin: 8px 0 12px;
}

.stepGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.stepNum {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--accent-teal);
  display: block;
  margin-bottom: 12px;
}

.stepTitle {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 18px;
  color: var(--text);
  margin: 0 0 8px;
}

.stepBody {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
}

.rowlist {
  display: flex;
  flex-direction: column;
}

.rowlistRow {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
  font-family: var(--font-mono);
  font-size: 14px;
}

.rowlistRow:last-child {
  border-bottom: none;
}

.rowlistLabel {
  color: var(--text-secondary);
}

.rowlistValue {
  color: var(--text);
}

.ctaBand {
  padding: 96px 0;
  text-align: center;
  border-top: 1px solid var(--line);
}

.ctaTitle {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: clamp(1.75rem, 4vw, 3rem);
  color: var(--text);
  margin: 0 0 16px;
}

.ctaLede {
  font-size: 17px;
  color: var(--text-secondary);
  max-width: 48ch;
  margin: 0 auto 32px;
}
```

- [ ] **Step 4: Replace `page.tsx` in full**

```tsx
// apps/web/app/page.tsx
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Reveal } from '@/components/ui/Reveal';
import styles from './page.module.css';

const STEPS = [
  {
    num: '01',
    title: 'Upload your STL',
    body: 'Drop an STL in the browser. We parse the actual mesh — volume, bounding box, triangle count — right on your device. Nothing is uploaded until you order.',
  },
  {
    num: '02',
    title: 'See a real price',
    body: 'Pick a material, layer height and finish. The price is computed from your model’s true volume — no “contact us for a quote”, no guessing. Including 18% GST and the payment fee.',
  },
  {
    num: '03',
    title: 'Pay and we print',
    body: 'Pay over UPI through Razorpay. We print on calibrated FDM machines in Chennai and ship pan-India in four days, with tracking on every order.',
  },
];

const PRICING_ROWS = [
  { label: 'Material', value: 'Per-gram rate × printed mass' },
  { label: 'Setup fee', value: '₹100 / file' },
  { label: 'Rush turnaround', value: '+25% (optional)' },
  { label: 'GST', value: '18%' },
  { label: 'Shipping', value: '₹120 · free over ₹2,500' },
  { label: 'Payment processing', value: '2%' },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="wrap">
          <Reveal>
            <div className={styles.eyebrow}>FDM only · Chennai</div>
            <h1 className={styles.title}>FDM 3D printing. Quoted live. Printed locally.</h1>
            <p className={styles.lede}>
              Upload an STL, pick a material, and see a real price computed from the actual mesh in
              under a minute. Pay over UPI. Ships pan-India in four days.
            </p>
            <div className={styles.actions}>
              <Link className={styles.btnPrimary} href="/quote">
                Upload STL · See live price
              </Link>
              <Link className={styles.btnGhost} href="/materials">
                Browse materials
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className={styles.section}>
        <div className="wrap">
          <Reveal className={styles.sectionHead}>
            <div className={styles.eyebrow}>How it works</div>
            <h2 className={styles.sectionTitle}>Three steps. No back-and-forth.</h2>
            <p className={styles.lede}>
              The quote you see is the price you pay. The mesh is measured, not estimated.
            </p>
          </Reveal>
          <div className={styles.stepGrid}>
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 0.1}>
                <Card>
                  <span className={styles.stepNum}>{s.num}</span>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepBody}>{s.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Materials teaser */}
      <section className={styles.section}>
        <div className="wrap">
          <Reveal className={styles.sectionHead}>
            <div className={styles.eyebrow}>Materials</div>
            <h2 className={styles.sectionTitle}>Seven FDM materials, kept in stock.</h2>
            <p className={styles.lede}>
              PLA+, PLA LW, PETG, ABS, TPU 95A, PA6 and PA-CF — from everyday brackets to
              engineering-grade carbon-filled nylon. No “available on request”.
            </p>
            <Link className={styles.btnGhost} href="/materials">
              See materials &amp; specs →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Pricing transparency */}
      <section id="pricing" className={styles.section}>
        <div className="wrap">
          <Reveal className={styles.sectionHead}>
            <div className={styles.eyebrow}>Pricing</div>
            <h2 className={styles.sectionTitle}>Every rupee, on the table.</h2>
            <p className={styles.lede}>No hidden fees. Here is exactly what goes into the number you pay.</p>
          </Reveal>
          <Reveal className={styles.rowlist}>
            {PRICING_ROWS.map((r) => (
              <div className={styles.rowlistRow} key={r.label}>
                <span className={styles.rowlistLabel}>{r.label}</span>
                <span className={styles.rowlistValue}>{r.value}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.ctaBand}>
        <div className="wrap">
          <Reveal>
            <h2 className={styles.ctaTitle}>Got an STL? Get a price right now.</h2>
            <p className={styles.ctaLede}>
              Drop your file, see the number, and pay over UPI. Printed in Chennai, shipped pan-India
              in four days.
            </p>
            <Link className={styles.btnPrimary} href="/quote">
              Upload STL · See live price
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter web test -- homepage`
Expected: PASS (5/5)

- [ ] **Step 6: Run typecheck**

Run: `pnpm --filter web typecheck`
Expected: exit 0

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/page.tsx apps/web/app/page.module.css apps/web/tests/homepage.test.tsx
git commit -m "feat: reskin homepage in Pango-inspired dark/teal theme with scroll reveals"
```

---

### Task 3: Phase 2 validation gate

**Files:** None (verification only, no commit).

- [ ] **Step 1: Full test suite**

Run: `pnpm --filter web test`
Expected: all test files pass, including every pre-existing suite plus `reveal.test.tsx` and `homepage.test.tsx`.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: exit 0

- [ ] **Step 3: Build**

Run: `pnpm --filter web build`
Expected: exit 0, no type or lint errors, all routes compile including `/`.

- [ ] **Step 4: Report**

Report the exact pass/fail counts from Steps 1–3. A real-browser visual check of `/` (screenshot) is done separately by the controller outside this plan, using the working Playwright script already set up in this session — Phase 1 showed that curl/HTML-only checks miss real layout bugs (fixed-vs-sticky width collapse), so this phase's visual sign-off happens via an actual rendered screenshot, not approximated here.
