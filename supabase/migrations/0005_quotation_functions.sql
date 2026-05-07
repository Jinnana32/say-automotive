create or replace function public.next_document_number(p_key text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sequence public.document_sequences%rowtype;
begin
  update public.document_sequences
  set last_value = last_value + 1
  where key = p_key
  returning * into v_sequence;

  if not found then
    raise exception 'Document sequence "%" is not configured.', p_key;
  end if;

  return v_sequence.prefix || lpad(v_sequence.last_value::text, v_sequence.padding, '0');
end;
$$;

create or replace function public.save_quotation_with_items(
  p_quotation_id uuid,
  p_branch_id uuid,
  p_customer_id uuid,
  p_vehicle_id uuid,
  p_inspection_notes text,
  p_status public.quotation_status,
  p_subtotal numeric,
  p_discount numeric,
  p_tax numeric,
  p_total_amount numeric,
  p_items jsonb,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quotation_id uuid;
  v_existing_status public.quotation_status;
  v_item record;
begin
  if p_status not in ('draft', 'pending_approval') then
    raise exception 'Quotations can only be saved as draft or pending approval.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one quotation item is required.';
  end if;

  if not exists (
    select 1
    from public.vehicles
    where id = p_vehicle_id
      and customer_id = p_customer_id
  ) then
    raise exception 'Selected vehicle does not belong to the selected customer.';
  end if;

  for v_item in
    select value, ordinality
    from jsonb_array_elements(p_items) with ordinality
  loop
    if trim(coalesce(v_item.value ->> 'description', '')) = '' then
      raise exception 'Quotation item % is missing a description.', v_item.ordinality;
    end if;

    if coalesce((v_item.value ->> 'quantity')::numeric, 0) <= 0 then
      raise exception 'Quotation item % must have quantity greater than zero.', v_item.ordinality;
    end if;

    if coalesce((v_item.value ->> 'unit_price')::numeric, -1) < 0 then
      raise exception 'Quotation item % must have unit price zero or greater.', v_item.ordinality;
    end if;

    if (v_item.value ->> 'item_type') = 'product'
      and nullif(v_item.value ->> 'product_id', '') is null then
      raise exception 'Quotation item % requires a product reference.', v_item.ordinality;
    end if;

    if (v_item.value ->> 'item_type') = 'service'
      and nullif(v_item.value ->> 'service_id', '') is null then
      raise exception 'Quotation item % requires a service reference.', v_item.ordinality;
    end if;
  end loop;

  if p_quotation_id is null then
    v_quotation_id := gen_random_uuid();

    insert into public.quotations (
      id,
      quotation_number,
      branch_id,
      customer_id,
      vehicle_id,
      inspection_notes,
      status,
      subtotal,
      discount,
      tax,
      total_amount,
      created_by
    )
    values (
      v_quotation_id,
      public.next_document_number('quotation'),
      p_branch_id,
      p_customer_id,
      p_vehicle_id,
      nullif(trim(p_inspection_notes), ''),
      p_status,
      p_subtotal,
      p_discount,
      p_tax,
      p_total_amount,
      p_created_by
    );
  else
    select status
    into v_existing_status
    from public.quotations
    where id = p_quotation_id
    for update;

    if not found then
      raise exception 'Quotation does not exist.';
    end if;

    if v_existing_status = 'approved' then
      raise exception 'Approved quotations cannot be edited.';
    end if;

    update public.quotations
    set
      branch_id = p_branch_id,
      customer_id = p_customer_id,
      vehicle_id = p_vehicle_id,
      inspection_notes = nullif(trim(p_inspection_notes), ''),
      status = p_status,
      subtotal = p_subtotal,
      discount = p_discount,
      tax = p_tax,
      total_amount = p_total_amount,
      approved_at = null,
      rejected_at = case when p_status = 'rejected' then timezone('utc', now()) else null end,
      updated_at = timezone('utc', now())
    where id = p_quotation_id;

    delete from public.quotation_items where quotation_id = p_quotation_id;

    v_quotation_id := p_quotation_id;
  end if;

  insert into public.quotation_items (
    quotation_id,
    line_number,
    item_type,
    product_id,
    service_id,
    description,
    quantity,
    unit_price,
    total
  )
  select
    v_quotation_id,
    item.ordinality::integer,
    (item.value ->> 'item_type')::public.line_item_type,
    nullif(item.value ->> 'product_id', '')::uuid,
    nullif(item.value ->> 'service_id', '')::uuid,
    item.value ->> 'description',
    (item.value ->> 'quantity')::numeric,
    (item.value ->> 'unit_price')::numeric,
    coalesce(
      (item.value ->> 'total')::numeric,
      (item.value ->> 'quantity')::numeric * (item.value ->> 'unit_price')::numeric
    )
  from jsonb_array_elements(p_items) with ordinality as item(value, ordinality);

  return v_quotation_id;
end;
$$;

create or replace function public.approve_quotation_to_job_order(
  p_quotation_id uuid,
  p_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quotation public.quotations%rowtype;
  v_job_order_id uuid;
begin
  select *
  into v_quotation
  from public.quotations
  where id = p_quotation_id
  for update;

  if not found then
    raise exception 'Quotation does not exist.';
  end if;

  select id
  into v_job_order_id
  from public.job_orders
  where quotation_id = p_quotation_id
  limit 1;

  if v_job_order_id is not null then
    return v_job_order_id;
  end if;

  if v_quotation.status not in ('draft', 'pending_approval') then
    raise exception 'Only draft or pending approval quotations can be approved.';
  end if;

  v_job_order_id := gen_random_uuid();

  insert into public.job_orders (
    id,
    job_order_number,
    quotation_id,
    branch_id,
    customer_id,
    vehicle_id,
    status,
    inspection_notes,
    created_by
  )
  values (
    v_job_order_id,
    public.next_document_number('job_order'),
    v_quotation.id,
    v_quotation.branch_id,
    v_quotation.customer_id,
    v_quotation.vehicle_id,
    'pending',
    v_quotation.inspection_notes,
    p_user_id
  );

  insert into public.job_order_items (
    id,
    job_order_id,
    source_quotation_item_id,
    line_number,
    item_type,
    product_id,
    service_id,
    description,
    quantity,
    unit_price,
    total,
    is_additional,
    approval_status,
    usage_status
  )
  select
    gen_random_uuid(),
    v_job_order_id,
    qi.id,
    qi.line_number,
    qi.item_type,
    qi.product_id,
    qi.service_id,
    qi.description,
    qi.quantity,
    qi.unit_price,
    qi.total,
    false,
    'not_required',
    'planned'
  from public.quotation_items qi
  where qi.quotation_id = p_quotation_id
  order by qi.line_number;

  update public.quotations
  set
    status = 'approved',
    approved_at = timezone('utc', now()),
    rejected_at = null,
    updated_at = timezone('utc', now())
  where id = p_quotation_id;

  return v_job_order_id;
end;
$$;
