# Deploy runbook — PrintGrid Studio (do in order)

One Next.js app (`apps/web`) with same-origin `/api/*`. One Vercel deploy.

## 0. Prereqs (have these tabs open)
- Supabase project dashboard
- Razorpay dashboard (Test mode for first launch)
- Vercel account
- (Optional) Resend account for email

## 1. Branch is on GitHub
`feat/monorepo-and-checkout` is already pushed. (Merge to `main` only after you've
reviewed the PR — see WELCOME_BACK.md.)

## 2. Apply the shipping-address migration
The first migration is already applied. Apply the second one
(`supabase/migrations/0002_shipping_address.sql`) to add address columns:
- Supabase → **SQL Editor** → paste the file's contents → Run.
- (Or `supabase db push` if you've linked the CLI.)

## 3. Get the POOLER database URL  ⚠️ required for Vercel
- Supabase → **Settings → Database → Connection string → Transaction** (port **6543**).
- Copy it; you'll paste it as `DATABASE_URL` in step 5. **Do not use the direct
  `db.<ref>.supabase.co:5432` host on Vercel — it's IPv6-only and will time out.**

## 4. Import the repo into Vercel
- vercel.com → **Add New → Project** → import `shiv2077/Print-Grid-Studio`.
- **Root Directory: `./`** (leave repo root — `vercel.json` drives the monorepo build:
  `pnpm --filter @printgrid/pricing build && pnpm --filter web build`, output `apps/web/.next`).

## 5. Set Environment Variables (Production + Preview)
Paste values for each NAME (values intentionally blank here):

```
DATABASE_URL=                 # the POOLER string from step 3
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=order-files
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=      # blank for now; set in step 7
RESEND_API_KEY=               # optional; email no-ops if blank
RESEND_FROM=PrintGrid Studio <orders@printgrid.co.in>
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

## 6. Deploy
- Click **Deploy**. You get `https://<project>.vercel.app`.
- Open it: site, `/materials`, `/quote` (upload an STL → 3D preview + live price) should all work.

## 7. Register the Razorpay webhook
- Razorpay → **Settings → Webhooks → Add New Webhook**
  - URL: `https://<project>.vercel.app/api/webhooks/razorpay`
  - Active events: `payment.captured` (and optionally `order.paid`)
  - Secret: choose one → copy it
- Vercel → set `RAZORPAY_WEBHOOK_SECRET` to that secret → **Redeploy**.

## 8. Post-deploy smoke checks
- `GET https://<project>.vercel.app/api/quote/reprice` → **405** (POST-only; route is live).
- On `/quote`: upload an STL, click **Continue to payment** → Razorpay modal opens,
  pay with test card `4111 1111 1111 1111` (any future expiry/CVV).
- Page shows "confirming"; within seconds the webhook flips it → **Paid ✓**.
- Visit `/orders/<code>` → status `paid`, amount shown.
- Check the order row in Supabase: `status=paid`, `razorpay_payment_id` set, address columns populated.

## If checkout 500s / hangs ~10s
You're on the direct DB URL. Swap `DATABASE_URL` to the **pooler** (step 3) and redeploy.

## Custom domain
Vercel → Project → **Domains** → add `printgrid.co.in`, follow the DNS records.
