alter table public.branches
  add column if not exists address text,
  add column if not exists contact_number text,
  add column if not exists email text,
  add column if not exists is_main boolean not null default false,
  add column if not exists is_active boolean not null default true;

update public.branches
set
  is_main = coalesce(is_default, false),
  is_active = case when status = 'inactive' then false else true end;

update public.branches
set
  name = 'Main Branch',
  code = 'MAIN',
  is_main = true,
  is_active = true
where code = 'MAIN';

insert into public.branches (
  code,
  name,
  is_default,
  status,
  is_main,
  is_active
)
select
  'MAIN',
  'Main Branch',
  true,
  'active',
  true,
  true
where not exists (
  select 1
  from public.branches
  where code = 'MAIN'
);

create or replace function public.sync_branch_legacy_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(new.is_default, false) and not coalesce(new.is_main, false) then
    new.is_main := true;
  end if;

  if new.status = 'inactive' and new.is_active then
    new.is_active := false;
  end if;

  new.is_default := new.is_main;
  new.status := case when new.is_active then 'active' else 'inactive' end;
  return new;
end;
$$;

drop trigger if exists sync_branch_legacy_fields on public.branches;
create trigger sync_branch_legacy_fields
before insert or update on public.branches
for each row
execute function public.sync_branch_legacy_fields();

drop index if exists public.branches_one_default_idx;
create unique index if not exists branches_one_main_idx
  on public.branches (is_main)
  where is_main = true;

create sequence if not exists public.business_settings_id_seq;

alter sequence public.business_settings_id_seq
  owned by public.business_settings.id;

alter table public.business_settings
  add column if not exists branch_id uuid references public.branches(id) on delete restrict;

alter table public.business_settings
  alter column id set default nextval('public.business_settings_id_seq');

alter table public.business_settings
  drop constraint if exists business_settings_id_check;

with main_branch as (
  select id
  from public.branches
  where code = 'MAIN'
  limit 1
)
update public.business_settings
set branch_id = main_branch.id
from main_branch
where public.business_settings.branch_id is null;

with main_branch as (
  select id
  from public.branches
  where code = 'MAIN'
  limit 1
)
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
  main_branch.id,
  'SAY Auto Care Center',
  null,
  null,
  'Thank you for choosing SAY Auto Care Center.'
from main_branch
where not exists (
  select 1
  from public.business_settings
  where branch_id = main_branch.id
)
on conflict (id) do update
set branch_id = excluded.branch_id;

insert into public.business_settings (
  branch_id,
  allow_partial_payments,
  allow_release_with_balance,
  require_full_payment_before_release,
  require_additional_item_preapproval,
  require_shop_ip_for_mechanic_attendance,
  allow_dtr_amendments,
  allow_attendance_admin_override,
  enable_barcode_support,
  enable_shelf_location,
  default_tax_rate,
  business_name,
  business_logo_path,
  business_address,
  business_contact,
  business_email,
  business_vat_registration_no,
  receipt_footer
)
select
  branch.id,
  main_settings.allow_partial_payments,
  main_settings.allow_release_with_balance,
  main_settings.require_full_payment_before_release,
  main_settings.require_additional_item_preapproval,
  main_settings.require_shop_ip_for_mechanic_attendance,
  main_settings.allow_dtr_amendments,
  main_settings.allow_attendance_admin_override,
  main_settings.enable_barcode_support,
  main_settings.enable_shelf_location,
  main_settings.default_tax_rate,
  main_settings.business_name,
  main_settings.business_logo_path,
  main_settings.business_address,
  main_settings.business_contact,
  main_settings.business_email,
  main_settings.business_vat_registration_no,
  main_settings.receipt_footer
from public.branches as branch
cross join lateral (
  select *
  from public.business_settings
  where branch_id = (
    select id
    from public.branches
    where code = 'MAIN'
    limit 1
  )
  limit 1
) as main_settings
left join public.business_settings as existing_settings
  on existing_settings.branch_id = branch.id
where existing_settings.branch_id is null;

alter table public.business_settings
  alter column branch_id set not null;

create unique index if not exists business_settings_branch_id_key
  on public.business_settings (branch_id);

select setval(
  'public.business_settings_id_seq',
  greatest(coalesce((select max(id) from public.business_settings), 1), 1),
  true
);

alter table public.document_sequences
  add column if not exists branch_id uuid references public.branches(id) on delete cascade;

with main_branch as (
  select id
  from public.branches
  where code = 'MAIN'
  limit 1
)
update public.document_sequences
set branch_id = main_branch.id
from main_branch
where public.document_sequences.branch_id is null;

with main_branch as (
  select id
  from public.branches
  where code = 'MAIN'
  limit 1
),
required_sequences (key, prefix, padding) as (
  values
    ('quotation', 'QT-', 4),
    ('job_order', 'JO-', 4),
    ('invoice', 'INV-', 4),
    ('sale', 'POS-', 4)
)
insert into public.document_sequences (
  key,
  branch_id,
  prefix,
  padding,
  last_value
)
select
  required_sequences.key,
  main_branch.id,
  required_sequences.prefix,
  required_sequences.padding,
  0
from main_branch
cross join required_sequences
left join public.document_sequences as existing_sequence
  on existing_sequence.key = required_sequences.key
 and existing_sequence.branch_id = main_branch.id
where existing_sequence.key is null;

alter table public.document_sequences
  alter column branch_id set not null;

alter table public.document_sequences
  drop constraint if exists document_sequences_pkey;

alter table public.document_sequences
  add constraint document_sequences_pkey primary key (key, branch_id);

create index if not exists document_sequences_branch_id_idx
  on public.document_sequences (branch_id);

insert into public.document_sequences (
  key,
  branch_id,
  prefix,
  padding,
  last_value
)
select
  main_sequence.key,
  branch.id,
  main_sequence.prefix,
  main_sequence.padding,
  0
from public.branches as branch
cross join lateral (
  select key, prefix, padding
  from public.document_sequences
  where branch_id = (
    select id
    from public.branches
    where code = 'MAIN'
    limit 1
  )
) as main_sequence
left join public.document_sequences as existing_sequence
  on existing_sequence.key = main_sequence.key
 and existing_sequence.branch_id = branch.id
where existing_sequence.key is null;

create or replace function public.provision_branch_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.business_settings (
    branch_id,
    allow_partial_payments,
    allow_release_with_balance,
    require_full_payment_before_release,
    require_additional_item_preapproval,
    require_shop_ip_for_mechanic_attendance,
    allow_dtr_amendments,
    allow_attendance_admin_override,
    enable_barcode_support,
    enable_shelf_location,
    default_tax_rate,
    business_name,
    business_logo_path,
    business_address,
    business_contact,
    business_email,
    business_vat_registration_no,
    receipt_footer
  )
  select
    new.id,
    main_settings.allow_partial_payments,
    main_settings.allow_release_with_balance,
    main_settings.require_full_payment_before_release,
    main_settings.require_additional_item_preapproval,
    main_settings.require_shop_ip_for_mechanic_attendance,
    main_settings.allow_dtr_amendments,
    main_settings.allow_attendance_admin_override,
    main_settings.enable_barcode_support,
    main_settings.enable_shelf_location,
    main_settings.default_tax_rate,
    main_settings.business_name,
    main_settings.business_logo_path,
    main_settings.business_address,
    main_settings.business_contact,
    main_settings.business_email,
    main_settings.business_vat_registration_no,
    main_settings.receipt_footer
  from public.business_settings as main_settings
  where main_settings.branch_id = (
    select id
    from public.branches
    where is_main = true
    limit 1
  )
  on conflict (branch_id) do nothing;

  insert into public.document_sequences (
    key,
    branch_id,
    prefix,
    padding,
    last_value
  )
  select
    main_sequence.key,
    new.id,
    main_sequence.prefix,
    main_sequence.padding,
    0
  from public.document_sequences as main_sequence
  where main_sequence.branch_id = (
    select id
    from public.branches
    where is_main = true
    limit 1
  )
  on conflict (key, branch_id) do nothing;

  return new;
end;
$$;

drop trigger if exists provision_branch_defaults on public.branches;
create trigger provision_branch_defaults
after insert on public.branches
for each row
execute function public.provision_branch_defaults();

alter table public.staff
  add column if not exists branch_id uuid references public.branches(id) on delete restrict;

with main_branch as (
  select id
  from public.branches
  where code = 'MAIN'
  limit 1
)
update public.staff
set branch_id = main_branch.id
from main_branch
where public.staff.branch_id is null;

alter table public.staff
  alter column branch_id set not null;

create index if not exists staff_branch_id_idx on public.staff (branch_id);

alter table public.customers
  add column if not exists branch_id uuid references public.branches(id) on delete restrict;

with main_branch as (
  select id
  from public.branches
  where code = 'MAIN'
  limit 1
)
update public.customers
set branch_id = main_branch.id
from main_branch
where public.customers.branch_id is null;

alter table public.customers
  alter column branch_id set not null;

create index if not exists customers_branch_id_idx on public.customers (branch_id);
create index if not exists customers_branch_created_at_idx
  on public.customers (branch_id, created_at desc);

alter table public.vehicles
  add column if not exists branch_id uuid references public.branches(id) on delete restrict;

with main_branch as (
  select id
  from public.branches
  where code = 'MAIN'
  limit 1
)
update public.vehicles
set branch_id = coalesce(
  (
    select c.branch_id
    from public.customers c
    where c.id = public.vehicles.customer_id
  ),
  main_branch.id
)
from main_branch
where public.vehicles.branch_id is null;

alter table public.vehicles
  alter column branch_id set not null;

create index if not exists vehicles_branch_id_idx on public.vehicles (branch_id);
create index if not exists vehicles_branch_customer_id_idx on public.vehicles (branch_id, customer_id);

drop index if exists public.vehicles_plate_number_unique_idx;
drop index if exists public.vehicles_vin_unique_idx;

create unique index if not exists vehicles_branch_plate_number_unique_idx
  on public.vehicles (branch_id, lower(plate_number))
  where plate_number is not null;

create unique index if not exists vehicles_branch_vin_unique_idx
  on public.vehicles (branch_id, lower(vin))
  where vin is not null;

alter table public.quotations
  add column if not exists branch_id uuid references public.branches(id) on delete restrict;

with main_branch as (
  select id
  from public.branches
  where code = 'MAIN'
  limit 1
)
update public.quotations q
set branch_id = coalesce(
  (
    select c.branch_id
    from public.customers c
    where c.id = q.customer_id
  ),
  (
    select v.branch_id
    from public.vehicles v
    where v.id = q.vehicle_id
  ),
  main_branch.id
)
from main_branch
where q.branch_id is null;

