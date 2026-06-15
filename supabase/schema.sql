-- PrintGrid Studio — database schema
-- Postgres (Supabase). ALL money is INTEGER PAISE. Never floats, never rupees in storage.
-- Phase A: this file is the source of truth but is NOT applied to any DB yet.
-- M2.1 applies it via a versioned migration in supabase/migrations/.

-- gen_random_uuid() is built into Postgres 13+ (Supabase). pgcrypto fallback:
create extension if not exists pgcrypto;

-- ──────────────────────────────────────────────────────────────────────────
-- orders: one row per checkout. Becomes `paid` ONLY via a verified Razorpay
-- webhook (M2.5) — never from the browser success callback.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists orders (
  id                  uuid primary key default gen_random_uuid(),
  order_code          text not null unique,          -- public lookup code (e.g. PG-XXXXXX)
  status              text not null default 'pending'
                        check (status in ('pending', 'paid', 'failed', 'cancelled')),
  amount_paise        integer not null check (amount_paise >= 0),  -- SERVER-authoritative total
  currency            text not null default 'INR',
  server_volume_mm3   double precision,              -- volume measured server-side from the STL
  email               text,
  razorpay_order_id   text unique,
  razorpay_payment_id text unique,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists orders_status_idx on orders (status);
create index if not exists orders_razorpay_order_id_idx on orders (razorpay_order_id);

-- ──────────────────────────────────────────────────────────────────────────
-- order_files: the STL(s) and print parameters for an order. Files live in the
-- PRIVATE `order-files` Storage bucket; storage_path points at the object.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists order_files (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders (id) on delete cascade,
  storage_path  text not null,                       -- path within the private `order-files` bucket
  filename      text,
  material_key  text,
  layer_height  text,
  finish        text,
  multicolor    boolean not null default false,
  qty           integer not null default 1 check (qty >= 1),
  volume_mm3    double precision,                    -- server-measured volume for THIS file
  mass_grams    double precision,
  created_at    timestamptz not null default now()
);

create index if not exists order_files_order_id_idx on order_files (order_id);

-- keep updated_at fresh on orders
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();
