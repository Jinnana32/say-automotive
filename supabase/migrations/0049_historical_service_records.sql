alter table public.job_orders
  add column if not exists is_historical boolean not null default false,
  add column if not exists service_date date,
  add column if not exists historical_recorded_at timestamptz;

create index if not exists job_orders_is_historical_idx
  on public.job_orders (is_historical)
  where is_historical = true;

alter table public.job_orders
  add constraint job_orders_historical_service_date_check
    check (
      (is_historical = false and service_date is null)
      or (is_historical = true and service_date is not null)
    ) not valid;

create or replace function public.create_historical_service_record_impl(
  p_vehicle_id uuid,
  p_service_date date,
  p_work_performed text,
  p_customer_concern text default null,
  p_diagnosis text default null,
  p_inspection_notes text default null,
  p_mileage_in numeric default null,
  p_mileage_out numeric default null,
  p_items jsonb default '[]'::jsonb,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vehicle public.vehicles%rowtype;
  v_customer public.customers%rowtype;
  v_job_order_id uuid;
  v_service_timestamp timestamptz;
  v_item record;
  v_item_quantity numeric(14,4);
  v_item_unit_price numeric(14,4);
  v_line_number integer := 0;
  v_work_performed text;
begin
  if p_service_date is null then
    raise exception 'Service date is required for historical records.';
  end if;

  if p_service_date > current_date then
    raise exception 'Service date cannot be in the future.';
  end if;

  v_work_performed := nullif(trim(p_work_performed), '');

  if v_work_performed is null
    and (jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0) then
    raise exception 'Enter what was done on this visit or add at least one line item.';
  end if;

  if p_mileage_in is not null and p_mileage_in < 0 then
    raise exception 'Mileage in must be zero or greater.';
  end if;

  if p_mileage_out is not null and p_mileage_out < 0 then
    raise exception 'Mileage out must be zero or greater.';
  end if;

  if p_mileage_in is not null and p_mileage_out is not null and p_mileage_out < p_mileage_in then
    raise exception 'Mileage out cannot be less than mileage in.';
  end if;

  select *
  into v_vehicle
  from public.vehicles
  where id = p_vehicle_id;

  if not found then
    raise exception 'Vehicle does not exist.';
  end if;

  select *
  into v_customer
  from public.customers
  where id = v_vehicle.customer_id
    and branch_id = v_vehicle.branch_id;

  if not found then
    raise exception 'Vehicle customer record does not exist in this branch.';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'Historical line items must be provided as an array.';
  end if;

  for v_item in
    select value, ordinality
    from jsonb_array_elements(p_items) with ordinality
  loop
    if trim(coalesce(v_item.value ->> 'description', '')) = '' then
      raise exception 'Historical line item % is missing a description.', v_item.ordinality;
    end if;

    v_item_quantity := round(coalesce((v_item.value ->> 'quantity')::numeric, 0), 4);
    v_item_unit_price := round(coalesce((v_item.value ->> 'unit_price')::numeric, 0), 4);

    if v_item_quantity <= 0 then
      raise exception 'Historical line item % must have quantity greater than zero.', v_item.ordinality;
    end if;

    if v_item_unit_price < 0 then
      raise exception 'Historical line item % must have unit price zero or greater.', v_item.ordinality;
    end if;

    if (v_item.value ->> 'item_type') not in ('labor', 'service') then
      raise exception 'Historical line items must be labor or service descriptions only.';
    end if;
  end loop;

  v_service_timestamp := timezone(
    'utc',
    (p_service_date::timestamp + time '12:00') at time zone 'Asia/Manila'
  );

  v_job_order_id := gen_random_uuid();

  insert into public.job_orders (
    id,
    job_order_number,
    quotation_id,
    branch_id,
    customer_id,
    vehicle_id,
    status,
    mileage_in,
    mileage_out,
    customer_concern,
    inspection_notes,
    diagnosis,
    work_performed,
    started_at,
    completed_at,
    is_historical,
    service_date,
    historical_recorded_at,
    created_by,
    created_at,
    updated_at
  )
  values (
    v_job_order_id,
    public.next_document_number('job_order', v_vehicle.branch_id),
    null,
    v_vehicle.branch_id,
    v_vehicle.customer_id,
    v_vehicle.id,
    'completed',
    p_mileage_in,
    p_mileage_out,
    nullif(trim(p_customer_concern), ''),
    nullif(trim(p_inspection_notes), ''),
    nullif(trim(p_diagnosis), ''),
    v_work_performed,
    v_service_timestamp,
    v_service_timestamp,
    true,
    p_service_date,
    timezone('utc', now()),
    p_created_by,
    v_service_timestamp,
    timezone('utc', now())
  );

  for v_item in
    select value, ordinality
    from jsonb_array_elements(p_items) with ordinality
    order by ordinality
  loop
    v_line_number := v_item.ordinality::integer;
    v_item_quantity := round((v_item.value ->> 'quantity')::numeric, 4);
    v_item_unit_price := round((v_item.value ->> 'unit_price')::numeric, 4);

    insert into public.job_order_items (
      id,
      job_order_id,
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
    values (
      gen_random_uuid(),
      v_job_order_id,
      v_line_number,
      (v_item.value ->> 'item_type')::public.line_item_type,
      null,
      nullif(v_item.value ->> 'service_id', '')::uuid,
      trim(v_item.value ->> 'description'),
      v_item_quantity,
      v_item_unit_price,
      round(v_item_quantity * v_item_unit_price, 4),
      false,
      'not_required',
      'planned'
    );
  end loop;

  return v_job_order_id;
end;
$$;

create or replace function public.create_historical_service_record(
  p_vehicle_id uuid,
  p_service_date date,
  p_work_performed text,
  p_customer_concern text default null,
  p_diagnosis text default null,
  p_inspection_notes text default null,
  p_mileage_in numeric default null,
  p_mileage_out numeric default null,
  p_items jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_branch_id uuid;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[],
    'Only service-administration roles can record past service history.'
  );

  select branch_id
  into v_branch_id
  from public.vehicles
  where id = p_vehicle_id;

  if v_branch_id is null then
    raise exception 'Vehicle does not exist.';
  end if;

  perform public.assert_branch_access(
    v_branch_id,
    'You do not have access to record service history for this branch.'
  );

  return public.create_historical_service_record_impl(
    p_vehicle_id,
    p_service_date,
    p_work_performed,
    p_customer_concern,
    p_diagnosis,
    p_inspection_notes,
    p_mileage_in,
    p_mileage_out,
    p_items,
    v_actor_user_id
  );
end;
$$;

create or replace function public.record_job_order_part_usage(
  p_job_order_item_id uuid,
  p_quantity numeric,
  p_notes text default null,
  p_performed_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_order_id uuid;
  v_is_historical boolean;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[],
    'Only operational roles can record job order part usage.'
  );

  select joi.job_order_id, jo.is_historical
  into v_job_order_id, v_is_historical
  from public.job_order_items as joi
  join public.job_orders as jo on jo.id = joi.job_order_id
  where joi.id = p_job_order_item_id;

  if v_job_order_id is null then
    raise exception 'Job order item does not exist.';
  end if;

  if v_is_historical then
    raise exception 'Historical service records cannot deduct inventory.';
  end if;

  if not public.can_access_job_order(v_job_order_id) then
    raise exception 'You do not have access to update this job order item.';
  end if;

  return public.record_job_order_part_usage_impl(
    p_job_order_item_id,
    p_quantity,
    p_notes,
    auth.uid()
  );
end;
$$;

create or replace function public.create_invoice_from_job_order(
  p_job_order_id uuid,
  p_invoice_date date,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_branch_id uuid;
  v_is_historical boolean;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[],
    'Only service-administration roles can create invoices from job orders.'
  );

  select branch_id, is_historical
  into v_branch_id, v_is_historical
  from public.job_orders
  where id = p_job_order_id;

  if v_branch_id is null then
    raise exception 'Job order does not exist.';
  end if;

  if coalesce(v_is_historical, false) then
    raise exception 'Historical service records cannot generate invoices.';
  end if;

  perform public.assert_branch_access(
    v_branch_id,
    'You do not have access to create invoices for this branch.'
  );

  return public.create_invoice_from_job_order_impl(
    p_job_order_id,
    p_invoice_date,
    v_actor_user_id
  );
end;
$$;

revoke all on function public.create_historical_service_record_impl(
  uuid,
  date,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  jsonb,
  uuid
) from public, anon, authenticated;

revoke all on function public.create_historical_service_record(
  uuid,
  date,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  jsonb
) from public, anon;

grant execute on function public.create_historical_service_record(
  uuid,
  date,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  jsonb
) to authenticated;
