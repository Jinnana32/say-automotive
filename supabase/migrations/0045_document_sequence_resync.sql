-- Resync branch document sequences from existing issued numbers and skip collisions
-- when the sequence counter drifts behind records already stored in the database.

create or replace function public.branch_document_sequence_value(
  p_document_number text,
  p_prefix text,
  p_branch_code text
)
returns bigint
language plpgsql
immutable
as $$
declare
  v_normalized text := upper(btrim(p_document_number));
  v_prefix text := upper(p_prefix);
  v_branch_code text := upper(p_branch_code);
  v_branch_pattern text;
  v_legacy_pattern text;
begin
  if coalesce(v_normalized, '') = '' then
    return 0;
  end if;

  v_branch_pattern := '^'
    || regexp_replace(v_prefix, '([.*+?^${}()|[\]\\])', '\\\1', 'g')
    || v_branch_code
    || '-([0-9]+)$';

  if v_normalized ~ v_branch_pattern then
    return (regexp_match(v_normalized, v_branch_pattern))[1]::bigint;
  end if;

  if v_branch_code = 'MAIN' then
    v_legacy_pattern := '^'
      || regexp_replace(v_prefix, '([.*+?^${}()|[\]\\])', '\\\1', 'g')
      || '([0-9]+)$';

    if v_normalized ~ v_legacy_pattern then
      return (regexp_match(v_normalized, v_legacy_pattern))[1]::bigint;
    end if;
  end if;

  return 0;
end;
$$;

create or replace function public.document_number_exists(
  p_key text,
  p_document_number text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return case p_key
    when 'quotation' then exists (
      select 1
      from public.quotations
      where quotation_number = p_document_number
    )
    when 'job_order' then exists (
      select 1
      from public.job_orders
      where job_order_number = p_document_number
    )
    when 'invoice' then exists (
      select 1
      from public.invoices
      where invoice_number = p_document_number
    )
    when 'sale' then exists (
      select 1
      from public.sales
      where sale_number = p_document_number
    )
    when 'staff' then exists (
      select 1
      from public.staff
      where lower(staff_code) = lower(p_document_number)
    )
    else false
  end;
end;
$$;

create or replace function public.resync_document_sequences_for_key(
  p_key text,
  p_prefix text,
  p_number_column text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  execute format(
    $sql$
    update public.document_sequences as sequence_row
    set last_value = greatest(
      sequence_row.last_value,
      coalesce(branch_max.max_sequence_value, 0)
    )
    from (
      select
        docs.branch_id,
        max(
          public.branch_document_sequence_value(docs.document_number, %L, branches.code)
        ) as max_sequence_value
      from (
        select branch_id, %I as document_number
        from public.%I
      ) as docs
      join public.branches as branches on branches.id = docs.branch_id
      group by docs.branch_id
    ) as branch_max
    where sequence_row.key = %L
      and sequence_row.branch_id = branch_max.branch_id
    $sql$,
    p_prefix,
    p_number_column,
    p_key || 's',
    p_key
  );
end;
$$;

select public.resync_document_sequences_for_key('quotation', 'QT-', 'quotation_number');
select public.resync_document_sequences_for_key('job_order', 'JO-', 'job_order_number');
select public.resync_document_sequences_for_key('invoice', 'INV-', 'invoice_number');
select public.resync_document_sequences_for_key('sale', 'POS-', 'sale_number');

drop function public.resync_document_sequences_for_key(text, text, text);

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
  v_candidate text;
  v_attempts integer := 0;
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
      ('staff', 'EMP-', 4)
  ) as required_sequence (key, prefix, padding)
  where required_sequence.key = p_key
  on conflict (key, branch_id) do nothing;

  loop
    v_attempts := v_attempts + 1;

    if v_attempts > 100 then
      raise exception 'Unable to generate a unique document number for "%".', p_key;
    end if;

    update public.document_sequences
    set last_value = last_value + 1
    where key = p_key
      and branch_id = p_branch_id
    returning * into v_sequence;

    if not found then
      raise exception 'Document sequence "%" is not configured for the selected branch.', p_key;
    end if;

    v_candidate := v_sequence.prefix
      || v_branch_code
      || '-'
      || lpad(v_sequence.last_value::text, v_sequence.padding, '0');

    exit when not public.document_number_exists(p_key, v_candidate);
  end loop;

  return v_candidate;
end;
$$;
