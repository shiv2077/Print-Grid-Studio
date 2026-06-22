-- 0003_order_tracking — fulfillment timeline. Idempotent. 0001/0002 untouched.
-- This is the fulfillment status, separate from the payment `status` (pending/paid).

do $$ begin
  create type fulfillment_status as enum (
    'uploaded', 'under_review', 'approved', 'printing',
    'post_processing', 'quality_check', 'packed', 'shipped', 'delivered'
  );
exception when duplicate_object then null; end $$;

alter table orders
  add column if not exists fulfillment_status fulfillment_status not null default 'uploaded';

create table if not exists order_status_history (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders (id) on delete cascade,
  status     fulfillment_status not null,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_id_idx on order_status_history (order_id);
