# Open issues for human review

Items the overnight run could not resolve autonomously. Triage in priority
order (BLOCKERS first).

## Resolved at start of run (logged for transparency)

### Source files were truncated or missing
- `Overnight.md` on disk was a kit-paste truncated at line 30 of 236 (cut
  at "## Folder structure"). Reconstituted from `Frontend overnight kit
  v3 nextjs.md` lines 25–260. Original preserved as `Overnight.original.md`.
  → No human action needed; this restores the kit's stated intent.
- `Design.md` on disk is 24 lines, ending mid-sentence at "Loaded via
  Google Fonts at top of `<head>`:". The vibes / aesthetic adjectives /
  anti-adjectives / typography intro that ARE there are treated as
  binding. Tokens, components, and layout rules are derived from
  `Overnight.md` task descriptions and the `Frontend overnight kit
  v3 nextjs.md` CSS Modules pattern (which uses `--ink`, `--paper`,
  `--paper-warm`, `--accent`, `--accent-deep`).
  → **Recommend:** finish writing Design.md after this run. Specifically,
  document: full token table with hex values, ink-tint scale, type scale
  table (size + weight + line-height + tracking per class), spacing
  scale, the 32px grid-paper pattern.
- `PROJECT_BRIEF.md` does not exist. `Claude.md` (the prompt playbook) is
  serving as the brief, with its Section 8 "Stack" overridden per the
  orchestrator instructions (Next.js + CSS Modules instead of vanilla
  HTML + Tailwind).
  → **Recommend:** rename `Claude.md` to `PROJECT_BRIEF.md` (or extract
  the brief content into one) so the references in `Overnight.md` line up.
- `.claude/agents/design-reviewer.md` did not exist. The orchestrator
  prompt offered an inline spec but the message cut off mid-sentence
  before the spec was provided. I authored a reviewer agent definition
  derived from `Design.md` (vibes/anti-references) and the kit task
  descriptions. Spec at `.claude/agents/design-reviewer.md`.
  → **Review:** confirm the reviewer agent's BLOCKER/MAJOR/MINOR rubric
  matches what you intended.

## Will be flagged here as the night progresses

### Task 14 — Polish items I cannot run from this environment

The orchestrator's Task 14 lists several checks that need a real
browser. I can't execute them tonight; please run before deploy:

- **Lighthouse on every page.** Targets per spec: ≥90 perf on /, /about,
  /materials, /contact, /privacy, /terms, /refund, /shipping. ≥75 on
  /quote (R3F is heavy). Use `npx lighthouse-ci` or the Chrome DevTools
  audit panel.
- **Tab through every page.** Verify every interactive element receives
  a visible accent focus ring (the global :focus-visible rule should
  give you this for free, but visually confirm). Pay particular
  attention to the FileCard quantity +/-, the SegmentedControl options,
  and the mobile menu close button.
- **Reduced-motion audit.** macOS: System Settings → Accessibility →
  Display → Reduce motion. Reload the homepage and quote page. The
  RevealOnScroll fade should snap on instead of animate, and the
  ghost-button chevron should not slide on hover.
- **Real screenshots.** I haven't installed Playwright; the end-of-run
  morning brief notes which pages were/weren't auto-captured.

### Task 7 — /materials page needs real product photos

The `/materials` page renders 7 sections (one per filament). Each has a
50/50 split with copy on the left and a "photo placeholder" on the
right. The placeholder is styled with a CAD-title-block aesthetic so
it's honest about being a placeholder rather than a generic gray box,
but Aadharsh: please drop a real photo of a printed part in each
material before launch. Title-block codes (`PG-MAT-PLA-PLUS`, etc.) are
in the page so you can search-replace each placeholder when the photos
are ready.

### Task 5 — STL parser is duplicated (worker.js ↔ stl-parse.ts)

The kit at line 511 says: "STL parser — keep `/public/stl-parser.worker.js`
from kit v2 Section 6 verbatim." **Kit v2 is not on disk** — only kit v3.
I wrote the worker myself from the algorithm description in `Claude.md`
Prompt 3 (binary header layout, ASCII detection, signed-tetrahedron
volume).

Because classic Web Workers cannot import ESM/TS modules, the worker
script and `lib/stl-parse.ts` duplicate the same algorithm. Tests run
against the TypeScript port (`lib/stl-parse.ts`) — if someone changes
one without changing the other, the bug will silently slip into prod
because the worker is what the browser actually executes.

**Mitigation options for the morning:**
1. Replace the duplicated worker with a Vite-bundled worker
   (`new Worker(new URL('./stl-parser.worker.ts', import.meta.url),
   { type: 'module' })`) — Next.js 14 supports this for module workers,
   but it ties the worker to the bundler and loses the kit's "verbatim
   /public" intent. Recommended.
2. Lock the duplication with a CI step that fails if the two files
   produce different outputs on a fixture buffer.
3. Accept the duplication and rely on code review.

Aadharsh: pick one. If you go with option 1, I'd want to see a fresh
benchmark — module workers have a small initialisation cost that
sometimes matters for STLs over 50MB.

### Task 0 — npm install warnings (review before deploy)

- `next@14.2.15` carries a security advisory dated 2025-12-11. The kit
  pinned Next.js 14 and bumping mid-overnight has high risk of cascading
  changes (App Router behavior, font imports, CSS module quirks). I left
  it at 14.2.15. **Bump to the latest 14.x patch (probably 14.2.30 or
  the latest LTS) before any deploy.**
- `eslint@8.57.1` is no longer supported. Upgrade path is non-trivial
  (eslint 9 has a different config format). Punting to backend phase.
- `three-mesh-bvh@0.7.8` deprecation warning came in via `@react-three/drei`.
  Drei pulls it transitively; nothing to do unless we hit runtime
  issues with it.
- npm reports 0 vulnerabilities at install (but didn't run `npm audit`
  separately — flagged for Aadharsh to run before deploy).
