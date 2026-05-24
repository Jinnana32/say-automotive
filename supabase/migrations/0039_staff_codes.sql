alter table public.staff
  add column if not exists staff_code text;

comment on column public.staff.staff_code is
  'Branch-aware staff identifier used for physical ID cards and roster references.';

with numbered_staff as (
  select
    s.id,
    concat(
      'STF-',
      upper(b.code),
      '-',
      lpad(
        row_number() over (
          partition by s.branch_id
          order by s.created_at, s.id
        )::text,
        4,
        '0'
      )
    ) as generated_code
  from public.staff as s
  join public.branches as b on b.id = s.branch_id
)
update public.staff as s
set staff_code = numbered_staff.generated_code
from numbered_staff
where s.id = numbered_staff.id
  and coalesce(nullif(btrim(s.staff_code), ''), '') = '';

create unique index if not exists staff_staff_code_unique_idx
  on public.staff (lower(staff_code))
  where staff_code is not null;

create index if not exists staff_branch_staff_code_idx
  on public.staff (branch_id, staff_code);

insert into public.document_sequences (
  key,
  branch_id,
  prefix,
  padding,
  last_value
)
select
  'staff',
  b.id,
  'STF-',
  4,
  coalesce(branch_staff.last_value, 0)
from public.branches as b
left join (
  select
    s.branch_id,
    max(
      case
        when s.staff_code ~ '^[A-Z]+-[A-Z0-9]+-[0-9]+$'
          then split_part(s.staff_code, '-', 3)::bigint
        else 0
      end
    ) as last_value
  from public.staff as s
  where s.staff_code is not null
  group by s.branch_id
) as branch_staff on branch_staff.branch_id = b.id
on conflict (key, branch_id) do update
set
  prefix = excluded.prefix,
  padding = excluded.padding,
  last_value = greatest(public.document_sequences.last_value, excluded.last_value);

create or replace function public.next_document_number(
  p_key text,
  p_branch_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sequence public.document_sequences%rowtype;
  v_branch_code text;
begin
  perform public.assert_branch_access(
    p_branch_id,
    'You do not have access to generate document numbers for this branch.'
  );

  select upper(code)
  into v_branch_code
  from public.branches
  where id = p_branch_id
    and is_active = true;

  if not found then
    raise exception 'Branch document numbering is not configured for the selected branch.';
  end if;

  insert into public.document_sequences (
    key,
    branch_id,
    prefix,
    padding,
    last_value
  )
  select
    required_sequence.key,
    p_branch_id,
    required_sequence.prefix,
    required_sequence.padding,
    0
  from (
    values
      ('quotation', 'QT-', 4),
      ('job_order', 'JO-', 4),
      ('invoice', 'INV-', 4),
      ('sale', 'POS-', 4),
      ('staff', 'STF-', 4)
  ) as required_sequence (key, prefix, padding)
  where required_sequence.key = p_key
  on conflict (key, branch_id) do nothing;

  update public.document_sequences
  set last_value = last_value + 1
  where key = p_key
    and branch_id = p_branch_id
  returning * into v_sequence;

  if not found then
    raise exception 'Document sequence "%" is not configured for the selected branch.', p_key;
  end if;

  return v_sequence.prefix || v_branch_code || '-' || lpad(v_sequence.last_value::text, v_sequence.padding, '0');
end;
$$;

create or replace function public.assign_staff_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.branch_id is null then
    raise exception 'Staff branch is required before a staff ID can be assigned.';
  end if;

  if coalesce(nullif(btrim(new.staff_code), ''), '') = '' then
    new.staff_code := public.next_document_number('staff', new.branch_id);
  else
    new.staff_code := upper(btrim(new.staff_code));
  end if;

  return new;
end;
$$;

drop trigger if exists assign_staff_code on public.staff;
create trigger assign_staff_code
before insert or update on public.staff
for each row
execute function public.assign_staff_code();
