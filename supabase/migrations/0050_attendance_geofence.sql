alter table public.business_settings
  add column if not exists require_shop_location_for_mechanic_attendance boolean not null default false,
  add column if not exists attendance_geofence_latitude double precision,
  add column if not exists attendance_geofence_longitude double precision,
  add column if not exists attendance_geofence_radius_meters integer not null default 100;

alter table public.business_settings
  drop constraint if exists business_settings_geofence_radius_check;

alter table public.business_settings
  add constraint business_settings_geofence_radius_check
  check (attendance_geofence_radius_meters >= 25 and attendance_geofence_radius_meters <= 2000);

alter table public.attendance_time_logs
  add column if not exists request_latitude double precision,
  add column if not exists request_longitude double precision,
  add column if not exists location_accuracy_meters double precision,
  add column if not exists is_location_valid boolean not null default false;
