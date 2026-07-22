# Pango Revamp — Phase 1 (Shared Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the shared foundation (design tokens, motion library, `Card`,
`AgentInput`, restyled `Header`) that Phases 2–5 (Homepage, Materials, Orders,
Quote) will build on — with no page content migrated yet in this phase.

**Architecture:** Additive CSS custom properties in the existing global
stylesheet (new tokens live alongside, not instead of, the current light/dark
tokens, since only `Header` changes behavior in this phase — everything else
keeps rendering exactly as today). Two new presentational components under
`apps/web/components/ui/`, each with a small pure/testable core (a hover-state
helper for `Card`, a typewriter state machine for `AgentInput`) wrapped by a
thin React component. `Header` is restyled in place.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript (strict), CSS
Modules, `motion` (Framer Motion successor, imported from `motion/react`),
Vitest + `@testing-library/react` + jsdom (already configured, currently
unused by any test in the repo — this phase activates it for the first time).

## Global Constraints

- No changes to `apps/web/lib/server/**`, `apps/web/app/api/**`, or
  `apps/web/app/quote/state.ts` — pricing, payments, mesh parsing, and the
  quote reducer are strictly out of scope.
- No changes to any page content in this phase (`app/page.tsx`,
  `app/quote/**`, `app/materials/**`, `app/orders/**` are untouched — they get
  migrated in later phases).
- `apps/web/app/v2/**` is untouched.
- Every animation must have a static, non-animated fallback under
  `prefers-reduced-motion: reduce`.
- After every task: `pnpm --filter web typecheck` must pass. After the final
  task: `pnpm --filter web test` must pass in full.
- New dependency version must match what is actually published — do not
  invent a version number. `motion@12.42.2` is confirmed current on the npm
  registry as of this plan (`framer-motion@12.42.2` is the same release under
  its legacy name; this plan uses the `motion` package name and imports from
  `motion/react`, per the current Framer Motion documentation).

---

### Task 1: Add the `motion` dependency

**Files:**
- Modify: `apps/web/package.json:14-32` (dependencies block)

**Interfaces:**
- Consumes: nothing
- Produces: the `motion` package, importable as `import { motion, useReducedMotion } from 'motion/react'` in later tasks

- [ ] **Step 1: Add the dependency to `apps/web/package.json`**

Current block (lines 14–32):

```json
  "dependencies": {
    "@printgrid/pricing": "workspace:*",
    "@hookform/resolvers": "^3.9.0",
    "@react-three/drei": "^9.114.0",
    "@react-three/fiber": "^8.17.10",
    "@supabase/supabase-js": "^2.45.4",
    "clsx": "^2.1.1",
    "drizzle-orm": "^0.33.0",
    "jszip": "^3.10.1",
    "pdf-lib": "^1.17.1",
    "lucide-react": "^0.453.0",
    "next": "14.2.15",
    "postgres": "^3.4.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.0",
    "three": "^0.169.0",
    "zod": "^3.23.8"
  },
```

Change it to (new line inserted after `lucide-react`):

```json
  "dependencies": {
    "@printgrid/pricing": "workspace:*",
    "@hookform/resolvers": "^3.9.0",
    "@react-three/drei": "^9.114.0",
    "@react-three/fiber": "^8.17.10",
    "@supabase/supabase-js": "^2.45.4",
    "clsx": "^2.1.1",
    "drizzle-orm": "^0.33.0",
    "jszip": "^3.10.1",
    "pdf-lib": "^1.17.1",
    "lucide-react": "^0.453.0",
    "motion": "^12.42.2",
    "next": "14.2.15",
    "postgres": "^3.4.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.0",
    "three": "^0.169.0",
    "zod": "^3.23.8"
  },
```

- [ ] **Step 2: Install and update the lockfile**

Run from the repo root:

```bash
pnpm install
```

Expected: exits 0, `pnpm-lock.yaml` at the repo root is modified to include
`motion@12.42.2`, and `apps/web/node_modules/motion` exists.

- [ ] **Step 3: Verify the package resolves**

Run:

```bash
pnpm --filter web exec node -e "console.log(require.resolve('motion/react'))"
```

