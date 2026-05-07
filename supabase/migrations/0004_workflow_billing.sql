create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quotation_number text not null unique,
  branch_id uuid not null references public.branches(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  inspection_notes text,
  status public.quotation_status not null default 'draft',
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  created_by uuid references auth.users(id),
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists quotations_customer_id_idx on public.quotations (customer_id);
create index if not exists quotations_vehicle_id_idx on public.quotations (vehicle_id);
create index if not exists quotations_status_idx on public.quotations (status);

create trigger set_quotations_updated_at
before update on public.quotations
for each row
execute function public.set_updated_at();

create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  line_number integer not null,
  item_type public.line_item_type not null,
  product_id uuid references public.products(id),
  service_id uuid references public.services(id),
  description text not null,
  quantity numeric(12,4) not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (quotation_id, line_number)
);

create index if not exists quotation_items_product_id_idx on public.quotation_items (product_id);
create index if not exists quotation_items_service_id_idx on public.quotation_items (service_id);

create trigger set_quotation_items_updated_at
before update on public.quotation_items
for each row
execute function public.set_updated_at();

create table if not exists public.job_orders (
  id uuid primary key default gen_random_uuid(),
  job_order_number text not null unique,
  quotation_id uuid unique references public.quotations(id) on delete set null,
  branch_id uuid not null references public.branches(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  status public.job_order_status not null default 'pending',
  mileage_in numeric(12,2),
  mileage_out numeric(12,2),
  customer_concern text,
  inspection_notes text,
  diagnosis text,
  work_performed text,
  started_at timestamptz,
  completed_at timestamptz,
  released_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists job_orders_customer_id_idx on public.job_orders (customer_id);
create index if not exists job_orders_vehicle_id_idx on public.job_orders (vehicle_id);
create index if not exists job_orders_status_idx on public.job_orders (status);

create trigger set_job_orders_updated_at
before update on public.job_orders
for each row
execute function public.set_updated_at();

create table if not exists public.job_order_mechanics (
  id uuid primary key default gen_random_uuid(),
  job_order_id uuid not null references public.job_orders(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete restrict,
  task_description text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists job_order_mechanics_job_order_id_idx
  on public.job_order_mechanics (job_order_id);
create index if not exists job_order_mechanics_staff_id_idx on public.job_order_mechanics (staff_id);

create trigger set_job_order_mechanics_updated_at
before update on public.job_order_mechanics
for each row
execute function public.set_updated_at();

create table if not exists public.job_order_items (
  id uuid primary key default gen_random_uuid(),
  job_order_id uuid not null references public.job_orders(id) on delete cascade,
  source_quotation_item_id uuid references public.quotation_items(id) on delete set null,
  line_number integer not null,
  item_type public.line_item_type not null,
  product_id uuid references public.products(id),
  service_id uuid references public.services(id),
  description text not null,
  quantity numeric(12,4) not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  is_additional boolean not null default false,
  approval_status public.approval_status not null default 'not_required',
  usage_status public.usage_status not null default 'planned',
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (job_order_id, line_number)
);

create index if not exists job_order_items_job_order_id_idx on public.job_order_items (job_order_id);
create index if not exists job_order_items_product_id_idx on public.job_order_items (product_id);
create index if not exists job_order_items_approval_status_idx
  on public.job_order_items (approval_status);

create trigger set_job_order_items_updated_at
before update on public.job_order_items
for each row
execute function public.set_updated_at();

create table if not exists public.job_order_part_usages (
  id uuid primary key default gen_random_uuid(),
  job_order_id uuid not null references public.job_orders(id) on delete cascade,
  job_order_item_id uuid not null references public.job_order_items(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  usage_type public.part_usage_type not null,
  quantity numeric(12,4) not null check (quantity > 0),
  stock_movement_id uuid unique references public.stock_movements(id) on delete restrict,
  notes text,
  performed_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists job_order_part_usages_job_order_id_idx
  on public.job_order_part_usages (job_order_id);
create index if not exists job_order_part_usages_product_id_idx
  on public.job_order_part_usages (product_id);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text not null unique,
  branch_id uuid not null references public.branches(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  cashier_user_id uuid references auth.users(id),
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  status public.sale_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists sales_status_idx on public.sales (status);

create trigger set_sales_updated_at
before update on public.sales
for each row
execute function public.set_updated_at();

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  line_number integer not null,
  product_id uuid not null references public.products(id) on delete restrict,
  description text not null,
  quantity numeric(12,4) not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (sale_id, line_number)
);

create index if not exists sale_items_product_id_idx on public.sale_items (product_id);

create trigger set_sale_items_updated_at
before update on public.sale_items
for each row
execute function public.set_updated_at();

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  job_order_id uuid unique references public.job_orders(id) on delete set null,
  sale_id uuid unique references public.sales(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  invoice_date date not null,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  balance numeric(12,2) not null default 0,
  status public.invoice_status not null default 'unpaid',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (job_order_id is not null or sale_id is not null)
);

create index if not exists invoices_status_idx on public.invoices (status);
create index if not exists invoices_customer_id_idx on public.invoices (customer_id);

create trigger set_invoices_updated_at
before update on public.invoices
for each row
execute function public.set_updated_at();

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  source_type text,
  source_id uuid,
  line_number integer not null,
  item_type public.line_item_type not null,
  description text not null,
  quantity numeric(12,4) not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (invoice_id, line_number)
);

create trigger set_invoice_items_updated_at
before update on public.invoice_items
for each row
execute function public.set_updated_at();

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_method public.payment_method not null,
  reference_number text,
  received_by uuid references auth.users(id),
  paid_at timestamptz not null default timezone('utc', now()),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists payments_invoice_id_idx on public.payments (invoice_id);
create index if not exists payments_paid_at_idx on public.payments (paid_at desc);

create trigger set_payments_updated_at
before update on public.payments
for each row
execute function public.set_updated_at();
