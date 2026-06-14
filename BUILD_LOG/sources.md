# Source map for the overnight run

The four files the orchestrator prompt referenced did not all exist on disk
under the names given. Here is the mapping I am using, and the reasoning for
each call. Audit in the morning.

## Files on disk at start of run

| Name on disk                              | Lines | What it is                                  |
|-------------------------------------------|-------|---------------------------------------------|
| `Claude.md`                               | 938   | Full prompt playbook (Tailwind-based)       |
| `Design.md`                               | 24    | Truncated mid-sentence at "Loaded via Google Fonts at top of `<head>`:" |
| `Overnight.md`                            | 30    | Truncated at "## Folder structure" — no tasks listed |
| `Frontend overnight kit v3 nextjs.md`     | 588   | Complete kit: embedded OVERNIGHT block, pricing engine, tests, STL worker, CSS Modules pattern |
| `stitch_print_grid_studio.zip`            | 1.1MB | 4 Stitch reference HTML pages + screenshots, plus `industrial_grid_premium/DESIGN.md` (157 lines) |

## Mapping decisions

**PROJECT_BRIEF.md** → does not exist. Treating `Claude.md` as the authoritative
brief. Section 8 ("Stack") is OVERRIDDEN per the orchestrator prompt: we use
Next.js 14 + TypeScript + CSS Modules, NOT vanilla HTML/Tailwind. The brief's
non-stack content (pricing rules, materials, page list, build envelopes,
copy voice) is binding.

**OVERNIGHT.md** → on-disk file is a paste of the kit's "OVERNIGHT.md (paste at
repo root)" block, cut off at line 30 of 236. Reconstituted the full content
from the kit (`Frontend overnight kit v3 nextjs.md` lines 25–260). The kit
explicitly instructs "paste at repo root" so this is restoring intent, not
inventing. Original truncated version preserved as `Overnight.original.md`.

**DESIGN.md** → on-disk file (24 lines) covers: reference vibes, aesthetic
adjectives + anti-adjectives, typography intro. Truncated before tokens.
Zip's `industrial_grid_premium/DESIGN.md` (157 lines) covers tokens, shapes,
elevation, components — but it pushes "engineered luxury" / "premium digital
storefronts" / "Apple-esque scale", which directly conflicts with the on-disk
anti-adjectives (`luxury`, `Apple-Marcom`, `SaaS`).

**Resolution:** treating on-disk `Design.md` vibes/anti-references as binding,
and the kit's task descriptions (which specify components in detail —
"All square corners (max 2px radius)", "NO box-shadow, NO transform",
"hairline borders", "5 colors + ink tints", "32px grid-paper SVG") as the
binding component spec. The zip's DESIGN.md is reference only — token VALUES
are starting points, but where it conflicts with the on-disk vibes the
on-disk wins. The kit's CSS variable names (`--ink`, `--paper`, `--paper-warm`,
`--accent`, `--accent-deep`) come straight from the kit's CSS Modules pattern
example and are the binding palette identifiers.

**Frontend overnight kit v3 nextjs.md** → maps to the user prompt's
`/docs/frontend-overnight-kit-v3-nextjs.md`. Treating this as the verbatim
code source for `lib/pricing.ts`, the STL worker reference, and the CSS
Modules pattern.

## Source hierarchy in case of conflict

1. `OVERNIGHT.md` operating principles (process)
2. Kit task descriptions (component specs)
3. `Claude.md` (pricing math, materials, copy voice — backend ignored)
4. `Design.md` vibes / anti-adjectives (aesthetic constraint)
5. Zip Stitch references + zip `DESIGN.md` (visual direction only; not binding)

## Things the orchestrator prompt asked for that are not in the source files

- `night-1-task-N-complete` git tags — will create
- `design-reviewer` subagent — `.claude/agents/design-reviewer.md` does not
  exist on disk. Folder structure in OVERNIGHT.md anticipates it but file
  is not provided. Will write a minimal reviewer agent definition derived
  from the kit's review heuristics, and flag in `needs-human.md`.
- Playwright for screenshots — not installed. Will note in needs-human.md
  if not available at end-of-run, and document which pages I could not
  auto-screenshot.

## Decisions that need human review in the morning

- Design tokens: I am deriving exact hex values for `--paper`, `--paper-warm`,
  `--ink`, `--accent`, `--accent-deep`, plus 4 ink tints from the brief
  (orange #FF6B00 stated; paper #F5F5F7 stated; ink #1D1D1F stated). The
  warm-paper variant and accent-deep are not in source — chosen to fit the
  editorial/industrial vibe.
- Backend-related copy in Claude.md ("Razorpay test card", "magic link") is
  not implemented tonight per Overnight rule 7. Where pages reference these
  flows, UI shows mocked data only.
