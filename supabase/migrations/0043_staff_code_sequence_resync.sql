-- Resync staff document sequences from existing staff codes and harden auto-assignment
-- when the sequence counter drifts behind already-issued staff IDs.

create or replace function public.staff_code_sequence_value(p_staff_code text)
returns bigint
language sql
immutable
as $$
  select case
    when p_staff_code ~ '^[A-Z]+-[A-Z0-9-]+-[0-9]+$'
      then regexp_replace(upper(btrim(p_staff_code)), '^.*-', '')::bigint
    else 0
  end;
$$;

update public.document_sequences as sequence_row
set last_value = greatest(
  sequence_row.last_value,
  coalesce(branch_staff.max_sequence_value, 0)
)
from (
  select
    s.branch_id,
    max(public.staff_code_sequence_value(s.staff_code)) as max_sequence_value
  from public.staff as s
  where s.staff_code is not null
  group by s.branch_id
) as branch_staff
where sequence_row.key = 'staff'
  and sequence_row.branch_id = branch_staff.branch_id;

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
  'EMP-',
  4,
  coalesce(branch_staff.max_sequence_value, 0)
from public.branches as b
left join (
  select
    s.branch_id,
    max(public.staff_code_sequence_value(s.staff_code)) as max_sequence_value
  from public.staff as s
  where s.staff_code is not null
  group by s.branch_id
) as branch_staff on branch_staff.branch_id = b.id
on conflict (key, branch_id) do update
set
  prefix = excluded.prefix,
  padding = excluded.padding,
  last_value = greatest(public.document_sequences.last_value, excluded.last_value);

create or replace function public.assign_staff_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempts integer := 0;
begin
  if new.branch_id is null then
    raise exception 'Staff branch is required before a staff ID can be assigned.';
  end if;

  if coalesce(nullif(btrim(new.staff_code), ''), '') = '' then
    loop
      v_attempts := v_attempts + 1;

      if v_attempts > 100 then
        raise exception 'Unable to assign a unique staff ID for this branch.';
      end if;

      new.staff_code := public.next_document_number('staff', new.branch_id);

      exit when not exists (
        select 1
        from public.staff as existing_staff
        where lower(existing_staff.staff_code) = lower(new.staff_code)
          and existing_staff.id is distinct from new.id
      );
    end loop;
  else
    new.staff_code := upper(btrim(new.staff_code));
  end if;

  return new;
end;
$$;
