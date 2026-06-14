# Print Grid Studio — Claude Code Prompt Playbook

Sequenced prompt set for building **printgridstudio.com** with Claude Code.
Run prompts in order. Each is scoped, has acceptance criteria, and forbids scope creep.

## How to use this

1. `mkdir print-grid-studio && cd print-grid-studio && claude`
2. Paste **Prompt 0** first — it sets up `CLAUDE.md` which every later prompt references.
3. After each prompt: review the diff, run the app, commit with a clear message.
4. Don't merge prompts. Small focused PRs save you when something breaks.
5. Tell Claude Code to **plan first, then implement** on every prompt. (`Plan only. Do not write code yet. Show me the file list and approach.`)
6. If Claude Code goes off-script, stop it. Revert. Re-prompt with tighter scope.

## Stack (final, post-audit)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router | Server components, file-based routing |
| Lang | TypeScript strict | No `any`, ever |
| Styles | Tailwind + shadcn/ui | Fast iteration, consistent tokens |
| 3D | React Three Fiber + Drei | Industry standard for R3F |
| Anim | Framer Motion | Page transitions, micro-interactions |
| Client state | useState / URL params | Zustand only if a single page truly needs it |
| Forms | React Hook Form + Zod | Schema validation everywhere |
| **DB** | **Postgres (Neon)** + Prisma | Relational data, real transactions |
| Auth | NextAuth (admin only) | Magic link for customer order tracking |
| Payments | Razorpay | India |
| **Files** | **Cloudflare R2** (presigned) | STLs (private, large). Cloudinary for product photos only |
| Email | Resend | Transactional |
| Slicer (v2) | OrcaSlicer CLI in worker | Real print-time pricing |
| Hosting | Vercel | + Neon, R2 |

---

## Prompt 0 — Project init + CLAUDE.md

```
Initialize a Next.js 14 project for "Print Grid Studio" — a custom 3D printing
service in Chennai. Solo operator, 2 printers, custom-order-first.

Steps:
1. `npx create-next-app@latest . --ts --tailwind --app --eslint --src-dir=false --import-alias="@/*"`
2. Install: shadcn/ui (init with neutral base), framer-motion, three, @react-three/fiber,
   @react-three/drei, react-hook-form, zod, @hookform/resolvers, prisma, @prisma/client,
   next-auth, razorpay, resend, react-dropzone, vitest, @vitest/ui, @testing-library/react.
3. Add Inter via next/font, set as default font in layout.
4. Create CLAUDE.md at repo root with the content below. This is the source of truth.
5. Create folder structure:
   /app, /components, /lib (pricing, db, stl, razorpay, email),
   /lib/db/queries, /lib/db/schema, /workers, /tests
6. Add `.env.example` with all required vars (do NOT create `.env`).
7. Set up Vitest config + a passing dummy test in `/tests/sanity.test.ts`.
8. Configure tsconfig: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitAny: true`.
9. Add commit hook (lint-staged + husky) for `tsc --noEmit` and eslint on commit.

CLAUDE.md content:
---
# Print Grid Studio

Custom 3D printing service. Solo, Chennai, 2 printers, 48hr turnaround after quote approval.

## Hard rules
- All money is integer paise. NEVER float, NEVER rupees in code.
- `lib/pricing.ts` is the single source of truth for prices. Never hardcode rates in UI.
- All DB queries live in `/lib/db/queries/*`. Components don't import Prisma.
- No `alert()`. Use the Modal component.
- No `any`. No `as any`. If you need a type escape, ask first.
- Server components by default. `"use client"` only when needed (interactivity, R3F, hooks).
- Reprice server-side before EVERY Razorpay order creation. Frontend prices are display-only.
- All STL parsing runs in a Web Worker. Never on main thread.
- All Razorpay webhook handlers must check `event_id` against a `webhook_events` table for idempotency.

## Stack
Next.js 14 App Router · TS strict · Tailwind + shadcn · R3F · Framer Motion ·
Postgres (Neon) + Prisma · NextAuth (admin only) · Razorpay · R2 · Resend · Vercel

## Design tokens (globals.css)
--bg: #F5F5F7
--bg-dark: #1D1D1F
--surface-dark: #2C2C2E
--text-1: #1D1D1F
--text-2: #6E6E73
--text-3: #A1A1A6
--accent: #FF6B00
--accent-light: #FFF3E8
--border: #D2D2D7
--border-dark: #3A3A3C
--ghost: #EBEBED

