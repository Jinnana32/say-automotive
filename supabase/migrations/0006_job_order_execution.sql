create unique index if not exists job_order_mechanics_job_order_staff_key
  on public.job_order_mechanics (job_order_id, staff_id);

create or replace function public.save_job_order_details(
  p_job_order_id uuid,
  p_mileage_in numeric default null,
  p_mileage_out numeric default null,
  p_customer_concern text default null,
  p_inspection_notes text default null,
  p_diagnosis text default null,
  p_work_performed text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_order public.job_orders%rowtype;
begin
  select *
  into v_job_order
  from public.job_orders
  where id = p_job_order_id
  for update;

  if not found then
    raise exception 'Job order does not exist.';
  end if;

  if v_job_order.status in ('released', 'cancelled') then
    raise exception 'Released or cancelled job orders cannot be edited.';
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

  update public.job_orders
  set
    mileage_in = p_mileage_in,
    mileage_out = p_mileage_out,
    customer_concern = nullif(trim(p_customer_concern), ''),
    inspection_notes = nullif(trim(p_inspection_notes), ''),
    diagnosis = nullif(trim(p_diagnosis), ''),
    work_performed = nullif(trim(p_work_performed), ''),
    updated_at = timezone('utc', now())
  where id = p_job_order_id;

  return p_job_order_id;
end;
$$;

create or replace function public.assign_job_order_mechanic(
  p_job_order_id uuid,
  p_staff_id uuid,
  p_task_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_order public.job_orders%rowtype;
  v_assignment_id uuid;
begin
  select *
  into v_job_order
  from public.job_orders
  where id = p_job_order_id
  for update;

  if not found then
    raise exception 'Job order does not exist.';
  end if;

  if v_job_order.status in ('completed', 'ready_for_billing', 'paid', 'released', 'cancelled') then
    raise exception 'Mechanic assignments are locked for this job order status.';
  end if;

  if not exists (
    select 1
    from public.staff
    where id = p_staff_id
      and role = 'mechanic'
      and status = 'active'
  ) then
    raise exception 'Selected staff record is not an active mechanic.';
  end if;

  insert into public.job_order_mechanics (
    job_order_id,
    staff_id,
    task_description
  )
  values (
    p_job_order_id,
    p_staff_id,
    nullif(trim(p_task_description), '')
  )
  on conflict (job_order_id, staff_id)
  do update
  set
    task_description = coalesce(excluded.task_description, job_order_mechanics.task_description),
    updated_at = timezone('utc', now())
  returning id into v_assignment_id;

  return v_assignment_id;
end;
$$;

create or replace function public.remove_job_order_mechanic(
  p_assignment_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.job_order_status;
begin
  select jo.status
  into v_status
  from public.job_order_mechanics jm
  join public.job_orders jo on jo.id = jm.job_order_id
  where jm.id = p_assignment_id
  for update of jm, jo;

  if not found then
    raise exception 'Mechanic assignment does not exist.';
  end if;

  if v_status in ('completed', 'ready_for_billing', 'paid', 'released', 'cancelled') then
    raise exception 'Mechanic assignments are locked for this job order status.';
  end if;

  delete from public.job_order_mechanics
  where id = p_assignment_id;

  return p_assignment_id;
end;
$$;

create or replace function public.update_job_order_status(
  p_job_order_id uuid,
  p_next_status public.job_order_status
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_order public.job_orders%rowtype;
  v_has_pending_additional boolean;
begin
  select *
  into v_job_order
  from public.job_orders
  where id = p_job_order_id
  for update;

  if not found then
    raise exception 'Job order does not exist.';
  end if;

  if v_job_order.status = p_next_status then
    return p_job_order_id;
  end if;

  if p_next_status in ('paid', 'released') then
    raise exception 'Use billing and release workflows to move a job order into "%".', p_next_status;
  end if;

  if v_job_order.status in ('ready_for_billing', 'paid', 'released', 'cancelled') then
    raise exception 'This job order status can no longer be changed from operational controls.';
  end if;

  if (v_job_order.status, p_next_status) not in (
    ('pending', 'in_progress'),
    ('pending', 'cancelled'),
    ('in_progress', 'waiting_for_parts'),
    ('in_progress', 'waiting_for_customer_approval'),
    ('in_progress', 'completed'),
    ('in_progress', 'cancelled'),
    ('waiting_for_parts', 'in_progress'),
    ('waiting_for_parts', 'waiting_for_customer_approval'),
    ('waiting_for_parts', 'cancelled'),
    ('waiting_for_customer_approval', 'in_progress'),
    ('waiting_for_customer_approval', 'waiting_for_parts'),
    ('waiting_for_customer_approval', 'cancelled'),
    ('completed', 'ready_for_billing')
  ) then
    raise exception 'Invalid job order transition from "%" to "%".', v_job_order.status, p_next_status;
  end if;

  if p_next_status in ('completed', 'ready_for_billing') then
    select exists (
      select 1
      from public.job_order_items
      where job_order_id = p_job_order_id
        and is_additional = true
        and approval_status = 'pending'
    )
    into v_has_pending_additional;

    if v_has_pending_additional then
      raise exception 'Pending additional items must be approved or rejected first.';
    end if;
  end if;

  update public.job_orders
  set
    status = p_next_status,
    started_at = case
      when p_next_status = 'in_progress' then coalesce(started_at, timezone('utc', now()))
      else started_at
    end,
    completed_at = case
      when p_next_status in ('completed', 'ready_for_billing')
        then coalesce(completed_at, timezone('utc', now()))
      else completed_at
    end,
    updated_at = timezone('utc', now())
  where id = p_job_order_id;

  return p_job_order_id;
end;
$$;

create or replace function public.add_job_order_item(
  p_job_order_id uuid,
  p_item_type public.line_item_type,
  p_product_id uuid default null,
  p_service_id uuid default null,
  p_description text default null,
  p_quantity numeric default 0,
  p_unit_price numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_order public.job_orders%rowtype;
  v_item_id uuid;
  v_line_number integer;
  v_description text;
begin
  select *
  into v_job_order
  from public.job_orders
  where id = p_job_order_id
  for update;

  if not found then
    raise exception 'Job order does not exist.';
  end if;

  if v_job_order.status in ('completed', 'ready_for_billing', 'paid', 'released', 'cancelled') then
    raise exception 'Items cannot be added at this job order status.';
  end if;

  if p_quantity <= 0 then
    raise exception 'Additional job order items must have quantity greater than zero.';
  end if;

  if p_unit_price < 0 then
    raise exception 'Additional job order items must have unit price zero or greater.';
  end if;

  if p_item_type = 'product' and p_product_id is null then
    raise exception 'Product items require a product reference.';
  end if;

  if p_item_type = 'service' and p_service_id is null then
    raise exception 'Service items require a service reference.';
  end if;

  v_description := nullif(trim(p_description), '');

  if v_description is null then
    raise exception 'Additional job order items require a description.';
  end if;

  select coalesce(max(line_number), 0) + 1
  into v_line_number
  from public.job_order_items
  where job_order_id = p_job_order_id;

  v_item_id := gen_random_uuid();

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
    v_item_id,
    p_job_order_id,
    v_line_number,
    p_item_type,
    p_product_id,
    p_service_id,
    v_description,
    p_quantity,
    p_unit_price,
    p_quantity * p_unit_price,
    true,
    'pending',
    'planned'
  );

  if v_job_order.status in ('in_progress', 'waiting_for_parts') then
    update public.job_orders
    set
      status = 'waiting_for_customer_approval',
      updated_at = timezone('utc', now())
    where id = p_job_order_id;
  end if;

  return v_item_id;
end;
$$;

create or replace function public.set_job_order_item_approval(
  p_job_order_item_id uuid,
  p_approval_status public.approval_status
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.job_order_items%rowtype;
  v_job_order_status public.job_order_status;
begin
  select *
  into v_item
  from public.job_order_items
  where id = p_job_order_item_id
  for update;

  if not found then
    raise exception 'Job order item does not exist.';
  end if;

  select status
  into v_job_order_status
  from public.job_orders
  where id = v_item.job_order_id
  for update;

  if not v_item.is_additional then
    raise exception 'Only additional items require approval changes.';
  end if;

  if p_approval_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Unsupported approval status "%".', p_approval_status;
  end if;

  if v_job_order_status in ('completed', 'ready_for_billing', 'paid', 'released', 'cancelled') then
    raise exception 'Item approvals are locked for this job order status.';
  end if;

  update public.job_order_items
  set
    approval_status = p_approval_status,
    approved_at = case when p_approval_status = 'approved' then timezone('utc', now()) else null end,
    rejected_at = case when p_approval_status = 'rejected' then timezone('utc', now()) else null end,
    updated_at = timezone('utc', now())
  where id = p_job_order_item_id;

  return p_job_order_item_id;
end;
$$;
