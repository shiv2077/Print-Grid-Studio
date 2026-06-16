# Cleanup plan — dead code audit (Phase 2)

Method: grepped the explicit **live** file set (40 files: app pages/routes/layout +
their real transitive deps) for every candidate. "DEAD" = imported by **zero** live
files. The `pnpm --filter web build` + test gate is the definitive proof after deletion.

## DELETE — standalone dead backend
| Path | Why | Proof |
|---|---|---|
| `apps/api/` (entire NestJS app) | Superseded by the `/api/*` Next route handlers; never deployed | No live file in apps/web or packages/pricing imports `apps/api`; deployment uses apps/web only |

## DELETE — orphaned pre-reskin components (apps/web)
All confirmed **no live import**:
| Path | Replaced by |
|---|---|
| `app/quote/Dropzone.tsx` + `.module.css` | inline dropzone in QuotePage |
| `app/quote/FileCard.tsx` + `.module.css` | inline file cards in QuotePage |
| `app/quote/PriceBreakdown.tsx` + `.module.css` | inline price card in QuotePage |
| `app/quote/MaterialDropdown.tsx` + `.module.css` | native `<select>` in QuotePage |
| `app/quote/quote.module.css` | global `.quote-*` classes |
| `app/quote/StlViewer.module.css` | global `.quote-viewer` classes |
| `app/_home/` (Hero, HowItWorks, MaterialsTable, BuildEnvelope, PricingTransparency, Shipping, FinalCta + modules) | inline home sections in `app/page.tsx` |
| `app/_legal/` (LegalPage + module) | inline prose in policy pages |
| `app/materials/MaterialSection.tsx`, `MaterialsHero.tsx` + modules | inline cards in `app/materials/page.tsx` |
| `app/orders/[code]/LookupForm.tsx`, `order.module.css` | new live status page |
| `components/ui/Button|Container|SegmentedControl|RevealOnScroll` + modules | global `.btn` etc. |
| `components/layout/MobileMenu.tsx` | nav uses global classes |
| `components/layout/Header.module.css`, `Footer.module.css`, `StatusStrip.module.css` | global classes |
| `components/illustrations/` (BuildEnvelopeDiagram, ExtruderDiagram, IndiaMap + module) | not used in reskin |
| `lib/mock-orders.ts` | orders page now fetches real status from `/api/orders/[code]` |

## KEEP (still live or intentionally retained)
- `components/ui/Section.tsx` + `Section.module.css` — **live**, wraps QuotePage in `app/quote/page.tsx`
- `packages/pricing`, all of live `apps/web`, `supabase/`, all docs, `Overnight.md`, `Overnight.original.md`
- `lib/stl-parse.ts`, `lib/stl-types.ts`, `public/stl-parser.worker.js` — used by the STL parser + tests

## Test coverage preservation
`apps/api` held the stl-volume + webhook unit tests. Before deleting, the money-path
logic (now in `lib/server`) gets equivalent tests in `apps/web/tests/` so the suite
stays green and the two invariants remain covered.
