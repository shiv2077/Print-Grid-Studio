# Task 7 — /materials — plan

## Overnight spec (verbatim)
- 7 sections, one per material, alternating paper/paper-warm.
- Each: 50/50 split. Material name (display-2), spec table (mono numbers), use-case paragraph. Photo placeholder right column (note in needs-human.md).
- Specs MUST match brief table exactly.

## Approach
- `app/materials/page.tsx` — server component, hero band + 7 alternating Section components.
- Each material section is a single component `MaterialSection.tsx` rendered 7 times with different data, alternating `bg='paper'`/`'paper-warm'`.
- Material data sourced from `MATERIALS` in `lib/pricing.ts` (single source of truth — no copy-pasted specs).
- 50/50 split: copy on the left, "photo placeholder" on the right. Placeholder = styled `<div>` with a CAD-style title block matching the illustration aesthetic. Note dispatched to `needs-human.md` so Aadharsh knows to drop in real photos.
- Spec list reuses the `.specList`/`.specRow` pattern from BuildEnvelope.
- Hero strip at the top is a small Section (paper, gridPaper) with the page intro: "Seven materials. Real numbers."

## Files
- `app/materials/page.tsx`
- `app/materials/MaterialSection.tsx`
- `app/materials/MaterialSection.module.css`
- `app/materials/MaterialsHero.tsx`
- `app/materials/MaterialsHero.module.css`

## Copy

Page H1: "Materials"
Page lede: "We stock seven filaments, mostly Bambu and Polymaker. Specs
below come from the manufacturers' datasheets — we don't inflate."

Per material — three things:
1. ₹/g, density, max temp, tensile (from MATERIALS)
2. One-paragraph use-case (3-4 sentences)
3. Print settings recommendation (default layer height + recommended
   layer height range)

Use-case copy already exists in `MaterialsTable.tsx` `MATERIAL_NOTES` —
expand to a full paragraph here.

## Acceptance
- 7 sections render in canonical order: pla-plus, pla-lw, petg, abs,
  tpu-95a, pa6, pa-cf
- Alternation: pla-plus paper, pla-lw paper-warm, petg paper, ...
- Specs match `MATERIALS` exactly (tested by linking to the constant)
- Each section is mobile-stackable (50/50 → single column at 900px)
- `tsc --noEmit` clean, build green
