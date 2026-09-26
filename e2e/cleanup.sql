-- Removes rows created by the e2e suite from the demo shop (keeps realistic QA sales).
begin;
with test_sales as (
  select s.id from public.sales s
  left join public.customers c on c.id = s.customer_id
  where s.shop_id = '0b0a7100-0000-4000-8000-000000000001'
    and (c.name like 'Client E2E %'
         or exists (select 1 from public.sale_items i join public.products p on p.id = i.product_id
                    where i.sale_id = s.id and p.name like 'Test E2E %'))
),
gone as (
  delete from public.stock_movements m using test_sales t where m.sale_id = t.id returning m.product_id, m.delta
),
restore as (
  update public.products p set quantity = p.quantity - g.d
  from (select product_id, sum(delta) d from gone group by product_id) g
  where p.id = g.product_id and p.name not like 'Test E2E %'
  returning p.id
)
delete from public.sales s using test_sales t where s.id = t.id;
delete from public.customers where shop_id = '0b0a7100-0000-4000-8000-000000000001' and name like 'Client E2E %';
delete from public.products where shop_id = '0b0a7100-0000-4000-8000-000000000001' and name like 'Test E2E %';
delete from public.expenses where shop_id = '0b0a7100-0000-4000-8000-000000000001' and note like 'Taxi E2E %';
commit;
select (select count(*) from public.products where shop_id = '0b0a7100-0000-4000-8000-000000000001') products,
       (select count(*) from public.customers where shop_id = '0b0a7100-0000-4000-8000-000000000001') customers;
