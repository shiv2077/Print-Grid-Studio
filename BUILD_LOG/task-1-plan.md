# Task 1 — Design tokens + globals.css — plan

## Goal
Land the full design system in `app/globals.css`: token variables,
typography classes, focus-visible rule, reduced-motion handling, and the
grid-paper utility class. Every later task (2 through 14) imports from
this file.

## Source-of-truth resolution

The `Design.md` file on disk does not include a token table or a type
scale (it is truncated). I am deriving tokens from:
- `Claude.md` color values (binding for hex values it specifies)
- Kit CSS Modules pattern (binding for token NAMES: `--ink`, `--paper`,
  `--paper-warm`, `--accent`, `--accent-deep`)
- Kit task descriptions (binding for typography class NAMES and behaviors)
- `Design.md` vibes/anti-references (binding for aesthetic constraints —
  "no gradients", "industrial", "hairlines")
- Type scale derived to match the editorial/industrial vibe — calibrated
  against the references in Design.md (onlyscrews.in, jlc3dp.com, vintage
  HP/Tektronix manuals)

These values flagged in `BUILD_LOG/needs-human.md` for morning review.

## Token map

### Surfaces (5 colors per kit task spec)
- `--paper`        `#F5F5F7` — primary light surface (from Claude.md)
- `--paper-warm`   `#EDE6D9` — alternating section warm cream; hand-picked
  to feel like 100gsm cartridge paper, NOT cream-yellow. Defensible
  against "luxury" because saturation is low (chroma < 10).
- `--ink`          `#1D1D1F` — primary dark surface / body text
  (from Claude.md)
- `--accent`       `#FF6B00` — single-accent orange (from Claude.md /
  Design.md anti-list explicitly preserves this)
- `--accent-deep`  `#CC5500` — hover / pressed state for accent

### Ink tints (for hairlines, secondary text, ghosted timeline steps)
Ramped HSL between `--paper` and `--ink`, no chromatic shift:
- `--ink-90`  `#2E2E30` — large dark surfaces alt
- `--ink-70`  `#5A5A5E` — secondary text on paper
- `--ink-50`  `#86868B` — tertiary text, captions
- `--ink-30`  `#C5C5C8` — disabled, future timeline steps
- `--ink-10`  `#E6E6E8` — hairlines on paper

### Inverse tints for paper-on-ink contexts
- `--paper-90` `#E6E6E8` — body text on ink
- `--paper-70` `#A8A8AB` — secondary text on ink
- `--paper-50` `#7A7A7D` — tertiary on ink
- `--paper-30` `#4F4F52` — hairlines on ink

## Typography classes

Sizes calibrated for the editorial/industrial vibe (Inter for display,
JetBrains Mono for tech labels). All values are in px, line-heights
unitless, tracking in em.

| Class          | Size | Weight | Line-height | Tracking | Family   |
|----------------|------|--------|-------------|----------|----------|
| `.display`     | 96   | 700    | 1.05        | -0.02em  | Inter    |
| `.display-2`   | 64   | 600    | 1.1         | -0.01em  | Inter    |
| `.display-3`   | 32   | 600    | 1.2         | 0        | Inter    |
| `.h-eyebrow`   | 12   | 500    | 1           | 0.1em    | Mono     |
| `.lede`        | 21   | 400    | 1.5         | 0        | Inter    |
| `.caption`     | 13   | 400    | 1.45        | 0        | Inter    |
| `.micro`       | 11   | 500    | 1.4         | 0        | Inter    |
| `.mono-spec`   | 15   | 500    | 1.45        | 0.02em   | Mono     |
| `.mono-label`  | 11   | 500    | 1           | 0.1em    | Mono uppercase |

Mobile (≤640px) overrides per Task 13:
- `.display`   → 44px
- `.display-2` → 32px
- `.display-3` → 24px

`.h-eyebrow`, `.mono-label` use `text-transform: uppercase`.

## Grid-paper utility

`.grid-paper` adds a 32×32px engineering-paper background via inline
data-URL SVG. Lines use `--ink-10` (paper context) or `--paper-30` (ink
context — applied via `.grid-paper-on-ink` variant). 1px stroke,
`shape-rendering: crispEdges` to keep hairlines hairline at all DPRs.

## Focus-visible

```
*:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }
```

Applied globally so primitives don't have to opt in. Native `outline:none`
on `<button>` etc. is overridden.

## Reduced motion

```
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0ms !important;
    animation-duration: 0ms !important;
    transform: none !important;
  }
}
```

Per kit, fades remain — but transforms (translate, scale, rotate) are
killed. RevealOnScroll (Task 2) will check `matchMedia` and skip the
fade entirely if reduced-motion is set.

## Acceptance

- `app/globals.css` defines all tokens above as CSS custom properties on
  `:root`
- All typography classes compile (no syntax errors)
- `.grid-paper` produces a visible 32px grid (manually verify by adding
  to `app/page.tsx` placeholder; remove before commit)
- `:focus-visible` outline visible on a `<button>` in dev (no real button
  on the page yet — verify with the placeholder `<a>` in `app/page.tsx`)
- `tsc --noEmit` clean (CSS doesn't affect this but check)
- `npm test` still green

## Out of scope for Task 1

- The placeholder `app/page.tsx` will be tweaked to demonstrate `.display`
  and `.h-eyebrow` so the reviewer can see they render. Real homepage
  is Task 6.
- Component-level styles (Task 2+)
- Mobile media-query for sections (already in this task's responsive
  type scale; Section component padding lands in Task 2)
