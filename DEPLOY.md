# Deploying PrintGrid Studio to Vercel

The whole app (site + quote tool + checkout API) is **one Next.js app** in this
monorepo. Vercel hosts it in a single deploy — no separate backend.

## ⚠️ The one thing that will break if you skip it

Vercel's serverless functions are **IPv4-only**, but the Supabase *direct*
connection (`db.<ref>.supabase.co:5432`) is **IPv6-only**. You MUST use the
**connection pooler** for `DATABASE_URL` on Vercel, or every DB call times out.

Get it from: **Supabase → Project Settings → Database → Connection string →
"Transaction" (port 6543)**. It looks like:

```
postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=require
```

(Our `lib/server/db.ts` already sets `prepare: false`, required for the pooler.)

## Steps

1. **Push this branch to GitHub** (or merge to `main`):
   ```bash
   git push -u origin feat/monorepo-and-checkout
   ```
2. **Import the repo in Vercel** (vercel.com → Add New → Project → pick
   `shiv2077/Print-Grid-Studio`). Leave **Root Directory = ./** (repo root) —
   `vercel.json` already sets the monorepo build (`pnpm --filter @printgrid/pricing
   build && pnpm --filter web build`, output `apps/web/.next`).
3. **Add Environment Variables** (Production + Preview):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | the **pooler** string (port 6543, see above) |
   | `SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | your `sb_secret_…` key |
   | `SUPABASE_STORAGE_BUCKET` | `order-files` |
   | `RAZORPAY_KEY_ID` | `rzp_test_…` (or live, later) |
   | `RAZORPAY_KEY_SECRET` | … |
   | `RAZORPAY_WEBHOOK_SECRET` | set in step 5 |
   | `RESEND_API_KEY` | `re_…` (optional; email no-ops without it) |
   | `RESEND_FROM` | `PrintGrid Studio <orders@printgrid.co.in>` |
   | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_test_…` |

4. **Deploy.** You'll get `https://<project>.vercel.app`.
5. **Register the Razorpay webhook** (dashboard → Webhooks): URL
   `https://<project>.vercel.app/api/webhooks/razorpay`, event `payment.captured`,
   set a secret → put it in Vercel as `RAZORPAY_WEBHOOK_SECRET` → redeploy.
6. **Test**: open the site, upload an STL on `/quote`, pay with test card
   `4111 1111 1111 1111`, watch the order flip `pending → paid`.

## Custom domain
Vercel → Project → Domains → add `printgrid.co.in` and follow the DNS records.

## Notes
- The migration is already applied to the Supabase DB (`supabase/migrations/0001_init.sql`).
- The `apps/api` NestJS app is now superseded by the `/api/*` route handlers and
  is not deployed. It can be removed in a cleanup pass.