## Aesthetic
Apple-inspired: light #F5F5F7 base, dark #1D1D1F text, alternating light/dark sections,
full-bleed product imagery, ghost watermark text behind hero, left-aligned editorial.
Orange #FF6B00 as accent — max ONE accent element per section.
Quote page is the exception: dark #1D1D1F background (it's a tool, not marketing).
Font: Inter (NOT SF Pro — not licensed for web).

## Pages
/ /quote /catalog /materials /about /contact /orders/[code] /admin

## Pricing model (paise)
Materials (₹/g, density g/cm³):
  pla-plus: 5, 1.24    pla-lw: 7, 0.64    petg: 6, 1.27
  abs: 6.5, 1.04       tpu-95a: 11, 1.21
  pa6: 16, 1.14        pa-cf: 21, 1.10
Layer mult: 0.12=1.35, 0.16=1.15, 0.20=1.00, 0.24=0.90, 0.28=0.80
Finish mult: as-printed=1.00, sanded=1.20, primer=1.40, paint=1.70
Setup: ₹50 flat per job (never discounted)
Minimum order: ₹199 (top-up if below)
Multicolor: +₹200 per file
Rush: +₹150 per job (gated on print queue capacity)
Shipping: ₹120 flat / free above ₹2,500
Qty discount (parts only, not setup): 10–19=5%, 20–49=10%, 50+=15%
Promos: FIRSTPRINT=10%, DRONE25=25%, FOUNDER=₹500 flat
Complexity factor (admin-set, default 1.0): 1.0 / 1.3 / 1.6 — multiplied into part cost
  before quantity discount. Compensates for the volume-based model not capturing print time.

## Tax (India)
Customer in Tamil Nadu (our state): 9% CGST + 9% SGST on ex-GST subtotal.
Customer outside TN: 18% IGST on ex-GST subtotal.
Listed prices are ex-GST. GST is added at checkout. Show breakdown.
Invoice must include: GSTIN (if provided), HSN code 3926, tax split.

## Build envelopes
Printer 1 (Bambu X1C): 256 × 256 × 256 mm
Printer 2 (Bambu X1C): 256 × 256 × 256 mm
Quote tool warns if any STL bbox exceeds the smallest envelope.
---

Output: directory listing + `CLAUDE.md` printed back to me for review.
Do NOT run the dev server yet. Do NOT create any pages beyond what's needed.
```

---

## Prompt 1 — Pricing engine (TDD, pure)

```
Build `lib/pricing.ts` as a pure TypeScript module with full Vitest coverage.
Reference CLAUDE.md for all rates and rules.

Inputs (Zod-validated):
  - files: Array<{
      massGrams: number,
      material: 'pla-plus' | 'pla-lw' | 'petg' | 'abs' | 'tpu-95a' | 'pa6' | 'pa-cf',
      layerHeight: 0.12 | 0.16 | 0.20 | 0.24 | 0.28,
      infillPct: number (15-80),
      walls: number (2-8),
      quantity: number,
      finish: 'as-printed' | 'sanded' | 'primer' | 'paint',
      multicolor: boolean,
      complexity: 1.0 | 1.3 | 1.6   // admin-set, default 1.0
    }>
  - rush: boolean
  - promo?: 'FIRSTPRINT' | 'DRONE25' | 'FOUNDER'
  - addressState?: string  // for tax calc
  - shippingPaise?: number // override; else default rule

Output:
  {
    lineItems: Array<{
      fileIndex, massGrams, materialCost, layerMult, finishMult, complexityMult,
      multicolorAddon, quantity, qtyDiscountPct, qtyDiscount, lineSubtotal
    }>,
    setupTotal,
    multicolorTotal,
    rushFee,
    partsSubtotal,         // sum of lineSubtotal
    promoDiscount,
    preTaxSubtotal,        // partsSubtotal + setup + multicolor + rush + shipping - promo
    shipping,
    cgst, sgst, igst,      // based on addressState
    taxTotal,
    minimumOrderTopUp,     // applied if preTaxSubtotal < 199_00
    grandTotalPaise
  }

Rules:
- All math in paise. Mass in grams (decimal allowed). Round to nearest paisa at output.
- Setup fee NEVER discounted, never multiplied.
- Quantity discount applies to (lineSubtotal - setup) — i.e., parts cost only.
- Promo applied to (partsSubtotal + multicolor + rush) — NOT setup, NOT shipping, NOT tax.
- Minimum order top-up: if preTaxSubtotal < ₹199, add (₹199 - preTaxSubtotal) as a "minimum_topup" line.
- Free shipping if (preTaxSubtotal - shipping) ≥ ₹2500. Else ₹120 flat.
- Tax: addressState === 'Tamil Nadu' → 9/9 split. Otherwise 18% IGST.
  If addressState undefined, leave tax fields null (quote-only mode).

