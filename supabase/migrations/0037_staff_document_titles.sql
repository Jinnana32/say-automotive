alter table public.staff
add column if not exists document_title text;

comment on column public.staff.document_title is
  'Customer-facing title used on print/PDF documents instead of the internal role label.';

update public.staff
set document_title = case
  when lower(trim(concat_ws(' ', first_name, last_name))) = 'henrick say' then 'Service Adviser'
  when lower(trim(concat_ws(' ', first_name, last_name))) in ('nia grace ariete', 'nia grace') then 'Shop Manager'
  else document_title
end
where lower(trim(concat_ws(' ', first_name, last_name))) in (
  'henrick say',
  'nia grace ariete',
  'nia grace'
)
and coalesce(nullif(btrim(document_title), ''), '') = '';
