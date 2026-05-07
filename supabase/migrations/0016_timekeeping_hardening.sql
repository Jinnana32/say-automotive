create table if not exists public.staff_schedules (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null unique references public.staff(id) on delete cascade,
  shift_start_time time not null,
  shift_end_time time not null,
  grace_minutes integer not null default 0 check (grace_minutes >= 0 and grace_minutes <= 240),
  monday_is_workday boolean not null default false,
  tuesday_is_workday boolean not null default false,
  wednesday_is_workday boolean not null default false,
  thursday_is_workday boolean not null default false,
  friday_is_workday boolean not null default false,
  saturday_is_workday boolean not null default false,
  sunday_is_workday boolean not null default false,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (shift_end_time > shift_start_time)
);

create trigger set_staff_schedules_updated_at
before update on public.staff_schedules
for each row
execute function public.set_updated_at();

alter table public.attendance
  add column if not exists approved_by_staff_id uuid references public.staff(id) on delete set null,
  add column if not exists approved_at timestamptz;

create table if not exists public.attendance_adjustments (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid not null references public.attendance(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  attendance_date date not null,
  action text not null
    check (action in ('created', 'updated', 'approved', 'unapproved')),
  previous_data jsonb,
  next_data jsonb,
  reason text,
  changed_by_staff_id uuid references public.staff(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists attendance_adjustments_attendance_created_idx
  on public.attendance_adjustments (attendance_id, created_at desc);

create index if not exists attendance_adjustments_staff_date_idx
  on public.attendance_adjustments (staff_id, attendance_date desc);

alter table public.staff_schedules enable row level security;
alter table public.attendance_adjustments enable row level security;

drop policy if exists staff_schedules_select_admin_team on public.staff_schedules;
create policy staff_schedules_select_admin_team
on public.staff_schedules
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists staff_schedules_insert_admin_team on public.staff_schedules;
create policy staff_schedules_insert_admin_team
on public.staff_schedules
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists staff_schedules_update_admin_team on public.staff_schedules;
create policy staff_schedules_update_admin_team
on public.staff_schedules
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists attendance_adjustments_select_admin_team on public.attendance_adjustments;
create policy attendance_adjustments_select_admin_team
on public.attendance_adjustments
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists attendance_adjustments_insert_admin_team on public.attendance_adjustments;
create policy attendance_adjustments_insert_admin_team
on public.attendance_adjustments
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));
