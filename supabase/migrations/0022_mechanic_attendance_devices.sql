create table if not exists public.staff_devices (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  device_id_hash text not null unique,
  device_name text,
  user_agent text,
  first_seen_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  last_ip text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'revoked')),
  approved_at timestamptz,
  approved_by_staff_id uuid references public.staff(id) on delete set null,
  revoked_at timestamptz,
  revoked_by_staff_id uuid references public.staff(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists staff_devices_staff_id_idx on public.staff_devices (staff_id);
create index if not exists staff_devices_status_idx on public.staff_devices (status);
create unique index if not exists staff_devices_one_approved_per_staff_idx
  on public.staff_devices (staff_id)
  where status = 'approved';

alter table public.attendance_time_logs
  add column if not exists staff_device_id uuid references public.staff_devices(id) on delete set null,
  add column if not exists is_device_approved boolean not null default false;

create index if not exists attendance_time_logs_staff_device_id_idx on public.attendance_time_logs (staff_device_id);

drop trigger if exists staff_devices_set_updated_at on public.staff_devices;
create trigger staff_devices_set_updated_at
before update on public.staff_devices
for each row execute function public.set_updated_at();

alter table public.staff_devices enable row level security;

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
        or me.role in ('owner', 'admin')
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
  )
)
with check (
  exists (
    select 1
    from public.staff me
    where me.linked_user_id = auth.uid()
      and me.status = 'active'
      and me.role in ('owner', 'admin')
  )
);
