-- ===========================================================================
-- WarehouseOS — Supabase PostgreSQL schema
-- SY BTech CSE · DAA Mini Project
--
-- Run this in the Supabase SQL Editor (or `supabase db push`).
-- It creates every table, index, constraint, Row Level Security policy and a
-- safe atomic stock-adjustment function used by the React app.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: 1-to-1 with auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'operator'
              check (role in ('administrator', 'operator', 'viewer')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- warehouses
-- ---------------------------------------------------------------------------
create table if not exists public.warehouses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null unique,
  address     text,
  capacity    integer not null default 0 check (capacity >= 0),
  owner_id    uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- warehouse_zones  (Warehouse → Zone)
-- ---------------------------------------------------------------------------
create table if not exists public.warehouse_zones (
  id            uuid primary key default gen_random_uuid(),
  warehouse_id  uuid not null references public.warehouses(id) on delete cascade,
  name          text not null,
  code          text not null,
  created_at    timestamptz not null default now(),
  unique (warehouse_id, code)
);

-- ---------------------------------------------------------------------------
-- storage_locations  (... → Aisle → Rack → Shelf → Bin)
-- ---------------------------------------------------------------------------
create table if not exists public.storage_locations (
  id            uuid primary key default gen_random_uuid(),
  warehouse_id  uuid not null references public.warehouses(id) on delete cascade,
  zone_id       uuid references public.warehouse_zones(id) on delete set null,
  code          text not null,
  path          text,
  aisle         text,
  rack          text,
  shelf         text,
  bin           text,
  capacity      integer not null default 0 check (capacity >= 0),
  occupied      integer not null default 0 check (occupied >= 0),
  status        text not null default 'active' check (status in ('active', 'inactive')),
  created_at    timestamptz not null default now(),
  unique (warehouse_id, code)
);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- suppliers
-- ---------------------------------------------------------------------------
create table if not exists public.suppliers (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text,
  phone          text,
  address        text,
  contact_person text,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- products  (denormalized stock fields for fast reads; see inventory table
--            for the normalized per-warehouse ledger)
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  sku                  text not null unique,
  barcode              text,
  description          text,
  category_id          uuid references public.categories(id) on delete set null,
  category_name        text,
  brand                text,
  supplier_id          uuid references public.suppliers(id) on delete set null,
  supplier_name        text,
  purchase_price       numeric(12,2) not null default 0 check (purchase_price >= 0),
  selling_price        numeric(12,2) not null default 0 check (selling_price >= 0),
  quantity             integer not null default 0 check (quantity >= 0),
  reserved             integer not null default 0 check (reserved >= 0),
  min_stock            integer not null default 0 check (min_stock >= 0),
  max_stock            integer not null default 0 check (max_stock >= 0),
  warehouse_id         uuid references public.warehouses(id) on delete set null,
  warehouse_name       text,
  storage_location_id  uuid references public.storage_locations(id) on delete set null,
  storage_location_code text,
  expiry_date          date,
  image_url            text,
  created_at           timestamptz not null default now(),
  constraint reserved_not_exceed_quantity check (reserved <= quantity)
);

-- ---------------------------------------------------------------------------
-- inventory  (normalized per-warehouse stock ledger)
-- ---------------------------------------------------------------------------
create table if not exists public.inventory (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  available    integer not null default 0 check (available >= 0),
  reserved     integer not null default 0 check (reserved >= 0),
  minimum      integer not null default 0 check (minimum >= 0),
  unit_cost    numeric(12,2) not null default 0 check (unit_cost >= 0),
  unique (product_id, warehouse_id)
);

-- ---------------------------------------------------------------------------
-- inventory_transactions  (immutable audit log)
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_transactions (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid references public.products(id) on delete set null,
  product_name    text,
  sku             text,
  type            text not null check (type in ('add','remove','update','reserve','release','transfer')),
  quantity        integer not null default 0 check (quantity >= 0),
  warehouse_name  text,
  note            text,
  user_email      text,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  text not null unique,
  customer_name text not null,
  status        text not null default 'Pending'
                check (status in ('Pending','Processing','Packed','Shipped','Delivered','Cancelled')),
  total         numeric(12,2) not null default 0 check (total >= 0),
  owner_id      uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  name        text,
  sku         text,
  quantity    integer not null default 1 check (quantity > 0),
  price       numeric(12,2) not null default 0 check (price >= 0),
  line_total  numeric(12,2) not null default 0 check (line_total >= 0)
);

-- ---------------------------------------------------------------------------
-- stock_transfers
-- ---------------------------------------------------------------------------
create table if not exists public.stock_transfers (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid references public.products(id) on delete set null,
  product_name      text,
  sku               text,
  quantity          integer not null default 0 check (quantity >= 0),
  from_warehouse_id uuid references public.warehouses(id) on delete set null,
  from_warehouse    text,
  to_warehouse_id   uuid references public.warehouses(id) on delete set null,
  to_warehouse      text,
  status            text not null default 'Pending'
                    check (status in ('Pending','In Transit','Completed')),
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,
  severity    text not null default 'info'
              check (severity in ('info','success','warning','danger')),
  title       text not null,
  message     text,
  read        boolean not null default false,
  user_id     uuid references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ===========================================================================
-- Indexes
-- ===========================================================================
create index if not exists idx_products_category   on public.products(category_id);
create index if not exists idx_products_supplier    on public.products(supplier_id);
create index if not exists idx_products_warehouse   on public.products(warehouse_id);
create index if not exists idx_products_location    on public.products(storage_location_id);
create index if not exists idx_products_sku         on public.products(sku);
create index if not exists idx_products_status      on public.products(quantity);
create index if not exists idx_locations_warehouse  on public.storage_locations(warehouse_id);
create index if not exists idx_zones_warehouse      on public.warehouse_zones(warehouse_id);
create index if not exists idx_tx_product           on public.inventory_transactions(product_id);
create index if not exists idx_tx_created           on public.inventory_transactions(created_at desc);
create index if not exists idx_orders_status        on public.orders(status);
create index if not exists idx_orders_created       on public.orders(created_at desc);
create index if not exists idx_items_order          on public.order_items(order_id);
create index if not exists idx_transfers_product    on public.stock_transfers(product_id);
create index if not exists idx_inventory_product    on public.inventory(product_id);

-- ===========================================================================
-- updated_at trigger for orders
-- ===========================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_orders_touch on public.orders;
create trigger trg_orders_touch before update on public.orders
for each row execute function public.touch_updated_at();

-- ===========================================================================
-- Auto-create a profile when a new auth user signs up
-- ===========================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 'administrator')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ===========================================================================
-- Atomic stock adjustment (prevents negative inventory inside the database)
-- Returns the new quantity. Call via supabase.rpc('adjust_stock', {...}).
-- ===========================================================================
create or replace function public.adjust_stock(
  p_product_id uuid,
  p_delta      integer,
  p_note       text default 'Manual adjustment',
  p_user       text default null
)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_before integer;
  v_after  integer;
  v_type   text;
  v_name   text;
  v_sku    text;
  v_wh     text;
begin
  select quantity, name, sku, warehouse_name into v_before, v_name, v_sku, v_wh
  from public.products where id = p_product_id for update;

  if not found then
    raise exception 'Product not found';
  end if;

  v_after := greatest(0, v_before + p_delta);
  v_type  := case when p_delta >= 0 then 'add' else 'remove' end;

  update public.products set quantity = v_after where id = p_product_id;

  insert into public.inventory_transactions
    (product_id, product_name, sku, type, quantity, warehouse_name, note, user_email)
  values (p_product_id, v_name, v_sku, v_type, abs(p_delta), v_wh, p_note, p_user);

  return v_after;
end;
$$;

-- ===========================================================================
-- Row Level Security
-- Enabled on every table. For this single-workspace student project any
-- authenticated user can read and write the shared warehouse data; tighten
-- these policies (e.g. scope by owner_id / team_id) for multi-tenant use.
-- ===========================================================================
alter table public.profiles               enable row level security;
alter table public.warehouses             enable row level security;
alter table public.warehouse_zones        enable row level security;
alter table public.storage_locations      enable row level security;
alter table public.categories             enable row level security;
alter table public.suppliers              enable row level security;
alter table public.products               enable row level security;
alter table public.inventory              enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;
alter table public.stock_transfers        enable row level security;
alter table public.notifications          enable row level security;

-- profiles: a user can read & update only their own profile
create policy "profiles self select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id);

-- Helper: authenticated users get full access to shared warehouse tables.
create policy "read all"   on public.warehouses             for select to authenticated using (true);
create policy "write all"  on public.warehouses             for all    to authenticated using (true) with check (true);
create policy "read all"   on public.warehouse_zones        for select to authenticated using (true);
create policy "write all"  on public.warehouse_zones        for all    to authenticated using (true) with check (true);
create policy "read all"   on public.storage_locations      for select to authenticated using (true);
create policy "write all"  on public.storage_locations      for all    to authenticated using (true) with check (true);
create policy "read all"   on public.categories             for select to authenticated using (true);
create policy "write all"  on public.categories             for all    to authenticated using (true) with check (true);
create policy "read all"   on public.suppliers              for select to authenticated using (true);
create policy "write all"  on public.suppliers              for all    to authenticated using (true) with check (true);
create policy "read all"   on public.products               for select to authenticated using (true);
create policy "write all"  on public.products               for all    to authenticated using (true) with check (true);
create policy "read all"   on public.inventory              for select to authenticated using (true);
create policy "write all"  on public.inventory              for all    to authenticated using (true) with check (true);
create policy "read all"   on public.inventory_transactions for select to authenticated using (true);
create policy "insert tx"  on public.inventory_transactions for insert to authenticated with check (true);
create policy "read all"   on public.orders                 for select to authenticated using (true);
create policy "write all"  on public.orders                 for all    to authenticated using (true) with check (true);
create policy "read all"   on public.order_items            for select to authenticated using (true);
create policy "write all"  on public.order_items            for all    to authenticated using (true) with check (true);
create policy "read all"   on public.stock_transfers        for select to authenticated using (true);
create policy "write all"  on public.stock_transfers        for all    to authenticated using (true) with check (true);
create policy "read all"   on public.notifications          for select to authenticated using (true);
create policy "write all"  on public.notifications          for all    to authenticated using (true) with check (true);

-- Allow the anonymous role read access during demo exploration only if you
-- enable anonymous auth. By default only authenticated users are admitted.

-- ===========================================================================
-- Done. The WarehouseOS React app now has a complete, RLS-protected backend.
-- ===========================================================================
