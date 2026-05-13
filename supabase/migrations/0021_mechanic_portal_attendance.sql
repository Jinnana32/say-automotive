alter table public.business_settings
  add column if not exists require_shop_ip_for_mechanic_attendance boolean not null default true,
  add column if not exists allow_dtr_amendments boolean not null default true,
  add column if not exists allow_attendance_admin_override boolean not null default true;

create table if not exists public.attendance_allowed_ips (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  ip_address inet not null,
  label text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (branch_id, ip_address)
);

create trigger set_attendance_allowed_ips_updated_at
before update on public.attendance_allowed_ips
for each row
execute function public.set_updated_at();

create index if not exists attendance_allowed_ips_branch_idx
  on public.attendance_allowed_ips (branch_id, ip_address);

create table if not exists public.dtr_amendment_requests (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  attendance_id uuid references public.attendance(id) on delete set null,
  attendance_date date not null,
  target_log_type text not null
    check (target_log_type in ('time_in', 'time_out')),
  amendment_type text not null
    check (amendment_type in ('missed_time_in', 'missed_time_out', 'wrong_time', 'shop_network_issue', 'other')),
  requested_timestamp timestamptz not null,
  reason text not null,
  proof_url text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  requested_ip inet,
  request_user_agent text,
  approved_timestamp timestamptz,
  approved_by_staff_id uuid references public.staff(id) on delete set null,
  rejected_at timestamptz,
  rejected_by_staff_id uuid references public.staff(id) on delete set null,
  final_timestamp timestamptz,
  admin_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_dtr_amendment_requests_updated_at
before update on public.dtr_amendment_requests
for each row
execute function public.set_updated_at();

create index if not exists dtr_amendment_requests_status_created_idx
  on public.dtr_amendment_requests (status, created_at desc);

create index if not exists dtr_amendment_requests_staff_date_idx
  on public.dtr_amendment_requests (staff_id, attendance_date desc);

create index if not exists dtr_amendment_requests_branch_date_idx
  on public.dtr_amendment_requests (branch_id, attendance_date desc);

create table if not exists public.attendance_time_logs (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  attendance_id uuid references public.attendance(id) on delete set null,
  dtr_amendment_id uuid references public.dtr_amendment_requests(id) on delete set null,
  attendance_date date not null,
  log_type text not null
    check (log_type in ('time_in', 'time_out')),
  logged_at timestamptz not null,
  source text not null
    check (source in ('mechanic_portal', 'admin_approved_amendment', 'admin_override')),
  request_ip inet,
  is_shop_ip_valid boolean not null default false,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists attendance_time_logs_staff_date_idx
  on public.attendance_time_logs (staff_id, attendance_date desc, created_at desc);

create index if not exists attendance_time_logs_attendance_idx
  on public.attendance_time_logs (attendance_id, created_at desc);

create index if not exists attendance_time_logs_amendment_idx
  on public.attendance_time_logs (dtr_amendment_id, created_at desc);

alter table public.attendance_allowed_ips enable row level security;
alter table public.dtr_amendment_requests enable row level security;
alter table public.attendance_time_logs enable row level security;

drop policy if exists attendance_allowed_ips_select_admin_team on public.attendance_allowed_ips;
create policy attendance_allowed_ips_select_admin_team
on public.attendance_allowed_ips
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists attendance_allowed_ips_insert_admin_team on public.attendance_allowed_ips;
create policy attendance_allowed_ips_insert_admin_team
on public.attendance_allowed_ips
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists attendance_allowed_ips_update_admin_team on public.attendance_allowed_ips;
create policy attendance_allowed_ips_update_admin_team
on public.attendance_allowed_ips
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists attendance_allowed_ips_delete_admin_team on public.attendance_allowed_ips;
create policy attendance_allowed_ips_delete_admin_team
on public.attendance_allowed_ips
for delete
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists dtr_amendment_requests_select_self_or_admin on public.dtr_amendment_requests;
create policy dtr_amendment_requests_select_self_or_admin
on public.dtr_amendment_requests
for select
to authenticated
using (
  staff_id = public.current_staff_record_id()
  or public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
);

drop policy if exists dtr_amendment_requests_insert_self on public.dtr_amendment_requests;
create policy dtr_amendment_requests_insert_self
on public.dtr_amendment_requests
for insert
to authenticated
with check (
  public.is_active_staff()
  and staff_id = public.current_staff_record_id()
);

drop policy if exists dtr_amendment_requests_update_admin_team on public.dtr_amendment_requests;
create policy dtr_amendment_requests_update_admin_team
on public.dtr_amendment_requests
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists attendance_time_logs_select_self_or_admin on public.attendance_time_logs;
create policy attendance_time_logs_select_self_or_admin
on public.attendance_time_logs
for select
to authenticated
using (
  staff_id = public.current_staff_record_id()
  or public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
);
