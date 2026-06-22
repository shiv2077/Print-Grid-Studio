# DESIGN_V2 — PrintGrid Studio v2 homepage (dark / technical)

Scope: a **new** `/v2` marketing homepage only. Nothing here touches the live site,
`/api/*`, checkout, pricing, or any other route. This document is the source of truth
for the v2 dark theme; all v2 colours and type derive from it.

Direction (from the brief): a dark, technical/brutalist landing in the "HydraDB" idiom —
monospace display type, a near-black canvas ruled with faint vertical grid lines, hard
square corners, hairline borders, and burnt-orange used as a structural accent with one or
two solid orange statement blocks. The grounding metaphor is the **CAD drawing / build
plate**: the subject is a precision FDM shop, so the page borrows that world's vernacular —
coordinate ticks, dimension callouts (`256 mm`, `±0.15 mm`), monospace measurements.

---

## 1. Palette (all ratios computed, WCAG 2.1, against the canvas unless noted)

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--v2-bg` | `#0A0A0A` | canvas (near-black, **not** pure black) | — |
| `--v2-bg-raise` | `#121212` | raised panels / cards | — |
| `--v2-text` | `#EDEDED` | primary text | **16.91:1** on bg ✓ AAA |
| `--v2-text-secondary` | `#A8A29A` | body secondary (warm grey) | **7.82:1** ✓ AA |
| `--v2-text-muted` | `#8C8C8C` | mono labels / captions | **5.89:1** ✓ AA |
| `--v2-accent` | `#E55934` | accent text, UI, point-cloud, hairline highlights | **5.48:1** on bg ✓ AA |
| `--v2-accent-strong` | `#BC3A14` | solid statement-block background (white text) | white = **5.59:1** ✓ AA |
| `--v2-line` | `rgba(237,237,237,0.10)` | hairline borders | structural, non-text |
| `--v2-line-strong` | `rgba(237,237,237,0.18)` | card / divider borders | structural, non-text |
| `--v2-grid` | `rgba(237,237,237,0.045)` | vertical background grid lines | ambient, non-text |
| statement text | `#FFFFFF` | text on `--v2-accent-strong` | **5.59:1** ✓ AA |

Why two oranges: both are the **existing** PrintGrid brand oranges, so v2 bridges the live
brand. `#E55934` is the live dark-theme accent (bright enough to pass AA as foreground on
near-black). `#BC3A14` is the live light-theme brand accent (deep enough that white text on
it passes AA) — it backs the solid statement blocks. Verified in `/tmp/contrast.mjs` during
build; numbers above are the actual output.

