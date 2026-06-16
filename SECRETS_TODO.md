# Secrets — rotate these when you're back (~3 minutes)

These credentials were shared in chat during development, so rotate them before going
live. Nothing here is committed (all real `.env*` files are gitignored and untracked).
**This is a checklist only — no rotation was performed automatically.**

After rotating, update the new values in:
- `apps/web/.env.local` (local dev)
- Vercel → Project → Settings → Environment Variables (production)

## 1. Supabase database password
- Supabase → your project → **Settings → Database → Reset database password**
- Update `DATABASE_URL` (both the local direct string and the production **pooler** string)
  with the new password.

## 2. Supabase service_role / secret key
- Supabase → **Settings → API → Project API keys → `service_role` (secret)** → **roll/reset**
- Update `SUPABASE_SERVICE_ROLE_KEY`.
- (The `anon`/`publishable` key is public-safe; roll only if you want to.)

## 3. Razorpay test keys
- Razorpay Dashboard (Test mode) → **Settings → API Keys → Regenerate Test Key**
- Update `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
- (When you switch to live payments later, generate **Live** keys and a fresh webhook secret.)

## 4. GitHub token (the push token you configured)
- GitHub → **Settings → Developer settings → Fine-grained tokens** → revoke the one used for
  this build; create a fresh one (or let it expire). Re-point the remote if needed:
  `git remote set-url origin https://<NEW_TOKEN>@github.com/shiv2077/Print-Grid-Studio.git`

## 5. Razorpay webhook secret
- Not yet set (no production webhook registered). You'll create it during deploy
  (see DEPLOY_RUNBOOK.md) and paste it as `RAZORPAY_WEBHOOK_SECRET`.
