# Task 11 — /orders/[code] — plan

## Spec
- Dynamic route. Validate `^PG-[A-Z0-9]{4}-[A-Z0-9]{4}$`.
- 5 mock orders in `/lib/mock-orders.ts` (PG-DEMO-0001..0005).
- Order header (code mono, placed date, status pill).
- Vertical status timeline: past=ink, current=accent, future=ink-30.
- Order summary (files + breakdown), address.
- "Need to update something?" → WhatsApp link prefilled with code.
- Invalid code → "Invalid order code" + lookup form.

## Approach
- `lib/mock-orders.ts` — `MockOrder` shape (intentionally a superset of
  the eventual Prisma model so the swap is mostly a name change). 5
  orders covering: DELIVERED, SHIPPED, PRINTING, PAID, CANCELLED — so
  the timeline has variety to demo.
- `app/orders/[code]/page.tsx` — server component. Validates regex via
  `getMockOrder`. Returns `<OrderView>` or the not-found UI with the
  lookup form + clickable demo codes.
- `app/orders/[code]/LookupForm.tsx` — `'use client'`, single input
  + button, redirects to `/orders/{code}`.
- `app/orders/[code]/order.module.css` — all styles.

## Status pill colours
- PENDING / PAID — ink-10 (neutral, "in progress towards print")
- PRINTING / QUALITY_CHECK — accent (currently active in the studio)
- SHIPPED / DELIVERED — ink (settled / completed)
- CANCELLED — accent + line-through

## Timeline
For non-cancelled orders: walk TIMELINE_ORDER (PENDING → DELIVERED 6
steps), match each to event-by-status, mark past/current/future.
For cancelled: just render the events as a closed log.
