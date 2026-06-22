# PrintGrid Studio — Phase A + M2 handoff

Branch: `feat/monorepo-and-checkout`. Built overnight, unattended. **The payment
flow is NOT verified** — only a real test-mode payment (which needs you + a
public tunnel) can do that. Everything verifiable without a live card is done and
green. Razorpay is in **TEST mode** throughout.

---

## What was built

### Phase A — real monorepo (the architecture earlier reports claimed but git proved never existed)
- Flat npm Next.js app → **pnpm workspace**: `apps/web`, `apps/api`, `packages/pricing`.
- `apps/web`: the existing site moved verbatim (`git mv`, history preserved). No redesign.
- `packages/pricing` → **`@printgrid/pricing`**: `lib/pricing.ts` extracted as the single
  source of money math (integer paise). Real exports preserved (`quote`, `computeMass`,
  `formatINR`, `MATERIALS`, …); 11 web importers rewired; **used by web AND api, never forked**.
- `apps/api`: **NestJS**. `GET /health`, `POST /quote/reprice` (reprices via the shared package).
- `supabase/schema.sql` + `supabase/migrations/0001_init.sql`: `orders` + `order_files` (integer paise).

### M2 — self-serve Razorpay checkout
- **M2.1** Drizzle + `postgres` wired to Supabase (treated as plain Postgres). `OrdersRepository`.
  Migration applied to the live DB. Private Storage bucket `order-files` created.
- **M2.2** Server-authoritative STL volume (`src/stl/stl-volume.ts`, signed-tetrahedron, binary+ASCII).
- **M2.3** `POST /orders`: stores STL in the private bucket, measures volume server-side, prices via
  `@printgrid/pricing`, creates a Razorpay order for the **server** amount, inserts a `pending` row.
  Returns `{ order_code, razorpay_order_id, amount_paise, key_id }`. `GET /orders/:code` for polling.
- **M2.4** `apps/web` checkout: `POST /orders` → Razorpay Checkout → **"confirming"** state →
  poll `GET /orders/:code`. The browser **never** marks an order paid.
- **M2.5** `POST /webhooks/razorpay`: raw-body **HMAC-SHA256** verify (constant-time) → amount match
  → idempotent `pending→paid`. The only path that marks an order paid.
- **M2.6** Resend confirmation email on `paid` (no-ops without a key; never fails the webhook).

### The two invariants (both hold)
1. **Charged amount is always recomputed server-side** from the server's own STL volume. Verified:
   client sends no amount; a 10mm cube → 1000 mm³ → **32538 paise**, identical in the M2.2 unit test
   and the live `POST /orders`.
2. **An order becomes `paid` only via a valid-HMAC webhook.** Verified live: valid→paid,
   replay→"already processed" (idempotent), forged signature→400.

---

## Test results (all green)

| Suite | Result |
|---|---|
| `@printgrid/pricing` | **51/51** |
| `apps/api` (STL volume 3, webhook 4) | **7/7** |
| `apps/web` (stl-parse, sanity) | **17/17** |
| `pnpm --filter web build` | ✅ 0 errors, 13 static + 2 dynamic routes |
| `pnpm --filter api build` | ✅ |
| Live: migration applied, order smoke (insert/read) | ✅ |
| Live: `POST /orders` → Razorpay test order + pending row + private upload | ✅ (test data cleaned up) |
| Live: webhook valid→paid / replay→idempotent / forged→400 | ✅ (test data cleaned up) |

> Note: the plan estimated "12 SSG routes"; the app actually has **13 static + 2 dynamic = 15**.
> Nothing was lost in the move — every route maps to an existing source file; "12" was an estimate.

---

## YOUR test-mode payment run (the part I could not do)

Prereqs: fill these in `apps/api/.env` (gitignored):
- `RAZORPAY_WEBHOOK_SECRET` — you'll get it in step 3.
- `RESEND_API_KEY` + verified sender domain — optional; without it the email is logged, not sent.

