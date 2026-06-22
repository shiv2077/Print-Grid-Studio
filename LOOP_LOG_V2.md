# LOOP_LOG_V2 — /v2 homepage design iteration

Rubric scored 1–10 each round from real screenshots at 390 / 768 / 1440.
Target: ≥9 in every category, or 5 rounds. Screenshots in `design/shots-v2/round-N/`.

Harness note: scroll-reveals use IntersectionObserver, so the screenshot script
(`scripts/shots-v2.mjs`) step-scrolls the page to fire them before capturing.
An early "everything below the hero is black" artifact was a **stale dev server**
(started before the branch switch, serving 404 JS chunks → no hydration), not a
design bug — fixed by restarting `next dev` and clearing `.next`.

---

## Round 1 — baseline

Scores: credibility **7** · layout/hierarchy **7** · typography **7** · color/contrast **9**
· spacing/rhythm **7** · responsiveness **8** · motion **7** · floating-nav **3** · performance **9**
· brand cohesion **8**

What works: palette + AA contrast land; material-comparison bars (real pricing data) and the
two orange statement blocks read strong; mobile stacks cleanly; /v2 First Load JS 98.4 kB with
the point-cloud code-split out.

Top 3 problems I actually see:
1. **Floating nav is not fixed — it scrolls away (score 3).** Computed `position: relative`, not
   `fixed`. Cause: the grid-layer rule `.v2-root > *:not(.v2-gridlines){position:relative}`
   (specificity 0,2,0) overrides `.v2-navwrap{position:fixed}` (0,1,0). The signature feature is
   dead. → Re-layer the grid via z-index only; stop forcing position on children.
2. **Hero headline wraps into a ragged 5 lines** ("Upload a / model. See the real / price.
   Print it.") at 1440 — the mono display is too large for the hero column, breaking hierarchy.
   → Cap hero h1 size and widen the hero text column so each intended line fits.
3. **Hero point cloud reads small/sparse** inside its large frame — underwhelming for the
   signature visual. → Scale the cloud up (canvas + SVG fallback) to fill more of the frame.

Fixes applied → see Round 2.

---

## Round 2 — after the three fixes

Scores: credibility **8** · layout/hierarchy **9** · typography **9** · color/contrast **9**
· spacing/rhythm **8** · responsiveness **9** · motion **8** · floating-nav **9** · performance **9**
· brand cohesion **9**

Verified the floating nav with a headless probe: `position: fixed`, `top: 16` at all scroll
positions, `data-scrolled` flips false→true as the hero sentinel clears (y≈800), pill bg goes
solid + shadow + shrinks 68→61px, **no layout shift**. Hero headline is now a clean 3 lines.
Gear cloud reads clearly as a bored spur gear.

Remaining (the three still at 8):
1. **Grid lines almost invisible** — the cohesion motif isn't pulling its weight (cohesion/spacing).
2. **"How it works" cards feel sparse** — content top-aligned in equal-height cells leaves dead
   space (spacing/credibility).
3. **Hero frame a touch empty** around the gear (credibility).

Fixes applied → see Round 3.

---

## Round 3 — polish

Scores: credibility **9** · layout/hierarchy **9** · typography **9** · color/contrast **9**
· spacing/rhythm **9** · responsiveness **9** · motion **9** · floating-nav **9** · performance **9**
· brand cohesion **9**  → **target met (≥9 every category) in 3 rounds.**

Fixes: grid `--v2-grid` alpha 0.045→0.07 (sections now visibly tied); flow cards restructured —
big mono step number at top, title+description anchored to the bottom via `margin-top:auto`, plus
a 28×2px orange corner tick (intentional, not empty); faint horizontal "layer line" texture in the
hero frame (the FDM build-plate motif) + gear scaled 0.44→0.48. Mobile re-checked at 390 — clean
stacking, no regression.

No further rounds needed.