alter table public.quotations
  alter column branch_id set not null;

create index if not exists quotations_branch_id_idx on public.quotations (branch_id);
create index if not exists quotations_branch_status_idx on public.quotations (branch_id, status);
create index if not exists quotations_branch_created_at_idx
  on public.quotations (branch_id, created_at desc);

alter table public.job_orders
  add column if not exists branch_id uuid references public.branches(id) on delete restrict;

with main_branch as (
  select id
  from public.branches
  where code = 'MAIN'
  limit 1
)
update public.job_orders jo
set branch_id = coalesce(
  (
    select q.branch_id
    from public.quotations q
    where q.id = jo.quotation_id
  ),
  (
    select c.branch_id
    from public.customers c
    where c.id = jo.customer_id
  ),
  (
    select v.branch_id
    from public.vehicles v
    where v.id = jo.vehicle_id
  ),
  main_branch.id
)
from main_branch
where jo.branch_id is null;

alter table public.job_orders
  alter column branch_id set not null;

create index if not exists job_orders_branch_id_idx on public.job_orders (branch_id);
create index if not exists job_orders_branch_status_idx on public.job_orders (branch_id, status);
create index if not exists job_orders_branch_created_at_idx
  on public.job_orders (branch_id, created_at desc);

alter table public.sales
  add column if not exists branch_id uuid references public.branches(id) on delete restrict;

with main_branch as (
  select id
  from public.branches
  where code = 'MAIN'
  limit 1
)
update public.sales s
set branch_id = coalesce(
  (
    select c.branch_id
    from public.customers c
    where c.id = s.customer_id
  ),
  main_branch.id
)
from main_branch
where s.branch_id is null;

alter table public.sales
  alter column branch_id set not null;

create index if not exists sales_branch_id_idx on public.sales (branch_id);
create index if not exists sales_branch_status_idx on public.sales (branch_id, status);
create index if not exists sales_branch_created_at_idx
  on public.sales (branch_id, created_at desc);

alter table public.inventory_stocks
  add column if not exists branch_id uuid references public.branches(id) on delete restrict;

with main_branch as (
  select id
  from public.branches
  where code = 'MAIN'
  limit 1
)
update public.inventory_stocks
set branch_id = main_branch.id
from main_branch
where public.inventory_stocks.branch_id is null;

alter table public.inventory_stocks
  alter column branch_id set not null;

create index if not exists inventory_stocks_branch_id_idx
  on public.inventory_stocks (branch_id);

alter table public.stock_movements
  add column if not exists branch_id uuid references public.branches(id) on delete restrict;

with main_branch as (
  select id
  from public.branches
  where code = 'MAIN'
  limit 1
)
update public.stock_movements sm
set branch_id = coalesce(
  (
    select jpu.branch_id
    from public.job_order_part_usages jpu
    where jpu.id = sm.reference_id
      and sm.reference_type = 'job_order_part_usage'
  ),
  (
    select s.branch_id
    from public.sales s
    where s.id = sm.reference_id
      and sm.reference_type = 'sale'
  ),
  (
    select s.branch_id
    from public.sale_items si
    join public.sales s on s.id = si.sale_id
    where si.id = sm.reference_id
      and sm.reference_type = 'sale_item'
  ),
  main_branch.id
)
from main_branch
where sm.branch_id is null;

alter table public.stock_movements
  alter column branch_id set not null;

create index if not exists stock_movements_branch_id_idx
  on public.stock_movements (branch_id);
create index if not exists stock_movements_branch_created_at_idx
  on public.stock_movements (branch_id, created_at desc);

alter table public.attendance
  add column if not exists branch_id uuid references public.branches(id) on delete restrict;

update public.attendance a
set branch_id = s.branch_id
from public.staff s
where a.staff_id = s.id
  and a.branch_id is null;

alter table public.attendance
  alter column branch_id set not null;

create index if not exists attendance_branch_date_idx
  on public.attendance (branch_id, attendance_date desc);

alter table public.attendance_adjustments
  add column if not exists branch_id uuid references public.branches(id) on delete restrict;

update public.attendance_adjustments aa
set branch_id = coalesce(
  (
    select a.branch_id
    from public.attendance a
    where a.id = aa.attendance_id
  ),
  (
    select s.branch_id
    from public.staff s
    where s.id = aa.staff_id
  )
)
where aa.branch_id is null;

alter table public.attendance_adjustments
  alter column branch_id set not null;

create index if not exists attendance_adjustments_branch_date_idx
  on public.attendance_adjustments (branch_id, attendance_date desc);

alter table public.attendance_time_logs
  add column if not exists branch_id uuid references public.branches(id) on delete restrict;

update public.attendance_time_logs atl
set branch_id = coalesce(
  (
    select a.branch_id
    from public.attendance a
    where a.id = atl.attendance_id
  ),
  (
    select dar.branch_id
    from public.dtr_amendment_requests dar
    where dar.id = atl.dtr_amendment_id
  ),
  (
    select s.branch_id
    from public.staff s
    where s.id = atl.staff_id
  )
)
where atl.branch_id is null;

alter table public.attendance_time_logs
  alter column branch_id set not null;

create index if not exists attendance_time_logs_branch_date_idx
  on public.attendance_time_logs (branch_id, attendance_date desc, created_at desc);

alter table public.dtr_amendment_requests
  add column if not exists branch_id uuid references public.branches(id) on delete restrict;

with main_branch as (
  select id
  from public.branches
  where code = 'MAIN'
  limit 1
)
update public.dtr_amendment_requests dar
set branch_id = coalesce(
  (
    select a.branch_id
    from public.attendance a
    where a.id = dar.attendance_id
  ),
  (
    select s.branch_id
    from public.staff s
    where s.id = dar.staff_id
  ),
  main_branch.id
)
from main_branch
where dar.branch_id is null;

alter table public.dtr_amendment_requests
  alter column branch_id set not null;

create index if not exists dtr_amendment_requests_branch_date_idx
  on public.dtr_amendment_requests (branch_id, attendance_date desc);
create index if not exists dtr_amendment_requests_branch_status_created_idx
  on public.dtr_amendment_requests (branch_id, status, created_at desc);

alter table public.payroll_periods
  add column if not exists branch_id uuid references public.branches(id) on delete restrict;

with main_branch as (
  select id
  from public.branches
  where code = 'MAIN'
  limit 1
)
update public.payroll_periods
set branch_id = main_branch.id
from main_branch
where public.payroll_periods.branch_id is null;

alter table public.payroll_periods
  alter column branch_id set not null;

create index if not exists payroll_periods_branch_status_idx
  on public.payroll_periods (branch_id, status, period_start_date desc);
create index if not exists payroll_periods_branch_period_start_idx
  on public.payroll_periods (branch_id, period_start_date desc);

alter table public.invoices
  add column if not exists branch_id uuid references public.branches(id) on delete restrict;

update public.invoices i
set branch_id = coalesce(
  (
    select jo.branch_id
    from public.job_orders jo
    where jo.id = i.job_order_id
  ),
  (
    select s.branch_id
    from public.sales s
    where s.id = i.sale_id
  )
)
where i.branch_id is null;

with main_branch as (
  select id
  from public.branches
  where code = 'MAIN'
  limit 1
)
update public.invoices i
set branch_id = main_branch.id
from main_branch
where i.branch_id is null;

alter table public.invoices
  alter column branch_id set not null;

create index if not exists invoices_branch_id_idx on public.invoices (branch_id);
create index if not exists invoices_branch_status_idx on public.invoices (branch_id, status);
create index if not exists invoices_branch_invoice_date_idx
  on public.invoices (branch_id, invoice_date desc);

alter table public.payments
  add column if not exists branch_id uuid references public.branches(id) on delete restrict;

update public.payments p
set branch_id = i.branch_id
from public.invoices i
where p.invoice_id = i.id
  and p.branch_id is null;

alter table public.payments
  alter column branch_id set not null;

create index if not exists payments_branch_id_idx on public.payments (branch_id);
create index if not exists payments_branch_paid_at_idx on public.payments (branch_id, paid_at desc);

create or replace function public.ensure_vehicle_branch_matches_customer()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_customer_branch_id uuid;
begin
  select branch_id
  into v_customer_branch_id
  from public.customers
  where id = new.customer_id;

  if not found then
    raise exception 'Selected customer does not exist.';
  end if;

  if new.branch_id is null then
    new.branch_id := v_customer_branch_id;
  elsif new.branch_id <> v_customer_branch_id then
    raise exception 'Vehicle branch must match the selected customer branch.';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_vehicle_branch_matches_customer on public.vehicles;
create trigger ensure_vehicle_branch_matches_customer
before insert or update on public.vehicles
for each row
execute function public.ensure_vehicle_branch_matches_customer();

create or replace function public.ensure_attendance_branch_id()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_staff_branch_id uuid;
begin
  select branch_id
  into v_staff_branch_id
  from public.staff
  where id = new.staff_id;

  if not found then
    raise exception 'Selected staff record does not exist.';
  end if;

  if new.branch_id is null then
    new.branch_id := v_staff_branch_id;
  elsif new.branch_id <> v_staff_branch_id then
    raise exception 'Attendance branch must match the selected staff branch.';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_attendance_branch_id on public.attendance;
create trigger ensure_attendance_branch_id
before insert or update on public.attendance
for each row
execute function public.ensure_attendance_branch_id();

create or replace function public.ensure_attendance_adjustment_branch_id()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_branch_id uuid;
begin
  select a.branch_id
  into v_branch_id
  from public.attendance a
  where a.id = new.attendance_id;

  if v_branch_id is null then
    select s.branch_id
    into v_branch_id
    from public.staff s
    where s.id = new.staff_id;
  end if;

  if v_branch_id is null then
    raise exception 'Unable to resolve attendance adjustment branch.';
  end if;

  if new.branch_id is null then
    new.branch_id := v_branch_id;
  elsif new.branch_id <> v_branch_id then
    raise exception 'Attendance adjustment branch does not match the source attendance branch.';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_attendance_adjustment_branch_id on public.attendance_adjustments;
create trigger ensure_attendance_adjustment_branch_id
before insert or update on public.attendance_adjustments
for each row
execute function public.ensure_attendance_adjustment_branch_id();