**Rule:** never put small/normal-weight text in `--v2-text-muted` below 13px, and never use
`--v2-accent` for long-form body copy (it's an accent, not a reading colour). `#6E6E6E` and
anything fainter is **decorative only** (never text) — it fails AA for normal text (3.88:1).

---

## 2. Type

Faces (already loaded via `next/font`, reused — no new font requests):
- **JetBrains Mono** (`--font-jetbrains`) — DISPLAY headings + all data/labels. Carries the
  technical personality. Weights 400/500/600.
- **Inter** (`--font-inter`) — body / paragraphs / nav. Weights 400/500/600/700.

Scale (fluid via `clamp`, mobile→desktop):

| Role | Family | Size | Weight | Tracking | Leading |
|---|---|---|---|---|---|
| Display XL (hero h1) | Mono | `clamp(2.5rem, 6.2vw, 4.5rem)` | 600 | -0.03em | 1.02 |
| Display L (section h2) | Mono | `clamp(1.9rem, 3.6vw, 2.85rem)` | 600 | -0.02em | 1.06 |
| Heading M (h3) | Mono | `clamp(1.25rem, 2vw, 1.5rem)` | 500 | -0.01em | 1.15 |
| Stat number | Mono | `clamp(2.25rem, 4vw, 3.25rem)` | 600 | -0.02em | 1.0 |
| Body L (lede) | Inter | `clamp(1.0625rem, 1.4vw, 1.25rem)` | 400 | 0 | 1.6 |
| Body | Inter | `1rem` | 400 | 0 | 1.6 |
| Label / eyebrow | Mono | `0.75rem` | 500 | 0.16em, UPPERCASE | 1.2 |
| Mono caption / data | Mono | `0.8125rem` | 400, tabular-nums | 0.02em | 1.4 |

Display headings are monospace and lowercase-friendly (statements read like terminal output,
not billboards). Numbers everywhere use `font-variant-numeric: tabular-nums`.

---

## 3. Layout & motifs

- **Container:** max 1200px, 24px gutter (32px ≥768px). 12-col mental model; the vertical
  grid lines mark 4 columns to anchor the eye.
- **Vertical grid lines:** one fixed, behind-everything layer — a `repeating-linear-gradient`
  of `--v2-grid` columns aligned to the container, `pointer-events:none`, `aria-hidden`. Ties
  every section to the same rhythm. Fades near the page edges.
- **Square corners everywhere** (`border-radius: 0`) — the ONE exception is the floating nav
  pill (full radius). That single rounded element against an all-square page is deliberate.
- **Hairline borders** (`--v2-line` / `--v2-line-strong`), never shadows for structure.
  Shadow is used only on the scrolled nav pill and is soft/low.
- **Solid orange statement blocks:** exactly **two** on the page — the value-prop block and
  the final CTA block. `--v2-accent-strong` bg, white text, square. Used nowhere else so they
  stay loud.
- **CAD/measurement device:** thin tick marks + mono dimension labels (e.g. a caliper-style
  `256 mm` span under the hero, `±0.15 mm` annotations on stats). This is the structural
  motif — it encodes real precision specs, it isn't decoration.

Spacing scale (4px base): 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128.
Section vertical padding: `clamp(64px, 10vw, 128px)`.

---

## 4. Motion rules

- Durations **200–300ms**; easing `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out, no bounce).
- **Scroll reveals:** `opacity 0→1` + `translateY(16px→0)`, 240ms, fired once via
  IntersectionObserver (`rootMargin: -10% bottom`, `threshold` small). No stagger longer than
  60ms between siblings.
- **Nav pill:** transitions `background`, `box-shadow`, `backdrop-filter`, `padding`,
  `transform: scale()` only — all GPU/compositor-friendly. State toggled by an
  IntersectionObserver sentinel at the hero base (no per-frame scroll handler → no jank). The
  pill is `position: fixed` so its size change causes **zero layout shift**.
- **Hero point cloud:** capped at ~30fps (timestamp throttle), `requestAnimationFrame`,
  **paused** when the tab is hidden or the canvas scrolls out of view. Lazy-mounted after
  first paint (dynamic import, no SSR) so it never blocks LCP.

### prefers-reduced-motion (every animation has a static fallback)
- Scroll reveals → elements render at final state (opacity 1, no transform).
- Hero point cloud → renders a **single static frame** (no rAF loop), or the static fallback
  image; no drift/rotation.
- Nav → still changes background/shadow on scroll (that's state, not motion) but with no
  scale transition.
- Dashed connector "draw" animations → drawn in their final state immediately.

---

## 5. Accessibility floor

- AA contrast on everything per §1 (verified ratios, not guesses).
- Visible `:focus-visible` — 2px `--v2-accent` outline, 2px offset, on every interactive
  element. Never `outline: none` without a replacement.
- Keyboard: nav fully tabbable; mobile hamburger is a real `<button aria-expanded>` toggling
  a disclosure, closable with `Esc`, focus returned to the toggle.
- Skip-link preserved. Landmarks: `<header> <main> <footer>`, one `<h1>`.
- All decorative layers (grid, point cloud) are `aria-hidden`. Hero has a real text `<h1>`;
  the visual is supplementary.
- Respect `prefers-reduced-motion` (§4) and `prefers-contrast` is not weakened.

---

## 6. The 10 homepage features → component map (all under `app/v2/_components/`)

1. `NavPill` — floating sticky pill, scroll-state via sentinel, mobile hamburger disclosure.
2. type scale — global, in `v2.css`.
3. `GridLines` — fixed vertical-grid background layer.
4. statement blocks — `StatementBlock` (value prop + final CTA only).
5. `HeroPointCloud` — 2D-canvas dot-matrix of a real printed part (gear), lazy + fallback.
6. `Reveal` — IntersectionObserver wrapper, reduced-motion safe.
7. `Stats` — white-bordered stat callouts, orange label-tag + big mono number (real specs).
8. `MaterialBars` — animated horizontal comparison bars from real `@printgrid/pricing` data.
9. `HowItWorks` — Upload→Quote→Pay→Print→Ship blocks with animated dashed orange connectors.
10. `SiteFooter` — wordmark, tagline, columns, TRUE trust badges, contact.

Hero asset: `public/v2/part.stl` (a generated spur-gear — a real printable part) +
`public/v2/part-points.json` (surface point cloud sampled at build time by
`scripts/gen-hero-points.mjs`, which validates the STL through the **existing** parser).
Runtime ships only the small points JSON + a 2D canvas — no three.js, no runtime STL parser,
so mobile performance is protected. A static `public/v2/hero-fallback.*` covers reduced-motion
/ no-JS / low-end.

---

## 7. Real content only (no invented numbers)

Build envelope **256 mm** (Bambu P1S usable bed) · tolerance **±0.15 mm** · **7 materials**
(PLA+, PLA-LW, PETG, ABS, TPU 95A, PA6, PA-CF) · price from true mesh volume incl. **18% GST**
· **UPI via Razorpay** · printed in **Chennai**, **Hyderabad pickup from late June 2026** ·
ships **pan-India in 4 days** · rush **+25%** optional · WhatsApp **+91 75400 23670**.
Trust badges must be TRUE only: Razorpay-secured payments, UPI, GST-registered. No
testimonials, no fake logos, no invented stats.
