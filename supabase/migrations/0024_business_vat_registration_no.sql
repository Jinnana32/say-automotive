alter table public.business_settings
  add column if not exists business_vat_registration_no text;
