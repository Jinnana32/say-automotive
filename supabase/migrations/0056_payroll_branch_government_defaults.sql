alter table public.business_settings
  add column if not exists payroll_default_sss_ee_amount numeric(14,4) not null default 0
    check (payroll_default_sss_ee_amount >= 0),
  add column if not exists payroll_default_philhealth_ee_amount numeric(14,4) not null default 0
    check (payroll_default_philhealth_ee_amount >= 0),
  add column if not exists payroll_default_pagibig_ee_amount numeric(14,4) not null default 0
    check (payroll_default_pagibig_ee_amount >= 0);

comment on column public.business_settings.payroll_default_sss_ee_amount is
  'Shop-wide default employee SSS contribution per payroll period.';
comment on column public.business_settings.payroll_default_philhealth_ee_amount is
  'Shop-wide default employee PhilHealth contribution per payroll period.';
comment on column public.business_settings.payroll_default_pagibig_ee_amount is
  'Shop-wide default employee Pag-IBIG contribution per payroll period.';

alter table public.staff_compensation_profiles
  add column if not exists use_branch_government_defaults boolean not null default true;

comment on column public.staff_compensation_profiles.use_branch_government_defaults is
  'When true, payroll uses shop default SSS/PhilHealth/Pag-IBIG amounts. When false, uses this profile''s custom amounts.';

update public.staff_compensation_profiles
set use_branch_government_defaults = false
where sss_ee_amount > 0
   or philhealth_ee_amount > 0
   or pagibig_ee_amount > 0;
