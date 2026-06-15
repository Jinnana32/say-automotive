alter table public.staff
  add column if not exists is_payroll_eligible boolean not null default true;

update public.staff
set is_payroll_eligible = case
  when role in ('owner', 'admin') then false
  else true
end;

alter table public.business_settings
  add column if not exists payroll_standard_daily_hours numeric(6,2) not null default 8
    check (payroll_standard_daily_hours > 0 and payroll_standard_daily_hours <= 24),
  add column if not exists payroll_holiday_premium_rate numeric(8,4) not null default 0.30
    check (payroll_holiday_premium_rate >= 0 and payroll_holiday_premium_rate <= 10);

alter table public.payroll_periods
  add column if not exists generated_by_staff_id uuid references public.staff(id) on delete set null,
  add column if not exists generated_at timestamptz;

create table if not exists public.payroll_period_items (
  id uuid primary key default gen_random_uuid(),
  payroll_period_id uuid not null references public.payroll_periods(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  staff_id uuid not null references public.staff(id) on delete restrict,
  staff_name text not null,
  staff_role public.staff_role not null,
  pay_basis public.pay_basis,
  base_rate numeric(14,4),
  overtime_rate numeric(14,4),
  allowance_per_period numeric(14,4) not null default 0 check (allowance_per_period >= 0),
  daily_rate_used numeric(14,4) not null default 0 check (daily_rate_used >= 0),
  hourly_rate_used numeric(14,4) not null default 0 check (hourly_rate_used >= 0),
  standard_daily_hours numeric(6,2) not null default 8 check (standard_daily_hours > 0 and standard_daily_hours <= 24),
  holiday_premium_rate numeric(8,4) not null default 0.30 check (holiday_premium_rate >= 0 and holiday_premium_rate <= 10),
  scheduled_workday_count integer not null default 0 check (scheduled_workday_count >= 0),
  holiday_day_count integer not null default 0 check (holiday_day_count >= 0),
  approved_leave_day_count integer not null default 0 check (approved_leave_day_count >= 0),
  expected_workday_count integer not null default 0 check (expected_workday_count >= 0),
  missing_attendance_day_count integer not null default 0 check (missing_attendance_day_count >= 0),
  recorded_day_count integer not null default 0 check (recorded_day_count >= 0),
  present_count integer not null default 0 check (present_count >= 0),
  late_count integer not null default 0 check (late_count >= 0),
  half_day_count integer not null default 0 check (half_day_count >= 0),
  absent_count integer not null default 0 check (absent_count >= 0),
  missing_timeout_count integer not null default 0 check (missing_timeout_count >= 0),
  pending_approval_count integer not null default 0 check (pending_approval_count >= 0),
  worked_minutes integer not null default 0 check (worked_minutes >= 0),
  paid_day_units numeric(10,4) not null default 0 check (paid_day_units >= 0),
  holiday_worked_day_units numeric(10,4) not null default 0 check (holiday_worked_day_units >= 0),
  late_deduction_minutes integer not null default 0 check (late_deduction_minutes >= 0),
  overtime_minutes integer not null default 0 check (overtime_minutes >= 0),
  base_pay numeric(14,4) not null default 0,
  late_deduction_amount numeric(14,4) not null default 0,
  holiday_premium_pay numeric(14,4) not null default 0,
  overtime_pay numeric(14,4) not null default 0,
  allowance_pay numeric(14,4) not null default 0,
  computed_pay numeric(14,4) not null default 0,
  manual_additions_total numeric(14,4) not null default 0,
  manual_deductions_total numeric(14,4) not null default 0,
  gross_pay numeric(14,4) not null default 0,
  net_pay numeric(14,4) not null default 0,
  readiness_status text not null default 'ready' check (
    readiness_status in (
      'ready',
      'missing_schedule',
      'missing_compensation',
      'missing_attendance',
      'needs_dtr_completion',
      'configured_no_activity',
      'not_configured'
    )
  ),
  warning_codes text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists payroll_period_items_period_staff_unique_idx
  on public.payroll_period_items (payroll_period_id, staff_id);

create index if not exists payroll_period_items_branch_period_idx
  on public.payroll_period_items (branch_id, payroll_period_id);

create index if not exists payroll_period_items_period_net_pay_idx
  on public.payroll_period_items (payroll_period_id, net_pay desc);

create trigger set_payroll_period_items_updated_at
before update on public.payroll_period_items
for each row
execute function public.set_updated_at();

create table if not exists public.payroll_period_item_adjustments (
  id uuid primary key default gen_random_uuid(),
  payroll_period_item_id uuid not null references public.payroll_period_items(id) on delete cascade,
  adjustment_type text not null check (adjustment_type in ('addition', 'deduction')),
  label text not null,
  amount numeric(14,4) not null check (amount >= 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists payroll_period_item_adjustments_item_idx
  on public.payroll_period_item_adjustments (payroll_period_item_id, created_at asc);

create trigger set_payroll_period_item_adjustments_updated_at
before update on public.payroll_period_item_adjustments
for each row
execute function public.set_updated_at();

alter table public.payroll_period_items enable row level security;
alter table public.payroll_period_item_adjustments enable row level security;

drop policy if exists payroll_period_items_select_admin_team on public.payroll_period_items;
create policy payroll_period_items_select_admin_team
on public.payroll_period_items
for select
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists payroll_period_items_insert_admin_team on public.payroll_period_items;
create policy payroll_period_items_insert_admin_team
on public.payroll_period_items
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists payroll_period_items_update_admin_team on public.payroll_period_items;
create policy payroll_period_items_update_admin_team
on public.payroll_period_items
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

drop policy if exists payroll_period_items_delete_admin_team on public.payroll_period_items;
create policy payroll_period_items_delete_admin_team
on public.payroll_period_items
for delete
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and public.can_access_branch(branch_id)
);

drop policy if exists payroll_period_item_adjustments_select_admin_team on public.payroll_period_item_adjustments;
create policy payroll_period_item_adjustments_select_admin_team
on public.payroll_period_item_adjustments
for select
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and exists (
    select 1
    from public.payroll_period_items as item
    where item.id = payroll_period_item_adjustments.payroll_period_item_id
      and public.can_access_branch(item.branch_id)
  )
);

drop policy if exists payroll_period_item_adjustments_insert_admin_team on public.payroll_period_item_adjustments;
create policy payroll_period_item_adjustments_insert_admin_team
on public.payroll_period_item_adjustments
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and exists (
    select 1
    from public.payroll_period_items as item
    where item.id = payroll_period_item_adjustments.payroll_period_item_id
      and public.can_access_branch(item.branch_id)
  )
);

drop policy if exists payroll_period_item_adjustments_update_admin_team on public.payroll_period_item_adjustments;
create policy payroll_period_item_adjustments_update_admin_team
on public.payroll_period_item_adjustments
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and exists (
    select 1
    from public.payroll_period_items as item
    where item.id = payroll_period_item_adjustments.payroll_period_item_id
      and public.can_access_branch(item.branch_id)
  )
)
with check (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and exists (
    select 1
    from public.payroll_period_items as item
    where item.id = payroll_period_item_adjustments.payroll_period_item_id
      and public.can_access_branch(item.branch_id)
  )
);

drop policy if exists payroll_period_item_adjustments_delete_admin_team on public.payroll_period_item_adjustments;
create policy payroll_period_item_adjustments_delete_admin_team
on public.payroll_period_item_adjustments
for delete
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  and exists (
    select 1
    from public.payroll_period_items as item
    where item.id = payroll_period_item_adjustments.payroll_period_item_id
      and public.can_access_branch(item.branch_id)
  )
);
