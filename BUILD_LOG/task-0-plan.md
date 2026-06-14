# Task 0 — Project init — plan

## Goal
Stand up Next.js 14 + TS strict + CSS Modules scaffolding with Inter +
JetBrains Mono via `next/font/google`, Vitest passing on a dummy test,
and `BUILD_LOG/` already in place. No reviewer this task — first commit
just needs to compile and test.

## Constraints from Overnight.md

- `npx create-next-app@latest . --ts --no-tailwind --eslint --app --src-dir=false --import-alias="@/*"`
- Add: `@react-three/fiber @react-three/drei three react-hook-form zod @hookform/resolvers lucide-react clsx`
- Dev: `@types/three vitest @vitest/ui @testing-library/react @testing-library/jest-dom`
- tsconfig: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitAny: true`
- Vitest config + dummy test that passes
- Commit. No reviewer yet.

## Decisions

1. **Package manager**: Overnight.md says `pnpm add`. Will check for pnpm
   on the system; if missing, fall back to `npm install` and document in
   needs-human.md. Either way, deterministic lockfile checked in.
2. **Existing repo state**: This directory already has files
   (`Claude.md`, `Design.md`, `Overnight.md`, the kit, the zip plus the
   stitch/ extraction, `BUILD_LOG/`, `.claude/agents/design-reviewer.md`,
   `Overnight.original.md`). `create-next-app` will refuse a non-empty
   directory unless we use `.` AND there are no conflicting files. The
   existing `.md` files and `BUILD_LOG/`, `.claude/`, `stitch/` won't
   conflict with create-next-app's outputs. But `package.json`,
   `node_modules`, `.gitignore` would. Plan: run with `.` as target;
   create-next-app's interactive prompts about overwriting existing
   `.gitignore` will be auto-handled by passing flags.
3. **Tailwind**: `--no-tailwind` flag explicitly. Confirm no
   `tailwind.config.*` or `postcss.config.*` ends up in the tree. Remove
   if it does.
4. **App router**: `--app` flag. `--src-dir=false` so files live at
   `/app/...` not `/src/app/...`.
5. **Strict tsconfig**: create-next-app gives strict by default, but
   does NOT include `noUncheckedIndexedAccess`. Will edit tsconfig
   after init to add it + `noImplicitAny: true` (redundant under strict
   but explicitly required by spec).
6. **Vitest**: not part of Next.js scaffold. Need:
   - `vitest.config.ts` with React + jsdom env
   - `tests/sanity.test.ts` with one trivial assertion
   - `package.json` `test` script → `vitest run`
   - `setupTests.ts` (loads `@testing-library/jest-dom`)
7. **Fonts**: Wire `next/font/google` for Inter (400, 500, 600, 700) and
   JetBrains_Mono (400, 500) in `app/layout.tsx`. Export both font
   variables (`--font-inter`, `--font-jetbrains`) on `<body>` so they're
   reachable from CSS modules.
8. **Stripping create-next-app boilerplate**: by default the scaffold
   ships `app/page.tsx` with a marketing-y hero, plus `app/page.module.css`
   styled all over the place. Will replace `app/page.tsx` with a minimal
   placeholder ("PrintGrid Studio — under construction" or similar
   honest text in the brand voice — Task 6 will replace it). Will leave
   `app/globals.css` minimal until Task 1.
9. **ESLint**: scaffold sets up `eslint-config-next`. Leave it.

## Steps (in order)

1. Check for `pnpm`; pick package manager.
2. Run `create-next-app` non-interactively into `.`.
3. Verify the tree: confirm `app/`, `tsconfig.json`, no Tailwind config,
   no `src/`.
4. Edit `tsconfig.json`: add `noUncheckedIndexedAccess` + `noImplicitAny`
   + ensure `strict: true`.
5. Install runtime deps: R3F, Drei, three, RHF, zod, resolvers, lucide,
   clsx.
6. Install dev deps: @types/three, vitest, @vitest/ui, @testing-library
   pieces, jsdom.
7. Add `vitest.config.ts`, `tests/sanity.test.ts`, `tests/setup.ts`,
   `package.json` test script.
8. Wire Inter + JetBrains Mono in `app/layout.tsx` via `next/font/google`.
9. Replace `app/page.tsx` with a minimal honest placeholder.
10. Strip the demo CSS from `app/globals.css`; leave only `*` reset and
    a body color/font fallback (full tokens land in Task 1).
11. Verify: `npx tsc --noEmit` clean; `pnpm test` (or `npm test`) green;
    `next build` (skip if too slow — the type-check covers correctness).
12. Commit `feat(scaffold): next.js 14 + ts strict + vitest + fonts`.
13. Tag `night-1-task-0-complete`.

## Acceptance

- `tsc --noEmit` exits 0
- `pnpm test` exits 0 with one passing test
- `app/layout.tsx` imports both fonts via `next/font/google` and applies
  them as CSS variables on `<body>`
- No tailwind config files in the repo
- `git tag --list 'night-1-task-0-complete'` shows the tag

## Out of scope for Task 0

- Design tokens (Task 1)
- Any UI primitives (Task 2)
- Header / Footer / StatusStrip (Task 3)
- Any real page content (Task 6+)
