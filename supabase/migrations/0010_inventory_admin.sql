create or replace function public.receive_inventory_stock(
  p_branch_id uuid,
  p_product_id uuid,
  p_quantity numeric,
  p_notes text default null,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_stock public.inventory_stocks%rowtype;
  v_stock_movement_id uuid := gen_random_uuid();
  v_new_quantity numeric(14,4);
begin
  if p_quantity <= 0 then
    raise exception 'Received quantity must be greater than zero.';
  end if;

  select *
  into v_product
  from public.products
  where id = p_product_id;

  if not found then
    raise exception 'Product does not exist.';
  end if;

  if v_product.branch_id is not null and v_product.branch_id <> p_branch_id then
    raise exception 'Product is not available in this branch.';
  end if;

  select *
  into v_stock
  from public.inventory_stocks
  where branch_id = p_branch_id
    and product_id = p_product_id
  for update;

  if not found then
    insert into public.inventory_stocks (
      branch_id,
      product_id,
      quantity_on_hand,
      reserved_quantity,
      reorder_level,
      shelf_location
    )
    values (
      p_branch_id,
      p_product_id,
      0,
      0,
      v_product.reorder_level,
      nullif(trim(coalesce(v_product.shelf_location, '')), '')
    )
    on conflict (branch_id, product_id) do nothing
    returning * into v_stock;

    if not found then
      select *
      into v_stock
      from public.inventory_stocks
      where branch_id = p_branch_id
        and product_id = p_product_id
      for update;
    end if;
  end if;

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
    p_branch_id,
    p_product_id,
    'stock_in',
    p_quantity,
    v_stock.quantity_on_hand,
    v_new_quantity,
    'inventory_receiving',
    null,
    nullif(trim(p_notes), ''),
    p_created_by
  );

  update public.inventory_stocks
  set quantity_on_hand = v_new_quantity
  where id = v_stock.id;

  return v_stock_movement_id;
end;
$$;

create or replace function public.reconcile_inventory_stock(
  p_branch_id uuid,
  p_product_id uuid,
  p_counted_quantity numeric,
  p_notes text default null,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_stock public.inventory_stocks%rowtype;
  v_stock_movement_id uuid := gen_random_uuid();
  v_movement_quantity numeric(14,4);
begin
  if p_counted_quantity < 0 then
    raise exception 'Counted quantity cannot be negative.';
  end if;

  select *
  into v_product
  from public.products
  where id = p_product_id;

  if not found then
    raise exception 'Product does not exist.';
  end if;

  if v_product.branch_id is not null and v_product.branch_id <> p_branch_id then
    raise exception 'Product is not available in this branch.';
  end if;

  select *
  into v_stock
  from public.inventory_stocks
  where branch_id = p_branch_id
    and product_id = p_product_id
  for update;

  if not found then
    insert into public.inventory_stocks (
      branch_id,
      product_id,
      quantity_on_hand,
      reserved_quantity,
      reorder_level,
      shelf_location
    )
    values (
      p_branch_id,
      p_product_id,
      0,
      0,
      v_product.reorder_level,
      nullif(trim(coalesce(v_product.shelf_location, '')), '')
    )
    on conflict (branch_id, product_id) do nothing
    returning * into v_stock;

    if not found then
      select *
      into v_stock
      from public.inventory_stocks
      where branch_id = p_branch_id
        and product_id = p_product_id
      for update;
    end if;
  end if;

  if p_counted_quantity < v_stock.reserved_quantity then
    raise exception 'Counted quantity cannot be lower than the reserved quantity.';
  end if;

  if p_counted_quantity = v_stock.quantity_on_hand then
    raise exception 'Counted quantity already matches the current stock.';
  end if;

  v_movement_quantity := abs(p_counted_quantity - v_stock.quantity_on_hand);

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
    p_branch_id,
    p_product_id,
    'adjustment',
    v_movement_quantity,
    v_stock.quantity_on_hand,
    p_counted_quantity,
    'inventory_recount',
    null,
    nullif(trim(p_notes), ''),
    p_created_by
  );

  update public.inventory_stocks
  set quantity_on_hand = p_counted_quantity
  where id = v_stock.id;

  return v_stock_movement_id;
end;
$$;

create or replace function public.mark_inventory_stock_damaged(
  p_branch_id uuid,
  p_product_id uuid,
  p_quantity numeric,
  p_notes text default null,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock public.inventory_stocks%rowtype;
  v_stock_movement_id uuid := gen_random_uuid();
  v_new_quantity numeric(14,4);
begin
  if p_quantity <= 0 then
    raise exception 'Damaged quantity must be greater than zero.';
  end if;

  select *
  into v_stock
  from public.inventory_stocks
  where branch_id = p_branch_id
    and product_id = p_product_id
  for update;

  if not found then
    raise exception 'Inventory stock is not configured for this product in the selected branch.';
  end if;

  if v_stock.available_quantity < p_quantity then
    raise exception 'Insufficient available stock to mark as damaged.';
  end if;

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
    p_branch_id,
    p_product_id,
    'damaged',
    p_quantity,
    v_stock.quantity_on_hand,
    v_new_quantity,
    'inventory_damage',
    null,
    nullif(trim(p_notes), ''),
    p_created_by
  );

  update public.inventory_stocks
  set quantity_on_hand = v_new_quantity
  where id = v_stock.id;

  return v_stock_movement_id;
end;
$$;

create or replace function public.update_inventory_stock_settings(
  p_branch_id uuid,
  p_product_id uuid,
  p_reorder_level numeric default null,
  p_shelf_location text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_stock public.inventory_stocks%rowtype;
begin
  if p_reorder_level is not null and p_reorder_level < 0 then
    raise exception 'Reorder level cannot be negative.';
  end if;

  select *
  into v_product
  from public.products
  where id = p_product_id;

  if not found then
    raise exception 'Product does not exist.';
  end if;

  if v_product.branch_id is not null and v_product.branch_id <> p_branch_id then
    raise exception 'Product is not available in this branch.';
  end if;

  select *
  into v_stock
  from public.inventory_stocks
  where branch_id = p_branch_id
    and product_id = p_product_id
  for update;

  if not found then
    insert into public.inventory_stocks (
      branch_id,
      product_id,
      quantity_on_hand,
      reserved_quantity,
      reorder_level,
      shelf_location
    )
    values (
      p_branch_id,
      p_product_id,
      0,
      0,
      coalesce(p_reorder_level, v_product.reorder_level),
      coalesce(
        nullif(trim(coalesce(p_shelf_location, '')), ''),
        nullif(trim(coalesce(v_product.shelf_location, '')), '')
      )
    )
    on conflict (branch_id, product_id) do nothing
    returning * into v_stock;

    if not found then
      select *
      into v_stock
      from public.inventory_stocks
      where branch_id = p_branch_id
        and product_id = p_product_id
      for update;
    end if;
  end if;

  update public.inventory_stocks
  set
    reorder_level = p_reorder_level,
    shelf_location = nullif(trim(coalesce(p_shelf_location, '')), '')
  where id = v_stock.id;

  return v_stock.id;
end;
$$;
