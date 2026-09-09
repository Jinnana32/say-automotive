alter table public.staff_compensation_profiles
  add column if not exists sss_ee_amount numeric(14,4) not null default 0
    check (sss_ee_amount >= 0),
  add column if not exists philhealth_ee_amount numeric(14,4) not null default 0
    check (philhealth_ee_amount >= 0),
  add column if not exists pagibig_ee_amount numeric(14,4) not null default 0
    check (pagibig_ee_amount >= 0);

comment on column public.staff_compensation_profiles.sss_ee_amount is
  'Fixed employee SSS contribution amount to deduct when a payroll period applies government deductions.';
comment on column public.staff_compensation_profiles.philhealth_ee_amount is
  'Fixed employee PhilHealth contribution amount to deduct when a payroll period applies government deductions.';
comment on column public.staff_compensation_profiles.pagibig_ee_amount is
  'Fixed employee Pag-IBIG contribution amount to deduct when a payroll period applies government deductions.';

alter table public.payroll_periods
  add column if not exists apply_government_deductions boolean not null default true;

comment on column public.payroll_periods.apply_government_deductions is
  'When true, generate payroll cut applies fixed SSS/PhilHealth/Pag-IBIG employee amounts from compensation profiles.';
