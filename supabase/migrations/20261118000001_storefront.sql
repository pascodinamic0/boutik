-- Boutique en ligne publique + champs associés (vitrine, WhatsApp, masquage produit).
-- À appliquer manuellement (supabase db push / SQL editor) — ne pas supposer qu'elle est déjà live.

-- ---------------------------------------------------------------------------
-- Colonnes boutique
-- ---------------------------------------------------------------------------
alter table public.shops
  add column if not exists storefront_enabled boolean not null default false,
  add column if not exists storefront_slug text,
  add column if not exists storefront_whatsapp text,
  add column if not exists storefront_description text,
  add column if not exists storefront_theme text not null default 'cinema';

alter table public.shops
  drop constraint if exists shops_storefront_theme_allow;
alter table public.shops
  add constraint shops_storefront_theme_allow
  check (storefront_theme in ('cinema', 'marche', 'atelier'));

alter table public.shops
  drop constraint if exists shops_storefront_slug_format;
alter table public.shops
  add constraint shops_storefront_slug_format
  check (
    storefront_slug is null
    or storefront_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
       and char_length(storefront_slug) between 3 and 48
  );

alter table public.shops
  drop constraint if exists shops_storefront_description_len;
alter table public.shops
  add constraint shops_storefront_description_len
  check (storefront_description is null or char_length(storefront_description) <= 280);

create unique index if not exists shops_storefront_slug_uidx
  on public.shops (storefront_slug)
  where storefront_slug is not null;

-- ---------------------------------------------------------------------------
-- Colonnes produit
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists storefront_hidden boolean not null default false;

-- ---------------------------------------------------------------------------
-- RPC lecture publique : uniquement des champs sûrs, boutiques activées
-- ---------------------------------------------------------------------------
create or replace function public.get_public_storefront(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_slug text := lower(trim(coalesce(p_slug, '')));
  v_shop public.shops%rowtype;
  v_products jsonb;
begin
  if char_length(v_slug) < 3 or char_length(v_slug) > 48 then
    return null;
  end if;

  select * into v_shop
    from public.shops
   where storefront_enabled = true
     and storefront_slug = v_slug
   limit 1;

  if not found then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'category', p.category,
        'sell_price', p.sell_price,
        'photo', case when p.photo like 'data:%' then null else p.photo end,
        'unit', p.unit,
        'availability', case
          when p.quantity <= 0 then 'out'
          when p.quantity <= p.low_stock then 'low'
          else 'in'
        end
      )
      order by p.category, p.name
    ),
    '[]'::jsonb
  )
  into v_products
  from public.products p
  where p.shop_id = v_shop.id
    and p.archived = false
    and p.storefront_hidden = false;

  return jsonb_build_object(
    'slug', v_shop.storefront_slug,
    'name', v_shop.name,
    'commune', v_shop.commune,
    'description', v_shop.storefront_description,
    'whatsapp', nullif(trim(coalesce(v_shop.storefront_whatsapp, v_shop.phone, '')), ''),
    'currency', v_shop.currency,
    'theme', case
      when v_shop.storefront_theme in ('cinema', 'marche', 'atelier') then v_shop.storefront_theme
      else 'cinema'
    end,
    'products', v_products
  );
end;
$$;

revoke all on function public.get_public_storefront(text) from public;
grant execute on function public.get_public_storefront(text) to anon, authenticated;

-- Vérification d'unicité du slug (pour l'UI propriétaire, hors RPC publique)
create or replace function public.is_storefront_slug_available(p_slug text, p_shop_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.shops
     where storefront_slug = lower(trim(p_slug))
       and (p_shop_id is null or id <> p_shop_id)
  );
$$;

revoke all on function public.is_storefront_slug_available(text, uuid) from public;
grant execute on function public.is_storefront_slug_available(text, uuid) to authenticated;

comment on function public.get_public_storefront(text) is
  'Vitrine publique : nom, description, WhatsApp, devises et produits (prix de vente, dispo). Jamais buy_price, crédit, dépenses, clients.';
