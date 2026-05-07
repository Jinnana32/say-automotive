alter table public.products
  add column if not exists website_visible boolean not null default false,
  add column if not exists website_featured boolean not null default false,
  add column if not exists website_sort_order integer not null default 0,
  add column if not exists website_slug text,
  add column if not exists website_image_url text,
  add column if not exists website_short_description text,
  add column if not exists website_badge text;

create unique index if not exists products_website_slug_unique_idx
  on public.products (lower(website_slug))
  where website_slug is not null;

create index if not exists products_website_visibility_idx
  on public.products (website_visible, website_featured, website_sort_order, name);

create table if not exists public.website_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null,
  content text not null,
  cover_image_url text,
  category text not null default 'shop_update'
    check (category in ('shop_update', 'maintenance_tip', 'promo')),
  is_featured boolean not null default false,
  status public.record_status not null default 'active',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_website_posts_updated_at
before update on public.website_posts
for each row
execute function public.set_updated_at();

create index if not exists website_posts_status_published_idx
  on public.website_posts (status, is_featured, published_at desc, created_at desc);

create table if not exists public.website_quote_requests (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete restrict,
  requested_product_id uuid references public.products(id) on delete set null,
  requested_product_label text,
  first_name text not null,
  last_name text not null,
  contact_number text,
  email text not null,
  province text not null,
  city text not null,
  barangay text not null,
  vehicle_make text not null,
  vehicle_model text not null,
  vehicle_year integer,
  transmission text not null,
  mileage text not null,
  plate_number text not null,
  engine_size text,
  oil_requirement_liters numeric(8,2),
  service_needed text not null,
  customer_concern text not null,
  status text not null default 'new'
    check (status in ('new', 'reviewed', 'contacted', 'quoted', 'closed')),
  source text not null default 'website',
  internal_notes text,
  contacted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_website_quote_requests_updated_at
before update on public.website_quote_requests
for each row
execute function public.set_updated_at();

create index if not exists website_quote_requests_status_created_idx
  on public.website_quote_requests (status, created_at desc);

create index if not exists website_quote_requests_product_idx
  on public.website_quote_requests (requested_product_id);

alter table public.website_posts enable row level security;
alter table public.website_quote_requests enable row level security;

drop policy if exists website_posts_select_admin_team on public.website_posts;
create policy website_posts_select_admin_team
on public.website_posts
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists website_posts_insert_admin_team on public.website_posts;
create policy website_posts_insert_admin_team
on public.website_posts
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists website_posts_update_admin_team on public.website_posts;
create policy website_posts_update_admin_team
on public.website_posts
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists website_quote_requests_select_service_team on public.website_quote_requests;
create policy website_quote_requests_select_service_team
on public.website_quote_requests
for select
to authenticated
using (
  public.has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[]
  )
);

drop policy if exists website_quote_requests_update_service_team on public.website_quote_requests;
create policy website_quote_requests_update_service_team
on public.website_quote_requests
for update
to authenticated
using (
  public.has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[]
  )
)
with check (
  public.has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[]
  )
);
