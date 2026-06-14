# PrintGrid Studio — Overnight Frontend Kit v3 (Next.js)

Replaces kit v2. Same DESIGN.md. Same design-reviewer subagent. Same pricing model.
**Stack overridden from PROJECT_BRIEF.md Section 8 by user decision: Next.js 14 instead of vanilla HTML.**

Frontend-only tonight. No backend, no Razorpay, no email, no Postgres.

---

## What changes from kit v2

- `/public/*.html` → `/app/**/page.tsx` (App Router pages)
- `/css/*.css` → CSS Modules per component + `/app/globals.css` for tokens
- `/js/pricing.js` → `/lib/pricing.ts` (typed)
- `/js/stl-parser.worker.js` → `/public/stl-parser.worker.js` (unchanged, classic worker)
- DESIGN.md → unchanged
- design-reviewer subagent → unchanged
- All visual rules, anti-references, brand voice → unchanged

---

## OVERNIGHT.md (paste at repo root)

```markdown
# Overnight Build — PrintGrid Studio Frontend (Next.js)

Authoritative spec: /PROJECT_BRIEF.md (with Section 8 OVERRIDDEN — we're using Next.js)
Design contract: /DESIGN.md (unchanged, non-negotiable)

You are in Auto Mode. Do not ask permission for routine operations.

## Operating principles

1. Plan each task before executing. Write the plan to /BUILD_LOG/task-N-plan.md.
2. Commit after each task: `feat(<scope>): <what>`.
3. Run design-reviewer subagent after each task against the new files.
4. If REVISE: fix BLOCKER and MAJOR items, re-run reviewer once. Max 2 revision cycles per task. If still REVISE, write open issues to /BUILD_LOG/needs-human.md and proceed.
5. Tag the repo `night-1-task-N-complete` after each successful task.
6. Sequential. Don't skip ahead.
7. Frontend ONLY tonight. No /api routes, no Prisma, no Razorpay, no Resend, no auth, no DB. Mock all data.
8. No new dependencies beyond what each task lists. If you need one, write to needs-human.md and find a workaround.

## Stack (NON-NEGOTIABLE for v1)

- Next.js 14 App Router
- TypeScript strict (`noUncheckedIndexedAccess: true`, no `any`, no `as any`)
- CSS Modules per component + `/app/globals.css` for design tokens
- **NO Tailwind, NO styled-components, NO Emotion, NO CSS-in-JS libraries**
- next/font/google for Inter + JetBrains Mono
- React Three Fiber + Drei (only on /quote)
- React Hook Form + Zod for forms
- Classic Web Worker for STL parsing (in /public/)
- Vercel or Cloudflare Pages deploy target

## Folder structure

```
print-grid-studio/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          (home)
│   ├── globals.css
│   ├── quote/page.tsx
│   ├── materials/page.tsx
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── orders/[code]/page.tsx
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── refund/page.tsx
│   ├── shipping/page.tsx
│   └── opengraph-image.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx + Header.module.css
│   │   ├── Footer.tsx + Footer.module.css
│   │   └── StatusStrip.tsx + StatusStrip.module.css
│   ├── ui/
│   │   ├── Button.tsx + Button.module.css
│   │   ├── Section.tsx + Section.module.css
│   │   ├── Container.tsx + Container.module.css
│   │   ├── SegmentedControl.tsx
│   │   └── RevealOnScroll.tsx
│   ├── quote/
│   │   ├── Dropzone.tsx
│   │   ├── FileCard.tsx
│   │   ├── PriceBreakdown.tsx
│   │   └── StlViewer.tsx
│   └── illustrations/
│       ├── ExtruderDiagram.tsx           (inline SVG, CAD-style)
│       └── BuildEnvelopeDiagram.tsx
├── lib/
│   ├── pricing.ts                        (typed port of model B)
│   ├── stl-types.ts
│   ├── mock-orders.ts
│   └── format.ts
├── public/
│   ├── stl-parser.worker.js              (classic worker, vanilla JS)
│   ├── hero-extruder.svg                 (placeholder; real SVG built into ExtruderDiagram component)
│   └── favicon.svg
├── tests/
│   └── pricing.test.ts
├── .claude/
│   └── agents/
│       └── design-reviewer.md
├── DESIGN.md
├── PROJECT_BRIEF.md
├── OVERNIGHT.md                          (this file)
├── BUILD_LOG/
│   └── (created during run)
└── package.json
```

## Tasks

### Task 0 — Project init
- `npx create-next-app@latest . --ts --no-tailwind --eslint --app --src-dir=false --import-alias="@/*"`
- Install: `pnpm add @react-three/fiber @react-three/drei three react-hook-form zod @hookform/resolvers lucide-react clsx`
- Dev: `pnpm add -D @types/three vitest @vitest/ui @testing-library/react @testing-library/jest-dom`
- Configure `next/font/google` for Inter (weights 400, 500, 600, 700) and JetBrains_Mono (weights 400, 500). Export both from `app/layout.tsx`.
- tsconfig: strict + noUncheckedIndexedAccess + noImplicitAny.
- Vitest config + dummy passing test.
- /BUILD_LOG/ folder.
- Commit. No reviewer yet.

### Task 1 — Design tokens + globals
- `app/globals.css`: full :root from DESIGN.md (5 colors + ink tints).
- Add the 32px grid-paper SVG as a CSS background-image utility class (`.grid-paper`).
- Set body font to Inter, base 15px / line-height 1.6.
- Define typography classes: `.display`, `.display-2`, `.display-3`, `.h-eyebrow`, `.lede`, `.caption`, `.micro`, `.mono-spec`, `.mono-label`. Match the type scale table from DESIGN.md exactly.
- Focus-visible: 2px outline `--accent`, 4px offset, all interactive elements globally.
- Reduced-motion media query strips all transforms, keeps fades.
- Commit + reviewer.

### Task 2 — UI primitives
Build with CSS Modules. Each component in its own folder with `.tsx` + `.module.css`.

- **Button.tsx** — variants: `primary` (filled accent, paper text), `secondary` (1px ink outline, transparent fill), `ghost` (text + chevron). All square corners (max 2px radius). Hover inverts fg/bg or shifts border to ink. 150ms transition. NO box-shadow, NO transform, NO scale.
- **SegmentedControl.tsx** — for layer height + finish pickers. 5 buttons in a row, hairline borders between, selected = ink bg + paper text.
- **Section.tsx** — props: `bg: 'paper' | 'paper-warm' | 'ink'`, `gridPaper?: boolean`. Wraps children, padding 120px / 64px mobile.
- **Container.tsx** — max-width 1200px, gutters 32px / 24px mobile.
- **RevealOnScroll.tsx** — IntersectionObserver-based, fades children in over 200ms on viewport entry. Honors reduced-motion.
- Commit + reviewer.

### Task 3 — Layout shell
- **StatusStrip.tsx** — full-width hairline-bottom strip with mono UPPERCASE text: "CHENNAI · HYDERABAD LATE JUNE 2026 · SHIPS PAN-INDIA IN 4 DAYS"
- **Header.tsx** — wordmark left ("PRINTGRID" Inter 600 + "studio · 3d printing" mono 11px), nav right (Materials, How it works, Pricing, Contact), CTA "Get a quote →" right-most. Sticky. Hairline border-bottom. Mobile: hamburger → full-screen overlay.
- **Footer.tsx** — 4 columns desktop, stacked mobile. Col 1 wordmark + tagline. Col 2 Pages. Col 3 Legal. Col 4 Contact (WhatsApp wa.me/917540023670, email aadharsh.j10@gmail.com, Mon-Sat 10-7 IST).
- Wire into `app/layout.tsx`.
- Commit + reviewer.

### Task 4 — Pricing engine + tests
- Copy `/lib/pricing.ts` verbatim from Section "Pricing engine module" of this kit.
- Write `/tests/pricing.test.ts` with the test cases listed in Section "Pricing tests" of this kit.
- `pnpm test` must pass with all tests green.
- Commit + reviewer (no design check, just tests).

### Task 5 — STL parser worker
- Drop `/public/stl-parser.worker.js` from kit v2 Section 6 verbatim. Classic worker.
- Build `/lib/use-stl-parser.ts` — React hook wrapping the worker via postMessage. Returns `{ parse, result, error, isLoading }`.
- Test with a known cube STL (asset placeholder: write to needs-human.md if no test asset; use generated cube vertices otherwise).
- Commit + reviewer (no design).

### Task 6 — Homepage
- 7 sections per kit v2 task 2 (carry over verbatim — same content, same copy):
  1. Hero (paper bg, grid-paper motif, ExtruderDiagram on right)
  2. How it works (paper-warm, 4 numbered cards)
  3. Materials table (paper, real numbers)
  4. Build envelope (paper-warm, BuildEnvelopeDiagram on right)
  5. Pricing transparency (paper, inline breakdown example)
  6. Shipping (paper-warm, simple India SVG)
  7. Final CTA (ink bg, reverse colors)
- `app/page.tsx` is a server component. RevealOnScroll children only become client where needed.
- Real copy in brand voice. No lorem.
- Commit + reviewer.

### Task 7 — /materials
- 7 sections, one per material, alternating paper/paper-warm.
- Each: 50/50 split. Material name (display-2), spec table (mono numbers), use-case paragraph. Photo placeholder right column (note in needs-human.md).
- Specs MUST match brief table exactly.
- Commit + reviewer.

### Task 8 — /about
- Single column max-width 720px.
- Sections: Origin, The studio (Bambu P1S + AMS), Standards (tolerance, QC, when we won't print).
- Founder bio at bottom: photo placeholder + 3-line bio. WhatsApp + email links.
- Commit + reviewer.

### Task 9 — /contact
- Two-column desktop, stacked mobile.
- Left: WhatsApp button (primary CTA), email link, hours, location.
- Right: form (name, email, message). RHF + Zod. Submit handler logs to console + shows success state inline. (Real wire-up in backend phase.)
- Commit + reviewer.

### Task 10 — /quote (the core)
- Dark layout: `--ink` background, `--paper` text. Grid-paper motif at 5% opacity.
- 60/40 desktop split, stacked mobile.
- Left: Dropzone + per-file FileCard list.
- Right: Sticky PriceBreakdown panel.
- **FileCard:**
  - StlViewer (R3F, OrbitControls, square camera, no shadows beyond contact shadow on plane, material color preview)
  - Filename, size MB, triangle count, bbox X×Y×Z (all mono)
  - Build envelope warning (red-banner with --accent bg) if any axis > 256mm — blocks order
  - Material custom dropdown
  - Layer height SegmentedControl (5 options)
  - Quantity number input
  - Finish SegmentedControl (4 options)
  - Multicolor toggle button "+20% AMS"
  - Live unit subtotal (display-3 mono)
  - Remove button
- **PriceBreakdown:**
  - Mono throughout
  - Lines: per-file subtotals · Setup (₹100×N) · Multicolor (if any) · Qty discount (if any) · Rush toggle row · Promo input + Apply · Subtotal · Shipping · Payment processing 2% · GRAND TOTAL (display-3)
  - GST line: "Includes 18% GST · CGST/SGST or IGST split at checkout"
  - Continue to checkout button — square, accent fill, disabled until valid.
- Wire all changes through `lib/pricing.ts`. Update on every input change, debounce 50ms.
- NO glassmorphism, NO backdrop-filter. Sticky panel is plain `--paper-warm` bg + 1px hairline.
- Commit + reviewer.

### Task 11 — /orders/[code]
- Dynamic route. Reads code from params, validates regex `/^PG-[A-Z0-9]{4}-[A-Z0-9]{4}$/`.
- Mock data: hardcode 5 orders (PG-DEMO-0001 through PG-DEMO-0005) in `/lib/mock-orders.ts`.
- Layout: order header (code mono, placed date, status pill), status timeline (vertical, past in ink, current in accent, future in ink-30), order summary (files + breakdown), address.
- "Need to update something?" → WhatsApp link prefilled with order code.
- Invalid code → "Invalid order code" + form to enter code manually.
- Commit + reviewer.

### Task 12 — Footer-only legal pages
- /privacy, /terms, /refund, /shipping
- Single column max-width 720px.
- Real boilerplate (not lorem) adapted for Indian e-commerce + 3D printing studio specifics. Cover the points listed in kit v2 Task 10.
- "Last updated: <date>" mono at top.
- Commit + reviewer.

### Task 13 — Mobile pass
- Walk every page at 375px viewport
- Type scale: display drops to 44, display-2 to 32, display-3 to 24
- Section padding 64px
- Multi-col → single col
- Header: hamburger overlay
- Quote breakdown → bottom drawer
- Reviewer per page, commit per page.

### Task 14 — Polish + perf + a11y
- Lighthouse on every page; target ≥ 90 perf except /quote (≥ 75 OK due to R3F).
- Tab through every page; verify focus states.
- Reduced-motion audit.
- Favicon (PG monogram SVG).
- /app/opengraph-image.tsx (1200×630, hero composition).
- /app/sitemap.ts.
- /app/robots.ts (allow all on prod, disallow on preview).
- Final reviewer pass on every page.

## End of run

When all tasks complete OR circuit breaker hits:
1. Final design-reviewer pass on every page, desktop + mobile.
2. Screenshot every page using Playwright. Save to /screenshots/.
3. Write /BUILD_LOG/morning-brief.md with per-page status, top 5 needs-human items, top 5 wins, open questions.
4. Stop. Do not deploy.
```

