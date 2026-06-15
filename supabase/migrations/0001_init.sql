-- 0001_init — orders + order_files. ALL money is INTEGER PAISE.
-- Idempotent (IF NOT EXISTS) so re-applying is safe. Mirrors supabase/schema.sql.

create extension if not exists pgcrypto;

create table if not exists orders (
  id                  uuid primary key default gen_random_uuid(),
  order_code          text not null unique,
  status              text not null default 'pending'
                        check (status in ('pending', 'paid', 'failed', 'cancelled')),
  amount_paise        integer not null check (amount_paise >= 0),
  currency            text not null default 'INR',
  server_volume_mm3   double precision,
  email               text,
  razorpay_order_id   text unique,
  razorpay_payment_id text unique,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists orders_status_idx on orders (status);
create index if not exists orders_razorpay_order_id_idx on orders (razorpay_order_id);

create table if not exists order_files (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders (id) on delete cascade,
  storage_path  text not null,
  filename      text,
  material_key  text,
  layer_height  text,
  finish        text,
  multicolor    boolean not null default false,
  qty           integer not null default 1 check (qty >= 1),
  volume_mm3    double precision,
  mass_grams    double precision,
  created_at    timestamptz not null default now()
);

create index if not exists order_files_order_id_idx on order_files (order_id);

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
