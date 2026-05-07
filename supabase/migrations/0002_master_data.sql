create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_code text unique,
  customer_type public.customer_type not null default 'individual',
  display_name text not null,
  first_name text,
  last_name text,
  company_name text,
  contact_number text,
  email text,
  address text,
  notes text,
  status public.record_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists customers_display_name_idx on public.customers (display_name);

create trigger set_customers_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  make text not null,
  model text not null,
  year integer,
  transmission text,
  mileage numeric(12,2),
  plate_number text,
  vin text,
  engine text,
  variant text,
  fuel_type text,
  color text,
  status public.record_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists vehicles_plate_number_unique_idx
  on public.vehicles (lower(plate_number))
  where plate_number is not null;

create unique index if not exists vehicles_vin_unique_idx
  on public.vehicles (lower(vin))
  where vin is not null;

create index if not exists vehicles_customer_id_idx on public.vehicles (customer_id);

create trigger set_vehicles_updated_at
before update on public.vehicles
for each row
execute function public.set_updated_at();

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  linked_user_id uuid unique references auth.users(id),
  branch_id uuid references public.branches(id),
  first_name text not null,
  last_name text not null,
  contact_number text,
  address text,
  role public.staff_role not null,
  sss_number text,
  philhealth_number text,
  tin_number text,
  emergency_contact_name text,
  emergency_contact_number text,
  status public.record_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists staff_branch_id_idx on public.staff (branch_id);
create index if not exists staff_role_idx on public.staff (role);

create trigger set_staff_updated_at
before update on public.staff
for each row
execute function public.set_updated_at();

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  attendance_date date not null,
  time_in timestamptz,
  time_out timestamptz,
  status public.attendance_status not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (staff_id, attendance_date)
);

create index if not exists attendance_date_idx on public.attendance (attendance_date);

create trigger set_attendance_updated_at
before update on public.attendance
for each row
execute function public.set_updated_at();

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  abbreviation text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_units_updated_at
before update on public.units
for each row
execute function public.set_updated_at();

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  parent_category_id uuid references public.product_categories(id),
  name text not null unique,
  description text,
  status public.record_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_product_categories_updated_at
before update on public.product_categories
for each row
execute function public.set_updated_at();

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  status public.record_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_brands_updated_at
before update on public.brands
for each row
execute function public.set_updated_at();

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  supplier_name text not null unique,
  contact_person text,
  contact_number text,
  email text,
  address text,
  payment_terms text,
  notes text,
  status public.record_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_suppliers_updated_at
before update on public.suppliers
for each row
execute function public.set_updated_at();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id),
  name text not null,
  sku text,
  barcode text,
  category_id uuid references public.product_categories(id),
  brand_id uuid references public.brands(id),
  primary_supplier_id uuid references public.suppliers(id),
  unit_id uuid not null references public.units(id),
  part_number text,
  oem_number text,
  description text,
  product_type public.product_type not null default 'part',
  cost_price numeric(12,2) not null default 0,
  selling_price numeric(12,2) not null default 0,
  reorder_level numeric(12,4) not null default 0,
  warranty_duration_days integer,
  shelf_location text,
  status public.record_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists products_sku_unique_idx
  on public.products (lower(sku))
  where sku is not null;

create unique index if not exists products_barcode_unique_idx
  on public.products (lower(barcode))
  where barcode is not null;

create index if not exists products_name_idx on public.products (name);
create index if not exists products_branch_id_idx on public.products (branch_id);

create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id),
  name text not null,
  category text,
  description text,
  labor_price numeric(12,2) not null default 0,
  estimated_duration_minutes integer,
  status public.record_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists services_name_idx on public.services (name);

create trigger set_services_updated_at
before update on public.services
for each row
execute function public.set_updated_at();

insert into public.units (name, abbreviation)
values
  ('Piece', 'pc'),
  ('Set', 'set'),
  ('Pair', 'pair'),
  ('Liter', 'L'),
  ('Bottle', 'btl'),
  ('Gallon', 'gal'),
  ('Can', 'can')
on conflict (name) do nothing;
