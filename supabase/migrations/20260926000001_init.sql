-- Boutik — schéma initial
-- Toutes les tables métier portent un shop_id ; l'accès est contrôlé par l'appartenance
-- à la boutique (shop_members) via RLS. Les identifiants sont des UUID générés côté client
-- pour permettre la création hors ligne et une synchronisation idempotente.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  commune text not null default '',
  shop_type text not null default 'boutique',
  currency text not null default 'CDF' check (currency in ('CDF','USD')),
  exchange_rate numeric(12,2) not null default 2800 check (exchange_rate > 0),
  phone text,
  plan text not null default 'trial' check (plan in ('trial','active','expired')),
  trial_ends_at timestamptz not null default (now() + interval '30 days'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  synced_at timestamptz not null default clock_timestamp()
);

create table if not exists public.shop_members (
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','seller')),
  display_name text not null default '',
  email text,
  created_at timestamptz not null default now(),
  synced_at timestamptz not null default clock_timestamp(),
  primary key (shop_id, user_id)
);
create index if not exists shop_members_user_idx on public.shop_members(user_id);

create table if not exists public.products (
  id uuid primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  category text not null default 'Divers',
  buy_price numeric(14,2) not null default 0 check (buy_price >= 0),
  sell_price numeric(14,2) not null default 0 check (sell_price >= 0),
  quantity numeric(14,3) not null default 0,
  unit text not null default 'pièce',
  barcode text,
  low_stock numeric(14,3) not null default 5,
  photo text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz not null default clock_timestamp()
);
create index if not exists products_shop_idx on public.products(shop_id, synced_at);

create table if not exists public.stock_movements (
  id uuid primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  delta numeric(14,3) not null,
  kind text not null check (kind in ('initial','restock','adjust','sale','return')),
  unit_cost numeric(14,2),
  note text,
  sale_id uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  synced_at timestamptz not null default clock_timestamp()
);
create index if not exists stock_movements_shop_idx on public.stock_movements(shop_id, synced_at);

create table if not exists public.customers (
  id uuid primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  phone text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz not null default clock_timestamp()
);
create index if not exists customers_shop_idx on public.customers(shop_id, synced_at);

create table if not exists public.sales (
  id uuid primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0 check (discount >= 0),
  total numeric(14,2) not null default 0 check (total >= 0),
  paid numeric(14,2) not null default 0 check (paid >= 0),
  method text not null check (method in ('cash','mpesa','orange','airtel','afrimoney','credit')),
  reference text,
  is_credit boolean not null default false,
  due_date date,
  currency text not null default 'CDF' check (currency in ('CDF','USD')),
  rate numeric(12,2) not null default 2800,
  seller_id uuid,
  seller_name text,
  note text,
  created_at timestamptz not null default now(),
  synced_at timestamptz not null default clock_timestamp()
);
create index if not exists sales_shop_idx on public.sales(shop_id, synced_at);
create index if not exists sales_shop_created_idx on public.sales(shop_id, created_at);

