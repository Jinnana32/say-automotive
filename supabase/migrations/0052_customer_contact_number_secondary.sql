-- Optional secondary / backup contact number for customers.
-- Used when a customer has more than one reachable phone (common in legacy imports).

alter table public.customers
  add column if not exists contact_number_secondary text;

comment on column public.customers.contact_number_secondary is
  'Optional alternate or backup contact number for the customer.';