---

## Pricing engine module — copy verbatim into `/lib/pricing.ts`

```typescript
// lib/pricing.ts
// PrintGrid Studio pricing engine. Authoritative source of pricing math.
// All money in INTEGER PAISE. Never floats. Never rupees in storage.
// Reusable in client components, server components, and (eventually) Node API routes.

export type MaterialKey =
  | 'pla-plus' | 'pla-lw' | 'petg' | 'abs' | 'tpu-95a' | 'pa6' | 'pa-cf';

export type LayerHeight = '0.12' | '0.16' | '0.20' | '0.24' | '0.28';
export type Finish = 'as-printed' | 'sanded' | 'primer' | 'gloss';
export type PromoCode = 'FIRSTPRINT' | 'DRONE25' | 'FOUNDER';

export interface MaterialSpec {
  name: string;
  ratePerGramPaise: number;
  density: number; // g/cm³
  maxTempC: number;
  tensileMpa: number;
}

export const MATERIALS: Readonly<Record<MaterialKey, MaterialSpec>> = {
  'pla-plus': { name: 'PLA+',    ratePerGramPaise: 450,  density: 1.24, maxTempC: 60,  tensileMpa: 65 },
  'pla-lw':   { name: 'PLA LW',  ratePerGramPaise: 1800, density: 0.65, maxTempC: 55,  tensileMpa: 35 },
  'petg':     { name: 'PETG',    ratePerGramPaise: 600,  density: 1.27, maxTempC: 75,  tensileMpa: 50 },
  'abs':      { name: 'ABS',     ratePerGramPaise: 650,  density: 1.04, maxTempC: 95,  tensileMpa: 40 },
  'tpu-95a':  { name: 'TPU 95A', ratePerGramPaise: 1100, density: 1.21, maxTempC: 80,  tensileMpa: 30 },
  'pa6':      { name: 'PA6',     ratePerGramPaise: 2000, density: 1.14, maxTempC: 110, tensileMpa: 65 },
  'pa-cf':    { name: 'PA-CF',   ratePerGramPaise: 2100, density: 1.16, maxTempC: 130, tensileMpa: 90 },
};

export const LAYER_MULTIPLIERS: Readonly<Record<LayerHeight, number>> = {
  '0.28': 0.85,
  '0.24': 0.95,
  '0.20': 1.00,
  '0.16': 1.15,
  '0.12': 1.35,
};

export const FINISHES: Readonly<Record<Finish, number>> = {
  'as-printed': 0,
  'sanded':     7500,
  'primer':     9000,
  'gloss':      28000,
};

export const STUDIO_DEFAULTS = Object.freeze({
  infillPct: 20,
  walls: 3,
  shellFraction: 0.18,
});

const SETUP_FEE_PAISE   = 10000;
const RUSH_PCT          = 0.25;
const MULTICOLOR_MULT   = 1.20;
const MIN_ORDER_PAISE   = 19900;
const SHIPPING_PAISE    = 12000;
const FREE_SHIP_THRESH  = 250000;
const PAYMENT_FEE_PCT   = 0.02;
const GST_RATE          = 0.18;

const QTY_DISCOUNTS: ReadonlyArray<{ minQty: number; pct: number }> = [
  { minQty: 50, pct: 0.15 },
  { minQty: 20, pct: 0.10 },
  { minQty: 10, pct: 0.05 },
];

export const PROMOS: Readonly<Record<PromoCode, { type: 'pct' | 'flat'; value: number }>> = {
  FIRSTPRINT: { type: 'pct',  value: 0.10 },
  DRONE25:    { type: 'pct',  value: 0.25 },
  FOUNDER:    { type: 'flat', value: 50000 },
};

export interface FileInput {
  massGrams: number;
  materialKey: MaterialKey;
  layerHeight: LayerHeight;
  finish: Finish;
  multicolor: boolean;
  qty: number;
}

export interface QuoteInput {
  files: FileInput[];
  rush?: boolean;
  promo?: PromoCode | null;
  addressState?: string | null;
}

export interface LineItem extends FileInput {
  fileIndex: number;
  materialPaise: number;
  perUnitPaise: number;
  qtyDiscountPct: number;
  lineSubtotalPaise: number;
}

export interface QuoteResult {
  lineItems: LineItem[];
  setupTotalPaise: number;
  rushFeePaise: number;
  promoDiscountPaise: number;
  appliedPromo: PromoCode | null;
  minTopUpPaise: number;
  subtotalPaise: number;
  shippingPaise: number;
  paymentFeePaise: number;
  grandTotalPaise: number;
  exGstPaise: number;
  gstTotalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
}

export function computeMass(volumeMm3: number, materialKey: MaterialKey): number {
  const m = MATERIALS[materialKey];
  if (!m) throw new Error(`Unknown material: ${materialKey}`);
  if (volumeMm3 <= 0) throw new Error(`Invalid volume: ${volumeMm3}`);
  const volumeCm3 = volumeMm3 / 1000;
  const massFactor = STUDIO_DEFAULTS.shellFraction
                   + (1 - STUDIO_DEFAULTS.shellFraction) * (STUDIO_DEFAULTS.infillPct / 100);
  return volumeCm3 * m.density * massFactor;
}

const qtyDiscountFor = (qty: number): number =>
  QTY_DISCOUNTS.find(d => qty >= d.minQty)?.pct ?? 0;

export function quote(input: QuoteInput): QuoteResult {
  const { files, rush = false, promo = null, addressState = null } = input;
  if (!files.length) throw new Error('At least one file required');

  const lineItems: LineItem[] = files.map((f, i) => {
    const material = MATERIALS[f.materialKey];
    const layerMult = LAYER_MULTIPLIERS[f.layerHeight];
    const finishPaise = FINISHES[f.finish];
    if (!material) throw new Error(`File ${i}: unknown material`);
    if (layerMult === undefined) throw new Error(`File ${i}: unknown layer`);
    if (finishPaise === undefined) throw new Error(`File ${i}: unknown finish`);
    if (f.qty < 1) throw new Error(`File ${i}: qty must be >= 1`);
    if (f.massGrams <= 0) throw new Error(`File ${i}: massGrams must be > 0`);

    const materialPaise = Math.round(f.massGrams * material.ratePerGramPaise);
    const afterLayer = materialPaise * layerMult;
    const beforeMulticolor = afterLayer + finishPaise;
    const perUnitFloat = f.multicolor ? beforeMulticolor * MULTICOLOR_MULT : beforeMulticolor;
    const perUnitPaise = Math.round(perUnitFloat);

    const qtyDiscountPct = qtyDiscountFor(f.qty);
    const lineSubtotalPaise = Math.round(perUnitPaise * f.qty * (1 - qtyDiscountPct));

    return {
      ...f,
      fileIndex: i,
      materialPaise,
      perUnitPaise,
      qtyDiscountPct,
      lineSubtotalPaise,
    };
  });

  const lineSubtotalSum = lineItems.reduce((s, li) => s + li.lineSubtotalPaise, 0);
  const setupTotalPaise = files.length * SETUP_FEE_PAISE;
  const beforeRush = lineSubtotalSum + setupTotalPaise;
  const rushFeePaise = rush ? Math.round(beforeRush * RUSH_PCT) : 0;
  const beforePromo = beforeRush + rushFeePaise;

  let promoDiscountPaise = 0;
  let appliedPromo: PromoCode | null = null;
  if (promo && PROMOS[promo]) {
    const p = PROMOS[promo];
    promoDiscountPaise = p.type === 'pct'
      ? Math.round(beforePromo * p.value)
      : Math.min(p.value, beforePromo);
    appliedPromo = promo;
  }

  const afterPromo = beforePromo - promoDiscountPaise;
  const minTopUpPaise = Math.max(0, MIN_ORDER_PAISE - afterPromo);
  const subtotalPaise = Math.max(afterPromo, MIN_ORDER_PAISE);
  const shippingPaise = subtotalPaise >= FREE_SHIP_THRESH ? 0 : SHIPPING_PAISE;
  const beforePayFee = subtotalPaise + shippingPaise;
  const paymentFeePaise = Math.round(beforePayFee * PAYMENT_FEE_PCT);
  const grandTotalPaise = beforePayFee + paymentFeePaise;

  const exGstPaise = Math.round(grandTotalPaise / (1 + GST_RATE));
  const gstTotalPaise = grandTotalPaise - exGstPaise;
  let cgstPaise = 0, sgstPaise = 0, igstPaise = 0;
  if (addressState === 'Tamil Nadu') {
    cgstPaise = Math.round(gstTotalPaise / 2);
    sgstPaise = gstTotalPaise - cgstPaise;
  } else if (addressState) {
    igstPaise = gstTotalPaise;
  }

  return {
    lineItems,
    setupTotalPaise,
    rushFeePaise,
    promoDiscountPaise,
    appliedPromo,
    minTopUpPaise,
    subtotalPaise,
    shippingPaise,
    paymentFeePaise,
    grandTotalPaise,
    exGstPaise,
    gstTotalPaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
  };
}

export function formatINR(paise: number): string {
  if (typeof paise !== 'number') return '—';
  const rupees = paise / 100;
  return '₹' + rupees.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
```