create table if not exists public.sale_items (
  id uuid primary key,
  sale_id uuid not null references public.sales(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  qty numeric(14,3) not null check (qty > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  unit_cost numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  synced_at timestamptz not null default clock_timestamp()
);
create index if not exists sale_items_shop_idx on public.sale_items(shop_id, synced_at);
create index if not exists sale_items_sale_idx on public.sale_items(sale_id);

create table if not exists public.credit_payments (
  id uuid primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  method text not null default 'cash' check (method in ('cash','mpesa','orange','airtel','afrimoney')),
  reference text,
  created_by uuid,
  created_at timestamptz not null default now(),
  synced_at timestamptz not null default clock_timestamp()
);
create index if not exists credit_payments_shop_idx on public.credit_payments(shop_id, synced_at);

create table if not exists public.expenses (
  id uuid primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  category text not null,
  amount numeric(14,2) not null check (amount > 0),
  note text,
  spent_on date not null default current_date,
  deleted boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz not null default clock_timestamp()
);
create index if not exists expenses_shop_idx on public.expenses(shop_id, synced_at);

-- ---------------------------------------------------------------------------
-- Triggers : horodatage serveur (curseur de synchronisation) et stock
-- ---------------------------------------------------------------------------
create or replace function public.touch_synced_at() returns trigger
language plpgsql as $$
begin
  new.synced_at := clock_timestamp();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['shops','shop_members','products','stock_movements','customers','sales','sale_items','credit_payments','expenses'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format('create trigger %I_touch before insert or update on public.%I for each row execute function public.touch_synced_at()', t, t);
  end loop;
end $$;

-- La quantité en stock n'est jamais écrite directement par les clients :
-- elle résulte des mouvements de stock (ventes, réassorts, ajustements).
create or replace function public.apply_stock_movement() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.products
     set quantity = quantity + new.delta,
         updated_at = now()
   where id = new.product_id;
  return new;
end $$;

drop trigger if exists stock_movements_apply on public.stock_movements;
create trigger stock_movements_apply after insert on public.stock_movements
for each row execute function public.apply_stock_movement();

-- ---------------------------------------------------------------------------
-- Helpers RLS
-- ---------------------------------------------------------------------------
create or replace function public.is_member(p_shop uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.shop_members where shop_id = p_shop and user_id = auth.uid());
$$;

create or replace function public.is_owner(p_shop uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.shop_members where shop_id = p_shop and user_id = auth.uid() and role = 'owner');
$$;

-- Création d'une boutique + appartenance propriétaire, en une transaction.
create or replace function public.create_shop(
  p_name text, p_commune text, p_type text, p_currency text, p_rate numeric, p_display_name text default null
) returns public.shops
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_shop public.shops;
  v_email text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select email into v_email from auth.users where id = v_uid;
  insert into public.shops(name, commune, shop_type, currency, exchange_rate, created_by)
  values (trim(p_name), coalesce(trim(p_commune), ''), coalesce(p_type, 'boutique'), coalesce(p_currency, 'CDF'), coalesce(p_rate, 2800), v_uid)
  returning * into v_shop;
  insert into public.shop_members(shop_id, user_id, role, display_name, email)
  values (v_shop.id, v_uid, 'owner', coalesce(nullif(trim(p_display_name), ''), split_part(v_email, '@', 1)), v_email);
  return v_shop;
end $$;

revoke all on function public.create_shop(text, text, text, text, numeric, text) from public, anon;
grant execute on function public.create_shop(text, text, text, text, numeric, text) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.shops enable row level security;
alter table public.shop_members enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.credit_payments enable row level security;
alter table public.expenses enable row level security;

-- shops
drop policy if exists shops_select on public.shops;
create policy shops_select on public.shops for select to authenticated using (public.is_member(id));
drop policy if exists shops_update on public.shops;
create policy shops_update on public.shops for update to authenticated using (public.is_owner(id)) with check (public.is_owner(id));

-- shop_members : visibles par les membres ; seul le propriétaire retire un vendeur
drop policy if exists members_select on public.shop_members;
create policy members_select on public.shop_members for select to authenticated using (public.is_member(shop_id));
drop policy if exists members_delete on public.shop_members;
create policy members_delete on public.shop_members for delete to authenticated using (public.is_owner(shop_id) and role = 'seller');
drop policy if exists members_update_self on public.shop_members;
create policy members_update_self on public.shop_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- products : lecture pour tous les membres, écriture propriétaire
drop policy if exists products_select on public.products;
create policy products_select on public.products for select to authenticated using (public.is_member(shop_id));
drop policy if exists products_insert on public.products;
create policy products_insert on public.products for insert to authenticated with check (public.is_owner(shop_id));
drop policy if exists products_update on public.products;
create policy products_update on public.products for update to authenticated using (public.is_owner(shop_id)) with check (public.is_owner(shop_id));

-- stock_movements : les vendeurs ne créent que des mouvements de vente
drop policy if exists movements_select on public.stock_movements;
create policy movements_select on public.stock_movements for select to authenticated using (public.is_member(shop_id));
drop policy if exists movements_insert on public.stock_movements;
create policy movements_insert on public.stock_movements for insert to authenticated
  with check (public.is_owner(shop_id) or (public.is_member(shop_id) and kind = 'sale'));

-- customers
drop policy if exists customers_select on public.customers;
create policy customers_select on public.customers for select to authenticated using (public.is_member(shop_id));
drop policy if exists customers_insert on public.customers;
create policy customers_insert on public.customers for insert to authenticated with check (public.is_member(shop_id));
drop policy if exists customers_update on public.customers;
create policy customers_update on public.customers for update to authenticated using (public.is_member(shop_id)) with check (public.is_member(shop_id));

-- sales / sale_items
drop policy if exists sales_select on public.sales;
create policy sales_select on public.sales for select to authenticated using (public.is_member(shop_id));
drop policy if exists sales_insert on public.sales;
create policy sales_insert on public.sales for insert to authenticated with check (public.is_member(shop_id));
drop policy if exists sale_items_select on public.sale_items;
create policy sale_items_select on public.sale_items for select to authenticated using (public.is_member(shop_id));
drop policy if exists sale_items_insert on public.sale_items;
create policy sale_items_insert on public.sale_items for insert to authenticated with check (public.is_member(shop_id));

-- credit_payments
drop policy if exists payments_select on public.credit_payments;
create policy payments_select on public.credit_payments for select to authenticated using (public.is_member(shop_id));
drop policy if exists payments_insert on public.credit_payments;
create policy payments_insert on public.credit_payments for insert to authenticated with check (public.is_member(shop_id));

-- expenses : propriétaire uniquement
drop policy if exists expenses_select on public.expenses;
create policy expenses_select on public.expenses for select to authenticated using (public.is_owner(shop_id));
drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses for insert to authenticated with check (public.is_owner(shop_id));
drop policy if exists expenses_update on public.expenses;
create policy expenses_update on public.expenses for update to authenticated using (public.is_owner(shop_id)) with check (public.is_owner(shop_id));

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on all tables in schema public from anon;