create or replace function public.ensure_attendance_time_log_branch_id()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_branch_id uuid;
begin
  select a.branch_id
  into v_branch_id
  from public.attendance a
  where a.id = new.attendance_id;

  if v_branch_id is null and new.dtr_amendment_id is not null then
    select dar.branch_id
    into v_branch_id
    from public.dtr_amendment_requests dar
    where dar.id = new.dtr_amendment_id;
  end if;

  if v_branch_id is null then
    select s.branch_id
    into v_branch_id
    from public.staff s
    where s.id = new.staff_id;
  end if;

  if v_branch_id is null then
    raise exception 'Unable to resolve attendance log branch.';
  end if;

  if new.branch_id is null then
    new.branch_id := v_branch_id;
  elsif new.branch_id <> v_branch_id then
    raise exception 'Attendance log branch does not match the related attendance branch.';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_attendance_time_log_branch_id on public.attendance_time_logs;
create trigger ensure_attendance_time_log_branch_id
before insert or update on public.attendance_time_logs
for each row
execute function public.ensure_attendance_time_log_branch_id();

create or replace function public.ensure_invoice_branch_id()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_source_branch_id uuid;
begin
  if new.job_order_id is not null then
    select branch_id
    into v_source_branch_id
    from public.job_orders
    where id = new.job_order_id;
  elsif new.sale_id is not null then
    select branch_id
    into v_source_branch_id
    from public.sales
    where id = new.sale_id;
  end if;

  if v_source_branch_id is null then
    raise exception 'Invoice branch cannot be resolved from the billing source.';
  end if;

  if new.branch_id is null then
    new.branch_id := v_source_branch_id;
  elsif new.branch_id <> v_source_branch_id then
    raise exception 'Invoice branch must match the billing source branch.';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_invoice_branch_id on public.invoices;
create trigger ensure_invoice_branch_id
before insert or update on public.invoices
for each row
execute function public.ensure_invoice_branch_id();

create or replace function public.ensure_payment_branch_id()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_invoice_branch_id uuid;
begin
  select branch_id
  into v_invoice_branch_id
  from public.invoices
  where id = new.invoice_id;

  if not found then
    raise exception 'Referenced invoice does not exist.';
  end if;

  if new.branch_id is null then
    new.branch_id := v_invoice_branch_id;
  elsif new.branch_id <> v_invoice_branch_id then
    raise exception 'Payment branch must match the invoice branch.';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_payment_branch_id on public.payments;
create trigger ensure_payment_branch_id
before insert or update on public.payments
for each row
execute function public.ensure_payment_branch_id();

create or replace function public.ensure_quotation_branch_consistency()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_customer_branch_id uuid;
  v_vehicle_customer_id uuid;
  v_vehicle_branch_id uuid;
begin
  select branch_id
  into v_customer_branch_id
  from public.customers
  where id = new.customer_id;

  if not found then
    raise exception 'Selected customer does not exist.';
  end if;

  select customer_id, branch_id
  into v_vehicle_customer_id, v_vehicle_branch_id
  from public.vehicles
  where id = new.vehicle_id;

  if not found then
    raise exception 'Selected vehicle does not exist.';
  end if;

  if v_vehicle_customer_id <> new.customer_id then
    raise exception 'Quotation vehicle must belong to the selected customer.';
  end if;

  if v_vehicle_branch_id <> v_customer_branch_id then
    raise exception 'Quotation vehicle branch must match the selected customer branch.';
  end if;

  if tg_op = 'UPDATE' and old.branch_id <> new.branch_id then
    raise exception 'Quotation branch cannot be changed after creation.';
  end if;

  if new.branch_id is null then
    new.branch_id := v_customer_branch_id;
  elsif new.branch_id <> v_customer_branch_id then
    raise exception 'Quotation branch must match the selected customer branch.';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_quotation_branch_consistency on public.quotations;
create trigger ensure_quotation_branch_consistency
before insert or update on public.quotations
for each row
execute function public.ensure_quotation_branch_consistency();

create or replace function public.ensure_job_order_branch_consistency()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_customer_branch_id uuid;
  v_vehicle_customer_id uuid;
  v_vehicle_branch_id uuid;
  v_quotation_branch_id uuid;
  v_quotation_customer_id uuid;
  v_quotation_vehicle_id uuid;
  v_expected_branch_id uuid;
begin
  select branch_id
  into v_customer_branch_id
  from public.customers
  where id = new.customer_id;

  if not found then
    raise exception 'Selected customer does not exist.';
  end if;

  select customer_id, branch_id
  into v_vehicle_customer_id, v_vehicle_branch_id
  from public.vehicles
  where id = new.vehicle_id;

  if not found then
    raise exception 'Selected vehicle does not exist.';
  end if;

  if v_vehicle_customer_id <> new.customer_id then
    raise exception 'Job order vehicle must belong to the selected customer.';
  end if;

  if new.quotation_id is not null then
    select branch_id, customer_id, vehicle_id
    into v_quotation_branch_id, v_quotation_customer_id, v_quotation_vehicle_id
    from public.quotations
    where id = new.quotation_id;

    if not found then
      raise exception 'Selected quotation does not exist.';
    end if;

    if v_quotation_customer_id <> new.customer_id or v_quotation_vehicle_id <> new.vehicle_id then
      raise exception 'Job order quotation must match the selected customer and vehicle.';
    end if;
  end if;

  v_expected_branch_id := coalesce(v_quotation_branch_id, v_customer_branch_id, v_vehicle_branch_id);

  if v_expected_branch_id is null or v_vehicle_branch_id <> v_expected_branch_id then
    raise exception 'Job order branch must match the related quotation, customer, and vehicle branch.';
  end if;

  if tg_op = 'UPDATE' and old.branch_id <> new.branch_id then
    raise exception 'Job order branch cannot be changed after creation.';
  end if;

  if new.branch_id is null then
    new.branch_id := v_expected_branch_id;
  elsif new.branch_id <> v_expected_branch_id then
    raise exception 'Job order branch must match the related quotation, customer, and vehicle branch.';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_job_order_branch_consistency on public.job_orders;
create trigger ensure_job_order_branch_consistency
before insert or update on public.job_orders
for each row
execute function public.ensure_job_order_branch_consistency();

create or replace function public.ensure_job_order_mechanic_branch_consistency()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_job_order_branch_id uuid;
  v_staff_branch_id uuid;
begin
  select branch_id
  into v_job_order_branch_id
  from public.job_orders
  where id = new.job_order_id;

  if not found then
    raise exception 'Selected job order does not exist.';
  end if;

  select branch_id
  into v_staff_branch_id
  from public.staff
  where id = new.staff_id;

  if not found then
    raise exception 'Selected staff record does not exist.';
  end if;

  if v_job_order_branch_id <> v_staff_branch_id then
    raise exception 'Assigned mechanic must belong to the same branch as the job order.';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_job_order_mechanic_branch_consistency on public.job_order_mechanics;
create trigger ensure_job_order_mechanic_branch_consistency
before insert or update on public.job_order_mechanics
for each row
execute function public.ensure_job_order_mechanic_branch_consistency();

create or replace function public.ensure_sale_branch_consistency()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_customer_branch_id uuid;
begin
  if tg_op = 'UPDATE' and old.branch_id <> new.branch_id then
    raise exception 'Sale branch cannot be changed after creation.';
  end if;

  if new.customer_id is null then
    return new;
  end if;

  select branch_id
  into v_customer_branch_id
  from public.customers
  where id = new.customer_id;

  if not found then
    raise exception 'Selected customer does not exist.';
  end if;

  if new.branch_id is null then
    new.branch_id := v_customer_branch_id;
  elsif new.branch_id <> v_customer_branch_id then
    raise exception 'Sale branch must match the selected customer branch.';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_sale_branch_consistency on public.sales;
create trigger ensure_sale_branch_consistency
before insert or update on public.sales
for each row
execute function public.ensure_sale_branch_consistency();

create or replace function public.current_staff_branch_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select s.branch_id
  from public.staff s
  where s.linked_user_id = auth.uid()
    and s.status = 'active'
  limit 1;
$$;

create or replace function public.has_global_branch_access()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.staff s
    where s.linked_user_id = auth.uid()
      and s.status = 'active'
      and s.role = 'owner'
  );
$$;

