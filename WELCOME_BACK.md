# Welcome back 👋 — what the overnight build did

Branch: `feat/monorepo-and-checkout` (all commits **pushed** to GitHub). No deploy,
no live payment, no merge to `main` — those are yours (see "Your remaining steps").
**The payment flow is NOT marked verified** — only a real test-card payment confirms it.

## What got done (5 phases, all gates green)

| Phase | Commit | Result |
|---|---|---|
| 1 · Secret safety | `1f9f0cf` | All real `.env*` untracked + gitignored; **no secret values in any tracked file**. `SECRETS_TODO.md` written. Nothing rotated. |
| 2 · Cleanup | `0975712` | Deleted the dead NestJS `apps/api` + ~80 orphaned files (audited in `CLEANUP_PLAN.md`, grep-proven unreferenced). Ported money-path tests to web first so coverage survived. |
| 3 · Deploy-readiness | `34a673b` | Pooler documented as the required prod DB; `vercel.json` verified; `DEPLOY_RUNBOOK.md` written. |
| 4 · Verification | `44f3531` | `TEST_REPORT.md`; Resend confirmed clean no-op; typecheck fix. |
| 5 · Shipping address | `7936914` | Collect + persist shipping address at checkout (new migration `0002`, validator, form, server validation, tests). |

## Test results (all green)
- `@printgrid/pricing`: **51** · `apps/web`: **29** (sanity 2, address 5, mesh-volume 3, stl-parse 15, webhook 4) → **80 total**.
- `pnpm --filter web build`: green — **15 pages + 4 API functions**.
- typecheck clean; ESLint clean.
- **Live (dev, cleaned up afterward):** order create → real Razorpay test order + pending row; OBJ cube == STL cube (32538 paise); webhook valid→paid / replay→idempotent / forged→400; shipping address missing/bad-PIN→400, valid→persisted.

## Architecture now
- **One Next.js app** (`apps/web`): site + quote tool + 3D viewer + same-origin `/api/*` route handlers (orders, webhook, reprice, status). No separate backend.
- Two invariants intact: (1) amount always recomputed server-side from the server's own volume; (2) `paid` only via valid-HMAC webhook.
- DB: Supabase Postgres (migrations `0001` + `0002` applied to the dev DB); private `order-files` bucket.

## Checklists in the repo
- `SECRETS_TODO.md` — rotate creds (you)
- `DEPLOY_RUNBOOK.md` — exact Vercel deploy steps
- `DEPLOY.md`, `CLEANUP_PLAN.md`, `TEST_REPORT.md`, `PROJECT_BRIEF.md`
- **No `BLOCKED.md`** — nothing hit a blocking gate.

## ⚠️ Known follow-ups (not blockers)
- **3MF** parsing is implemented but **unverified on a real Bambu file** (no sample in repo). Drop one into `/quote` to confirm.
- **Resend email** is logs-only until you set `RESEND_API_KEY` + SPF/DKIM on `printgrid.co.in`.

## Your remaining steps (in order)
1. **Rotate secrets** — `SECRETS_TODO.md` (DB password, Supabase service_role, Razorpay keys, GitHub token). They were shared in chat.
2. **Local test-card payment via tunnel** — `cloudflared tunnel --url http://localhost:3001`… actually the API is same-origin now, so tunnel `http://localhost:3000`; register `<tunnel>/api/webhooks/razorpay` as the Razorpay test webhook + set `RAZORPAY_WEBHOOK_SECRET` in `apps/web/.env.local`; run a payment with card `4111 1111 1111 1111`; watch `pending → paid`. (This is the step that finally **verifies** the money path.)
3. **Deploy to Vercel** — `DEPLOY_RUNBOOK.md`. Use the **pooler** `DATABASE_URL` (the direct IPv6 host fails on Vercel). Apply migration `0002` on any fresh DB.
4. **Review + merge the PR** — opened against `main`: **https://github.com/shiv2077/Print-Grid-Studio/pull/1**. I did **not** merge.

> Note: migrations `0001` + `0002` are already applied to your **dev** Supabase DB. For production, apply them to the prod DB per the runbook.
