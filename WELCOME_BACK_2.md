# Welcome back 👋 (round 2) — M3 build

Branch: `feat/m3-tracking-reports` (off `feat/monorepo-and-checkout`). All commits
**pushed**. No deploy, no live payment, no merge, no secret rotation.

> ⚠️ The payment flow is **STILL UNVERIFIED** and **STILL the #1 human step**.
> Nothing in this round touched the payment/webhook flow or @printgrid/pricing; the
> two invariants are intact. But a real test-card payment is still what verifies the
> money path — I cannot and did not do it.

## What got built (6 phases, every gate green)

| Phase | Commit | What |
|---|---|---|
| 1 · Order tracking | `1c988c2` | Migration `0003` (fulfillment_status enum + `order_status_history`). Read-only public timeline on `/orders/[code]`. Protected `POST /api/orders/[code]/status` (header `x-admin-secret` == `ADMIN_STATUS_SECRET`; **503 if unset** — not a full auth system). |
| 2 · Manufacturability | `6d7b2be` | `lib/manufacturability.ts` — build-envelope / inch-unit / thin-wall / watertight / high-poly checks on the mesh stats already computed. Surfaced per-file in the quote tool. Advisory only. |
| 3 · Quote PDF | `109cf45` | `POST /api/quote/pdf` (pdf-lib) — engineering report: geometry, material specs, the `@printgrid/pricing` breakdown, manufacturability warnings, lead time. "Download PDF report" button. |
| 4 · Material intelligence | `37b3e85` | `/materials` rebuilt: searchable, flexibility-filtered, **sortable** comparison table + expandable per-material detail, from the real pricing data. No recommendation engine. |
| 5 · SEO | `a7eb9c9` | metadataBase + OpenGraph + Twitter; LocalBusiness + Product JSON-LD; sitemap/robots **fixed to printgrid.co.in** (were on the wrong printgridstudio.com). |
| 6 · Accessibility | `e5de41f` | AA contrast fix (accent 4.36→5.35:1), skip link, global focus-visible, focusable upload input, ARIA on viewer/alerts, verified loading/empty/error states. |

## Tests — all green
- `@printgrid/pricing`: **51** · `apps/web`: **49** → **100 total**.
- New suites: fulfillment (7), manufacturability (7), quote-pdf (3), materials-data (1), seo (2).
- typecheck clean · ESLint clean · `pnpm --filter web build` green at every phase.
- Live smokes (dev, cleaned up): status endpoint 401/400/200 + history; PDF route 200 application/pdf; address persistence (from round 1).
- **No `BLOCKED.md`** — nothing hit a gate failure.

## New env vars (documented in .env.example)
- `ADMIN_STATUS_SECRET` — optional; enables the status-update endpoint (unset ⇒ 503).
- `NEXT_PUBLIC_SITE_URL` — optional; defaults to `https://printgrid.co.in`.

## DB note
- Migration `0003_order_tracking.sql` is **applied to the dev DB**. Apply `0003`
  (and `0002`) to the **production** DB during deploy (see `DEPLOY_RUNBOOK.md`).

## Your remaining human steps (in order — unchanged priorities)
1. **Rotate secrets** — `SECRETS_TODO.md` (shared in chat: DB password, Supabase
   service_role, Razorpay keys, GitHub token).
2. **Test-card payment via tunnel** — the step that finally **verifies the money path**.
   Tunnel localhost, register `<tunnel>/api/webhooks/razorpay`, pay with `4111 1111 1111 1111`,
   watch `pending → paid`.
3. **Deploy to Vercel** with the **pooler** `DATABASE_URL` (`DEPLOY_RUNBOOK.md`).
4. **Review + merge** — PR #1 (`feat/monorepo-and-checkout`) and PR #2 (this branch).

## Scope discipline
Only the six requested features were built. Nothing from the broader vision (marketplace,
B2B portal, fleet, AI scores, STEP/IGES, Stripe/PayPal, AR, auth system) was started.