Tests (Vitest) — minimum 25 cases:
- Each material × each layer height (2 spot checks)
- Each finish multiplier
- Quantity discount tier boundaries (9, 10, 19, 20, 49, 50)
- Each promo, including FOUNDER cap (can't go below 0)
- Minimum order top-up triggers below ₹199
- Free shipping boundary at exactly ₹2500
- Multicolor stacks per file
- Rush adds once per job (not per file)
- Complexity factor 1.6 on PA-CF — no overflow
- Tax: TN customer (9+9), Karnataka customer (IGST), no state given (null tax)
- Float safety: 0.1 + 0.2 type bugs caught
- All money returned is integer

Forbidden:
- No DB calls.
- No HTTP.
- No console.log in shipped code.
- No `any`.

Acceptance:
- `pnpm test` → all green.
- 100% statement coverage on pricing.ts.
- Show me the test output before moving on.
```

---

## Prompt 2 — Postgres schema + Prisma

```
Set up Postgres (Neon free tier) with Prisma. NOT MongoDB.

1. Create Prisma schema with these models. All money fields are Int (paise).

model Order {
  id                String      @id @default(cuid())
  code              String      @unique  // "PGS-LX4K2A-F3B9"
  status            OrderStatus @default(PENDING)
  type              OrderType
  customerEmail     String
  customerName      String
  phone             String
  gstin             String?
  files             OrderFile[]
  quoteSnapshot     Json        // full PricingResult
  partsSubtotalPaise Int
  taxPaise          Int
  shippingPaise     Int
  totalPaise        Int
  razorpayOrderId   String?     @unique
  razorpayPaymentId String?     @unique
  addressLine1      String
  addressCity       String
  addressState      String
  addressPincode    String
  notes             String?
  complexityFactor  Float       @default(1.0)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  events            OrderEvent[]

  @@index([status])
  @@index([customerEmail])
}

model OrderFile {
  id              String   @id @default(cuid())
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId         String
  filename        String
  r2Key           String   // S3-compatible key in R2
  sizeBytes       Int
  triangleCount   Int
  volumeMm3       Float
  bboxX           Float
  bboxY           Float
  bboxZ           Float
  massGrams       Float
  material        String
  layerHeight     Float
  infillPct       Int
  walls           Int
  quantity        Int
  finish          String
  multicolor      Boolean
  createdAt       DateTime @default(now())
}

model OrderEvent {
  id        String   @id @default(cuid())
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId   String
  status    OrderStatus
  note      String?
  createdAt DateTime @default(now())

  @@index([orderId])
}

model Product {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String
  category    String
  material    String
  pricePaise  Int
  images      String[]
  inStock     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model AdminUser {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}

model WebhookEvent {
  id          String   @id  // Razorpay event id
  event       String
  payload     Json
  processedAt DateTime @default(now())
}

model PrintQueue {
  id        String   @id @default(cuid())
  orderId   String
  printerNo Int      // 1 or 2
  startedAt DateTime?
  endedAt   DateTime?
  estimatedHours Float
  status    QueueStatus @default(QUEUED)
}

enum OrderStatus {
  PENDING
  PAID
  PRINTING
  QUALITY_CHECK
  SHIPPED
  DELIVERED
  CANCELLED
}

enum OrderType { CUSTOM CATALOG }
enum QueueStatus { QUEUED ACTIVE COMPLETED FAILED }

2. Create initial migration: `pnpm prisma migrate dev --name init`
3. Add `lib/db/client.ts` with the singleton Prisma client (handle hot-reload).
4. Add seed script `prisma/seed.ts` that creates:
   - 1 admin user (env-driven email + bcrypted password)
   - 5 sample products in the catalog
5. Add query modules under /lib/db/queries/:
   - orders.ts: createOrder, getOrderByCode, updateOrderStatus, listOrders(filter)
   - products.ts: listProducts, getProductBySlug
   - webhook.ts: hasProcessedEvent, recordEvent
   All queries are typed, no `any`, return null on not-found instead of throwing.

Acceptance:
- `pnpm prisma migrate dev` succeeds against Neon.
- `pnpm prisma db seed` creates admin + 5 products.
- `pnpm prisma studio` shows the data.
```

---

## Prompt 3 — STL parser in Web Worker

```
Build STL parsing in a Web Worker. NEVER on main thread.

Files:
- /workers/stl-parser.worker.ts
- /lib/stl/types.ts
- /lib/stl/use-stl-parser.ts (React hook wrapping the worker via Comlink or postMessage)
- /lib/stl/density.ts (material → g/cm³ from CLAUDE.md)
- /tests/stl-parser.test.ts

Worker input: ArrayBuffer (raw STL file bytes)
Worker output: {
  triangleCount: number,
  volumeMm3: number,           // signed-tetrahedron summation from origin
  bboxMin: [x,y,z],
  bboxMax: [x,y,z],
  bboxSize: [x,y,z],
  isAscii: boolean,
  parseTimeMs: number
}

Implementation:
- Detect ASCII vs binary by checking first 5 bytes for "solid" + scanning for "facet normal" within first 200 bytes.
- Binary: 80-byte header, uint32 triangleCount, then 50 bytes per triangle (12-byte normal + 3×12-byte vertices + 2-byte attr).
- ASCII: regex/streaming parse, slower but rare for STLs >5MB.
- Volume: sum of `(v0 · (v1 × v2)) / 6` over all triangles. Take absolute value.
- File size limit: reject >100MB with a clear error.
- Triangle count >500k: still parse, but flag `highPolyWarning: true` for the viewer to use a decimated material.

Mass calc helper (NOT in worker, in /lib/stl/density.ts):
massGrams(volumeMm3, material, infillPct, walls)
- Convert volume to cm³
- Effective density: outer shell counts at full density, infill counts at (infillPct/100) × density.
- Approximation for MVP: treat shell volume as 15% of total for typical parts; refine later.
- mass = volumeCm3 × density × (0.15 + 0.85 × infillPct/100)
  Note this is a heuristic. Document this in the function JSDoc.
- Add a sanity ceiling: mass capped at volumeCm3 × density (100% infill case).

Tests:
- Parse a known cube STL → volume within 1% of analytic.
- Parse a known sphere STL → volume within 2%.
- Reject a malformed binary STL gracefully.
- Reject ASCII STL with corrupt facet block.
- 100MB+ rejected.
- ASCII vs binary autodetect on both sample files.

Hook usage in components:
const { parse, result, error, isLoading } = useStlParser();
parse(file) → returns Promise<StlResult>

Acceptance:
- Drop a 50MB STL into a test page → main thread stays at 60fps during parse.
- Worker terminates and respawns cleanly across multiple parses.
```

---

## Prompt 4 — STLViewer (R3F)

```
Build `<StlViewer />` component for the quote page. Shows uploaded STL spinning,
with material color preview.

File: /components/StlViewer.tsx (client component)

Props:
- file: File | null
- material: MaterialKey
- height?: number (default 320px)

Behavior:
- Use React Three Fiber + Drei OrbitControls.
- Parse STL via Three.js STLLoader (this is a viewer-only parse, distinct from the
  worker that calculates volume).
- Auto-center geometry, auto-fit camera to bbox + 20% margin.
- Material colors per material key:
  pla-plus: warm white #EAEAEA
  pla-lw: matte beige #D8C9A8
  petg: translucent orange #FF7A1A (use opacity 0.85)
  abs: jet black #1A1A1A
  tpu-95a: signal black #2A2A2A
  pa6: tan #B89A7E
  pa-cf: matte black with subtle sparkle #2A2A2C (no real sparkle, just hint)
- Lighting: 3-point (key, fill, rim). Soft contact shadow (Drei <ContactShadows />).
- Background transparent — let the parent's --bg-dark show through.
- Slow auto-rotate (0.5 rad/s) with rotation pause on user interaction.
- High poly fallback: if triangleCount > 250k, force flat material + disable shadows.
- Loading state: subtle pulsing skeleton box matching final aspect.
- Error state: small error icon + "Couldn't render preview".

Forbidden:
- No <Canvas> in server components — wrap in `"use client"`.
- No bundling Drei helpers we don't use (tree-shake aware imports).
- No DOM manipulation outside React.

Acceptance:
- Drop a 30MB STL → first frame within 800ms on M1.
- Switching material is instant (no re-parse).
- Resizing window doesn't break aspect.
```

---

## Prompt 5 — Quote page (the core)

```
Build /app/quote/page.tsx — the heart of this site.

This page is dark (#1D1D1F bg, light text). It's a tool, not marketing.

Layout (desktop):
- Left 65%: file upload + per-file control cards
- Right 35%: sticky breakdown panel
- Mobile: stacked, breakdown collapses to a bottom drawer

Components to build:
- /components/quote/Dropzone.tsx (react-dropzone, accepts .stl, max 100MB each, max 10 files)
- /components/quote/FileCard.tsx (one card per uploaded file)
- /components/quote/PriceBreakdown.tsx (sticky right rail)
- /components/quote/AddressForm.tsx (collected at checkout, not upfront)
- /components/quote/RushToggle.tsx (with queue-aware availability)

FileCard contents:
- STL viewer (StlViewer from previous prompt)
- Filename, size, triangle count, bbox (X×Y×Z mm), volume cm³, est mass g
- Build envelope warning if bbox > 256 in any axis (red banner, can't proceed)
- Material dropdown (7 options, with ₹/g hint)
- Layer height slider (5 stops, snap)
- Infill input (15–80, default 20)
- Walls input (2–8, default 3)
- Quantity input (1+, default 1)
- Finish select (4 options)
- Multicolor toggle (with +₹200 hint)
- Remove button
- Real-time updated subtotal for THIS file

PriceBreakdown panel:
- Live updates on every change (debounce 150ms, call lib/pricing.ts client-side
  for display only — server reprices at order creation).
- Line by line: each file's contribution, setup fees, multicolor, rush, promo, shipping, tax.
- Promo input field with "Apply" button.
- Total in ₹ (display) with "GST included" subtitle when address state is set.
- "Continue to checkout" CTA — disabled until: ≥1 valid file AND email AND name filled.

State:
- Use useReducer (NOT Zustand for one page). Single QuoteState type.
- Files keyed by client-side uuid for stable React keys.
- Persist quote draft to localStorage (debounced) so refresh doesn't kill it.

Acceptance:
- Add 5 files at once → all parse in parallel via worker pool (max 2 concurrent).
- Change infill on one file → only that card re-renders, breakdown recalculates.
- Breakdown matches lib/pricing.ts to the paisa.
- Refresh page → quote restored from localStorage.
- Remove a file → STLViewer cleans up R3F resources (no memory leak across 20 add/remove cycles).
```

---

## Prompt 6 — File upload to R2 + create-order API

```
Wire the quote → order pipeline.

1. Cloudflare R2 setup
   - /lib/r2/client.ts: S3 client pointed at R2 endpoint.
   - /lib/r2/presign.ts: function to generate a presigned PUT URL for an STL upload.
     Key format: `orders/pending/{cuid}/{filename}`.
     Expiry: 10 minutes.

2. API route /app/api/uploads/presign/route.ts (POST)
   - Accepts: { filename, sizeBytes, contentType }
   - Validates: contentType in ['model/stl','application/octet-stream'], size ≤ 100MB.
   - Returns: { url, key }
   - Rate limit: 20 requests / 10 min per IP (use upstash/ratelimit or simple in-memory).

3. Frontend in quote page
   - On drop: get presigned URL → upload directly to R2 via fetch PUT.
   - Show per-file upload progress.
   - Store r2Key in QuoteState.

4. API route /app/api/orders/create/route.ts (POST)
   - Body: { files: FileInput[], address, customer, promo?, rush }
   - Server-side:
     a. Re-validate every file's r2Key exists in R2 (HEAD request).
     b. RE-RUN lib/pricing.ts authoritatively (NEVER trust frontend total).
     c. Create Order row with status=PENDING.
     d. Create Razorpay order via Razorpay API: amount = grandTotalPaise, currency='INR'.
     e. Save razorpayOrderId on the Order.
     f. Create OrderFile rows for each file.
     g. Return { orderCode, razorpayOrderId, amountPaise, key: NEXT_PUBLIC_RAZORPAY_KEY_ID }.
   - On any failure: rollback (Prisma $transaction).
   - Send a "quote received, awaiting payment" email via Resend (fire and forget, don't block response).

5. Frontend
   - On successful response: open Razorpay Checkout modal with returned details.
   - On checkout success/dismissal: redirect to /orders/[code].

Forbidden:
- No price math in this route. Import lib/pricing.ts.
- No `any`. Body parsed with Zod.
- No frontend price trusted.

Acceptance:
- Manual test: complete a quote → Razorpay test modal opens → test card payment succeeds.
- DB: Order row with razorpayOrderId, OrderFile rows, all fields populated.
- Tampering test: edit the request body to send a lower amount → server reprices and creates Razorpay order with the CORRECT (server) amount.
```

---

## Prompt 7 — Razorpay webhook (idempotent)

```
Build /app/api/razorpay/webhook/route.ts.

Steps:
1. Read raw body (Next.js: use req.text(), DO NOT use req.json() — signature is over raw bytes).
2. Verify signature: HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET) === header 'x-razorpay-signature'.
   Use crypto.timingSafeEqual for the comparison.
3. Parse body. Extract event id and event type.
4. Idempotency: SELECT WebhookEvent WHERE id = event.id. If exists, return 200 immediately ("already processed").
5. Insert WebhookEvent row.
6. Handle events:
   - payment.captured:
     - Find Order by razorpayOrderId.
     - If status === PENDING → update to PAID, set razorpayPaymentId.
     - Insert OrderEvent.
     - Send "order confirmed" email via Resend.
     - Move R2 files from /pending/ to /paid/ keys (background job; can be async).
   - payment.failed:
     - Insert OrderEvent with status=PENDING + note=failure reason.
     - Send "payment failed, retry" email.
   - refund.processed:
     - Update Order status to CANCELLED, insert OrderEvent.
     - Send refund confirmation email.
7. Return 200 always (Razorpay retries on non-200). Errors logged but not surfaced.

Edge cases:
- Webhook arrives before order is committed (race): retry logic — wait 2s, retry once. If still no order, log and 200.
- Duplicate event id from Razorpay: handled by step 4.
- Payment for non-existent order: log, 200.

Tests:
- Unit test signature verification with valid + invalid + tampered bodies.
- Integration test: simulate a captured event → order moves to PAID → email queued.

Acceptance:
- Replay the same webhook 10 times → only one status change, one email sent.
- Tampered signature → 401, no DB write.
```

---

## Prompt 8 — /orders/[code] tracking + magic link

```
Customers track orders by visiting /orders/[code] with a magic-link email.

1. /app/orders/[code]/page.tsx (server component)
   - Reads `?token=` from search params.
   - Validates token: signed JWT containing { orderCode, email, exp }.
     Sign with NEXTAUTH_SECRET (reuse), HS256, 7-day expiry.
   - If valid: render order details.
   - If invalid/expired: render "Request a new link" form.

2. /app/api/orders/request-link/route.ts (POST)
   - Body: { orderCode, email }
   - Find order by code AND email (case-insensitive). 404 → return generic 200 (don't leak existence).
   - Generate token, send "Track your order" email via Resend with link.
   - Rate limit: 5 / hour per email.

3. Page UI
   - Header: order code, status (with colored pill), placed date.
   - Status timeline (vertical): Pending → Paid → Printing → QC → Shipped → Delivered.
     Use OrderEvent rows for actual timestamps. Future steps shown ghosted.
   - Order summary: files (filename + thumbnail if catalog), pricing breakdown.
   - Address.
   - "Need to update something?" CTA → opens contact prefilled with order code.

4. NO authenticated session for customers. Each page load re-validates the token.

Acceptance:
- Token tampered → "request new link" UI.
- Expired token → "request new link" UI.
- Magic link request for wrong email → no email sent, generic success message (no enumeration).
```

---

## Prompt 9 — Admin dashboard (NextAuth credentials)

```
Build /app/admin/* (protected).

1. NextAuth setup
   - /app/api/auth/[...nextauth]/route.ts using CredentialsProvider.
   - Credentials: email + password, validated against AdminUser table (bcrypt).
   - JWT session, 12hr expiry.
   - Sign-in page: /app/admin/sign-in/page.tsx (simple, dark, centered).

2. Middleware /middleware.ts
   - Protects /admin/* (excluding /admin/sign-in).
   - Redirects unauthenticated to sign-in.

3. /app/admin/page.tsx (dashboard)
   - Stats: orders today, paid revenue this week, queue depth, avg quote → paid time.
   - Recent orders table (last 50): code, customer, status, total, age. Click → detail.

4. /app/admin/orders/[code]/page.tsx
   - Full order view.
   - Status update dropdown → POST /api/admin/orders/[code]/status with new status + optional note.
     - Triggers status email via Resend.
   - File list with download links (presigned R2 GET URLs, 1hr expiry).
   - Edit complexity factor → re-runs pricing engine, shows old vs new total. Confirm to apply.
   - Notes field (admin-only, never shown to customer).
   - Cancel order button → triggers Razorpay refund + status update.

5. /app/admin/queue/page.tsx
   - Two columns: Printer 1, Printer 2.
   - Drag-and-drop orders between queues (use @dnd-kit/core).
   - Each card: order code, total est. hours, deadline.
   - Server actions for queue mutation.

6. /app/admin/products/* — CRUD for catalog products.

Forbidden:
- No client-side Prisma imports.
- No exposed admin endpoints without middleware check.

Acceptance:
- Visit /admin without session → redirect to sign-in.
- Sign in → see dashboard.
- Update order status → customer receives email within 30s.
- Refund flow: cancel → Razorpay refund API called → webhook fires → order CANCELLED.
```

---

## Prompt 10 — Email templates (Resend + React Email)

```
Set up React Email for templates.

1. Install: `pnpm add react-email @react-email/components`
2. Templates in /emails/:
   - QuoteReceived.tsx: "Your quote is ready, complete payment to start printing"
   - OrderConfirmed.tsx: "Payment received — printing starts within 4 hours"
   - StatusUpdate.tsx: generic with status pill (PRINTING / QC / SHIPPED)
   - Shipped.tsx: with tracking number + courier
   - Delivered.tsx: with review request CTA
   - PaymentFailed.tsx: retry link
   - RefundProcessed.tsx
   - MagicLink.tsx: order tracking link
   - QuoteAdmin.tsx: internal — new quote received notification to admin email

3. Brand:
   - Header: "PRINT GRID STUDIO" wordmark, ghost gray.
   - Body: white bg, #1D1D1F text, max 560px.
   - Single accent: orange CTA button.
   - Footer: address, GSTIN, contact, unsubscribe (legal req in India).

4. /lib/email/send.ts wrapper:
   - Renders React Email template → HTML.
   - Sends via Resend.
   - Logs to console in dev.
   - Returns success/error, never throws to caller (email failures must not break order flow).

5. Test rendering: `pnpm email dev` opens preview server on :3001.

Acceptance:
- All templates render correctly in light + dark email clients (test in https://litmus.com or screenshot in Gmail).
- Plain text fallback present.
- Unsubscribe link present in marketing-adjacent templates.
```

---

## Prompt 11 — Public pages (home, materials, catalog, about, contact)

```
Build the public marketing pages. All server components except where interactivity needed.

Aesthetic: alternating light/dark sections. Editorial left-aligned. Big imagery.

1. /app/page.tsx (Home)
   Section 1: Hero, light bg
     - H1: "Custom 3D printing. Print-grade parts."
     - Subhead: "Quote in seconds. In your hands in 48 hours."
     - CTA: "Get a quote" → /quote
     - Right side: hero 3D viewport (placeholder, real one in Prompt 12)
     - Ghost watermark text behind hero: "PRINT GRID" in #EBEBED, 320px, ultra-light weight
   Section 2: Materials, dark bg
     - Strip of 7 material cards, horizontal scroll on mobile.
     - Each card: hi-res photo of a part in that material, name, key spec.
     - One card has the orange accent border.
   Section 3: Process, light
     - 4 steps: Upload → Quote → Print → Ship.
     - Numbered, large headings.
   Section 4: Capability, dark
     - "Built for: drone parts, prototypes, jigs, end-use components."
     - 4 large photos.
   Section 5: CTA, light
     - "Get your quote." Big.

2. /app/materials/page.tsx
   - One section per material. Photo + spec table (density, tensile, max temp, finish options).
   - Use real specs (cite sources in comments).

3. /app/catalog/page.tsx
   - Grid of products from DB. Filter by category.
   - Each card → /catalog/[slug].
   - Add to "build a custom version" CTA.

4. /app/catalog/[slug]/page.tsx
   - Product detail. "Buy now" → adds to a single-item quote → /quote prefilled.

5. /app/about/page.tsx
   - Story. Photos of Aadharsh + the print farm.
   - Tech specs of the printers.
   - "Why custom?" section.

6. /app/contact/page.tsx
   - Form: name, email, subject, message. RHF + Zod.
   - POST /api/contact → sends email to admin via Resend.
   - Cloudflare Turnstile or hCaptcha on the form (env-gated; off in dev).

Layout:
- /components/layout/Header.tsx: minimal, links to Quote / Catalog / Materials / About / Contact.
- /components/layout/Footer.tsx: address, GSTIN, social, copyright, legal links.

Real copy:
- Don't write "Lorem ipsum". Write actual marketing copy that matches the brand voice
  (technical, confident, no fluff). Aadharsh will edit if needed.
```

---

## Prompt 12 — Hero "build line" 3D scene

```
Build /components/HeroScene.tsx — the centerpiece animation.

Concept: A drone bracket (or similar mechanical part) sits centered on a virtual build plate.
A horizontal scan line sweeps from base to top, slowly. Below the line: model fully rendered
in matte orange-tinted plastic. Above the line: model in subtle wireframe / hidden.
Effect: the model "prints itself" layer by layer in an infinite loop.

Tech:
- React Three Fiber.
- Single STL loaded from /public/hero-model.stl (committed asset, ~2MB optimized).
- Use a custom ShaderMaterial OR a clipping plane technique.

Recommended: Three.js localClipping with two materials.
- THREE.WebGLRenderer.localClippingEnabled = true.
- Material A (printed): MeshStandardMaterial with clippingPlanes = [planeLow], color #FF6B00 muted.
- Material B (wireframe): MeshBasicMaterial wireframe + clippingPlanes = [planeHigh].
- Animate plane.constant from bbox.min.y to bbox.max.y over 8s, hold 1s, reset.
- Add a thin glowing line at the current Y (a flat ring or quad) — the "print head".

Camera:
- Fixed angle, slight orbit on mouse (parallax, 0.05 strength), no full orbit.
- Soft contact shadow under the model.

Performance:
- Use useFrame, not setState, for animation.
- Pause when offscreen (IntersectionObserver).
- Mobile fallback: static hero image (next/image) instead of Canvas.

Acceptance:
- Loops cleanly.
- 60fps on M1, 30fps minimum on mid-range Android.
- No CLS — Canvas reserves its space immediately.
```

---

## Prompt 13 — SEO, sitemap, analytics, perf

```
1. SEO
   - /app/layout.tsx: default Metadata with title template, description, OG image.
   - Per-page metadata exports.
   - JSON-LD: LocalBusiness on home, Product on catalog detail, Service on /quote.
   - Open Graph image: /app/opengraph-image.tsx (next-gen dynamic OG).

2. Sitemap
   - /app/sitemap.ts: emits /, /quote, /catalog, /materials, /about, /contact, all products.

3. robots.ts
   - Allow all on prod, disallow on preview (use NEXT_PUBLIC_VERCEL_ENV).

4. Analytics
   - Plausible or Vercel Analytics (privacy-friendly, no cookie banner needed).
   - Track events: quote_started, file_uploaded, quote_completed, payment_initiated, payment_succeeded.

5. Perf budget
   - LCP < 2.5s on /quote (the heavy page).
   - Bundle size: app router pages < 200KB JS (excluding Three.js on /quote and /).
   - Lighthouse CI on main branch.

6. Image optimization
   - All product photos via next/image, WebP, responsive sizes.

Acceptance:
- pnpm build → no warnings.
- Lighthouse run → ≥90 perf on home and /materials.
- /quote ≥75 perf (R3F + STL parsing — known heavy).
```

---

## Prompt 14 — Tax invoice PDF generation

```
Build /app/api/orders/[code]/invoice/route.ts (GET).

- Auth: same magic-link token as /orders/[code], OR admin session.
- Generate a tax-compliant PDF invoice with:
  - "TAX INVOICE" header
  - Print Grid Studio details: name, address, GSTIN
  - Customer details + their GSTIN if provided
  - Invoice number (sequential, persistent — add InvoiceNumber model with @id @default(autoincrement()))
  - Date
  - Line items: description, HSN code 3926, qty, unit price (ex-GST), total
  - Tax breakdown:
    - Customer in TN: CGST 9%, SGST 9%
    - Customer outside TN: IGST 18%
  - Grand total (in figures + words — Indian convention)
  - Place of supply
  - Authorized signatory line

Stack: react-pdf (https://react-pdf.org/) for layout, served as application/pdf.

Tests:
- Generate invoice for TN customer → CGST + SGST split.
- Generate invoice for Karnataka customer → IGST.
- Invoice numbering is sequential, never reused.

Acceptance:
- Invoice PDF passes a manual check for the GST format requirements.
- Available from order tracking page after status=PAID.
```

---

## Production checklist (before going live)

- [ ] All env vars set on Vercel (prod + preview)
- [ ] Razorpay account in **Live** mode, KYC complete
- [ ] Razorpay webhook URL registered on dashboard, secret in env
- [ ] Resend domain verified (printgridstudio.com)
- [ ] R2 bucket CORS configured for printgridstudio.com origin
- [ ] Neon prod branch separate from preview
- [ ] Daily Postgres backup enabled
- [ ] Admin user seeded with strong password
- [ ] Privacy policy + Terms of Service pages drafted (legal req for Razorpay)
- [ ] Cancellation/refund policy page (Razorpay req)
- [ ] Shipping policy page (Razorpay req)
- [ ] GSTIN displayed in footer
- [ ] Contact page has physical address
- [ ] All emails have unsubscribe (where applicable) + business address (CAN-SPAM/India equivalent)
- [ ] Lighthouse CI green
- [ ] Manual test: full flow with a real Razorpay live ₹1 transaction (then refund)
- [ ] Sentry or similar error tracking configured
- [ ] Uptime monitoring (Better Uptime free tier)

---

## Phase 2 (post-launch)

- Real print-time pricing via OrcaSlicer CLI in a worker queue (BullMQ + Redis)
- Customer accounts (NextAuth email magic-link, optional)
- Reorder previous orders
- Bulk-pricing tier for repeat B2B customers
- API for design firms to integrate
- Print queue ETA shown publicly on /quote ("3 jobs ahead, est. start in 6h")
- Multi-printer-type support (FDM + resin)
- Failed-print auto-detection (camera + ML, far future)