1. **Start the services** (two terminals, from repo root):
   ```bash
   pnpm --filter @printgrid/pricing build      # ensure the shared package dist exists
   pnpm --filter api build && (cd apps/api && node dist/main.js)   # api on :3001
   pnpm --filter web dev                                            # web on :3000
   ```
2. **Tunnel the API** so Razorpay can reach your webhook:
   ```bash
   cloudflared tunnel --url http://localhost:3001
   # or: ngrok http 3001
   ```
   Copy the public https URL (e.g. `https://xxxx.trycloudflare.com`).
3. **Register the webhook** in the Razorpay dashboard (Test mode) →
   Settings → Webhooks → Add: URL = `<public-url>/webhooks/razorpay`,
   events = `payment.captured` (and optionally `order.paid`). Set a secret →
   put the **same** secret in `apps/api/.env` as `RAZORPAY_WEBHOOK_SECRET`, then **restart the api**.
4. **Place an order**: open http://localhost:3000/quote, drop one STL, click Continue.
   Razorpay opens. Pay with a **test card**: `4111 1111 1111 1111`, any future expiry, any CVV.
5. **Watch the flip**: the page shows "confirming"; when the webhook lands it flips to **Paid ✓**.
   Confirm the DB: order row goes `pending → paid` with a `razorpay_payment_id`.
   ```bash
   cd apps/api && node -e "import('postgres').then(async({default:pg})=>{const{loadEnv}=await import('./scripts/_env.mjs');const s=pg(loadEnv().DATABASE_URL,{ssl:'require',max:1});console.log(await s\`select order_code,status,amount_paise,razorpay_payment_id from orders order by created_at desc limit 3\`);await s.end()})"
   ```
6. **Email**: with a real `RESEND_API_KEY`, confirm the confirmation email arrives.
   Without it, the api log shows `RESEND_API_KEY missing — confirmation … NOT sent` (expected).

If a webhook doesn't arrive: check the tunnel is up, the URL/secret match, and the Razorpay
dashboard's webhook delivery log. The api returns **400** on signature mismatch (by design).

---

## TODOs / things I was unsure about (none block the test above)

- **Email is unsent until configured.** `RESEND_API_KEY` is empty and `printgrid.co.in` needs
  **SPF/DKIM** or mail goes to spam. Email body is summary-level (order code, per-file lines, INR
  total incl. GST); a full CGST/SGST split would need persisting `addressState`/the breakdown JSON
  (small migration) — deferred.
- **Single-file checkout only.** The UI blocks multi-file orders rather than mis-charge a multi-file
  total against the single-file `/orders` endpoint. Multi-file = a later phase.
- **Migration was applied directly** via `apps/api/scripts/migrate.mjs` (not the Supabase-CLI
  linked-repo flow — CLI isn't authenticated here). The SQL lives in `supabase/migrations/0001_init.sql`;
  for prod, run `supabase db push`.
- **DB connection is the direct IPv6 host** (works here). For Vercel/serverless, switch
  `DATABASE_URL` to the **pooler** (port 6543) and keep the direct string as `DIRECT_URL`.
- **Secrets were pasted into chat earlier** (DB password, `sb_secret_` key). Consider rotating them
  in the Supabase dashboard once you're set up.
- Leftover empty dir `3D-Printing-website-PrintGrid-Studio/` is untouched (it was part of a separate
  cleanup task that was never approved).

---

## Commits on this branch
```
Phase A: real monorepo (web + api + shared pricing)
M2.1: data layer — Drizzle/Postgres, orders schema + repo, migration, private bucket
M2.2: server-authoritative STL volume (signed-tetrahedron) + cube unit test
M2.3: POST /orders — server-authoritative checkout creation
M2.5 + M2.6: Razorpay webhook (HMAC, idempotent) + Resend confirmation
M2.4: client checkout in apps/web (server-authoritative, poll-to-confirm)
```

**The payment flow is built and unit/integration-tested, but NOT verified end-to-end with a real
test payment. That is the one step that needs you.**
