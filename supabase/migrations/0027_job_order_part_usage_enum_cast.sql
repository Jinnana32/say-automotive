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
    usage_status = 'used'::public.usage_status,
    updated_at = timezone('utc', now())
  where id = v_item.id;

  return v_usage_id;
end;
$$;

create or replace function public.record_job_order_part_return(
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
    raise exception 'Return quantity must be greater than zero.';
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
    raise exception 'Only product job order items can return inventory.';
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
    raise exception 'Inventory returns are not allowed at this job order status.';
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

  if p_quantity > v_net_used then
    raise exception 'Cannot return more than the net used quantity.';
  end if;

  v_usage_id := gen_random_uuid();
  v_stock_movement_id := gen_random_uuid();
  v_new_quantity := v_stock.quantity_on_hand + p_quantity;

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
    'return',
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
    'return',
    p_quantity,
    v_stock_movement_id,
    nullif(trim(p_notes), ''),
    p_performed_by
  );

  update public.job_order_items
  set
    usage_status = case
      when v_net_used - p_quantity = 0 then 'returned'::public.usage_status
      else 'used'::public.usage_status
    end,
    updated_at = timezone('utc', now())
  where id = v_item.id;

  return v_usage_id;
end;
$$;

revoke all on function public.record_job_order_part_usage(
  uuid,
  numeric,
  text,
  uuid
) from public, anon, authenticated;
revoke all on function public.record_job_order_part_return(
  uuid,
  numeric,
  text,
  uuid
) from public, anon, authenticated;

grant execute on function public.record_job_order_part_usage(
  uuid,
  numeric,
  text,
  uuid
) to authenticated;
grant execute on function public.record_job_order_part_return(
  uuid,
  numeric,
  text,
  uuid
) to authenticated;
