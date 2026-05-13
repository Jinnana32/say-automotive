alter table public.business_settings
  add column if not exists require_additional_item_preapproval boolean not null default true;

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
  v_requires_preapproval boolean := true;
  v_initial_approval_status public.approval_status := 'not_required';
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

  select coalesce(bs.require_additional_item_preapproval, true)
  into v_requires_preapproval
  from public.business_settings bs
  where bs.branch_id = v_job_order.branch_id;

  if v_requires_preapproval then
    v_initial_approval_status := 'pending';
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
    v_initial_approval_status,
    'planned'
  );

  if v_requires_preapproval and v_job_order.status in ('in_progress', 'waiting_for_parts') then
    update public.job_orders
    set
      status = 'waiting_for_customer_approval',
      updated_at = timezone('utc', now())
    where id = p_job_order_id;
  end if;

  return v_item_id;
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
  v_item public.job_order_items%rowtype;
  v_job_order public.job_orders%rowtype;
  v_stock public.inventory_stocks%rowtype;
  v_usage_id uuid;
  v_stock_movement_id uuid;
  v_total_used numeric(14,4);
  v_total_returned numeric(14,4);
  v_net_used numeric(14,4);
  v_new_quantity numeric(14,4);
begin
  if p_quantity <= 0 then
    raise exception 'Usage quantity must be greater than zero.';
  end if;

  select *
  into v_item
  from public.job_order_items
  where id = p_job_order_item_id
  for update;

  if not found then
    raise exception 'Job order item does not exist.';
  end if;

  if v_item.item_type <> 'product' or v_item.product_id is null then
    raise exception 'Only product job order items can deduct inventory.';
  end if;

  if v_item.is_additional and v_item.approval_status not in ('approved', 'not_required') then
    raise exception 'Pending or rejected additional items cannot deduct inventory.';
  end if;

  select *
  into v_job_order
  from public.job_orders
  where id = v_item.job_order_id
  for update;

  if not found then
    raise exception 'Job order does not exist.';
  end if;

  if v_job_order.status in ('pending', 'ready_for_billing', 'paid', 'released', 'cancelled') then
    raise exception 'Inventory usage is not allowed at this job order status.';
  end if;

  select *
  into v_stock
  from public.inventory_stocks
  where branch_id = v_job_order.branch_id
    and product_id = v_item.product_id
  for update;

  if not found then
    raise exception 'Inventory stock is not configured for this product in the job order branch.';
  end if;

  select
    coalesce(sum(case when usage_type = 'use' then quantity else 0 end), 0),
    coalesce(sum(case when usage_type = 'return' then quantity else 0 end), 0)
  into v_total_used, v_total_returned
  from public.job_order_part_usages
  where job_order_item_id = p_job_order_item_id;

  v_net_used := v_total_used - v_total_returned;

  if v_net_used + p_quantity > v_item.quantity then
    raise exception 'Cannot use more than the job order item quantity.';
  end if;

  if v_stock.available_quantity < p_quantity then
    raise exception 'Insufficient available stock for this usage.';
  end if;

  v_usage_id := gen_random_uuid();
  v_stock_movement_id := gen_random_uuid();
  v_new_quantity := v_stock.quantity_on_hand - p_quantity;

  insert into public.stock_movements (
    id,
    branch_id,
    product_id,
    movement_type,
    quantity,
    previous_quantity,
    new_quantity,
    reference_type,
    reference_id,
    notes,
    created_by
  )
  values (
    v_stock_movement_id,
    v_job_order.branch_id,
    v_item.product_id,
    'service_usage',
    p_quantity,
    v_stock.quantity_on_hand,
    v_new_quantity,
    'job_order_part_usage',
    v_usage_id,
    nullif(trim(p_notes), ''),
    p_performed_by
  );

  update public.inventory_stocks
  set quantity_on_hand = v_new_quantity
  where id = v_stock.id;

  insert into public.job_order_part_usages (
    id,
    job_order_id,
    job_order_item_id,
    branch_id,
    product_id,
    usage_type,
    quantity,
    stock_movement_id,
    notes,
    performed_by
  )
  values (
    v_usage_id,
    v_item.job_order_id,
    v_item.id,
    v_job_order.branch_id,
    v_item.product_id,
    'use',
    p_quantity,
    v_stock_movement_id,
    nullif(trim(p_notes), ''),
    p_performed_by
  );

  update public.job_order_items
  set
    usage_status = 'used',
    updated_at = timezone('utc', now())
  where id = v_item.id;

  return v_usage_id;
end;
$$;
