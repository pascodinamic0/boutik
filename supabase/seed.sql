-- Boutik — données de démonstration (boutique d'alimentation à Matete, Kinshasa)
-- Prérequis : les comptes demo@boutik.cd (propriétaire) et vendeur@boutik.cd (vendeur)
-- doivent exister dans auth.users (créés via l'API Admin, voir scripts/seed-demo.sh).
-- Idempotent : la boutique de démonstration est supprimée puis recréée.

do $$
declare
  v_shop uuid := '0b0a7100-0000-4000-8000-000000000001';
  v_owner uuid;
  v_seller uuid;
  v_rate numeric := 2800;
  d int;
  n int;
  i int;
  k int;
  v_sale uuid;
  v_ts timestamptz;
  v_sub numeric;
  v_disc numeric;
  v_total numeric;
  v_method text;
  v_ref text;
  v_credit boolean;
  v_cust uuid;
  v_paid numeric;
  v_by uuid;
  v_by_name text;
  r record;
  q numeric;
  rnd float;
begin
  perform setseed(0.42);
  select id into v_owner from auth.users where email = 'demo@boutik.cd';
  select id into v_seller from auth.users where email = 'vendeur@boutik.cd';
  if v_owner is null or v_seller is null then
    raise exception 'Créez d''abord les comptes demo@boutik.cd et vendeur@boutik.cd';
  end if;

  delete from public.shops where id = v_shop;

  insert into public.shops(id, name, commune, shop_type, currency, exchange_rate, phone, plan, trial_ends_at, created_by, created_at)
  values (v_shop, 'Alimentation Maman Nzuzi', 'Matete', 'boutique', 'CDF', v_rate, '+243 81 234 5678', 'trial', now() + interval '19 days', v_owner, now() - interval '11 days');

  insert into public.shop_members(shop_id, user_id, role, display_name, email) values
    (v_shop, v_owner, 'owner', 'Maman Nzuzi', 'demo@boutik.cd'),
    (v_shop, v_seller, 'seller', 'Junior Makiese', 'vendeur@boutik.cd');

  -- Catalogue ----------------------------------------------------------------
  create temp table demo_products (slug text, name text, category text, buy numeric, sell numeric, unit text, target numeric, low numeric, barcode text, weight numeric) on commit drop;
  insert into demo_products values
    ('riz','Riz parfumé 25 kg','Alimentation',78000,85000,'sac',9,3,'6001240100251',1.2),
    ('farine-mais','Farine de maïs (fufu) 5 kg','Alimentation',13500,15500,'sac',22,6,'6009801234565',3),
    ('huile','Huile végétale 1 L','Alimentation',5600,6500,'bouteille',40,10,'6001087340014',4),
    ('sucre','Sucre en poudre 1 kg','Alimentation',3800,4500,'kg',35,10,null,4),
    ('sel','Sel fin 500 g','Alimentation',900,1200,'paquet',50,10,null,2.5),
    ('lait-poudre','Lait en poudre 400 g','Alimentation',11000,13000,'boîte',4,6,'7613035394520',1.5),
    ('tomate','Concentré de tomate 70 g','Alimentation',450,600,'boîte',120,24,'6291003040235',7),
    ('sardines','Sardines à l''huile 125 g','Alimentation',1900,2500,'boîte',60,12,'6111024002217',4),
    ('spaghetti','Spaghetti 500 g','Alimentation',1700,2200,'paquet',48,12,'8076809513388',4),
    ('biscuits','Biscuits (paquet)','Alimentation',1000,1500,'paquet',55,12,null,5),
    ('arachides','Arachides grillées 500 g','Alimentation',2200,3000,'sachet',26,8,null,2),
    ('haricots','Haricots secs 1 kg','Alimentation',3600,4500,'kg',30,8,null,2),
    ('lait-concentre','Lait concentré sucré 397 g','Alimentation',3300,4200,'boîte',24,6,'8712045011805',2),
    ('mayonnaise','Mayonnaise 250 ml','Alimentation',3500,4500,'pot',16,5,null,1.2),
    ('bouillon','Bouillon cube (boîte de 60)','Alimentation',5200,6500,'boîte',3,5,'6001068313809',2.5),
    ('pain','Pain (miche)','Alimentation',450,600,'pièce',30,10,null,6),
    ('oeufs','Œufs (plateau de 30)','Alimentation',16500,19500,'plateau',6,3,null,1.2),
    ('soda','Coca-Cola 33 cl','Boissons',1300,1800,'canette',72,24,'5449000000996',6),
    ('biere','Bière Primus 72 cl','Boissons',2400,3000,'bouteille',96,24,'6009880180015',6),
    ('eau','Eau minérale 1,5 L','Boissons',1100,1500,'bouteille',60,12,null,5),
    ('jus','Jus d''orange 1 L','Boissons',4200,5500,'brique',18,6,null,1.5),
    ('the','Thé noir (25 sachets)','Boissons',3200,4000,'boîte',14,4,'8722700055525',1),
    ('cafe','Café soluble 100 g','Boissons',8500,10500,'pot',7,3,'7613036010467',0.8),
    ('manioc','Manioc frais (tas)','Produits frais',2000,3000,'tas',12,4,null,2),
    ('poisson-sale','Makayabu (poisson salé) 500 g','Produits frais',6500,8500,'sachet',10,4,null,1.5),
    ('oignons','Oignons','Produits frais',2500,3500,'kg',20,6,null,2.5),
    ('savon','Savon de toilette','Hygiène',1100,1500,'pièce',40,10,'6001087357180',3),
    ('dentifrice','Dentifrice 100 ml','Hygiène',2600,3500,'tube',18,5,'8714789941015',1.2),
    ('papier-toilette','Papier hygiénique (x4)','Hygiène',3000,4000,'paquet',2,5,null,1.2),
    ('lessive','Lessive liquide 1 L','Ménage',5500,7000,'bouteille',12,4,null,1),
    ('allumettes','Allumettes (paquet de 10)','Ménage',900,1200,'paquet',45,10,null,2),
    ('bougies','Bougies (paquet de 6)','Ménage',2300,3000,'paquet',25,6,null,1.5),
    ('piles','Piles AA (x2)','Divers',1800,2500,'paquet',30,8,'5000394203921',1.2);

  insert into public.products(id, shop_id, name, category, buy_price, sell_price, quantity, unit, barcode, low_stock, photo, created_at, updated_at)
  select md5('boutik-demo-' || slug)::uuid, v_shop, name, category, buy, sell, 0, unit, barcode, low, '/products/' || slug || '.webp', now() - interval '45 days', now()
  from demo_products;

  -- Stock initial
  insert into public.stock_movements(id, shop_id, product_id, delta, kind, unit_cost, note, created_by, created_at)
  select gen_random_uuid(), v_shop, md5('boutik-demo-' || slug)::uuid, greatest(target * 4, 20), 'initial', buy, 'Inventaire d''ouverture', v_owner, now() - interval '43 days'
  from demo_products;

  -- Clients du carnet de crédit ----------------------------------------------
  create temp table demo_customers (id uuid, name text, phone text) on commit drop;
  insert into demo_customers values
    (md5('boutik-demo-c1')::uuid, 'Maman Chantal Mbuyi', '0812345671'),
    (md5('boutik-demo-c2')::uuid, 'Papa Didier Lukusa', '0998765432'),
    (md5('boutik-demo-c3')::uuid, 'Grâce Nsimba', '0823456789'),
    (md5('boutik-demo-c4')::uuid, 'Patrick Ilunga', '0851234567'),
    (md5('boutik-demo-c5')::uuid, 'Maman Béatrice Kalala', '0971234560'),
    (md5('boutik-demo-c6')::uuid, 'Serge Tshibangu', '0894567123'),
    (md5('boutik-demo-c7')::uuid, 'Sœur Esther Mputu', '0817654321'),
    (md5('boutik-demo-c8')::uuid, 'Rodrigue Mavungu', '0842223344');
  insert into public.customers(id, shop_id, name, phone, note, created_at, updated_at)
  select id, v_shop, name, phone, null, now() - interval '40 days', now() from demo_customers;
  update public.customers set note = 'Voisine, paie en fin de mois' where id = md5('boutik-demo-c1')::uuid;
  update public.customers set note = 'Enseignant — salaire le 5' where id = md5('boutik-demo-c2')::uuid;

  -- Historique des ventes (6 semaines) ---------------------------------------
  for d in reverse 41..0 loop
    n := 14 + floor(random() * 14)::int;
    if extract(dow from (current_date - d)) in (6, 0) then n := n + 7; end if;
    if d = 0 then n := least(n, 9 + floor(extract(hour from now() at time zone 'Africa/Kinshasa') / 2)::int); end if;
    for i in 1..n loop
      v_sale := gen_random_uuid();
      v_ts := ((current_date - d)::timestamp + interval '7 hours 30 minutes' + (random() * interval '13 hours')) at time zone 'Africa/Kinshasa';
      if v_ts > now() then v_ts := now() - (random() * interval '3 hours'); end if;
      rnd := random();
      v_method := case when rnd < 0.50 then 'cash' when rnd < 0.72 then 'mpesa' when rnd < 0.87 then 'orange' when rnd < 0.95 then 'airtel' else 'afrimoney' end;
      v_ref := case when v_method = 'cash' then null
                    when random() < 0.7 then upper(substr(v_method, 1, 2)) || lpad(floor(random() * 1e8)::text, 8, '0')
                    else null end;
      v_credit := random() < 0.07;
      v_cust := null;
      if v_credit then
        select id into v_cust from demo_customers order by random() limit 1;
        v_method := 'credit'; v_ref := null;
      end if;
      if random() < 0.62 then v_by := v_owner; v_by_name := 'Maman Nzuzi'; else v_by := v_seller; v_by_name := 'Junior Makiese'; end if;

      insert into public.sales(id, shop_id, customer_id, subtotal, discount, total, paid, method, reference, is_credit, due_date, currency, rate, seller_id, seller_name, created_at)
      values (v_sale, v_shop, v_cust, 0, 0, 0, 0, v_method, v_ref, v_credit, case when v_credit then (v_ts + interval '14 days')::date end, 'CDF', v_rate, v_by, v_by_name, v_ts);

      k := 1 + floor(random() * random() * 4)::int;
      v_sub := 0;
      for r in select * from demo_products order by -ln(random()) / weight limit k loop
        q := case when r.sell > 20000 then 1 else 1 + floor(random() * random() * 4) end;
        insert into public.sale_items(id, sale_id, shop_id, product_id, name, qty, unit_price, unit_cost, created_at)
        values (gen_random_uuid(), v_sale, v_shop, md5('boutik-demo-' || r.slug)::uuid, r.name, q, r.sell, r.buy, v_ts);
        insert into public.stock_movements(id, shop_id, product_id, delta, kind, unit_cost, sale_id, created_by, created_at)
        values (gen_random_uuid(), v_shop, md5('boutik-demo-' || r.slug)::uuid, -q, 'sale', r.buy, v_sale, v_by, v_ts);
        v_sub := v_sub + q * r.sell;
      end loop;
      v_disc := case when v_sub > 20000 and random() < 0.12 then round(v_sub * 0.05 / 500) * 500 else 0 end;
      v_total := v_sub - v_disc;
      v_paid := case when v_credit then (case when random() < 0.4 then round(v_total * 0.3 / 500) * 500 else 0 end) else v_total end;
      update public.sales set subtotal = v_sub, discount = v_disc, total = v_total, paid = v_paid where id = v_sale;
    end loop;

    -- Réassort hebdomadaire (le lundi)
    if extract(dow from (current_date - d)) = 1 and d > 0 then
      insert into public.stock_movements(id, shop_id, product_id, delta, kind, unit_cost, note, created_by, created_at)
      select gen_random_uuid(), v_shop, md5('boutik-demo-' || slug)::uuid, ceil(target * 0.8), 'restock', buy, 'Réassort grossiste — Marché Gambela', v_owner,
             ((current_date - d)::timestamp + interval '9 hours') at time zone 'Africa/Kinshasa'
      from demo_products where random() < 0.55;
    end if;
  end loop;

  -- Remboursements partiels : pour ~la moitié des crédits de plus de 5 jours
  insert into public.credit_payments(id, shop_id, customer_id, amount, method, reference, created_by, created_at)
  select gen_random_uuid(), v_shop, s.customer_id,
         greatest(500, round((s.total - s.paid) * (0.5 + random() * 0.5) / 500) * 500),
         (array['cash','mpesa','orange','cash'])[1 + floor(random() * 4)::int], null, v_owner,
         least(now() - interval '1 hour', s.created_at + (3 + floor(random() * 10)) * interval '1 day')
  from public.sales s
  where s.shop_id = v_shop and s.is_credit and s.created_at < now() - interval '5 days' and random() < 0.55;

  -- Dépenses ------------------------------------------------------------------
  insert into public.expenses(id, shop_id, category, amount, note, spent_on, created_by, created_at, updated_at)
  select gen_random_uuid(), v_shop, e.category, e.amount, e.note, e.dday, v_owner, e.dday + time '10:00', now()
  from (
    select 'loyer' category, 420000::numeric amount, 'Loyer du dépôt' note, date_trunc('month', current_date)::date as dday
    union all select 'loyer', 420000, 'Loyer du dépôt', (date_trunc('month', current_date) - interval '1 month')::date
    union all select 'salaire', 250000, 'Salaire Junior', (date_trunc('month', current_date) - interval '1 month' + interval '27 days')::date
    union all select 'electricite', 35000, 'Facture SNEL', (current_date - 20)
    union all select 'electricite', 35000, 'Facture SNEL', (current_date - 50)
    union all select 'taxes', 25000, 'Taxe communale Matete', (current_date - 16)
    union all select 'communication', 10000, 'Forfait internet', (current_date - 9)
    union all select 'divers', 15000, 'Sachets et emballages', (current_date - 6)
    union all select 'divers', 8000, 'Réparation cadenas', (current_date - 23)
  ) e;
  -- Transport (réassort) et carburant groupe électrogène
  insert into public.expenses(id, shop_id, category, amount, note, spent_on, created_by, created_at, updated_at)
  select gen_random_uuid(), v_shop, 'transport', 12000 + floor(random() * 4) * 1000, 'Taxi-bus Gambela', (current_date - g), v_owner, (current_date - g) + time '09:30', now()
  from generate_series(1, 41) g where extract(dow from (current_date - g)) = 1;
  insert into public.expenses(id, shop_id, category, amount, note, spent_on, created_by, created_at, updated_at)
  select gen_random_uuid(), v_shop, 'carburant', 18000, 'Essence groupe électrogène (5 L)', (current_date - g), v_owner, (current_date - g) + time '18:00', now()
  from generate_series(0, 41, 4) g;

  -- Quantités finales réalistes (quelques ruptures proches pour les alertes)
  update public.products p set quantity = dp.target
  from demo_products dp where p.id = md5('boutik-demo-' || dp.slug)::uuid;
end $$;
