# Test report (Phase 4)

Run after the cleanup (Phase 2). Everything green.

## Automated suite — `pnpm -r test`

| Package | Tests | Result |
|---|---|---|
| `@printgrid/pricing` | 51 | ✅ all pass |
| `apps/web` → `tests/sanity.test.ts` | 2 | ✅ |
| `apps/web` → `tests/mesh-volume.test.ts` | 3 | ✅ |
| `apps/web` → `tests/stl-parse.test.ts` | 15 | ✅ |
| `apps/web` → `tests/webhook.test.ts` | 4 | ✅ |
| **Total** | **75** | ✅ |

### What the tests cover
- **Pricing engine** — full money math in integer paise (materials, layer, finish,
  multicolour, rush, promo, qty discounts, min order, shipping, GST split, payment fee).
- **Server volume → price chain** — a 10mm cube measured server-side as **1000 mm³** →
  **32538 paise**, identical for **STL and OBJ**. (Invariant #1: price from server measurement.)
- **STL parser** — 15 cases (binary/ASCII, bbox, edge cases).
- **Webhook security boundary** (Invariant #2) — forged signature rejected (400, no state
  change); valid → `pending→paid` + one email; **idempotent** replay; **amount mismatch**
  rejected (400). Logic in `lib/server/webhook.ts`, called by the route handler.

## Build
- `pnpm --filter web build` → ✅ green: **15 pages + 4 API functions**
  (`/api/orders`, `/api/orders/[code]`, `/api/quote/reprice`, `/api/webhooks/razorpay`).

## 3MF status
- 3MF parsing **is implemented** (`lib/server/mesh-volume.ts` via jszip + regex over the
  `3D/3dmodel.model` XML; client preview via three `3MFLoader`).
- **No `.3mf` sample exists in the repo**, so it is **not yet verified on a real file.**
  STL and OBJ are verified (cube → 1000 mm³). **Action: drop a real Bambu Studio 3MF into
  `/quote` and confirm the volume/price look right** before relying on 3MF in production.
  (No synthetic test file was fabricated.)

## Resend email
- Confirmed **clean no-op without a key**: `sendOrderConfirmation` now returns early (no DB
  query, no throw) when `RESEND_API_KEY` is unset, logging
  `RESEND_API_KEY missing — confirmation … NOT sent`.
- The webhook wraps the email call in try/catch, so an email failure **never** fails the
  paid transition.
- **TODO before email works:** set `RESEND_API_KEY` and configure **SPF/DKIM** on
  `printgrid.co.in` (else mail goes to spam).

## Not covered by automated tests (needs a tunnel + human — see WELCOME_BACK.md)
Real Razorpay order creation, Supabase Storage upload, and end-to-end webhook delivery were
verified **live during development** (and cleaned up), but a full test-card payment through a
public tunnel is the human step that confirms the whole loop. **Not marked "verified."**
