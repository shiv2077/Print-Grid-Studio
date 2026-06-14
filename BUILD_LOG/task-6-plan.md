# Task 6 — Homepage — plan

## Source-of-truth

Overnight Task 6 says "kit v2 task 2 (carry over verbatim — same content,
same copy)". Kit v2 is not on disk. I am writing copy + illustrations
from the brand voice in `Design.md` and the page-list from
`Claude.md`. Treat sections, not copy, as the binding spec.

## Section list (binding from Overnight.md)

1. **Hero** — `paper`, `gridPaper`, ExtruderDiagram right
2. **How it works** — `paper-warm`, 4 numbered cards (#how-it-works anchor)
3. **Materials table** — `paper`, real numbers from `MATERIALS` in lib/pricing.ts
4. **Build envelope** — `paper-warm`, BuildEnvelopeDiagram right
5. **Pricing transparency** — `paper`, inline breakdown (#pricing anchor)
6. **Shipping** — `paper-warm`, simple India SVG
7. **Final CTA** — `ink` (reverse colors)

## Components to build

- `components/illustrations/ExtruderDiagram.tsx` — inline SVG, CAD-style
  hairline strokes (no fills, all strokes 1px ink-70 or accent for the
  extruder tip). Shape: the hot-end of an FDM printer with motor,
  gantry, build plate, callout dimensions in mono. Approximate, not
  literal — visual shorthand for "industrial printer". 320×320 viewbox.
- `components/illustrations/BuildEnvelopeDiagram.tsx` — wireframe cube
  256×256×256mm with axis arrows + dimension labels in mono. CAD
  technical-drawing aesthetic. 320×320 viewbox.
- `components/illustrations/IndiaMap.tsx` — simple India outline SVG
  (path approximation). One filled circle = Chennai. Hairline.
  No state borders — just the country silhouette. 320×320 viewbox.

## Section components

Each homepage section is a small server component co-located in
`app/_home/` (underscore-prefixed so Next.js doesn't route it):
- `app/_home/Hero.tsx`
- `app/_home/HowItWorks.tsx`
- `app/_home/MaterialsTable.tsx`
- `app/_home/BuildEnvelope.tsx`
- `app/_home/PricingTransparency.tsx`
- `app/_home/Shipping.tsx`
- `app/_home/FinalCta.tsx`

`app/page.tsx` becomes the server-component composition that imports
each. `RevealOnScroll` wraps section bodies (client component already
built). The placeholder primitive demo is removed.

## Copy direction (brand voice from Design.md)

- onlyscrews.in style: plain, factual, dimensional. No marketing fluff.
- jlc3dp.com: industrial confidence, instant-quote workflow.
- Vintage Tektronix manuals: title blocks, dimension callouts,
  monospace numbers.
- Anti: SaaS, gradient-y, cute, luxury, Apple-Marcom.

Headlines:
- Hero H1: "Custom 3D printing. / Print-grade parts." (already used in
  placeholder)
- Hero lede: "A small Chennai studio printing real parts on Bambu P1S
  printers. Quote in seconds. In your hands in 4 days, anywhere in
  India."
- Hero CTAs: "Get a quote" (primary, → /quote), "See materials"
  (secondary, → /materials)
- Eyebrow above hero: "PRINTGRID STUDIO · CHENNAI"

How it works (4 cards, 1–4):
1. UPLOAD — "Drop an STL. We parse it in your browser to estimate
   weight + bounds."
2. QUOTE — "Pick material, layer height, finish, and quantity. The
   number updates as you click."
3. PRINT — "Approved quote enters the queue. Bambu P1S printers with
   AMS multicolor when you need it."
4. SHIP — "Pan-India in 4 days. Tracked. Insured above ₹2,500."

Materials table — pulls live from `MATERIALS` in `lib/pricing.ts`:
columns: Material, ₹/g, Density, Max temp, Tensile. Hairline rows.

Build envelope: "256 × 256 × 256 mm" — explain that anything that
fits inside our build volume gets printed in one piece. The
BuildEnvelopeDiagram visualises it.

Pricing transparency: a worked example — a 50g PLA+ part at 0.20mm,
single quantity, as-printed, no rush. Show the breakdown line by
line so the customer can see how the number comes out:
```
Material:    50g × ₹4.50          ₹225
Layer mult (0.20mm):  ×1.00       ₹225
Finish (as-printed):  +₹0         ₹225
Setup:       ₹100                 ₹325
Subtotal:                         ₹325
Min order top-up:    +₹0          ₹325
Shipping (under ₹2,500):  ₹120    ₹445
Payment fee 2%:                   +₹9
GRAND TOTAL                       ₹454
```
(Numbers must come from the actual `quote()` call so they stay in sync
if pricing constants change. Server-side compute at build time.)

Shipping: "We ship from Chennai pan-India in 4 days via tracked
courier. Above ₹2,500 the shipping is on us."

Final CTA: ink bg, big "Ready to print?" + Get-a-quote primary button.

## Acceptance

- `app/page.tsx` is a server component
- All 7 sections render
- 3 inline SVG illustrations (Extruder, BuildEnvelope, India)
- Real copy in brand voice — no lorem
- Pricing-transparency numbers match `quote()` output (computed at
  render time, not hardcoded)
- Anchor IDs `#how-it-works` and `#pricing` present so Header nav links
  resolve
- Mobile-friendly layout (Section/Container handle the bones)
- `tsc --noEmit` clean, all tests still green
