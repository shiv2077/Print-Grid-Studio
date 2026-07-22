# PrintGrid Studio — Pango-Inspired UI Revamp (Design)

**Date:** 2026-07-22
**Status:** Approved by user, pending implementation plan
**Branch:** `feat/v2-redesign`

## Summary

Restyle four production routes (`/`, `/quote`, `/materials`, `/orders/[code]`) with a
dark, high-polish, motion-driven aesthetic inspired by `pango.ai`, while preserving
PrintGrid's own teal-shifted brand identity and leaving the entire backend untouched.
This is a UI/visual layer change only: no new API routes, no changes to pricing,
checkout, mesh parsing, or persisted data shapes.

## Non-goals / hard boundaries

- **No changes** to `apps/web/lib/server/**`, any file under `apps/web/app/api/**`,
  or `apps/web/app/quote/state.ts` (the quote reducer). These are the pricing,
  payment, and order-fulfillment source of truth and are out of scope entirely.
- **No new backend calls.** Every existing `fetch()` call site (`lib/checkout.ts`,
  the reprice/pdf calls in `QuotePage.tsx`) keeps its current request/response
  shape. The revamp only changes what wraps around that data.
- **No real AI/LLM integration.** The Pango "chat" input is replicated as a
  *cosmetic* pattern only (typewriter placeholder, blinking cursor, terminal
  focus glow) around the existing file dropzone — it does not call out to any
  model or introduce a new endpoint.
- `app/v2/**` (the existing isolated homepage preview, per `WELCOME_BACK_V3.md`)
  is left untouched by this project. It is a separate, already-pending piece of
  work; folding it in or retiring it is a decision for later, not assumed here.

## Design tokens (`apps/web/app/globals.css`, extended in place)

The site moves to a single dark palette; the existing light/dark toggle
(`ThemeToggle`, `[data-theme]` switching, `localStorage['printgrid-theme']`) is
removed from `Header` and its usages across revamped pages.

| Token | Value | Role |
|---|---|---|
| `--canvas` | `#0A0B0D` | Page background (cool near-black, replaces `--paper`) |
| `--surface` | `#131519` | Raised cards / panels |
| `--text` | `#EDEDED` | Primary text |
| `--text-secondary` | `#9CA3AF` | Secondary body text |
| `--text-muted` | `#6B7280` | Captions, mono labels |
| `--accent` | `#2DD4BF` | Links, icons, active states, UI accents (teal, replacing PrintGrid orange for this revamp) |
| `--accent-strong` | `#0D9488` | Solid buttons / statement blocks (white text on top) |
| `--line` | `rgba(237,237,237,0.10)` | Hairline borders |
| `--line-strong` | `rgba(237,237,237,0.18)` | Card/divider borders |

**Contrast verification is an implementation-time step, not assumed here** —
before any page ships, a contrast-check script (same method used for the
existing `DESIGN_V2.md` palette) must confirm text/accent combinations hit at
least AA. If a token fails, it gets adjusted before that page is considered
done.

**Typography:** keep `next/font` loading exactly as-is (Inter + JetBrains
Mono, zero new font requests). JetBrains Mono continues to carry
labels/data/nav (PrintGrid's existing technical voice); Inter's heading scale
is enlarged/tightened toward Pango's bolder hierarchy for `h1`/`h2`.

## Motion system

Add `motion` (Framer Motion) as a new dependency of `apps/web`. This is a
deliberate departure from the codebase's current zero-animation-dependency
convention (`Reveal.tsx` today is hand-rolled `IntersectionObserver` + CSS) —
justified because scroll-linked SVG path drawing and true spring physics are
impractical to hand-roll to the same quality.

| Pango pattern | PrintGrid mapping | Where |
|---|---|---|
| AI prompt input | `AgentInput`: cosmetic wrapper around the existing dropzone — cycling typewriter placeholder text, blinking cursor, terminal-style focus glow. No new state, no new fetch. | `/quote` |
| Winding scroll-linked SVG road | Fulfillment timeline redrawn as an SVG path connecting the 9 fixed `fulfillment_status` steps (`uploaded → … → delivered`), `pathLength` animated in via `whileInView` (once), current step pulses in `--accent`. | `/orders/[code]` |
| Floating metric tiles w/ spring hover | New `Card` component, `whileHover` spring (lift + border glow), used for the materials comparison grid / `MaterialBars`-style tiles. | `/materials`, homepage feature cards |
| Staggered agentic reveals | The quote flow's real steps (Upload → Configure → Price → Pay) reveal via `AnimatePresence`/`staggerChildren` — reframes existing structure, invents no new steps. | `/quote` |

Reduced-motion: every animation must have a static fallback under
`prefers-reduced-motion: reduce`, matching the existing project convention
(`v2.css` already does this for `Reveal`).

## New / changed components

| Component | Location | Change |
|---|---|---|
| `Card` | `apps/web/components/ui/Card.tsx` (new) | Shared spring-hover card, replaces ad hoc `.feature`/`.material-card` markup where used on revamped pages |
| `AgentInput` | `apps/web/components/ui/AgentInput.tsx` (new) | Cosmetic wrapper described above |
| `Header` | `apps/web/components/layout/Header.tsx` (restyled) | Floating pill nav; `ThemeToggle` usage removed |
| `ThemeToggle` | `apps/web/components/layout/ThemeToggle.tsx` | Removed from `Header`; component left in place but unused (not deleted in this pass — deletion is a separate cleanup decision) |

## Build order (each phase gets its own implementation plan + review checkpoint)

1. **Shared foundation** — tokens in `globals.css`, `motion` dependency, `Card`,
   `AgentInput`, restyled `Header`.
2. **Homepage** (`app/page.tsx`) — no state complexity, proves the token/motion system.
3. **Materials** (`app/materials/MaterialsExplorer.tsx`) — `Card` grid.
4. **Orders** (`app/orders/[code]/page.tsx`) — SVG scroll-path timeline.
5. **Quote** (`app/quote/QuotePage.tsx`) — highest risk (live checkout adjacent), `AgentInput` + staggered reveals, last.

## Validation

After each phase: `pnpm --filter web typecheck` must pass before moving to the
next phase. Existing Vitest suite (`pnpm --filter web test`) must remain green
throughout, since it covers pricing/webhook/mesh-volume logic that this project
does not touch but must not accidentally break via shared import changes.

## Open items carried forward (not blockers, flagged for awareness)

- `app/v2/**` is not part of this project; a follow-up decision is needed on
  whether to retire it once this revamp supersedes its purpose.
- Exact `--accent` / `--accent-strong` hex values above are a starting point;
  the contrast-verification step in Phase 1 may shift them slightly to hit AA.
- `ThemeToggle.tsx` becomes dead code after Phase 1; left in place per the
  "don't delete without being asked" convention, revisit in cleanup.