create or replace function public.can_access_branch(p_branch_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    p_branch_id is not null
    and (
      public.has_global_branch_access()
      or p_branch_id = public.current_staff_branch_id()
    );
$$;

create or replace function public.can_access_optional_branch(p_branch_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select p_branch_id is null or public.can_access_branch(p_branch_id);
$$;

create or replace function public.can_access_staff_member(p_staff_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.staff s
    where s.id = p_staff_id
      and public.can_access_branch(s.branch_id)
  );
$$;

create or replace function public.can_access_job_order(p_job_order_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.job_orders jo
    where jo.id = p_job_order_id
      and (
        (
          public.has_any_staff_role(
            array['owner', 'admin', 'service_advisor', 'cashier']::public.staff_role[]
          )
          and public.can_access_branch(jo.branch_id)
        )
        or (
          public.has_any_staff_role(array['mechanic']::public.staff_role[])
          and public.can_access_branch(jo.branch_id)
          and exists (
            select 1
            from public.job_order_mechanics jm
            where jm.job_order_id = jo.id
              and jm.staff_id = public.current_staff_record_id()
          )
        )
      )
  );
$$;

create or replace function public.can_access_invoice(p_invoice_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.invoices i
    where i.id = p_invoice_id
      and public.can_access_branch(i.branch_id)
  );
$$;

create or replace function public.assert_branch_access(
  p_branch_id uuid,
  p_message text default 'You do not have access to this branch.'
)
returns void
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.can_access_branch(p_branch_id) then
    raise exception '%', p_message;
  end if;
end;
$$;

revoke all on function public.current_staff_branch_id() from public, anon;
revoke all on function public.has_global_branch_access() from public, anon;
revoke all on function public.can_access_branch(uuid) from public, anon;
revoke all on function public.can_access_optional_branch(uuid) from public, anon;
revoke all on function public.can_access_staff_member(uuid) from public, anon;
revoke all on function public.can_access_job_order(uuid) from public, anon;
revoke all on function public.can_access_invoice(uuid) from public, anon;
revoke all on function public.assert_branch_access(uuid, text) from public, anon, authenticated;

grant execute on function public.current_staff_branch_id() to authenticated;
grant execute on function public.has_global_branch_access() to authenticated;
grant execute on function public.can_access_branch(uuid) to authenticated;
grant execute on function public.can_access_optional_branch(uuid) to authenticated;
grant execute on function public.can_access_staff_member(uuid) to authenticated;
grant execute on function public.can_access_job_order(uuid) to authenticated;
grant execute on function public.can_access_invoice(uuid) to authenticated;
grant execute on function public.assert_branch_access(uuid, text) to authenticated;

update public.products
set branch_id = null
where branch_id is not null;

update public.services
set branch_id = null
where branch_id is not null;

create or replace function public.next_document_number(
  p_key text,
  p_branch_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sequence public.document_sequences%rowtype;
  v_branch_code text;
begin
  perform public.assert_branch_access(
    p_branch_id,
    'You do not have access to generate document numbers for this branch.'
  );

  select upper(code)
  into v_branch_code
  from public.branches
  where id = p_branch_id
    and is_active = true;

  if not found then
    raise exception 'Branch document numbering is not configured for the selected branch.';
  end if;

  insert into public.document_sequences (
    key,
    branch_id,
    prefix,
    padding,
    last_value
  )
  select
    required_sequence.key,
    p_branch_id,
    required_sequence.prefix,
    required_sequence.padding,
    0
  from (
    values
      ('quotation', 'QT-', 4),
      ('job_order', 'JO-', 4),
      ('invoice', 'INV-', 4),
      ('sale', 'POS-', 4)
  ) as required_sequence (key, prefix, padding)
  where required_sequence.key = p_key
  on conflict (key, branch_id) do nothing;

  update public.document_sequences
  set last_value = last_value + 1
  where key = p_key
    and branch_id = p_branch_id
  returning * into v_sequence;

  if not found then
    raise exception 'Document sequence "%" is not configured for the selected branch.', p_key;
  end if;

  return v_sequence.prefix || v_branch_code || '-' || lpad(v_sequence.last_value::text, v_sequence.padding, '0');
end;
$$;

create or replace function public.next_document_number(p_key text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch_id uuid;
begin
  select id
  into v_branch_id
  from public.branches
  where is_main = true
  limit 1;

  if v_branch_id is null then
    raise exception 'Main branch is not configured.';
  end if;

  return public.next_document_number(p_key, v_branch_id);
end;
$$;

do $$
begin
  if to_regprocedure('public.next_document_number(text, uuid)') is not null then
    execute 'revoke all on function public.next_document_number(text, uuid) from public, anon, authenticated';
  end if;

  if to_regprocedure('public.next_document_number(text)') is not null then
    execute 'revoke all on function public.next_document_number(text) from public, anon, authenticated';
  end if;
end;
$$;

create or replace function public.save_quotation_with_items_impl(
  p_quotation_id uuid,
  p_branch_id uuid,
  p_customer_id uuid,
  p_vehicle_id uuid,
  p_nature_of_repair text,
  p_inspection_notes text,
  p_status public.quotation_status,
  p_subtotal numeric,
  p_discount numeric,
  p_tax numeric,
  p_total_amount numeric,
  p_items jsonb,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quotation_id uuid;
  v_existing_branch_id uuid;
  v_existing_status public.quotation_status;
  v_item record;
  v_customer public.customers%rowtype;
  v_vehicle public.vehicles%rowtype;
  v_prepared_by_name text;
  v_prepared_by_title text;
begin
  if p_status not in ('draft', 'pending_approval') then
    raise exception 'Quotations can only be saved as draft or pending approval.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one quotation item is required.';
  end if;

  if p_quotation_id is not null then
    select branch_id, status
    into v_existing_branch_id, v_existing_status
    from public.quotations
    where id = p_quotation_id
    for update;

    if not found then
      raise exception 'Quotation does not exist.';
    end if;

    perform public.assert_branch_access(
      v_existing_branch_id,
      'You do not have access to edit quotations for this branch.'
    );

    if p_branch_id <> v_existing_branch_id then
      raise exception 'Quotation branch cannot be changed after creation.';
    end if;

    if v_existing_status = 'approved' then
      raise exception 'Approved quotations cannot be edited.';
    end if;
  end if;

  select *
  into v_customer
  from public.customers
  where id = p_customer_id
    and branch_id = p_branch_id;

  if not found then
    raise exception 'Selected customer does not exist in the selected branch.';
  end if;

  select *
  into v_vehicle
  from public.vehicles
  where id = p_vehicle_id
    and customer_id = p_customer_id
    and branch_id = p_branch_id;

  if not found then
    raise exception 'Selected vehicle does not belong to the selected customer branch.';
  end if;

  if p_created_by is not null then
    select
      nullif(trim(concat_ws(' ', s.first_name, s.last_name)), ''),
      initcap(replace(s.role::text, '_', ' '))
    into
      v_prepared_by_name,
      v_prepared_by_title
    from public.staff as s
    where s.linked_user_id = p_created_by
    limit 1;
  end if;

  for v_item in
    select value, ordinality
    from jsonb_array_elements(p_items) with ordinality
  loop
    if trim(coalesce(v_item.value ->> 'description', '')) = '' then
      raise exception 'Quotation item % is missing a description.', v_item.ordinality;
    end if;

    if coalesce((v_item.value ->> 'quantity')::numeric, 0) <= 0 then
      raise exception 'Quotation item % must have quantity greater than zero.', v_item.ordinality;
    end if;

    if coalesce((v_item.value ->> 'unit_price')::numeric, -1) < 0 then
      raise exception 'Quotation item % must have unit price zero or greater.', v_item.ordinality;
    end if;

    if (v_item.value ->> 'item_type') = 'product'
      and nullif(v_item.value ->> 'product_id', '') is null then
      raise exception 'Quotation item % requires a product reference.', v_item.ordinality;
    end if;

    if (v_item.value ->> 'item_type') = 'service'
      and nullif(v_item.value ->> 'service_id', '') is null then
      raise exception 'Quotation item % requires a service reference.', v_item.ordinality;
    end if;
  end loop;

  if p_quotation_id is null then
    v_quotation_id := gen_random_uuid();

    insert into public.quotations (
      id,
      quotation_number,
      branch_id,
      customer_id,
      vehicle_id,
      nature_of_repair,
      inspection_notes,
      status,
      subtotal,
      discount,
      tax,
      total_amount,
      customer_name_snapshot,
      customer_contact_snapshot,
      customer_address_snapshot,
      vehicle_make_snapshot,
      vehicle_model_snapshot,
      vehicle_year_snapshot,
      vehicle_plate_number_snapshot,
      vehicle_vin_snapshot,
      prepared_by_name_snapshot,
      prepared_by_title_snapshot,
      created_by
    )
    values (
      v_quotation_id,
      public.next_document_number('quotation', p_branch_id),
      p_branch_id,
      p_customer_id,
      p_vehicle_id,
      nullif(trim(p_nature_of_repair), ''),
      nullif(trim(p_inspection_notes), ''),
      p_status,
      p_subtotal,
      p_discount,
      p_tax,
      p_total_amount,
      v_customer.display_name,
      v_customer.contact_number,
      v_customer.address,
      v_vehicle.make,
      v_vehicle.model,
      v_vehicle.year,
      v_vehicle.plate_number,
      v_vehicle.vin,
      v_prepared_by_name,
      v_prepared_by_title,
      p_created_by
    );
  else
    update public.quotations
    set
      customer_id = p_customer_id,
      vehicle_id = p_vehicle_id,
      nature_of_repair = nullif(trim(p_nature_of_repair), ''),
      inspection_notes = nullif(trim(p_inspection_notes), ''),
      status = p_status,
      subtotal = p_subtotal,
      discount = p_discount,
      tax = p_tax,
      total_amount = p_total_amount,
      customer_name_snapshot = v_customer.display_name,
      customer_contact_snapshot = v_customer.contact_number,
      customer_address_snapshot = v_customer.address,
      vehicle_make_snapshot = v_vehicle.make,
      vehicle_model_snapshot = v_vehicle.model,
      vehicle_year_snapshot = v_vehicle.year,
      vehicle_plate_number_snapshot = v_vehicle.plate_number,
      vehicle_vin_snapshot = v_vehicle.vin,
      prepared_by_name_snapshot = coalesce(prepared_by_name_snapshot, v_prepared_by_name),
      prepared_by_title_snapshot = coalesce(prepared_by_title_snapshot, v_prepared_by_title),
      approved_at = null,
      rejected_at = case when p_status = 'rejected' then timezone('utc', now()) else null end,
      updated_at = timezone('utc', now())
    where id = p_quotation_id;

    delete from public.quotation_items where quotation_id = p_quotation_id;

    v_quotation_id := p_quotation_id;
  end if;

  insert into public.quotation_items (
    quotation_id,
    line_number,
    item_type,
    product_id,
    service_id,
    description,
    quantity,
    unit_label_snapshot,
    unit_price,
    total
  )
  select
    v_quotation_id,
    item.ordinality::integer,
    (item.value ->> 'item_type')::public.line_item_type,
    nullif(item.value ->> 'product_id', '')::uuid,
    nullif(item.value ->> 'service_id', '')::uuid,
    item.value ->> 'description',
    (item.value ->> 'quantity')::numeric,
    case
      when (item.value ->> 'item_type') = 'product' and u.id is not null
        then concat(u.name, ' (', u.abbreviation, ')')
      else null
    end,
    (item.value ->> 'unit_price')::numeric,
    coalesce(
      (item.value ->> 'total')::numeric,
      (item.value ->> 'quantity')::numeric * (item.value ->> 'unit_price')::numeric
    )
  from jsonb_array_elements(p_items) with ordinality as item(value, ordinality)
  left join public.products as p on nullif(item.value ->> 'product_id', '')::uuid = p.id
  left join public.units as u on p.unit_id = u.id;

  return v_quotation_id;
end;
$$;

create or replace function public.approve_quotation_to_job_order_impl(
  p_quotation_id uuid,
  p_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quotation public.quotations%rowtype;
  v_job_order_id uuid;
begin
  select *
  into v_quotation
  from public.quotations
  where id = p_quotation_id
  for update;

  if not found then
    raise exception 'Quotation does not exist.';
  end if;

  select id
  into v_job_order_id
  from public.job_orders
  where quotation_id = p_quotation_id
  limit 1;

  if v_job_order_id is not null then
    return v_job_order_id;
  end if;

  if v_quotation.status not in ('draft', 'pending_approval') then
    raise exception 'Only draft or pending approval quotations can be approved.';
  end if;

  v_job_order_id := gen_random_uuid();

  insert into public.job_orders (
    id,
    job_order_number,
    quotation_id,
    branch_id,
    customer_id,
    vehicle_id,
    status,
    inspection_notes,
    created_by
  )
  values (
    v_job_order_id,
    public.next_document_number('job_order', v_quotation.branch_id),
    v_quotation.id,
    v_quotation.branch_id,
    v_quotation.customer_id,
    v_quotation.vehicle_id,
    'pending',
    v_quotation.inspection_notes,
    p_user_id
  );

  insert into public.job_order_items (
    id,
    job_order_id,
    source_quotation_item_id,
    line_number,
    item_type,
    product_id,
    service_id,
    description,
    quantity,
    unit_price,
    total
  )
  select
    gen_random_uuid(),
    v_job_order_id,
    qi.id,
    qi.line_number,
    qi.item_type,
    qi.product_id,
    qi.service_id,
    qi.description,
    qi.quantity,
    qi.unit_price,
    qi.total
  from public.quotation_items qi
  where qi.quotation_id = p_quotation_id
  order by qi.line_number;

  update public.quotations
  set
    status = 'approved',
    approved_at = timezone('utc', now()),
    rejected_at = null,
    updated_at = timezone('utc', now())
  where id = p_quotation_id;

  return v_job_order_id;
end;
$$;

create or replace function public.create_invoice_from_job_order_impl(
  p_job_order_id uuid,
  p_invoice_date date,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_order public.job_orders%rowtype;
  v_settings public.business_settings%rowtype;
  v_invoice_id uuid;
  v_subtotal numeric(14,4);
  v_discount numeric(14,4) := 0;
  v_tax numeric(14,4);
  v_total numeric(14,4);
begin
  select *
  into v_job_order
  from public.job_orders
  where id = p_job_order_id
  for update;

  if not found then
    raise exception 'Job order does not exist.';
  end if;

  select id
  into v_invoice_id
  from public.invoices
  where job_order_id = p_job_order_id
  limit 1;

  if v_invoice_id is not null then
    return v_invoice_id;
  end if;

  if v_job_order.status <> 'ready_for_billing' then
    raise exception 'Only job orders marked ready for billing can generate an invoice.';
  end if;

  if exists (
    select 1
    from public.job_order_items
    where job_order_id = p_job_order_id
      and is_additional = true
      and approval_status = 'pending'
  ) then
    raise exception 'Pending additional items must be resolved before invoicing.';
  end if;

  select *
  into v_settings
  from public.business_settings
  where branch_id = v_job_order.branch_id;

  if not found then
    raise exception 'Business settings are not configured for this branch.';
  end if;

  select coalesce(sum(total), 0)
  into v_subtotal
  from public.job_order_items
  where job_order_id = p_job_order_id
    and approval_status in ('not_required', 'approved');

  if v_subtotal <= 0 then
    raise exception 'No billable job order items are available for invoicing.';
  end if;

  v_tax := round(greatest(v_subtotal - v_discount, 0) * (coalesce(v_settings.default_tax_rate, 0) / 100), 4);
  v_total := round(v_subtotal - v_discount + v_tax, 4);

  v_invoice_id := gen_random_uuid();

  insert into public.invoices (
    id,
    invoice_number,
    branch_id,
    job_order_id,
    customer_id,
    vehicle_id,
    invoice_date,
    subtotal,
    discount,
    tax,
    total_amount,
    paid_amount,
    balance,
    status,
    created_by
  )
  values (
    v_invoice_id,
    public.next_document_number('invoice', v_job_order.branch_id),
    v_job_order.branch_id,
    v_job_order.id,
    v_job_order.customer_id,
    v_job_order.vehicle_id,
    p_invoice_date,
    v_subtotal,
    v_discount,
    v_tax,
    v_total,
    0,
    v_total,
    'unpaid',
    p_created_by
  );

  insert into public.invoice_items (
    invoice_id,
    source_type,
    source_id,
    line_number,
    item_type,
    description,
    quantity,
    unit_price,
    total
  )
  select
    v_invoice_id,
    'job_order_item',
    joi.id,
    row_number() over (order by joi.line_number),
    joi.item_type,
    joi.description,
    joi.quantity,
    joi.unit_price,
    joi.total
  from public.job_order_items joi
  where joi.job_order_id = p_job_order_id
    and joi.approval_status in ('not_required', 'approved')
  order by joi.line_number;

  return v_invoice_id;
end;
$$;

create or replace function public.record_invoice_payment_impl(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_method public.payment_method,
  p_reference_number text default null,
  p_notes text default null,
  p_received_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.invoices%rowtype;
  v_job_order public.job_orders%rowtype;
  v_settings public.business_settings%rowtype;
  v_payment_id uuid;
  v_new_paid_amount numeric(14,4);
  v_new_balance numeric(14,4);
  v_new_status public.invoice_status;
begin
  if p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero.';
  end if;

  select *
  into v_invoice
  from public.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice does not exist.';
  end if;

  if v_invoice.status = 'cancelled' then
    raise exception 'Cancelled invoices cannot receive payments.';
  end if;

  if v_invoice.balance <= 0 then
    raise exception 'This invoice is already fully paid.';
  end if;

  if p_amount > v_invoice.balance then
    raise exception 'Payment amount cannot exceed the remaining balance.';
  end if;

  select *
  into v_settings
  from public.business_settings
  where branch_id = v_invoice.branch_id;

  if not found then
    raise exception 'Business settings are not configured for this branch.';
  end if;

  if not v_settings.allow_partial_payments and p_amount <> v_invoice.balance then
    raise exception 'Partial payments are disabled for this branch.';
  end if;

  v_payment_id := gen_random_uuid();
  v_new_paid_amount := v_invoice.paid_amount + p_amount;
  v_new_balance := v_invoice.total_amount - v_new_paid_amount;
  v_new_status := case
    when v_new_balance = 0 then 'paid'
    when v_new_paid_amount > 0 then 'partially_paid'
    else 'unpaid'
  end;

  insert into public.payments (
    id,
    branch_id,
    invoice_id,
    amount,
    payment_method,
    reference_number,
    received_by,
    notes
  )
  values (
    v_payment_id,
    v_invoice.branch_id,
    v_invoice.id,
    p_amount,
    p_payment_method,
    nullif(trim(p_reference_number), ''),
    p_received_by,
    nullif(trim(p_notes), '')
  );

  update public.invoices
  set
    paid_amount = v_new_paid_amount,
    balance = v_new_balance,
    status = v_new_status,
    updated_at = timezone('utc', now())
  where id = v_invoice.id;

  if v_invoice.job_order_id is not null and v_new_balance = 0 then
    select *
    into v_job_order
    from public.job_orders
    where id = v_invoice.job_order_id;

    update public.job_orders
    set
      status = 'paid',
      updated_at = timezone('utc', now())
    where id = v_invoice.job_order_id
      and status in ('ready_for_billing', 'completed');
  end if;

  return v_payment_id;
end;
$$;

create or replace function public.complete_pos_sale_impl(
  p_branch_id uuid,
  p_items jsonb,
  p_customer_id uuid default null,
  p_discount numeric default 0,
  p_payment_amount numeric default 0,
  p_payment_method public.payment_method default 'cash',
  p_reference_number text default null,
  p_notes text default null,
  p_cashier_user_id uuid default null,
  p_invoice_date date default current_date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.business_settings%rowtype;
  v_sale_id uuid := gen_random_uuid();
  v_invoice_id uuid := gen_random_uuid();
  v_sale_number text;
  v_invoice_number text;
  v_item jsonb;
  v_line_number integer := 0;
  v_product public.products%rowtype;
  v_stock public.inventory_stocks%rowtype;
  v_sale_item_id uuid;
  v_quantity numeric(14,4);
  v_line_total numeric(14,4);
  v_subtotal numeric(14,4) := 0;
  v_discount numeric(14,4);
  v_tax numeric(14,4);
  v_total numeric(14,4);
  v_new_quantity numeric(14,4);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'A POS sale must include at least one product.';
  end if;

  if exists (
    select 1
    from (
      select value->>'productId' as product_id, count(*) as item_count
      from jsonb_array_elements(p_items)
      group by 1
      having count(*) > 1
    ) duplicate_items
  ) then
    raise exception 'Duplicate products are not allowed in a POS sale.';
  end if;

  if p_discount < 0 then
    raise exception 'Discount cannot be negative.';
  end if;

  if p_payment_amount <= 0 then
    raise exception 'Payment amount must be greater than zero.';
  end if;

  select *
  into v_settings
  from public.business_settings
  where branch_id = p_branch_id;

  if not found then
    raise exception 'Business settings are not configured for this branch.';
  end if;

  if p_customer_id is not null then
    perform 1
    from public.customers
    where id = p_customer_id
      and branch_id = p_branch_id;

    if not found then
      raise exception 'Customer does not exist in this branch.';
    end if;
  end if;

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::numeric;

    if v_quantity <= 0 then
      raise exception 'Sale item quantities must be greater than zero.';
    end if;

    select *
    into v_product
    from public.products
    where id = (v_item->>'productId')::uuid
    for share;

    if not found then
      raise exception 'A selected product does not exist.';
    end if;

    if v_product.status <> 'active' then
      raise exception 'Inactive products cannot be sold through POS.';
    end if;

    if v_product.branch_id is not null and v_product.branch_id <> p_branch_id then
      raise exception 'A selected product is not available in this branch.';
    end if;

    select *
    into v_stock
    from public.inventory_stocks
    where branch_id = p_branch_id
      and product_id = v_product.id
    for update;

    if not found then
      raise exception 'Inventory stock is not configured for product % in this branch.', v_product.name;
    end if;

    if v_stock.available_quantity < v_quantity then
      raise exception 'Insufficient available stock for product %.', v_product.name;
    end if;

    v_line_total := round(v_quantity * v_product.selling_price, 4);
    v_subtotal := round(v_subtotal + v_line_total, 4);
  end loop;

  if p_discount > v_subtotal then
    raise exception 'Discount cannot exceed the sale subtotal.';
  end if;

  v_discount := round(p_discount, 4);
  v_tax := round(greatest(v_subtotal - v_discount, 0) * (coalesce(v_settings.default_tax_rate, 0) / 100), 4);
  v_total := round(v_subtotal - v_discount + v_tax, 4);

  if v_total <= 0 then
    raise exception 'The sale total must be greater than zero.';
  end if;

  if p_payment_amount > v_total then
    raise exception 'Payment amount cannot exceed the sale total.';
  end if;

  if not v_settings.allow_partial_payments and p_payment_amount <> v_total then
    raise exception 'This branch requires the POS payment to cover the full sale total.';
  end if;

  v_sale_number := public.next_document_number('sale', p_branch_id);
  v_invoice_number := public.next_document_number('invoice', p_branch_id);

  insert into public.sales (
    id,
    sale_number,
    branch_id,
    customer_id,
    cashier_user_id,
    subtotal,
    discount,
    tax,
    total_amount,
    status
  )
  values (
    v_sale_id,
    v_sale_number,
    p_branch_id,
    p_customer_id,
    p_cashier_user_id,
    v_subtotal,
    v_discount,
    v_tax,
    v_total,
    'completed'
  );

  insert into public.invoices (
    id,
    invoice_number,
    branch_id,
    sale_id,
    customer_id,
    invoice_date,
    subtotal,
    discount,
    tax,
    total_amount,
    paid_amount,
    balance,
    status,
    created_by
  )
  values (
    v_invoice_id,
    v_invoice_number,
    p_branch_id,
    v_sale_id,
    p_customer_id,
    p_invoice_date,
    v_subtotal,
    v_discount,
    v_tax,
    v_total,
    0,
    v_total,
    'unpaid',
    p_cashier_user_id
  );

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    v_line_number := v_line_number + 1;
    v_quantity := (v_item->>'quantity')::numeric;

    select *
    into v_product
    from public.products
    where id = (v_item->>'productId')::uuid;

    select *
    into v_stock
    from public.inventory_stocks
    where branch_id = p_branch_id
      and product_id = v_product.id
    for update;

    v_line_total := round(v_quantity * v_product.selling_price, 4);
    v_sale_item_id := gen_random_uuid();
    v_new_quantity := v_stock.quantity_on_hand - v_quantity;

    insert into public.sale_items (
      id,
      sale_id,
      line_number,
      product_id,
      description,
      quantity,
      unit_price,
      total
    )
    values (
      v_sale_item_id,
      v_sale_id,
      v_line_number,
      v_product.id,
      v_product.name,
      v_quantity,
      v_product.selling_price,
      v_line_total
    );

    insert into public.invoice_items (
      invoice_id,
      source_type,
      source_id,
      line_number,
      item_type,
      description,
      quantity,
      unit_price,
      total
    )
    values (
      v_invoice_id,
      'sale_item',
      v_sale_item_id,
      v_line_number,
      'product',
      v_product.name,
      v_quantity,
      v_product.selling_price,
      v_line_total
    );

    insert into public.stock_movements (
      id,
      branch_id,
      product_id,
      movement_type,
      quantity,
      previous_quantity,
      new_quantity,
      reference_type,
      reference_id,
      notes,
      created_by
    )
    values (
      gen_random_uuid(),
      p_branch_id,
      v_product.id,
      'sale',
      v_quantity,
      v_stock.quantity_on_hand,
      v_new_quantity,
      'sale_item',
      v_sale_item_id,
      nullif(trim(p_notes), ''),
      p_cashier_user_id
    );

    update public.inventory_stocks
    set quantity_on_hand = v_new_quantity
    where id = v_stock.id;
  end loop;

  perform public.record_invoice_payment(
    v_invoice_id,
    p_payment_amount,
    p_payment_method,
    p_reference_number,
    p_notes,
    p_cashier_user_id
  );

  update public.invoices
  set
    invoice_date = p_invoice_date,
    updated_at = timezone('utc', now())
  where id = v_invoice_id;

  return v_sale_id;
end;
$$;

create or replace function public.save_quotation_with_items(
  p_quotation_id uuid,
  p_branch_id uuid,
  p_customer_id uuid,
  p_vehicle_id uuid,
  p_nature_of_repair text,
  p_inspection_notes text,
  p_status public.quotation_status,
  p_subtotal numeric,
  p_discount numeric,
  p_tax numeric,
  p_total_amount numeric,
  p_items jsonb,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid := auth.uid();
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[],
    'Only service-administration roles can save quotations.'
  );

  perform public.assert_branch_access(
    p_branch_id,
    'You do not have access to save quotations for this branch.'
  );

  return public.save_quotation_with_items_impl(
    p_quotation_id,
    p_branch_id,
    p_customer_id,
    p_vehicle_id,
    p_nature_of_repair,
    p_inspection_notes,
    p_status,
    p_subtotal,
    p_discount,
    p_tax,
    p_total_amount,
    p_items,
    v_actor_user_id
  );
end;
$$;

create or replace function public.approve_quotation_to_job_order(
  p_quotation_id uuid,
  p_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_branch_id uuid;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[],
    'Only service-administration roles can approve quotations.'
  );

  select branch_id
  into v_branch_id
  from public.quotations
  where id = p_quotation_id;

  if v_branch_id is null then
    raise exception 'Quotation does not exist.';
  end if;

  perform public.assert_branch_access(
    v_branch_id,
    'You do not have access to approve quotations for this branch.'
  );

  return public.approve_quotation_to_job_order_impl(p_quotation_id, v_actor_user_id);
end;
$$;

create or replace function public.save_job_order_details(
  p_job_order_id uuid,
  p_mileage_in numeric default null,
  p_mileage_out numeric default null,
  p_customer_concern text default null,
  p_inspection_notes text default null,
  p_diagnosis text default null,
  p_work_performed text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[],
    'Only operational roles can update job order details.'
  );

  if not public.can_access_job_order(p_job_order_id) then
    raise exception 'You do not have access to update this job order.';
  end if;

  return public.save_job_order_details_impl(
    p_job_order_id,
    p_mileage_in,
    p_mileage_out,
    p_customer_concern,
    p_inspection_notes,
    p_diagnosis,
    p_work_performed
  );
end;
$$;

create or replace function public.assign_job_order_mechanic(
  p_job_order_id uuid,
  p_staff_id uuid,
  p_task_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_order_branch_id uuid;
  v_staff_branch_id uuid;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[],
    'Only operational roles can manage mechanic assignments.'
  );

  select branch_id
  into v_job_order_branch_id
  from public.job_orders
  where id = p_job_order_id;

  if v_job_order_branch_id is null then
    raise exception 'Job order does not exist.';
  end if;

  if not public.can_access_job_order(p_job_order_id) then
    raise exception 'You do not have access to manage assignments for this job order.';
  end if;

  select branch_id
  into v_staff_branch_id
  from public.staff
  where id = p_staff_id
    and role = 'mechanic'
    and status = 'active';

  if v_staff_branch_id is null then
    raise exception 'Selected staff record is not an active mechanic.';
  end if;

  if v_staff_branch_id <> v_job_order_branch_id then
    raise exception 'Assigned mechanic must belong to the same branch as the job order.';
  end if;

  return public.assign_job_order_mechanic_impl(
    p_job_order_id,
    p_staff_id,
    p_task_description
  );
end;
$$;

create or replace function public.remove_job_order_mechanic(
  p_assignment_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_order_id uuid;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[],
    'Only operational roles can manage mechanic assignments.'
  );

  select job_order_id
  into v_job_order_id
  from public.job_order_mechanics
  where id = p_assignment_id;

  if v_job_order_id is null then
    raise exception 'Mechanic assignment does not exist.';
  end if;

  if not public.can_access_job_order(v_job_order_id) then
    raise exception 'You do not have access to manage assignments for this job order.';
  end if;

  return public.remove_job_order_mechanic_impl(p_assignment_id);
end;
$$;

create or replace function public.update_job_order_status(
  p_job_order_id uuid,
  p_next_status public.job_order_status
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[],
    'Only operational roles can change job order status.'
  );

  if not public.can_access_job_order(p_job_order_id) then
    raise exception 'You do not have access to update this job order.';
  end if;

  return public.update_job_order_status_impl(p_job_order_id, p_next_status);
end;
$$;

create or replace function public.add_job_order_item(
  p_job_order_id uuid,
  p_item_type public.line_item_type,
  p_product_id uuid default null,
  p_service_id uuid default null,
  p_description text default null,
  p_quantity numeric default 0,
  p_unit_price numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[],
    'Only operational roles can add job order items.'
  );

  if not public.can_access_job_order(p_job_order_id) then
    raise exception 'You do not have access to update this job order.';
  end if;

  return public.add_job_order_item_impl(
    p_job_order_id,
    p_item_type,
    p_product_id,
    p_service_id,
    p_description,
    p_quantity,
    p_unit_price
  );
end;
$$;

create or replace function public.update_job_order_item(
  p_job_order_item_id uuid,
  p_description text,
  p_quantity numeric,
  p_unit_price numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.job_order_items%rowtype;
  v_job_order public.job_orders%rowtype;
  v_job_order_id uuid;
  v_total_used numeric(14,4);
  v_total_returned numeric(14,4);
  v_net_used numeric(14,4);
  v_next_approval_status public.approval_status;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[],
    'Only operational roles can update job order items.'
  );

  select *
  into v_item
  from public.job_order_items
  where id = p_job_order_item_id
  for update;

  if not found then
    raise exception 'Job order item does not exist.';
  end if;

  v_job_order_id := v_item.job_order_id;

  if not public.can_access_job_order(v_job_order_id) then
    raise exception 'You do not have access to update this job order item.';
  end if;

  select *
  into v_job_order
  from public.job_orders
  where id = v_item.job_order_id
  for update;

  if not found then
    raise exception 'Job order does not exist.';
  end if;

  if v_job_order.status in ('completed', 'ready_for_billing', 'paid', 'released', 'cancelled') then
    raise exception 'Work items cannot be edited at this job order status.';
  end if;

  if nullif(trim(p_description), '') is null then
    raise exception 'Work item description is required.';
  end if;

  if p_quantity <= 0 then
    raise exception 'Work item quantity must be greater than zero.';
  end if;

  if p_unit_price < 0 then
    raise exception 'Work item unit price must be zero or greater.';
  end if;

  if v_item.item_type = 'product' and v_item.product_id is not null then
    select
      coalesce(sum(case when usage_type = 'use' then quantity else 0 end), 0),
      coalesce(sum(case when usage_type = 'return' then quantity else 0 end), 0)
    into v_total_used, v_total_returned
    from public.job_order_part_usages
    where job_order_item_id = p_job_order_item_id;

    v_net_used := v_total_used - v_total_returned;

    if p_quantity < v_net_used then
      raise exception 'Work item quantity cannot be less than the quantity already used.';
    end if;
  end if;

  v_next_approval_status := case
    when v_item.is_additional and v_item.approval_status <> 'not_required'
      then 'pending'::public.approval_status
    else 'not_required'::public.approval_status
  end;

  update public.job_order_items
  set
    description = nullif(trim(p_description), ''),
    quantity = p_quantity,
    unit_price = p_unit_price,
    total = round(p_quantity * p_unit_price, 4),
    approval_status = v_next_approval_status,
    approved_at = null,
    rejected_at = null,
    updated_at = timezone('utc', now())
  where id = p_job_order_item_id;

  if v_item.is_additional
    and v_next_approval_status = 'pending'
    and v_job_order.status in ('in_progress', 'waiting_for_parts') then
    update public.job_orders
    set
      status = 'waiting_for_customer_approval',
      updated_at = timezone('utc', now())
    where id = v_job_order.id;
  end if;

  return p_job_order_item_id;
end;
$$;

create or replace function public.set_job_order_item_approval(
  p_job_order_item_id uuid,
  p_approval_status public.approval_status
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_order_id uuid;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[],
    'Only operational roles can update job order approvals.'
  );

  select job_order_id
  into v_job_order_id
  from public.job_order_items
  where id = p_job_order_item_id;

  if v_job_order_id is null then
    raise exception 'Job order item does not exist.';
  end if;

  if not public.can_access_job_order(v_job_order_id) then
    raise exception 'You do not have access to update this job order item.';
  end if;

  return public.set_job_order_item_approval_impl(
    p_job_order_item_id,
    p_approval_status
  );
end;
$$;

create or replace function public.record_job_order_part_usage(
  p_job_order_item_id uuid,
  p_quantity numeric,
  p_notes text default null,
  p_performed_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_order_id uuid;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[],
    'Only operational roles can record job order part usage.'
  );

  select job_order_id
  into v_job_order_id
  from public.job_order_items
  where id = p_job_order_item_id;

  if v_job_order_id is null then
    raise exception 'Job order item does not exist.';
  end if;

  if not public.can_access_job_order(v_job_order_id) then
    raise exception 'You do not have access to update this job order item.';
  end if;

  return public.record_job_order_part_usage_impl(
    p_job_order_item_id,
    p_quantity,
    p_notes,
    auth.uid()
  );
end;
$$;

create or replace function public.record_job_order_part_return(
  p_job_order_item_id uuid,
  p_quantity numeric,
  p_notes text default null,
  p_performed_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_order_id uuid;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[],
    'Only operational roles can record job order part returns.'
  );

  select job_order_id
  into v_job_order_id
  from public.job_order_items
  where id = p_job_order_item_id;

  if v_job_order_id is null then
    raise exception 'Job order item does not exist.';
  end if;

  if not public.can_access_job_order(v_job_order_id) then
    raise exception 'You do not have access to update this job order item.';
  end if;

  return public.record_job_order_part_return_impl(
    p_job_order_item_id,
    p_quantity,
    p_notes,
    auth.uid()
  );
end;
$$;

create or replace function public.create_invoice_from_job_order(
  p_job_order_id uuid,
  p_invoice_date date,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_branch_id uuid;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[],
    'Only service-administration roles can create invoices from job orders.'
  );

  select branch_id
  into v_branch_id
  from public.job_orders
  where id = p_job_order_id;

  if v_branch_id is null then
    raise exception 'Job order does not exist.';
  end if;

  perform public.assert_branch_access(
    v_branch_id,
    'You do not have access to create invoices for this branch.'
  );

  return public.create_invoice_from_job_order_impl(
    p_job_order_id,
    p_invoice_date,
    v_actor_user_id
  );
end;
$$;

create or replace function public.record_invoice_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_method public.payment_method,
  p_reference_number text default null,
  p_notes text default null,
  p_received_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_branch_id uuid;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'cashier']::public.staff_role[],
    'Only billing roles can record payments.'
  );

  select branch_id
  into v_branch_id
  from public.invoices
  where id = p_invoice_id;

  if v_branch_id is null then
    raise exception 'Invoice does not exist.';
  end if;

  perform public.assert_branch_access(
    v_branch_id,
    'You do not have access to record payments for this branch.'
  );

  return public.record_invoice_payment_impl(
    p_invoice_id,
    p_amount,
    p_payment_method,
    p_reference_number,
    p_notes,
    v_actor_user_id
  );
end;
$$;

create or replace function public.release_job_order_vehicle(
  p_job_order_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch_id uuid;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[],
    'Only service-administration roles can release vehicles.'
  );

  select branch_id
  into v_branch_id
  from public.job_orders
  where id = p_job_order_id;

  if v_branch_id is null then
    raise exception 'Job order does not exist.';
  end if;

  perform public.assert_branch_access(
    v_branch_id,
    'You do not have access to release vehicles for this branch.'
  );

  return public.release_job_order_vehicle_impl(p_job_order_id);
end;
$$;

create or replace function public.complete_pos_sale(
  p_branch_id uuid,
  p_items jsonb,
  p_customer_id uuid default null,
  p_discount numeric default 0,
  p_payment_amount numeric default 0,
  p_payment_method public.payment_method default 'cash',
  p_reference_number text default null,
  p_notes text default null,
  p_cashier_user_id uuid default null,
  p_invoice_date date default current_date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'cashier']::public.staff_role[],
    'Only POS roles can complete direct sales.'
  );

  perform public.assert_branch_access(
    p_branch_id,
    'You do not have access to complete POS sales for this branch.'
  );

  return public.complete_pos_sale_impl(
    p_branch_id,
    p_items,
    p_customer_id,
    p_discount,
    p_payment_amount,
    p_payment_method,
    p_reference_number,
    p_notes,
    auth.uid(),
    p_invoice_date
  );
end;
$$;

create or replace function public.receive_inventory_stock(
  p_branch_id uuid,
  p_product_id uuid,
  p_quantity numeric,
  p_notes text default null,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'inventory_staff']::public.staff_role[],
    'Only inventory roles can receive stock.'
  );

  perform public.assert_branch_access(
    p_branch_id,
    'You do not have access to receive stock for this branch.'
  );

  return public.receive_inventory_stock_impl(
    p_branch_id,
    p_product_id,
    p_quantity,
    p_notes,
    auth.uid()
  );
end;
$$;

create or replace function public.reconcile_inventory_stock(
  p_branch_id uuid,
  p_product_id uuid,
  p_counted_quantity numeric,
  p_notes text default null,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'inventory_staff']::public.staff_role[],
    'Only inventory roles can reconcile stock.'
  );

  perform public.assert_branch_access(
    p_branch_id,
    'You do not have access to reconcile stock for this branch.'
  );

  return public.reconcile_inventory_stock_impl(
    p_branch_id,
    p_product_id,
    p_counted_quantity,
    p_notes,
    auth.uid()
  );
end;
$$;

create or replace function public.mark_inventory_stock_damaged(
  p_branch_id uuid,
  p_product_id uuid,
  p_quantity numeric,
  p_notes text default null,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'inventory_staff']::public.staff_role[],
    'Only inventory roles can record damaged stock.'
  );

  perform public.assert_branch_access(
    p_branch_id,
    'You do not have access to record damaged stock for this branch.'
  );

  return public.mark_inventory_stock_damaged_impl(
    p_branch_id,
    p_product_id,
    p_quantity,
    p_notes,
    auth.uid()
  );
end;
$$;

create or replace function public.update_inventory_stock_settings(
  p_branch_id uuid,
  p_product_id uuid,
  p_reorder_level numeric default null,
  p_shelf_location text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'inventory_staff']::public.staff_role[],
    'Only inventory roles can change inventory settings.'
  );

  perform public.assert_branch_access(
    p_branch_id,
    'You do not have access to update inventory settings for this branch.'
  );

  return public.update_inventory_stock_settings_impl(
    p_branch_id,
    p_product_id,
    p_reorder_level,
    p_shelf_location
  );
end;
$$;

drop policy if exists branches_select_active_staff on public.branches;
create policy branches_select_active_staff
on public.branches
for select
to authenticated
using (
  public.is_active_staff()
  and (
    public.has_global_branch_access()
    or id = public.current_staff_branch_id()
  )
);

drop policy if exists business_settings_select_active_staff on public.business_settings;
create policy business_settings_select_active_staff
on public.business_settings
for select
to authenticated
using (
  public.is_active_staff()
  and public.can_access_branch(branch_id)
);

drop policy if exists business_settings_update_admin on public.business_settings;
create policy business_settings_update_admin
on public.business_settings
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
)
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists document_sequences_select_admin on public.document_sequences;
create policy document_sequences_select_admin
on public.document_sequences
for select
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists document_sequences_insert_admin on public.document_sequences;
create policy document_sequences_insert_admin
on public.document_sequences
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists document_sequences_update_admin on public.document_sequences;
create policy document_sequences_update_admin
on public.document_sequences
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
)
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists customers_select_active_staff on public.customers;
create policy customers_select_active_staff
on public.customers
for select
to authenticated
using (
  public.is_active_staff()
  and public.can_access_branch(branch_id)
);

