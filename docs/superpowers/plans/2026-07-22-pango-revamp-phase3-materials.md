# Pango Revamp Phase 3 — Materials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin `/materials` (`MaterialsExplorer.tsx` and its `page.tsx`) in the dark/teal Pango-inspired palette, with a subtle animated reveal on the expandable detail panel — while keeping the search, flexibility-filter, column-sort, and row-expand/collapse logic **byte-for-byte identical in behavior**. This supersedes the original design spec's mention of a "Card grid" for this page: the real component is a sortable/filterable/expandable data table, not a static grid, and converting it to a card grid would remove real functionality (column sorting). Preserving existing behavior takes priority over matching that earlier, pre-inspection description.

**Architecture:** Task 1 writes a characterization test suite against **today's** `MaterialsExplorer` — it must pass unmodified, proving it locks current behavior rather than testing new behavior. Task 2 then reskins the component (new CSS Module, `clsx` for conditional classes, a `motion.div` fade-in on the detail panel) while keeping every hook, handler, and piece of business logic untouched — only `className` values change, plus one purely-additive animation wrapper. The characterization suite must stay green through that entire task. `materials/page.tsx`'s head section gets the same page-scoped-CSS-Module treatment already used for the homepage in Phase 2, reusing the shared `Reveal` component.

**Tech Stack:** Next.js 14 App Router, `clsx` (already a dependency), `motion` (already a dependency), CSS Modules, Vitest + `@testing-library/react` (`fireEvent`, no `user-event` package installed).

## Global Constraints

- No changes to `apps/web/lib/server/**`, `apps/web/app/api/**`, or `apps/web/app/quote/state.ts`.
- No changes to `apps/web/app/v2/**`, `apps/web/app/layout.tsx`, or `apps/web/app/globals.css` — `.page-head` there is shared by `about`, `contact`, `terms`, `privacy`, `refund`, `shipping`, `orders/[code]`, and `quote/QuotePage.tsx`; this phase only stops referencing it from `materials/page.tsx`, it does not touch the rule itself.
- **No behavior change of any kind** to `MaterialsExplorer`'s search, filter, sort, or row-expand logic — same state shape, same handlers, same aria attributes (`aria-sort`, `aria-expanded`, `aria-pressed`, `role="button"` on rows), same keyboard handling (Enter/Space toggles a row). Only `className` (via a new CSS Module + `clsx`) and one additive `motion.div` wrapper around the detail-panel content may change.
- Every animation must have a static, non-animated fallback under `prefers-reduced-motion: reduce`.
- Design tokens available from Phase 1: `--canvas`, `--surface`, `--text`, `--text-secondary`, `--text-muted`, `--accent-teal`, `--accent-teal-strong`, `--line`, `--line-strong`, `--font-sans`, `--font-mono`. The shared `Reveal` component (Phase 2, `@/components/ui/Reveal`) is available and should be reused for entrance animation rather than writing a new one.
- Real material data used by tests (from `apps/web/lib/materials-data.ts` / `@printgrid/pricing`, do not change): names `PLA+`, `PLA LW`, `PETG`, `ABS`, `TPU 95A`, `PA6`, `PA-CF`; costs in paise/gram `450, 1800, 600, 650, 1100, 2000, 2100` respectively (PLA+ cheapest, PA-CF priciest); flexibility `Rigid, Rigid, Semi-rigid, Rigid, Flexible, Semi-rigid, Rigid` respectively (TPU 95A is the **only** `Flexible` material); PLA+'s `use` text contains "Drone frames, brackets, and mechanical mounts"; TPU 95A's `use` text contains "Gaskets, vibration dampers".

---

### Task 1: Characterization tests for today's `MaterialsExplorer` (no production code changes)

**Files:**
- Create: `apps/web/tests/materials-explorer.test.tsx`

**Interfaces:**
- Consumes: `MaterialsExplorer` from `apps/web/app/materials/MaterialsExplorer.tsx` (unchanged in this task) — `import { MaterialsExplorer } from '@/app/materials/MaterialsExplorer'`.

