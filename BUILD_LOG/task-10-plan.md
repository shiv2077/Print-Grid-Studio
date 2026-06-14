# Task 10 — /quote — plan

## Spec from Overnight.md (verbatim, abbreviated)

- Dark layout: `--ink` background, `--paper` text. Grid-paper at 5% opacity.
- 60/40 desktop split, stacked mobile. Left: dropzone + FileCards. Right: sticky PriceBreakdown.
- FileCard: StlViewer + filename/size/triangles/bbox + envelope warning + material dropdown + layer SegmentedControl + qty + finish SegmentedControl + multicolor toggle + live unit subtotal + remove.
- PriceBreakdown: mono throughout. Lines per spec. GRAND TOTAL display-3. GST line. Continue button disabled until valid.
- All math through lib/pricing.ts. Debounce 50ms (de-facto unnecessary in React state model — every input change is already coalesced).
- NO glassmorphism, NO backdrop-filter.

## State design

```ts
type FileRow = {
  id: string;            // uuid
  file: File;            // raw browser File
  parse: { status: 'idle' | 'parsing' | 'done' | 'error'; result?: StlParseResult; error?: string };
  config: {
    materialKey: MaterialKey;
    layerHeight: LayerHeight;
    finish: Finish;
    multicolor: boolean;
    qty: number;
  };
};

type State = {
  files: FileRow[];
  rush: boolean;
  promoInput: string;     // raw input
  appliedPromo: PromoCode | null;
  promoError: string | null;
};
```

Stored in `useReducer`. Actions: ADD_FILES, FILE_PARSED, FILE_PARSE_ERROR, UPDATE_CONFIG, REMOVE_FILE, TOGGLE_RUSH, SET_PROMO_INPUT, APPLY_PROMO, CLEAR_PROMO.

## Pricing

- For each parsed file, compute mass via `computeMass(volumeMm3, materialKey)` from lib/pricing.ts.
- Build `quote({ files: [...FileInputs], rush, promo })` and render the result in PriceBreakdown.
- If a file isn't parsed yet, exclude it from the pricing call (or pass with mass=0 → would error). Cleaner to only include parsed files in the FileInput list.

## Components

- `app/quote/page.tsx` — server shell (Section bg=ink + grid-paper-on-ink).
- `app/quote/QuotePage.tsx` — 'use client', orchestrator.
- `app/quote/quote.module.css` — shared styles.
- `app/quote/state.ts` — reducer + types (pure, testable).
- `app/quote/Dropzone.tsx` — drag-and-drop + click. Accepts STL only, max 100MB each, max 10 files. No upload.
- `app/quote/FileCard.tsx` — per-file controls + viewer slot.
- `app/quote/StlViewer.tsx` — R3F + drei (lazy via dynamic import to keep the initial bundle off /quote).
- `app/quote/MaterialDropdown.tsx` — custom dropdown.
- `app/quote/PriceBreakdown.tsx` — sticky panel.

## Build envelope warning

- Hard cap 256mm any axis. If `bboxSize.x|y|z > 256`, show a banner inside the FileCard with `--accent` background and "EXCEEDS BUILD ENVELOPE — split into parts or contact us".
- Continue button disabled if any file is in this state.

## StlViewer (R3F)

- Use `<Canvas>` from `@react-three/fiber`. Use `STLLoader` from `three/examples/jsm/loaders/STLLoader` (loaded via @react-three/drei? — no, drei doesn't export STLLoader, use Three's directly).
- Material color preview per material key (palette in lib).
- OrbitControls from drei. Auto-fit camera on geometry load. ContactShadows from drei (low-quality, contact-only).
- Slow auto-rotate via `useFrame` — pause on user interaction.
- High-poly fallback: if triangleCount > 250k, switch to flat material + no shadows.
- Background transparent so the FileCard's dark surface shows through.

## Material color palette
From Claude.md Prompt 4:
- pla-plus #EAEAEA · pla-lw #D8C9A8 · petg #FF7A1A (translucent) · abs #1A1A1A · tpu-95a #2A2A2A · pa6 #B89A7E · pa-cf #2A2A2C

## Promo handling

- User types in input + clicks Apply.
- If valid promo code (matches PROMOS keys), set appliedPromo. Pricing engine handles discount + cap.
- Invalid → show error message under input.
- Show small remove (×) button beside applied promo to clear.

## Continue button

Disabled if:
- 0 files OR
- Any file in 'parsing' or 'error' state OR
- Any file exceeds envelope.

On click: log payload + show alert/toast (real wire-up in backend).

## Files

```
app/quote/
├── page.tsx
├── QuotePage.tsx
├── state.ts
├── Dropzone.tsx
├── Dropzone.module.css
├── FileCard.tsx
├── FileCard.module.css
├── StlViewer.tsx                  ('use client', dynamic-import only)
├── StlViewer.module.css
├── MaterialDropdown.tsx
├── MaterialDropdown.module.css
├── PriceBreakdown.tsx
├── PriceBreakdown.module.css
└── quote.module.css
```

## Acceptance

- Drop an STL → parses via worker → FileCard renders with stats + viewer
- Change material → mass recalculates → breakdown updates
- Multiple files → each priced independently → breakdown shows totals
- Promo apply works for FIRSTPRINT, DRONE25, FOUNDER
- Envelope > 256 → red banner blocks Continue
- Continue button disabled until valid
- Mobile: stacks; breakdown could become a bottom drawer (Task 13 polish — for tonight render it inline below files on mobile)
