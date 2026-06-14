# Task 8 — /about — plan

## Overnight spec
- Single column max-width 720px
- Sections: Origin, The studio (Bambu P1S + AMS), Standards (tolerance, QC, when we won't print)
- Founder bio at bottom: photo placeholder + 3-line bio. WhatsApp + email links.

## Approach
- Single page file `app/about/page.tsx` (server component) — no need for sub-components since all content is co-located narrative copy in one column.
- Use `Section bg=...` for alternating bands but ALL content stays inside a 720px column (not the full Container).
- 4 narrative sections + a founder bio strip at the bottom:
  1. Hero/intro band — paper, gridPaper. Eyebrow + display H1 "About PrintGrid Studio." + lede.
  2. Origin — paper-warm. "How this studio came to be" — 3-paragraph essay.
  3. The Studio — paper. "Two Bambu P1S printers, an AMS unit, a desk in Anna Nagar." Equipment list as a spec table.
  4. Standards — paper-warm. "What we'll print, what we won't" — bulleted list of standards (tolerance, QC procedure, hard refusals).
  5. Founder — ink. Photo placeholder + 3-line bio + WhatsApp + email.

## Copy direction

Origin: a small studio born out of frustration with quote-by-email
service shops. Numbers-first, no upsells, clear timelines.

The Studio: equipment list — Bambu P1S × 2, AMS for multicolour,
hardened nozzles for CF materials, calipers + Mitutoyo gauge for QC,
Anna Nagar Chennai location.

Standards: tolerance ±0.3mm typical, ±0.15mm for high-precision parts.
QC pass criteria. What we won't print:
- Functional firearm parts
- Active medical devices
- Mass-counterfeit branded items
- Anything under 0.5mm wall thickness on a structural part

Founder bio: 3 lines about Aadharsh — start by saying who he is, what
he does, and how to reach him. Don't oversell.

## Files
- `app/about/page.tsx`
- `app/about/about.module.css`

## Acceptance
- Max-width 720 narrative column
- 4 sections + bio band
- WhatsApp + mailto links present
- `tsc` clean, `next build` green
