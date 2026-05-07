create table if not exists public.vehicle_makes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_key text not null unique,
  external_source text,
  external_source_id text,
  is_seeded boolean not null default false,
  sort_order integer not null default 0,
  status public.record_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists vehicle_makes_status_sort_idx
  on public.vehicle_makes (status, sort_order, name);

create trigger set_vehicle_makes_updated_at
before update on public.vehicle_makes
for each row
execute function public.set_updated_at();

create table if not exists public.vehicle_models (
  id uuid primary key default gen_random_uuid(),
  make_id uuid not null references public.vehicle_makes(id) on delete restrict,
  name text not null,
  name_key text not null,
  external_source text,
  external_source_id text,
  is_seeded boolean not null default false,
  sort_order integer not null default 0,
  status public.record_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (make_id, name_key)
);

create index if not exists vehicle_models_make_status_sort_idx
  on public.vehicle_models (make_id, status, sort_order, name);

create trigger set_vehicle_models_updated_at
before update on public.vehicle_models
for each row
execute function public.set_updated_at();

create table if not exists public.vehicle_lookup_options (
  id uuid primary key default gen_random_uuid(),
  lookup_type text not null check (lookup_type in ('transmission', 'fuel_type', 'color')),
  label text not null,
  value_key text not null,
  sort_order integer not null default 0,
  status public.record_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (lookup_type, value_key)
);

create index if not exists vehicle_lookup_options_type_status_sort_idx
  on public.vehicle_lookup_options (lookup_type, status, sort_order, label);

create trigger set_vehicle_lookup_options_updated_at
before update on public.vehicle_lookup_options
for each row
execute function public.set_updated_at();

insert into public.vehicle_lookup_options (lookup_type, label, value_key, sort_order)
values
  ('transmission', 'Automatic', 'automatic', 10),
  ('transmission', 'Manual', 'manual', 20),
  ('transmission', 'CVT', 'cvt', 30),
  ('transmission', 'DCT', 'dct', 40),
  ('fuel_type', 'Gasoline', 'gasoline', 10),
  ('fuel_type', 'Diesel', 'diesel', 20),
  ('fuel_type', 'Hybrid', 'hybrid', 30),
  ('fuel_type', 'Electric', 'electric', 40),
  ('fuel_type', 'LPG', 'lpg', 50),
  ('color', 'White', 'white', 10),
  ('color', 'Black', 'black', 20),
  ('color', 'Silver', 'silver', 30),
  ('color', 'Gray', 'gray', 40),
  ('color', 'Blue', 'blue', 50),
  ('color', 'Red', 'red', 60),
  ('color', 'Brown', 'brown', 70),
  ('color', 'Green', 'green', 80),
  ('color', 'Yellow', 'yellow', 90),
  ('color', 'Orange', 'orange', 100),
  ('color', 'Beige', 'beige', 110)
on conflict (lookup_type, value_key) do nothing;

alter table public.vehicle_makes enable row level security;
alter table public.vehicle_models enable row level security;
alter table public.vehicle_lookup_options enable row level security;

drop policy if exists vehicle_makes_select_active_staff on public.vehicle_makes;
create policy vehicle_makes_select_active_staff
on public.vehicle_makes
for select
to authenticated
using (public.is_active_staff());

drop policy if exists vehicle_makes_insert_admin on public.vehicle_makes;
create policy vehicle_makes_insert_admin
on public.vehicle_makes
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists vehicle_makes_update_admin on public.vehicle_makes;
create policy vehicle_makes_update_admin
on public.vehicle_makes
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists vehicle_models_select_active_staff on public.vehicle_models;
create policy vehicle_models_select_active_staff
on public.vehicle_models
for select
to authenticated
using (public.is_active_staff());

drop policy if exists vehicle_models_insert_admin on public.vehicle_models;
create policy vehicle_models_insert_admin
on public.vehicle_models
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists vehicle_models_update_admin on public.vehicle_models;
create policy vehicle_models_update_admin
on public.vehicle_models
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists vehicle_lookup_options_select_active_staff on public.vehicle_lookup_options;
create policy vehicle_lookup_options_select_active_staff
on public.vehicle_lookup_options
for select
to authenticated
using (public.is_active_staff());

drop policy if exists vehicle_lookup_options_insert_admin on public.vehicle_lookup_options;
create policy vehicle_lookup_options_insert_admin
on public.vehicle_lookup_options
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists vehicle_lookup_options_update_admin on public.vehicle_lookup_options;
create policy vehicle_lookup_options_update_admin
on public.vehicle_lookup_options
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));