---

## Pricing tests — `/tests/pricing.test.ts`

Minimum cases (Vitest):

- Each material × 0.20mm layer (7 cases)
- Each layer multiplier on PETG (5 cases)
- Each finish on PLA+ (4 cases)
- Multicolor on/off (2 cases)
- Qty discount boundaries: 9, 10, 19, 20, 49, 50 (6 cases)
- Each promo + FOUNDER cap (4 cases)
- Min order top-up (1 case)
- Free shipping at 250000 paise boundary (2 cases)
- Rush adds 25% (1 case)
- 3-file multi-material order (1 case)
- Tax: TN (CGST/SGST) vs Karnataka (IGST) (2 cases)
- Returned values are integers (parametric assertion)

If a test fails, fix the engine — not the test.

---

## STL parser — keep `/public/stl-parser.worker.js` from kit v2 Section 6 verbatim

Classic worker, served from /public. In Next.js, instantiate with:

```typescript
// In a client component
const worker = new Worker('/stl-parser.worker.js');
worker.onmessage = (e) => { /* handle result */ };
worker.postMessage({ buffer: arrayBuffer }, [arrayBuffer]);
```

No bundler config needed. Next.js serves /public as-is.

---

## CSS Modules pattern — example for Button

`components/ui/Button.module.css`:
```css
.button {
  font-family: var(--font-inter);
  font-size: 15px;
  font-weight: 500;
  padding: 14px 28px;
  border-radius: 2px;
  border: 1px solid var(--ink);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  transition: background 150ms cubic-bezier(0.4, 0, 0.2, 1),
              color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.button:hover {
  background: var(--ink);
  color: var(--paper);
}

.primary {
  background: var(--accent);
  color: var(--paper);
  border-color: var(--accent);
}

.primary:hover {
  background: var(--accent-deep);
  border-color: var(--accent-deep);
}

.ghost {
  border: none;
  padding: 8px 0;
}
```

`components/ui/Button.tsx`:
```tsx
import styles from './Button.module.css';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost';

export function Button({
  variant = 'secondary',
  children,
  ...rest
}: { variant?: Variant; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(styles.button, variant === 'primary' && styles.primary, variant === 'ghost' && styles.ghost)}
      {...rest}
    >
      {children}
    </button>
  );
}
```

This pattern repeats for every component. No utility classes, no Tailwind, no SaaS muscle memory bleeding in.