- [ ] **Step 1: Write the test file**

```tsx
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
    fireEvent.change(screen.getByLabelText('Search materials'), { target: { value: 'gasket' } });
    expect(screen.getByText('TPU 95A')).toBeInTheDocument();
    expect(screen.queryByText('PLA+')).not.toBeInTheDocument();
  });

  it('shows the empty-state message when no material matches the search', () => {
    render(<MaterialsExplorer />);
    fireEvent.change(screen.getByLabelText('Search materials'), { target: { value: 'zzznomatch' } });
    expect(screen.getByText('No materials match that filter.')).toBeInTheDocument();
  });

  it('sorts by cost ascending on first click, descending on a second click', () => {
    const { container } = render(<MaterialsExplorer />);
    const costHeader = screen.getByRole('button', { name: /Cost \/ g/ });
    fireEvent.click(costHeader);
    let dataRows = container.querySelectorAll('tbody tr[role="button"]');
    expect(dataRows[0].textContent).toContain('PLA+');
    fireEvent.click(costHeader);
    dataRows = container.querySelectorAll('tbody tr[role="button"]');
    expect(dataRows[0].textContent).toContain('PA-CF');
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
```

- [ ] **Step 2: Run the tests against today's unmodified component**

Run: `pnpm --filter web test -- materials-explorer`
Expected: PASS (9/9) — this is a characterization suite, not classic TDD: it must pass against the CURRENT implementation, proving it accurately locks existing behavior. If any test fails here, the test is wrong (fix the test to match real current behavior) — do not change `MaterialsExplorer.tsx` in this task.

- [ ] **Step 3: Commit**

```bash
git add apps/web/tests/materials-explorer.test.tsx
git commit -m "test: characterize current MaterialsExplorer behavior before Pango reskin"
```

---

### Task 2: Reskin `MaterialsExplorer` and `materials/page.tsx`

**Files:**
- Create: `apps/web/app/materials/MaterialsExplorer.module.css`
- Modify: `apps/web/app/materials/MaterialsExplorer.tsx` (full replacement)
- Create: `apps/web/app/materials/page.module.css`
- Modify: `apps/web/app/materials/page.tsx` (full replacement)

**Interfaces:**
- Consumes: `Reveal` from `@/components/ui/Reveal` (Phase 2, props `{ children, className?, delay? }`).

- [ ] **Step 1: Confirm the characterization suite from Task 1 is still green before starting**

Run: `pnpm --filter web test -- materials-explorer`
Expected: PASS (9/9)

- [ ] **Step 2: Create the CSS Module for the explorer**

```css
/* apps/web/app/materials/MaterialsExplorer.module.css */
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search {
  flex: 1;
  min-width: 200px;
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  padding: 10px 12px;
}

.search::placeholder {
  color: var(--text-muted);
}

.search:focus {
  outline: none;
  border-color: var(--accent-teal);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 8px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 150ms ease, border-color 150ms ease, background 150ms ease;
}

.chip:hover {
  color: var(--text);
  border-color: var(--accent-teal);
}

.chipActive {
  background: var(--accent-teal-strong);
  color: #fff;
  border-color: var(--accent-teal-strong);
}

.tableWrap {
  overflow-x: auto;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th {
  text-align: left;
  border-bottom: 1px solid var(--line-strong);
  background: var(--surface);
}

.numCol {
  text-align: right;
}

.sortButton {
  display: block;
  width: 100%;
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-secondary);
  padding: 12px 14px;
  text-align: inherit;
  cursor: pointer;
  background: none;
  border: none;
}

.sortButton:hover {
  color: var(--accent-teal);
}

.table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);
  color: var(--text);
}

.numCell {
  text-align: right;
  font-family: var(--font-mono);
}

.row {
  cursor: pointer;
  transition: background 150ms ease;
}

.row:hover,
.rowOpen {
  background: var(--surface);
}

.row:focus-visible {
  outline: 2px solid var(--accent-teal);
  outline-offset: -2px;
}

.detailRow td {
  background: var(--surface);
  padding: 0;
}

.detail {
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detailUse {
  font-size: 14px;
  line-height: 1.55;
  color: var(--text);
  max-width: 70ch;
}

.detailSpecs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  font-size: 13px;
  color: var(--text-secondary);
}

.detailKey {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  margin-right: 6px;
}

.empty {
  text-align: center;
  color: var(--text-secondary);
  padding: 24px;
}
```

