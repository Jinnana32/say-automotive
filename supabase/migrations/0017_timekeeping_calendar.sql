create table if not exists public.branch_holidays (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  holiday_date date not null,
  label text not null,
  holiday_kind text not null
    check (holiday_kind in ('regular', 'special', 'branch_closure', 'other')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (branch_id, holiday_date)
);

create trigger set_branch_holidays_updated_at
before update on public.branch_holidays
for each row
execute function public.set_updated_at();

create index if not exists branch_holidays_branch_date_idx
  on public.branch_holidays (branch_id, holiday_date);

create table if not exists public.staff_leave_entries (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  leave_type text not null
    check (leave_type in ('vacation', 'sick', 'emergency', 'unpaid', 'other')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (end_date >= start_date)
);

create trigger set_staff_leave_entries_updated_at
before update on public.staff_leave_entries
for each row
execute function public.set_updated_at();

create index if not exists staff_leave_entries_branch_date_idx
  on public.staff_leave_entries (branch_id, start_date, end_date);

create index if not exists staff_leave_entries_staff_date_idx
  on public.staff_leave_entries (staff_id, start_date, end_date);

alter table public.branch_holidays enable row level security;
alter table public.staff_leave_entries enable row level security;

drop policy if exists branch_holidays_select_admin_team on public.branch_holidays;
create policy branch_holidays_select_admin_team
on public.branch_holidays
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists branch_holidays_insert_admin_team on public.branch_holidays;
create policy branch_holidays_insert_admin_team
on public.branch_holidays
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists branch_holidays_update_admin_team on public.branch_holidays;
create policy branch_holidays_update_admin_team
on public.branch_holidays
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists branch_holidays_delete_admin_team on public.branch_holidays;
create policy branch_holidays_delete_admin_team
on public.branch_holidays
for delete
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists staff_leave_entries_select_admin_team on public.staff_leave_entries;
create policy staff_leave_entries_select_admin_team
on public.staff_leave_entries
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists staff_leave_entries_insert_admin_team on public.staff_leave_entries;
create policy staff_leave_entries_insert_admin_team
on public.staff_leave_entries
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists staff_leave_entries_update_admin_team on public.staff_leave_entries;
create policy staff_leave_entries_update_admin_team
on public.staff_leave_entries
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists staff_leave_entries_delete_admin_team on public.staff_leave_entries;
create policy staff_leave_entries_delete_admin_team
on public.staff_leave_entries
for delete
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));