drop policy if exists customers_insert_service_team on public.customers;
create policy customers_insert_service_team
on public.customers
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists customers_update_service_team on public.customers;
create policy customers_update_service_team
on public.customers
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  and public.can_access_branch(branch_id)
)
with check (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists vehicles_select_active_staff on public.vehicles;
create policy vehicles_select_active_staff
on public.vehicles
for select
to authenticated
using (
  public.is_active_staff()
  and public.can_access_branch(branch_id)
);

drop policy if exists vehicles_insert_service_team on public.vehicles;
create policy vehicles_insert_service_team
on public.vehicles
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists vehicles_update_service_team on public.vehicles;
create policy vehicles_update_service_team
on public.vehicles
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  and public.can_access_branch(branch_id)
)
with check (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists staff_select_self_or_admin on public.staff;
create policy staff_select_self_or_admin
on public.staff
for select
to authenticated
using (
  linked_user_id = auth.uid()
  or (
    public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
    and public.can_access_branch(branch_id)
  )
);

drop policy if exists staff_insert_admin on public.staff;
create policy staff_insert_admin
on public.staff
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists staff_update_admin on public.staff;
create policy staff_update_admin
on public.staff
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
)
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists attendance_select_self_or_admin on public.attendance;
create policy attendance_select_self_or_admin
on public.attendance
for select
to authenticated
using (
  staff_id = public.current_staff_record_id()
  or (
    public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
    and public.can_access_branch(branch_id)
  )
);

