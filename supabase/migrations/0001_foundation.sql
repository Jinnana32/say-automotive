create extension if not exists pgcrypto;

create type public.record_status as enum ('active', 'inactive');
create type public.customer_type as enum ('individual', 'company', 'fleet');
create type public.staff_role as enum (
  'owner',
  'admin',
  'mechanic',
  'cashier',
  'inventory_staff',
  'service_advisor'
);
create type public.attendance_status as enum ('present', 'absent', 'late', 'half_day');
create type public.product_type as enum ('part', 'fluid', 'consumable', 'accessory', 'tool');
create type public.line_item_type as enum ('product', 'service', 'labor');
create type public.quotation_status as enum (
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'expired'
);
create type public.job_order_status as enum (
  'pending',
  'in_progress',
  'waiting_for_parts',
  'waiting_for_customer_approval',
  'completed',
  'ready_for_billing',
  'paid',
  'released',
  'cancelled'
);
create type public.approval_status as enum ('not_required', 'pending', 'approved', 'rejected');
create type public.usage_status as enum ('planned', 'used', 'returned', 'cancelled');
create type public.invoice_status as enum ('unpaid', 'partially_paid', 'paid', 'cancelled');
create type public.payment_method as enum ('cash', 'gcash', 'card', 'bank_transfer', 'check');
create type public.sale_status as enum ('draft', 'completed', 'cancelled');
create type public.stock_movement_type as enum (
  'stock_in',
  'stock_out',
  'service_usage',
  'pos_sale',
  'adjustment',
  'return',
  'damaged'
);
create type public.part_usage_type as enum ('use', 'return');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_default boolean not null default false,
  status public.record_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists branches_one_default_idx
  on public.branches (is_default)
  where is_default = true;

create trigger set_branches_updated_at
before update on public.branches
for each row
execute function public.set_updated_at();

create table if not exists public.business_settings (
  id integer primary key default 1 check (id = 1),
  branch_id uuid not null references public.branches(id),
  allow_partial_payments boolean not null default false,
  allow_release_with_balance boolean not null default false,
  require_full_payment_before_release boolean not null default true,
  enable_barcode_support boolean not null default false,
  enable_shelf_location boolean not null default false,
  default_tax_rate numeric(5,2) not null default 0,
  business_name text not null,
  business_address text,
  business_contact text,
  receipt_footer text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_business_settings_updated_at
before update on public.business_settings
for each row
execute function public.set_updated_at();

create table if not exists public.document_sequences (
  key text primary key,
  prefix text not null,
  padding integer not null default 4 check (padding > 0),
  last_value bigint not null default 0 check (last_value >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_document_sequences_updated_at
before update on public.document_sequences
for each row
execute function public.set_updated_at();

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.branches (code, name, is_default, status)
values ('MAIN', 'Main Branch', true, 'active')
on conflict (code) do nothing;

insert into public.business_settings (
  id,
  branch_id,
  business_name,
  business_address,
  business_contact,
  receipt_footer
)
select
  1,
  id,
  'SAY Auto Care Center',
  null,
  null,
  'Thank you for choosing SAY Auto Care Center.'
from public.branches
where code = 'MAIN'
on conflict (id) do nothing;

insert into public.document_sequences (key, prefix, padding)
values
  ('quotation', 'QT-', 4),
  ('job_order', 'JO-', 4),
  ('invoice', 'INV-', 4),
  ('sale', 'POS-', 4)
on conflict (key) do nothing;
