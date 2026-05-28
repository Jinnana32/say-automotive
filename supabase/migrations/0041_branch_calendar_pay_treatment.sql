alter table public.branch_holidays
  add column if not exists pay_treatment text;

update public.branch_holidays
set holiday_kind = 'branch_closure'
where holiday_kind is distinct from 'branch_closure';

update public.branch_holidays
set pay_treatment = coalesce(pay_treatment, 'unpaid');

alter table public.branch_holidays
  alter column holiday_kind set default 'branch_closure';

alter table public.branch_holidays
  alter column pay_treatment set default 'unpaid';

alter table public.branch_holidays
  alter column pay_treatment set not null;

alter table public.branch_holidays
  drop constraint if exists branch_holidays_holiday_kind_check;

alter table public.branch_holidays
  add constraint branch_holidays_holiday_kind_check
  check (
    holiday_kind in (
      'branch_closure',
      'public_holiday',
      'company_holiday',
      'special_non_working_day'
    )
  );

alter table public.branch_holidays
  drop constraint if exists branch_holidays_pay_treatment_check;

alter table public.branch_holidays
  add constraint branch_holidays_pay_treatment_check
  check (pay_treatment in ('unpaid', 'paid_regular_day', 'custom'));