drop policy if exists attendance_insert_admin on public.attendance;
create policy attendance_insert_admin
on public.attendance
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists attendance_update_admin on public.attendance;
create policy attendance_update_admin
on public.attendance
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
)
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists products_select_active_staff on public.products;
create policy products_select_active_staff
on public.products
for select
to authenticated
using (
  public.is_active_staff()
  and public.can_access_optional_branch(branch_id)
);

drop policy if exists products_insert_inventory_team on public.products;
create policy products_insert_inventory_team
on public.products
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[])
  and public.can_access_optional_branch(branch_id)
);

drop policy if exists products_update_inventory_team on public.products;
create policy products_update_inventory_team
on public.products
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[])
  and public.can_access_optional_branch(branch_id)
)
with check (
  public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[])
  and public.can_access_optional_branch(branch_id)
);

drop policy if exists services_select_active_staff on public.services;
create policy services_select_active_staff
on public.services
for select
to authenticated
using (
  public.is_active_staff()
  and public.can_access_optional_branch(branch_id)
);

drop policy if exists services_insert_service_team on public.services;
create policy services_insert_service_team
on public.services
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  and public.can_access_optional_branch(branch_id)
);

drop policy if exists services_update_service_team on public.services;
create policy services_update_service_team
on public.services
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  and public.can_access_optional_branch(branch_id)
)
with check (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  and public.can_access_optional_branch(branch_id)
);

