# Task 2 — UI primitives — plan

Build 5 primitives. Each lives in `/components/ui/` as
`<Name>.tsx` + `<Name>.module.css` (kit pattern from
`Frontend overnight kit v3 nextjs.md` line 526+). All server components
unless behavior demands `"use client"`.

## Decisions

- **clsx** is already a dep (Task 0). Use it for variant class joining.
- All primitives accept `className?: string` plus the relevant native
  props they extend, so callers can pass through aria-* attributes,
  data-*, etc.
- No primitive emits `style={{}}` — all visual rules live in `.module.css`.
- TypeScript: discriminated union for variants; never `any`. The `as`
  prop pattern is avoided this run — keeps type complexity low.

## Components

### Button

```tsx
type Variant = 'primary' | 'secondary' | 'ghost';
type Props = {
  variant?: Variant;          // default 'secondary'
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;
```

CSS rules:
- Square: `border-radius: 2px;`
- 14px 28px padding (default), 8px 0 for ghost
- Inter 500 / 15px / line-height 1
- Transitions: `background 150ms`, `color 150ms`, `border-color 150ms`.
  No transform, no box-shadow, no scale.
- `.primary`: bg `--accent`, color `--paper`, border `--accent`.
  Hover: bg `--accent-deep`, border `--accent-deep`.
- `.secondary`: bg transparent, color `--ink`, border 1px `--ink`.
  Hover: bg `--ink`, color `--paper`. (Inverts.)
- `.ghost`: bg transparent, color `--ink`, no border. Hover: color
  `--accent`. Includes a chevron via lucide-react (or inline SVG).
- Disabled: opacity 0.4, cursor not-allowed, hover removed.

Inverse-context (inside `.on-ink` parent, e.g. dark hero CTA section):
- `.secondary` flips to ink-on-paper border (CSS handles via
  `.on-ink .secondary` cascade).

### SegmentedControl

```tsx
type Option<V extends string> = { value: V; label: string };
type Props<V extends string> = {
  options: Option<V>[];   // 2–6 options
  value: V;
  onChange: (next: V) => void;
  ariaLabel: string;
  className?: string;
};
```

`"use client"` (calls `onChange`). Renders as a `<div role="radiogroup">`
with each option as a `<button role="radio" aria-checked>`. Hairline
divider between options via `border-right` on all but the last. Selected
gets `--ink` bg + `--paper` text. Unselected: transparent + `--ink-70`
text. Hover unselected: bg `--ink-10`.

### Section

```tsx
type Bg = 'paper' | 'paper-warm' | 'ink';
type Props = {
  bg?: Bg;             // default 'paper'
  gridPaper?: boolean; // default false
  className?: string;
  children: React.ReactNode;
};
```

Server component. Renders `<section>` with bg class + optional
`grid-paper` (or `grid-paper-on-ink` when `bg === 'ink'`). Padding
`var(--section-pad-y)` top + bottom desktop, `var(--section-pad-y-mobile)`
on mobile. When `bg === 'ink'`, also adds `on-ink` class so the inverse
typography rules in globals.css apply.

### Container

```tsx
type Props = {
  className?: string;
  children: React.ReactNode;
};
```

Server. `max-width: var(--container-max)`, `margin: 0 auto`,
`padding-inline: var(--gutter)` desktop, `var(--gutter-mobile)` mobile.

### RevealOnScroll

`"use client"` — uses `IntersectionObserver` and `useState`.

```tsx
type Props = {
  delay?: number;       // ms; default 0
  className?: string;
  children: React.ReactNode;
};
```

Wraps children in a `<div>` with class `reveal-on-scroll` (the global CSS
already targets this class for reduced-motion override). Initial state:
`opacity: 0; transform: translateY(8px);`. On viewport entry, sets a
`.is-visible` class that transitions opacity to 1 and transform to none
over 200ms. Honors `prefers-reduced-motion: reduce` by skipping the
animation entirely (sets `is-visible` immediately on mount when matched
— the global CSS reduced-motion rule already nukes the transform either
way, so this is belt-and-braces).

Observer threshold: 0.1. Once visible, disconnects (one-shot).

## Acceptance

- All 5 component pairs compile (`tsc --noEmit` clean)
- Each has its own folder-flat `.tsx` + `.module.css` (kit's flat pattern,
  not per-folder per-component, but in `/components/ui/`)
- No primitive emits a hex value — all colors via tokens
- No primitive emits `box-shadow`, `transform` (other than RevealOnScroll's
  one-time entrance translate which is killed by reduced-motion), or
  `linear-gradient`
- Reviewer-checkable: short demo block in `app/page.tsx` placeholder
  exercising all 5 primitives so the reviewer can verify rendering.
  Will be replaced in Task 6.

## Out of scope for Task 2

- Header / Footer / StatusStrip (Task 3)
- Real page content (Tasks 6+)
- Form-specific primitives (Task 9)
- Custom dropdown for materials (Task 10 spec calls for a custom
  one — built when needed, not as a generic primitive)
