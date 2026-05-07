create type public.pay_basis as enum ('monthly', 'daily', 'hourly');
create type public.payroll_period_status as enum ('draft', 'processing', 'finalized');

create table if not exists public.staff_compensation_profiles (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null unique references public.staff(id) on delete cascade,
  pay_basis public.pay_basis not null,
  base_rate numeric(12,2) not null check (base_rate >= 0),
  overtime_rate numeric(12,2) check (overtime_rate is null or overtime_rate >= 0),
  allowance_per_period numeric(12,2) not null default 0 check (allowance_per_period >= 0),
  effective_start_date date not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists staff_compensation_profiles_effective_date_idx
  on public.staff_compensation_profiles (effective_start_date desc);

create trigger set_staff_compensation_profiles_updated_at
before update on public.staff_compensation_profiles
for each row
execute function public.set_updated_at();

create table if not exists public.payroll_periods (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete restrict,
  label text not null,
  period_start_date date not null,
  period_end_date date not null,
  payout_date date not null,
  status public.payroll_period_status not null default 'draft',
  notes text,
  created_by_staff_id uuid references public.staff(id) on delete set null,
  finalized_by_staff_id uuid references public.staff(id) on delete set null,
  finalized_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (period_end_date >= period_start_date)
);

create unique index if not exists payroll_periods_branch_period_unique_idx
  on public.payroll_periods (branch_id, period_start_date, period_end_date);

create index if not exists payroll_periods_status_start_date_idx
  on public.payroll_periods (status, period_start_date desc);

create trigger set_payroll_periods_updated_at
before update on public.payroll_periods
for each row
execute function public.set_updated_at();

alter table public.staff_compensation_profiles enable row level security;
alter table public.payroll_periods enable row level security;

drop policy if exists staff_compensation_profiles_select_admin_team on public.staff_compensation_profiles;
create policy staff_compensation_profiles_select_admin_team
on public.staff_compensation_profiles
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists staff_compensation_profiles_insert_admin_team on public.staff_compensation_profiles;
create policy staff_compensation_profiles_insert_admin_team
on public.staff_compensation_profiles
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists staff_compensation_profiles_update_admin_team on public.staff_compensation_profiles;
create policy staff_compensation_profiles_update_admin_team
on public.staff_compensation_profiles
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists payroll_periods_select_admin_team on public.payroll_periods;
create policy payroll_periods_select_admin_team
on public.payroll_periods
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists payroll_periods_insert_admin_team on public.payroll_periods;
create policy payroll_periods_insert_admin_team
on public.payroll_periods
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists payroll_periods_update_admin_team on public.payroll_periods;
create policy payroll_periods_update_admin_team
on public.payroll_periods
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));
