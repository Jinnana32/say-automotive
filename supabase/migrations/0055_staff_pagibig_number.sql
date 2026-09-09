alter table public.staff
  add column if not exists pagibig_number text;

comment on column public.staff.pagibig_number is
  'Employee Pag-IBIG / HDMF membership number shown on payslips.';