drop policy if exists inventory_stocks_select_operational_team on public.inventory_stocks;
create policy inventory_stocks_select_operational_team
on public.inventory_stocks
for select
to authenticated
using (
  public.has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic', 'cashier', 'inventory_staff']::public.staff_role[]
  )
  and public.can_access_branch(branch_id)
);

drop policy if exists stock_movements_select_operational_team on public.stock_movements;
create policy stock_movements_select_operational_team
on public.stock_movements
for select
to authenticated
using (
  public.has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic', 'inventory_staff']::public.staff_role[]
  )
  and public.can_access_branch(branch_id)
);

drop policy if exists quotations_select_service_team on public.quotations;
create policy quotations_select_service_team
on public.quotations
for select
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists quotations_update_service_team on public.quotations;
create policy quotations_update_service_team
on public.quotations
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  and public.can_access_branch(branch_id)
)
with check (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists quotation_items_select_service_team on public.quotation_items;
create policy quotation_items_select_service_team
on public.quotation_items
for select
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  and exists (
    select 1
    from public.quotations q
    where q.id = quotation_id
      and public.can_access_branch(q.branch_id)
  )
);

drop policy if exists job_orders_select_operational_team on public.job_orders;
create policy job_orders_select_operational_team
on public.job_orders
for select
to authenticated
using (
  public.can_access_job_order(id)
);

