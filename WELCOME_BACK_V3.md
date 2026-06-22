# WELCOME BACK — v3 (v2 homepage redesign)

**Branch:** `feat/v2-redesign` · **PR #4:** https://github.com/shiv2077/Print-Grid-Studio/pull/4
(base `feat/m3-tracking-reports`) · **Snapshot before this work:** branch/tag `cook1` (commit `2343ef1`).

## What this is
A fresh dark, technical "HydraDB-style" marketing homepage on a **new isolated `/v2` route**.
The live site, checkout/payment, quote tool, `/api/*`, and `@printgrid/pricing` are **100%
untouched**. Run it: `pnpm --filter web dev` → http://localhost:3000/v2

## Final screenshots (`design/shots-v2/`)
- `home-390.png` — mobile (390px)
- `home-768.png` — tablet (768px)
- `home-1440.png` — desktop (1440px)
- `nav-scrolled-1440.png` — solid floating-pill state after scroll
- Per-round history: `design/shots-v2/round-1..3/` (git-ignored; regenerate with
  `ROUND=n node scripts/shots-v2.mjs`).

## LOOP_LOG_V2 summary (full detail in `LOOP_LOG_V2.md`)
- **Round 1** (baseline): floating-nav **3/10** — it wasn't actually fixed (a grid-layer CSS rule
  `position:relative` was overriding the nav's `position:fixed`, specificity 0,2,0 vs 0,1,0).
  Hero headline wrapped into a ragged 5 lines. Point cloud too small.
- **Round 2**: nav fixed and **verified** (fixed, toggles solid on the hero sentinel, shrinks
  68→61px, zero layout shift); headline clean 3 lines; gear enlarged. Three categories still at 8
  (grid cohesion, sparse flow cards, empty hero frame).
- **Round 3**: grid alpha 0.045→0.07; flow cards restructured (big mono number, content anchored
  bottom, orange corner tick); faint FDM "layer-line" texture in the hero frame. **≥9 in every
  rubric category — target met in 3 rounds.**

## Performance numbers
- `/v2` **First Load JS 98.4 kB**, statically prerendered — vs `/quote` 267 kB (three.js). Only
  ~11 kB over the site's 87.3 kB shared baseline.
- Hero point-cloud is **code-split out of First Load** (separate chunk, `ssr:false`), capped
  ~30 fps, DPR capped 1.5, **paused** when the tab is hidden or the canvas scrolls off-screen.
- **Verified by headless probe:** under `prefers-reduced-motion: reduce`, the canvas chunk and the
  29 kB points JSON are **never fetched** — only the 38 kB static SVG poster loads. Normal motion:
  SVG poster paints first (LCP-safe), canvas + points load after paint.
- Gates: `build` ✓ · `typecheck` ✓ · `lint` ✓ · `test` (49 passed) ✓.

## Things I was unsure about / judgement calls (please sanity-check)
1. **Hero "reuse the existing parser".** The brief said reuse the existing mesh parsing. I reused
   the existing **signed-tetrahedron volume algorithm** in the build-time generator
   (`scripts/gen-hero-points.mjs`) and validated the generated `part.stl`, but the **runtime ships
   a precomputed point cloud + a 2D canvas — no three.js and no runtime STL parser** — because the
   hard perf gate (mobile) makes shipping the three.js viewer into the homepage a bad trade. The
   existing client viewer/parser remains the quote tool's. If you'd rather the hero literally run
   the client parser at runtime, that's a different perf profile — flag it.
2. **PR base is `feat/m3-tracking-reports`** (the branch `/v2` forked from) for a clean diff, not
   `main`. Retarget if you prefer main.
3. **Copy nit:** the build-volume stat reads "256 mm³" / "256 mm build". 256 mm is the linear bed
   size (256×256×256). Consider "256³ mm" or "256×256×256 mm" for precision before going live.
4. **No full Lighthouse run.** Lighthouse isn't installed here; I verified perf by bundle size +
   the lazy/reduced-motion probes above rather than a Lighthouse score. The posture is strong by
   construction, but if you want a number, run Lighthouse mobile on `/v2`.
5. **Concurrent automation on this repo.** Earlier in the session another process fetched and
   switched the working tree's branch mid-flight (and `cook1` appeared on the remote, which I
   didn't push). If a bot/another session is active here, coordinate before merging so branches
   don't collide.

## Next step
**Shiv reviews the `/v2` homepage. On approval, roll the `DESIGN_V2` tokens out to the remaining
pages.** No other pages were redesigned in this pass (per the brief's hard stop).

## ⚠️ Unchanged #1 blocker (independent of this redesign)
The **live test-mode Razorpay payment is STILL unverified** — test card → webhook → status flips
to `paid` → confirmation email has not been walked end-to-end. That remains the top real blocker
for the money path, regardless of this homepage work.
