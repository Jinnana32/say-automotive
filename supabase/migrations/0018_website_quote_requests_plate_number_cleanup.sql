update public.website_quote_requests
set plate_number = null
where plate_number is not null
  and btrim(plate_number) = '';

alter table public.website_quote_requests
  alter column plate_number drop not null;
