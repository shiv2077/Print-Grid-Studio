-- 0002_shipping_address — shipping address captured with the pending order.
-- Idempotent (IF NOT EXISTS) so re-applying is safe. Does NOT change pricing.

alter table orders add column if not exists ship_name    text;
alter table orders add column if not exists ship_phone   text;
alter table orders add column if not exists ship_line1   text;
alter table orders add column if not exists ship_line2   text;
alter table orders add column if not exists ship_city    text;
alter table orders add column if not exists ship_state   text;
alter table orders add column if not exists ship_pincode text;
