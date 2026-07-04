alter table public.staff_compensation_profiles
  add column if not exists exempt_from_attendance boolean not null default false;

comment on column public.staff_compensation_profiles.exempt_from_attendance is
  'When true, payroll pays scheduled workdays in the cutoff without requiring sign-in/sign-out records.';
