alter table public.business_settings
  add column if not exists business_logo_path text;

insert into storage.buckets (id, name, public)
values ('business-assets', 'business-assets', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Authenticated users can manage business logos" on storage.objects;

create policy "Authenticated users can manage business logos"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'business-assets'
  and name like 'business-logos/%'
)
with check (
  bucket_id = 'business-assets'
  and name like 'business-logos/%'
);