drop policy if exists job_order_mechanics_select_operational_team on public.job_order_mechanics;
create policy job_order_mechanics_select_operational_team
on public.job_order_mechanics
for select
to authenticated
using (
  (
    public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'cashier']::public.staff_role[])
    and public.can_access_job_order(job_order_id)
  )
  or (
    public.current_staff_record_id() = staff_id
    and public.can_access_job_order(job_order_id)
  )
);

drop policy if exists job_order_items_select_operational_team on public.job_order_items;
create policy job_order_items_select_operational_team
on public.job_order_items
for select
to authenticated
using (
  public.can_access_job_order(job_order_id)
);

drop policy if exists job_order_part_usages_select_operational_team on public.job_order_part_usages;
create policy job_order_part_usages_select_operational_team
on public.job_order_part_usages
for select
to authenticated
using (
  public.can_access_job_order(job_order_id)
);

drop policy if exists sales_select_billing_team on public.sales;
create policy sales_select_billing_team
on public.sales
for select
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'cashier']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists sale_items_select_billing_team on public.sale_items;
create policy sale_items_select_billing_team
on public.sale_items
for select
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'cashier']::public.staff_role[])
  and exists (
    select 1
    from public.sales s
    where s.id = sale_id
      and public.can_access_branch(s.branch_id)
  )
);

drop policy if exists invoices_select_billing_team on public.invoices;
create policy invoices_select_billing_team
on public.invoices
for select
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'cashier']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists invoice_items_select_billing_team on public.invoice_items;
create policy invoice_items_select_billing_team
on public.invoice_items
for select
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'cashier']::public.staff_role[])
  and exists (
    select 1
    from public.invoices i
    where i.id = invoice_id
      and public.can_access_branch(i.branch_id)
  )
);

drop policy if exists payments_select_billing_team on public.payments;
create policy payments_select_billing_team
on public.payments
for select
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'cashier']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists staff_schedules_select_admin_team on public.staff_schedules;
create policy staff_schedules_select_admin_team
on public.staff_schedules
for select
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_staff_member(staff_id)
);

drop policy if exists staff_schedules_insert_admin_team on public.staff_schedules;
create policy staff_schedules_insert_admin_team
on public.staff_schedules
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_staff_member(staff_id)
);

drop policy if exists staff_schedules_update_admin_team on public.staff_schedules;
create policy staff_schedules_update_admin_team
on public.staff_schedules
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_staff_member(staff_id)
)
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_staff_member(staff_id)
);

drop policy if exists attendance_adjustments_select_admin_team on public.attendance_adjustments;
create policy attendance_adjustments_select_admin_team
on public.attendance_adjustments
for select
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists attendance_adjustments_insert_admin_team on public.attendance_adjustments;
create policy attendance_adjustments_insert_admin_team
on public.attendance_adjustments
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists staff_compensation_profiles_select_admin_team on public.staff_compensation_profiles;
create policy staff_compensation_profiles_select_admin_team
on public.staff_compensation_profiles
for select
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_staff_member(staff_id)
);

drop policy if exists staff_compensation_profiles_insert_admin_team on public.staff_compensation_profiles;
create policy staff_compensation_profiles_insert_admin_team
on public.staff_compensation_profiles
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_staff_member(staff_id)
);

drop policy if exists staff_compensation_profiles_update_admin_team on public.staff_compensation_profiles;
create policy staff_compensation_profiles_update_admin_team
on public.staff_compensation_profiles
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_staff_member(staff_id)
)
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_staff_member(staff_id)
);

drop policy if exists payroll_periods_select_admin_team on public.payroll_periods;
create policy payroll_periods_select_admin_team
on public.payroll_periods
for select
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists payroll_periods_insert_admin_team on public.payroll_periods;
create policy payroll_periods_insert_admin_team
on public.payroll_periods
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists payroll_periods_update_admin_team on public.payroll_periods;
create policy payroll_periods_update_admin_team
on public.payroll_periods
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
)
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists branch_holidays_select_admin_team on public.branch_holidays;
create policy branch_holidays_select_admin_team
on public.branch_holidays
for select
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists branch_holidays_insert_admin_team on public.branch_holidays;
create policy branch_holidays_insert_admin_team
on public.branch_holidays
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists branch_holidays_update_admin_team on public.branch_holidays;
create policy branch_holidays_update_admin_team
on public.branch_holidays
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
)
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists branch_holidays_delete_admin_team on public.branch_holidays;
create policy branch_holidays_delete_admin_team
on public.branch_holidays
for delete
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists staff_leave_entries_select_admin_team on public.staff_leave_entries;
create policy staff_leave_entries_select_admin_team
on public.staff_leave_entries
for select
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists staff_leave_entries_insert_admin_team on public.staff_leave_entries;
create policy staff_leave_entries_insert_admin_team
on public.staff_leave_entries
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists staff_leave_entries_update_admin_team on public.staff_leave_entries;
create policy staff_leave_entries_update_admin_team
on public.staff_leave_entries
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
)
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists staff_leave_entries_delete_admin_team on public.staff_leave_entries;
create policy staff_leave_entries_delete_admin_team
on public.staff_leave_entries
for delete
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists attendance_allowed_ips_select_admin_team on public.attendance_allowed_ips;
create policy attendance_allowed_ips_select_admin_team
on public.attendance_allowed_ips
for select
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists attendance_allowed_ips_insert_admin_team on public.attendance_allowed_ips;
create policy attendance_allowed_ips_insert_admin_team
on public.attendance_allowed_ips
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists attendance_allowed_ips_update_admin_team on public.attendance_allowed_ips;
create policy attendance_allowed_ips_update_admin_team
on public.attendance_allowed_ips
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
)
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists attendance_allowed_ips_delete_admin_team on public.attendance_allowed_ips;
create policy attendance_allowed_ips_delete_admin_team
on public.attendance_allowed_ips
for delete
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists dtr_amendment_requests_select_self_or_admin on public.dtr_amendment_requests;
create policy dtr_amendment_requests_select_self_or_admin
on public.dtr_amendment_requests
for select
to authenticated
using (
  staff_id = public.current_staff_record_id()
  or (
    public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
    and public.can_access_branch(branch_id)
  )
);

drop policy if exists dtr_amendment_requests_insert_self on public.dtr_amendment_requests;
create policy dtr_amendment_requests_insert_self
on public.dtr_amendment_requests
for insert
to authenticated
with check (
  public.is_active_staff()
  and staff_id = public.current_staff_record_id()
  and public.can_access_branch(branch_id)
);

drop policy if exists dtr_amendment_requests_update_admin_team on public.dtr_amendment_requests;
create policy dtr_amendment_requests_update_admin_team
on public.dtr_amendment_requests
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
)
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists attendance_time_logs_select_self_or_admin on public.attendance_time_logs;
create policy attendance_time_logs_select_self_or_admin
on public.attendance_time_logs
for select
to authenticated
using (
  staff_id = public.current_staff_record_id()
  or (
    public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
    and public.can_access_branch(branch_id)
  )
);

drop policy if exists "staff_devices_select_self_or_admin" on public.staff_devices;
create policy "staff_devices_select_self_or_admin"
on public.staff_devices
for select
using (
  exists (
    select 1
    from public.staff me
    where me.linked_user_id = auth.uid()
      and me.status = 'active'
      and (
        me.id = public.staff_devices.staff_id
        or (
          me.role in ('owner', 'admin')
          and public.can_access_staff_member(public.staff_devices.staff_id)
        )
      )
  )
);

drop policy if exists "staff_devices_write_admin_only" on public.staff_devices;
create policy "staff_devices_write_admin_only"
on public.staff_devices
for all
using (
  exists (
    select 1
    from public.staff me
    where me.linked_user_id = auth.uid()
      and me.status = 'active'
      and me.role in ('owner', 'admin')
      and public.can_access_staff_member(public.staff_devices.staff_id)
  )
)
with check (
  exists (
    select 1
    from public.staff me
    where me.linked_user_id = auth.uid()
      and me.status = 'active'
      and me.role in ('owner', 'admin')
      and public.can_access_staff_member(public.staff_devices.staff_id)
  )
);
