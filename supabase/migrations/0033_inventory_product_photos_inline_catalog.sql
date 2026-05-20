alter table public.products
  add column if not exists product_image_path text,
  add column if not exists product_image_url text;

insert into storage.buckets (id, name, public)
values ('business-assets', 'business-assets', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Authenticated inventory team can manage product images" on storage.objects;

create policy "Authenticated inventory team can manage product images"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'business-assets'
  and name like 'product-images/%'
  and public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[])
)
with check (
  bucket_id = 'business-assets'
  and name like 'product-images/%'
  and public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[])
);
