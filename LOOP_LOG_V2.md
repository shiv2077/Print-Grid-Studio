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