Expected: prints a path ending in `motion/dist/cjs/react.js` (or `.mjs`),
no error.

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore: add motion (Framer Motion) dependency for Pango-inspired revamp"
```

---

### Task 2: Add dark/teal design tokens to `globals.css`

**Files:**
- Modify: `apps/web/app/globals.css:1-27` (tokens section)
- Test: `apps/web/tests/globals-tokens.test.ts` (new)

**Interfaces:**
- Consumes: nothing
- Produces: CSS custom properties `--canvas`, `--surface`, `--text`,
  `--text-secondary`, `--text-muted`, `--accent-teal`, `--accent-teal-strong`,
  `--line`, `--line-strong` on `:root`, available to every later task/phase.
  Named `--accent-teal`/`--accent-teal-strong` (not `--accent`/`--accent-strong`
  as in the design doc's shorthand) specifically so they do not collide with
  the existing `--accent` (orange) token that `.btn-primary`,
  `.quote-row-line--discount`, and other current production CSS still depend
  on — those must keep working unmodified until their own phase migrates them.

- [ ] **Step 1: Write the failing test**

Create `apps/web/tests/globals-tokens.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('globals.css design tokens', () => {
  const css = readFileSync(
    path.resolve(__dirname, '../app/globals.css'),
    'utf8'
  );

  it('defines the new dark/teal revamp tokens on :root', () => {
    expect(css).toMatch(/--canvas:\s*#0A0B0D/);
    expect(css).toMatch(/--surface:\s*#131519/);
    expect(css).toMatch(/--text:\s*#EDEDED/);
    expect(css).toMatch(/--text-secondary:\s*#9CA3AF/);
    expect(css).toMatch(/--text-muted:\s*#6B7280/);
    expect(css).toMatch(/--accent-teal:\s*#2DD4BF/);
    expect(css).toMatch(/--accent-teal-strong:\s*#0D9488/);
    expect(css).toMatch(/--line:\s*rgba\(237,\s*237,\s*237,\s*0\.10\)/);
    expect(css).toMatch(/--line-strong:\s*rgba\(237,\s*237,\s*237,\s*0\.18\)/);
  });

  it('does not remove the existing tokens other, not-yet-migrated pages depend on', () => {
    expect(css).toMatch(/--ink:\s*#0A0A0A/);
    expect(css).toMatch(/--paper:\s*#FAFAF7/);
    expect(css).toMatch(/--accent:\s*#BC3A14/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter web test -- globals-tokens`
Expected: FAIL — the new tokens (`--canvas`, `--surface`, etc.) do not exist yet.

- [ ] **Step 3: Add the tokens to `apps/web/app/globals.css`**

Insert this new block immediately after the existing `:root { ... }` block
(i.e., right after the line `}` that closes the block containing `--scrim`,
and before the `[data-theme="dark"]` block). The existing `:root` block,
`[data-theme="dark"]` block, and everything else in the file is left exactly
as-is:

```css
/* ---------- Pango-inspired revamp tokens ----------
   New, additive palette for the dark-only revamp (Homepage, Materials,
   Orders, Quote — rolled out one phase at a time). Named --accent-teal /
   --accent-teal-strong (not --accent / --accent-strong) so they never
   collide with the existing orange --accent used by not-yet-migrated pages
   and components. Exact hex values are a starting point; verify AA contrast
   before each page that consumes them ships. */
:root {
  --canvas: #0A0B0D;
  --surface: #131519;
  --text: #EDEDED;
  --text-secondary: #9CA3AF;
  --text-muted: #6B7280;
  --accent-teal: #2DD4BF;
  --accent-teal-strong: #0D9488;
  --line: rgba(237, 237, 237, 0.10);
  --line-strong: rgba(237, 237, 237, 0.18);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter web test -- globals-tokens`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: exits 0, no errors (CSS changes don't affect TS, but this confirms
nothing else broke).

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/globals.css apps/web/tests/globals-tokens.test.ts
git commit -m "feat: add dark/teal design tokens for Pango-inspired revamp"
```

---

### Task 3: `Card` component

**Files:**
- Create: `apps/web/components/ui/Card.tsx`
- Create: `apps/web/components/ui/Card.module.css`
- Test: `apps/web/tests/card.test.tsx` (new)

**Interfaces:**
- Consumes: tokens from Task 2 (`--surface`, `--line-strong`, `--accent-teal`,
  `--text`); `motion`/`useReducedMotion` from Task 1
- Produces: `export function Card({ children, className }: CardProps)` and
  `export function getHoverAnimation(reduceMotion: boolean): { y: number; borderColor: string } | undefined`
  from `apps/web/components/ui/Card.tsx`, for later phases (Materials grid,
  homepage feature cards) to import as `import { Card } from '@/components/ui/Card'`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/tests/card.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, getHoverAnimation } from '@/components/ui/Card';

describe('getHoverAnimation', () => {
  it('returns a lift + accent border when motion is allowed', () => {
    expect(getHoverAnimation(false)).toEqual({
      y: -4,
      borderColor: 'var(--accent-teal)',
    });
  });

  it('returns undefined when reduced motion is preferred', () => {
    expect(getHoverAnimation(true)).toBeUndefined();
  });
});

describe('Card', () => {
  it('renders its children', () => {
    render(<Card>hello card</Card>);
    expect(screen.getByText('hello card')).toBeInTheDocument();
  });

  it('applies a custom className alongside the base card class', () => {
    render(<Card className="extra-class">content</Card>);
    expect(screen.getByText('content').className).toContain('extra-class');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter web test -- card.test`
Expected: FAIL with "Failed to resolve import '@/components/ui/Card'" (the
file doesn't exist yet).

- [ ] **Step 3: Create `apps/web/components/ui/Card.module.css`**

```css
.card {
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  padding: 24px;
  color: var(--text);
}
```

- [ ] **Step 4: Create `apps/web/components/ui/Card.tsx`**

```tsx
'use client';

import { motion, useReducedMotion } from 'motion/react';
import clsx from 'clsx';
import styles from './Card.module.css';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/** Pure so it's testable without rendering or triggering a real hover. */
export function getHoverAnimation(
  reduceMotion: boolean
): { y: number; borderColor: string } | undefined {
  if (reduceMotion) return undefined;
  return { y: -4, borderColor: 'var(--accent-teal)' };
}

export function Card({ children, className }: CardProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={clsx(styles.card, className)}
      whileHover={getHoverAnimation(!!reduceMotion)}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter web test -- card.test`
Expected: PASS (4 tests).

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/ui/Card.tsx apps/web/components/ui/Card.module.css apps/web/tests/card.test.tsx
git commit -m "feat: add Card component with spring hover for Pango-inspired revamp"
```

---

### Task 4: `AgentInput` component

**Files:**
- Create: `apps/web/components/ui/AgentInput.tsx`
- Create: `apps/web/components/ui/AgentInput.module.css`
- Test: `apps/web/tests/agent-input.test.tsx` (new)

**Interfaces:**
- Consumes: tokens from Task 2 (`--accent-teal`, `--text-muted`,
  `--font-mono`); `useReducedMotion` from Task 1
- Produces: `export function AgentInput({ placeholders, children, className }: AgentInputProps)`,
  `export function nextTypewriterState(state: TypewriterState, phrases: readonly string[]): TypewriterState`,
  `export const TICK_MS`, `export const HOLD_TICKS`, `export const GAP_TICKS`,
  and `export type TypewriterState = { phraseIndex: number; charCount: number; phase: 'typing' | 'holding' | 'deleting' | 'gap'; counter: number }`
  from `apps/web/components/ui/AgentInput.tsx`. This is a **cosmetic wrapper
  only** — it renders `children` unchanged; the actual `/quote` dropzone
  markup, its `onDrop` handler, and `app/quote/state.ts` are not touched until
  Phase 5, and even then only wrapped, not modified.

- [ ] **Step 1: Write the failing tests**

Create `apps/web/tests/agent-input.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  AgentInput,
  nextTypewriterState,
  HOLD_TICKS,
  GAP_TICKS,
  type TypewriterState,
} from '@/components/ui/AgentInput';

vi.mock('motion/react', () => ({
  useReducedMotion: () => false,
}));

describe('nextTypewriterState', () => {
  const phrases = ['ab', 'c'];

  it('types one character per tick', () => {
    const s0: TypewriterState = { phraseIndex: 0, charCount: 0, phase: 'typing', counter: 0 };
    const s1 = nextTypewriterState(s0, phrases);
    expect(s1).toEqual({ phraseIndex: 0, charCount: 1, phase: 'typing', counter: 0 });
    const s2 = nextTypewriterState(s1, phrases);
    expect(s2).toEqual({ phraseIndex: 0, charCount: 2, phase: 'typing', counter: 0 });
  });

  it('switches to holding once the phrase is fully typed', () => {
    const typed: TypewriterState = { phraseIndex: 0, charCount: 2, phase: 'typing', counter: 0 };
    const held = nextTypewriterState(typed, phrases);
    expect(held.phase).toBe('holding');
  });

  it('switches from holding to deleting after the hold duration elapses', () => {
    const held: TypewriterState = { phraseIndex: 0, charCount: 2, phase: 'holding', counter: HOLD_TICKS - 1 };
    const next = nextTypewriterState(held, phrases);
    expect(next.phase).toBe('deleting');
    expect(next.counter).toBe(0);
  });

  it('deletes back to zero, then gaps', () => {
    let s: TypewriterState = { phraseIndex: 0, charCount: 2, phase: 'deleting', counter: 0 };
    s = nextTypewriterState(s, phrases);
    expect(s).toEqual({ phraseIndex: 0, charCount: 1, phase: 'deleting', counter: 0 });
    s = nextTypewriterState(s, phrases);
    expect(s).toEqual({ phraseIndex: 0, charCount: 0, phase: 'deleting', counter: 0 });
    s = nextTypewriterState(s, phrases);
    expect(s.phase).toBe('gap');
  });

  it('wraps from the last phrase back to the first after the gap elapses', () => {
    const lastPhraseGap: TypewriterState = { phraseIndex: 1, charCount: 0, phase: 'gap', counter: GAP_TICKS - 1 };
    const advanced = nextTypewriterState(lastPhraseGap, phrases);
    expect(advanced).toEqual({ phraseIndex: 0, charCount: 0, phase: 'typing', counter: 0 });
  });
});

describe('AgentInput', () => {
  it('renders children alongside the typed hint', () => {
    render(
      <AgentInput placeholders={['drop_model.stl_']}>
        <input aria-label="file" />
      </AgentInput>
    );
    expect(screen.getByLabelText('file')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter web test -- agent-input.test`
Expected: FAIL with "Failed to resolve import '@/components/ui/AgentInput'".

- [ ] **Step 3: Create `apps/web/components/ui/AgentInput.module.css`**

```css
.shell {
  position: relative;
  border-radius: 12px;
}

.shell:focus-within {
  box-shadow: 0 0 0 2px var(--accent-teal);
}

.hint {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 0;
  pointer-events: none;
}

.mono {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-muted);
  white-space: pre;
}

.cursor {
  display: inline-block;
  width: 7px;
  height: 15px;
  background: var(--accent-teal);
  animation: caret-blink 1s steps(2, start) infinite;
}

@keyframes caret-blink {
  to { visibility: hidden; }
}

@media (prefers-reduced-motion: reduce) {
  .cursor {
    animation: none;
  }
}
```

- [ ] **Step 4: Create `apps/web/components/ui/AgentInput.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import clsx from 'clsx';
import styles from './AgentInput.module.css';

export const TICK_MS = 40;
export const HOLD_TICKS = 35; // ~1400ms pause once fully typed
export const GAP_TICKS = 8; // ~320ms pause once fully deleted

type Phase = 'typing' | 'holding' | 'deleting' | 'gap';

export interface TypewriterState {
  phraseIndex: number;
  charCount: number;
  phase: Phase;
  counter: number;
}

/** Pure state-machine step, testable without timers. */
export function nextTypewriterState(
  state: TypewriterState,
  phrases: readonly string[]
): TypewriterState {
  const phrase = phrases[state.phraseIndex] ?? '';
  switch (state.phase) {
    case 'typing': {
      if (state.charCount < phrase.length) {
        return { ...state, charCount: state.charCount + 1 };
      }
      return { ...state, phase: 'holding', counter: 0 };
    }
    case 'holding': {
      if (state.counter + 1 < HOLD_TICKS) {
        return { ...state, counter: state.counter + 1 };
      }
      return { ...state, phase: 'deleting', counter: 0 };
    }
    case 'deleting': {
      if (state.charCount > 0) {
        return { ...state, charCount: state.charCount - 1 };
      }
      return { ...state, phase: 'gap', counter: 0 };
    }
    case 'gap': {
      if (state.counter + 1 < GAP_TICKS) {
        return { ...state, counter: state.counter + 1 };
      }
      return {
        phraseIndex: (state.phraseIndex + 1) % phrases.length,
        charCount: 0,
        phase: 'typing',
        counter: 0,
      };
    }
  }
}

export interface AgentInputProps {
  placeholders: readonly string[];
  children: React.ReactNode;
  className?: string;
}

/**
 * Cosmetic-only wrapper: renders `children` (the real dropzone/config
 * markup) unchanged, plus an animated typed hint above it. No new state,
 * no fetch calls — purely decorative.
 */
export function AgentInput({ placeholders, children, className }: AgentInputProps) {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState<TypewriterState>({
    phraseIndex: 0,
    charCount: 0,
    phase: 'typing',
    counter: 0,
  });

  useEffect(() => {
    if (reduceMotion || placeholders.length === 0) return;
    const id = setInterval(() => {
      setState((s) => nextTypewriterState(s, placeholders));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [reduceMotion, placeholders]);

  const phrase = placeholders[state.phraseIndex] ?? '';
  const shown = reduceMotion ? phrase : phrase.slice(0, state.charCount);

  return (
    <div className={clsx(styles.shell, className)}>
      <div className={styles.hint} aria-hidden="true">
        <span className={styles.mono}>{shown}</span>
        {!reduceMotion && <span className={styles.cursor} />}
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter web test -- agent-input.test`
Expected: PASS (6 tests).

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/ui/AgentInput.tsx apps/web/components/ui/AgentInput.module.css apps/web/tests/agent-input.test.tsx
git commit -m "feat: add AgentInput cosmetic typewriter wrapper for Pango-inspired revamp"
```

---

### Task 5: Restyle `Header` (floating pill nav, `ThemeToggle` removed)

**Files:**
- Create: `apps/web/components/layout/Header.module.css`
- Modify: `apps/web/components/layout/Header.tsx` (full rewrite, 33 lines → new version below)
- Test: `apps/web/tests/header.test.tsx` (new)

**Interfaces:**
- Consumes: tokens from Task 2 (`--surface`, `--line-strong`, `--text`,
  `--text-secondary`, `--accent-teal`, `--accent-teal-strong`, `--font-sans`,
  `--font-mono`)
- Produces: no new exports consumed by later tasks in this phase; `Header` is
  rendered once, globally, by `apps/web/app/layout.tsx` (unchanged in this
  phase — it already imports `Header` from `@/components/layout/Header` and
  needs no edit).
- Note: `apps/web/components/layout/ThemeToggle.tsx` is left in place,
  unmodified, but no longer imported by anything after this task. This is
  intentional dead code, per the approved design — its removal (file deletion)
  is a decision for a later cleanup pass, not this phase.

- [ ] **Step 1: Write the failing tests**

Create `apps/web/tests/header.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/layout/Header';

describe('Header', () => {
  it('renders the wordmark link to home', () => {
    render(<Header />);
    expect(
      screen.getByRole('link', { name: /printgrid studio home/i })
    ).toHaveAttribute('href', '/');
  });

  it('does not render a theme toggle', () => {
    render(<Header />);
    expect(
      screen.queryByRole('button', { name: /toggle colour theme/i })
    ).not.toBeInTheDocument();
  });

  it('renders the primary nav links plus the quote CTA', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Materials' })).toHaveAttribute(
      'href',
      '/materials'
    );
    expect(screen.getByRole('link', { name: 'Get a quote' })).toHaveAttribute(
      'href',
      '/quote'
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter web test -- header.test`
Expected: FAIL — current `Header` still renders `ThemeToggle`
("does not render a theme toggle" fails) and uses different markup/classes
(other assertions may still pass by coincidence; the toggle assertion is the
one that must fail before Step 4).

- [ ] **Step 3: Create `apps/web/components/layout/Header.module.css`**

```css
.header {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 10px 20px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 85%, transparent);
  backdrop-filter: blur(12px);
  border: 1px solid var(--line-strong);
}

.wordmark {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 15px;
  color: var(--text);
}

.wordmark:hover {
  color: var(--accent-teal);
}

.nav {
  display: flex;
  align-items: center;
  gap: 18px;
}

.navLink {
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
}

.navLink:hover {
  color: var(--accent-teal);
}

.cta {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 999px;
  background: var(--accent-teal-strong);
  color: #fff;
}

.cta:hover {
  background: var(--accent-teal);
}

@media (max-width: 720px) {
  .header {
    gap: 12px;
    padding: 8px 14px;
  }
  .nav {
    gap: 10px;
  }
  .navLink {
    display: none;
  }
}
```

- [ ] **Step 4: Replace `apps/web/components/layout/Header.tsx`**

Full new contents (replaces the entire current 33-line file, including
removing the `import { ThemeToggle } from './ThemeToggle';` line and the
`<ThemeToggle />` usage):

```tsx
import Link from 'next/link';
import styles from './Header.module.css';

const NAV_LINKS = [
  { href: '/materials', label: 'Materials' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
] as const;

export function Header() {
  return (
    <header className={styles.header}>
      <Link className={styles.wordmark} href="/" aria-label="PrintGrid Studio home">
        PrintGrid
      </Link>
      <nav className={styles.nav} aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} className={styles.navLink} href={link.href}>
            {link.label}
          </Link>
        ))}
        <Link className={styles.cta} href="/quote">
          Get a quote
        </Link>
      </nav>
    </header>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter web test -- header.test`
Expected: PASS (3 tests).

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter web typecheck`
Expected: exits 0 (confirms `ThemeToggle.tsx` itself, though now unused, is
still valid standalone TypeScript — it is not deleted, so it must still
compile on its own).

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/layout/Header.tsx apps/web/components/layout/Header.module.css apps/web/tests/header.test.tsx
git commit -m "feat: restyle Header as floating pill nav, drop ThemeToggle usage"
```

---

### Task 6: Full Phase 1 validation gate

**Files:** none (verification only)

**Interfaces:**
- Consumes: everything from Tasks 1–5
- Produces: confirmation that Phase 1 is complete and safe to build on in
  Phase 2 (Homepage)

- [ ] **Step 1: Run the full typecheck**

Run: `pnpm --filter web typecheck`
Expected: exits 0.

- [ ] **Step 2: Run the full test suite**

Run: `pnpm --filter web test`
Expected: all tests pass, including every pre-existing test (address,
fulfillment, manufacturability, materials-data, mesh-volume, quote-pdf,
sanity, seo, stl-parse, webhook) plus the four new suites added in this
plan (`globals-tokens`, `card`, `agent-input`, `header`).

- [ ] **Step 3: Run the production build**

Run: `pnpm --filter web build`
Expected: exits 0, no type or lint errors surfaced during build. This
confirms `Header`'s CSS Module and the new `motion` import resolve correctly
under Next.js's actual bundler, not just Vitest's.

- [ ] **Step 4: Manual visual check**

Run: `pnpm --filter web dev`, open `http://localhost:3000/` in a browser.
Confirm: the floating pill nav renders at the top, centered, with a
dark/blurred background; no theme toggle button is present; all nav links
and the "Get a quote" CTA are clickable and navigate correctly. (No other
part of the homepage will look different yet — Phase 2 handles the rest of
the page.)

No commit for this task — it is a verification checkpoint, not a code change.
If any step fails, fix the specific failing task above and re-run this
checklist from Step 1.