- [ ] **Step 3: Replace `MaterialsExplorer.tsx` in full**

```tsx
// apps/web/app/materials/MaterialsExplorer.tsx
'use client';

import { Fragment, useMemo, useState } from 'react';
import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';
import { formatINR } from '@printgrid/pricing';
import { MATERIAL_TABLE, FLEXIBILITIES, type MaterialInfo, type Flexibility } from '@/lib/materials-data';
import styles from './MaterialsExplorer.module.css';

type SortKey = 'name' | 'ratePerGramPaise' | 'tensileMpa' | 'maxTempC' | 'density';

const COLUMNS: { key: SortKey; label: string; numeric: boolean; render: (m: MaterialInfo) => string }[] = [
  { key: 'name', label: 'Material', numeric: false, render: (m) => m.name },
  { key: 'ratePerGramPaise', label: 'Cost / g', numeric: true, render: (m) => formatINR(m.ratePerGramPaise) },
  { key: 'tensileMpa', label: 'Tensile', numeric: true, render: (m) => `${m.tensileMpa} MPa` },
  { key: 'maxTempC', label: 'Max temp', numeric: true, render: (m) => `${m.maxTempC} °C` },
  { key: 'density', label: 'Density', numeric: true, render: (m) => `${m.density} g/cm³` },
];

export function MaterialsExplorer() {
  const [q, setQ] = useState('');
  const [flex, setFlex] = useState<Flexibility | 'All'>('All');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [asc, setAsc] = useState(true);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = MATERIAL_TABLE.filter(
      (m) =>
        (flex === 'All' || m.flexibility === flex) &&
        (needle === '' || `${m.name} ${m.use} ${m.flexibility}`.toLowerCase().includes(needle)),
    );
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return asc ? cmp : -cmp;
    });
  }, [q, flex, sortKey, asc]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setAsc((a) => !a);
    else { setSortKey(k); setAsc(true); }
  };
  const toggleOpen = (k: string) => setOpenKey((cur) => (cur === k ? null : k));

  return (
    <>
      <div className={styles.controls}>
        <input
          className={styles.search}
          type="text"
          placeholder="Search materials or uses…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search materials"
        />
        <div className={styles.chips} role="group" aria-label="Filter by flexibility">
          {(['All', ...FLEXIBILITIES] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={clsx(styles.chip, flex === f && styles.chipActive)}
              aria-pressed={flex === f}
              onClick={() => setFlex(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={c.numeric ? styles.numCol : undefined}
                  aria-sort={sortKey === c.key ? (asc ? 'ascending' : 'descending') : 'none'}
                >
                  <button type="button" className={styles.sortButton} onClick={() => toggleSort(c.key)}>
                    {c.label}
                    {sortKey === c.key ? (asc ? ' ▲' : ' ▼') : ''}
                  </button>
                </th>
              ))}
              <th>Flexibility</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <Fragment key={m.key}>
                <tr
                  className={clsx(styles.row, openKey === m.key && styles.rowOpen)}
                  tabIndex={0}
                  role="button"
                  aria-expanded={openKey === m.key}
                  onClick={() => toggleOpen(m.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleOpen(m.key); }
                  }}
                >
                  {COLUMNS.map((c) => (
                    <td key={c.key} className={c.numeric ? styles.numCell : undefined}>{c.render(m)}</td>
                  ))}
                  <td>{m.flexibility}</td>
                </tr>
                {openKey === m.key && (
                  <tr className={styles.detailRow}>
                    <td colSpan={COLUMNS.length + 1}>
                      <motion.div
                        className={styles.detail}
                        initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <p className={styles.detailUse}>{m.use}</p>
                        <div className={styles.detailSpecs}>
                          <span><span className={styles.detailKey}>Finish</span> {m.finish}</span>
                          <span><span className={styles.detailKey}>Cost</span> {formatINR(m.ratePerGramPaise)}/g</span>
                          <span><span className={styles.detailKey}>Density</span> {m.density} g/cm³</span>
                          <span><span className={styles.detailKey}>Tensile</span> {m.tensileMpa} MPa</span>
                          <span><span className={styles.detailKey}>Max temp</span> {m.maxTempC} °C</span>
                        </div>
                      </motion.div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className={styles.empty}>No materials match that filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Create the CSS Module for the page head**

```css
/* apps/web/app/materials/page.module.css */
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
  background: var(--canvas);
  padding: 0 0 96px;
}
```

- [ ] **Step 5: Replace `page.tsx` in full**

```tsx
// apps/web/app/materials/page.tsx
import type { Metadata } from 'next';
import { MaterialsExplorer } from './MaterialsExplorer';
import { Reveal } from '@/components/ui/Reveal';
import { MATERIAL_TABLE } from '@/lib/materials-data';
import { SITE_URL } from '@/lib/site';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Materials',
  description:
    "Compare PrintGrid Studio's seven FDM materials — cost, tensile strength, temperature resistance, flexibility, and typical applications.",
  alternates: { canonical: '/materials' },
};

const materialsLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'PrintGrid Studio FDM materials',
  itemListElement: MATERIAL_TABLE.map((m, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Product',
      name: `${m.name} FDM 3D printing`,
      description: m.use,
      category: '3D printing material',
      url: `${SITE_URL}/materials`,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: (m.ratePerGramPaise / 100).toFixed(2),
        availability: 'https://schema.org/InStock',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          priceCurrency: 'INR',
          price: (m.ratePerGramPaise / 100).toFixed(2),
          unitText: 'gram',
        },
      },
    },
  })),
};

export default function MaterialsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(materialsLd) }} />
      <section className={styles.head}>
        <div className="wrap">
          <Reveal>
            <div className={styles.eyebrow}>Materials</div>
            <h1 className={styles.title}>Seven FDM materials, compared.</h1>
            <p className={styles.lede}>
              Sort by cost, strength, or temperature. Filter by flexibility. Open a row for the full
              spec and what it&rsquo;s good for. All seven kept in stock.
            </p>
          </Reveal>
        </div>
      </section>

      <section className={styles.section}>
        <div className="wrap">
          <Reveal>
            <MaterialsExplorer />
          </Reveal>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 6: Run the characterization suite and confirm it is still fully green**

Run: `pnpm --filter web test -- materials-explorer`
Expected: PASS (9/9) — unchanged from Task 1, proving the reskin altered no behavior.

- [ ] **Step 7: Run typecheck**

Run: `pnpm --filter web typecheck`
Expected: exit 0

- [ ] **Step 8: Commit**

```bash
git add apps/web/app/materials/MaterialsExplorer.tsx apps/web/app/materials/MaterialsExplorer.module.css apps/web/app/materials/page.tsx apps/web/app/materials/page.module.css
git commit -m "feat: reskin Materials explorer in Pango-inspired dark/teal theme"
```

---

### Task 3: Phase 3 validation gate

**Files:** None (verification only, no commit).

- [ ] **Step 1: Full test suite**

Run: `pnpm --filter web test`
Expected: all test files pass, including every pre-existing suite plus the 9 new `materials-explorer` tests.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: exit 0

- [ ] **Step 3: Build**

Run: `pnpm --filter web build`
Expected: exit 0, all routes compile including `/materials`.

- [ ] **Step 4: Report**

Report the exact pass/fail counts. A real-browser interactive check of `/materials` (search, chip filter, column sort, row expand, keyboard toggle, screenshot) is done separately by the controller using the working Playwright script already set up in this session — not approximated here.
