alter table public.business_settings
  add column if not exists allow_global_product_catalog boolean not null default false,
  add column if not exists allow_global_service_catalog boolean not null default false;

alter table public.products
  add column if not exists is_global boolean not null default false;

alter table public.services
  add column if not exists is_global boolean not null default false;

with main_branch as (
  select id
  from public.branches
  where is_main = true
  limit 1
)
update public.products
set
  branch_id = main_branch.id,
  is_global = false
from main_branch
where public.products.branch_id is null;

with main_branch as (
  select id
  from public.branches
  where is_main = true
  limit 1
)
update public.services
set
  branch_id = main_branch.id,
  is_global = false
from main_branch
where public.services.branch_id is null;

alter table public.products
  alter column branch_id set not null;

alter table public.services
  alter column branch_id set not null;

drop index if exists products_sku_unique_idx;
drop index if exists products_barcode_unique_idx;

create unique index if not exists products_sku_unique_idx
  on public.products (branch_id, lower(sku))
  where sku is not null;

create unique index if not exists products_barcode_unique_idx
  on public.products (branch_id, lower(barcode))
  where barcode is not null;

create index if not exists products_branch_id_is_global_idx
  on public.products (branch_id, is_global, status);

create index if not exists services_branch_id_idx
  on public.services (branch_id);

create index if not exists services_branch_id_is_global_idx
  on public.services (branch_id, is_global, status);

create or replace function public.branch_allows_global_product_catalog(p_branch_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (
      select bs.allow_global_product_catalog
      from public.business_settings as bs
      where bs.branch_id = p_branch_id
      limit 1
    ),
    false
  );
$$;

create or replace function public.branch_allows_global_service_catalog(p_branch_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (
      select bs.allow_global_service_catalog
      from public.business_settings as bs
      where bs.branch_id = p_branch_id
      limit 1
    ),
    false
  );
$$;

create or replace function public.can_branch_use_product(
  p_branch_id uuid,
  p_product_branch_id uuid,
  p_is_global boolean
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    p_branch_id is not null
    and p_product_branch_id is not null
    and (
      p_product_branch_id = p_branch_id
      or (
        coalesce(p_is_global, false)
        and public.branch_allows_global_product_catalog(p_branch_id)
      )
    );
$$;

create or replace function public.can_branch_use_service(
  p_branch_id uuid,
  p_service_branch_id uuid,
  p_is_global boolean
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    p_branch_id is not null
    and p_service_branch_id is not null
    and (
      p_service_branch_id = p_branch_id
      or (
        coalesce(p_is_global, false)
        and public.branch_allows_global_service_catalog(p_branch_id)
      )
    );
$$;

create or replace function public.can_access_product_catalog_record(
  p_product_branch_id uuid,
  p_is_global boolean
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    public.has_global_branch_access()
    or public.can_access_branch(p_product_branch_id)
    or (
      coalesce(p_is_global, false)
      and public.branch_allows_global_product_catalog(public.current_staff_branch_id())
    );
$$;

create or replace function public.can_access_service_catalog_record(
  p_service_branch_id uuid,
  p_is_global boolean
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    public.has_global_branch_access()
    or public.can_access_branch(p_service_branch_id)
    or (
      coalesce(p_is_global, false)
      and public.branch_allows_global_service_catalog(public.current_staff_branch_id())
    );
$$;

revoke all on function public.branch_allows_global_product_catalog(uuid) from public, anon;
revoke all on function public.branch_allows_global_service_catalog(uuid) from public, anon;
revoke all on function public.can_branch_use_product(uuid, uuid, boolean) from public, anon;
revoke all on function public.can_branch_use_service(uuid, uuid, boolean) from public, anon;
revoke all on function public.can_access_product_catalog_record(uuid, boolean) from public, anon;
revoke all on function public.can_access_service_catalog_record(uuid, boolean) from public, anon;

grant execute on function public.branch_allows_global_product_catalog(uuid) to authenticated;
grant execute on function public.branch_allows_global_service_catalog(uuid) to authenticated;
grant execute on function public.can_branch_use_product(uuid, uuid, boolean) to authenticated;
grant execute on function public.can_branch_use_service(uuid, uuid, boolean) to authenticated;
grant execute on function public.can_access_product_catalog_record(uuid, boolean) to authenticated;
grant execute on function public.can_access_service_catalog_record(uuid, boolean) to authenticated;

drop policy if exists products_select_active_staff on public.products;
create policy products_select_active_staff
on public.products
for select
to authenticated
using (
  public.is_active_staff()
  and public.can_access_product_catalog_record(branch_id, is_global)
);

drop policy if exists products_insert_inventory_team on public.products;
create policy products_insert_inventory_team
on public.products
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[])
  and public.can_access_branch(branch_id)
  and (
    not is_global
    or public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  )
);

drop policy if exists products_update_inventory_team on public.products;
create policy products_update_inventory_team
on public.products
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[])
  and public.can_access_branch(branch_id)
  and (
    not is_global
    or public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  )
)
with check (
  public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[])
  and public.can_access_branch(branch_id)
  and (
    not is_global
    or public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  )
);

drop policy if exists services_select_active_staff on public.services;
create policy services_select_active_staff
on public.services
for select
to authenticated
using (
  public.is_active_staff()
  and public.can_access_service_catalog_record(branch_id, is_global)
);

drop policy if exists services_insert_service_team on public.services;
create policy services_insert_service_team
on public.services
for insert
to authenticated
with check (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  and public.can_access_branch(branch_id)
  and (
    not is_global
    or public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  )
);

drop policy if exists services_update_service_team on public.services;
create policy services_update_service_team
on public.services
for update
to authenticated
using (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  and public.can_access_branch(branch_id)
  and (
    not is_global
    or public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  )
)
with check (
  public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[])
  and public.can_access_branch(branch_id)
  and (
    not is_global
    or public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
  )
);

create or replace function public.validate_quotation_item_catalog_visibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch_id uuid;
  v_product public.products%rowtype;
  v_service public.services%rowtype;
begin
  select branch_id
  into v_branch_id
  from public.quotations
  where id = new.quotation_id;

  if v_branch_id is null then
    raise exception 'Quotation does not exist.';
  end if;

  if new.product_id is not null then
    select *
    into v_product
    from public.products
    where id = new.product_id;

    if not found then
      raise exception 'Selected product does not exist.';
    end if;

    if not public.can_branch_use_product(v_branch_id, v_product.branch_id, v_product.is_global) then
      raise exception 'Selected product is not available in this branch.';
    end if;
  end if;

  if new.service_id is not null then
    select *
    into v_service
    from public.services
    where id = new.service_id;

    if not found then
      raise exception 'Selected service does not exist.';
    end if;

    if not public.can_branch_use_service(v_branch_id, v_service.branch_id, v_service.is_global) then
      raise exception 'Selected service is not available in this branch.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_quotation_item_catalog_visibility on public.quotation_items;
create trigger validate_quotation_item_catalog_visibility
before insert or update on public.quotation_items
for each row
execute function public.validate_quotation_item_catalog_visibility();

create or replace function public.validate_job_order_item_catalog_visibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch_id uuid;
  v_product public.products%rowtype;
  v_service public.services%rowtype;
begin
  select branch_id
  into v_branch_id
  from public.job_orders
  where id = new.job_order_id;

  if v_branch_id is null then
    raise exception 'Job order does not exist.';
  end if;

  if new.product_id is not null then
    select *
    into v_product
    from public.products
    where id = new.product_id;

    if not found then
      raise exception 'Selected product does not exist.';
    end if;

    if not public.can_branch_use_product(v_branch_id, v_product.branch_id, v_product.is_global) then
      raise exception 'Selected product is not available in this branch.';
    end if;
  end if;

  if new.service_id is not null then
    select *
    into v_service
    from public.services
    where id = new.service_id;

    if not found then
      raise exception 'Selected service does not exist.';
    end if;

    if not public.can_branch_use_service(v_branch_id, v_service.branch_id, v_service.is_global) then
      raise exception 'Selected service is not available in this branch.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_job_order_item_catalog_visibility on public.job_order_items;
create trigger validate_job_order_item_catalog_visibility
before insert or update on public.job_order_items
for each row
execute function public.validate_job_order_item_catalog_visibility();

create or replace function public.complete_pos_sale(
  p_branch_id uuid,
  p_items jsonb,
  p_customer_id uuid default null,
  p_discount numeric default 0,
  p_payment_amount numeric default 0,
  p_payment_method public.payment_method default 'cash',
  p_reference_number text default null,
  p_notes text default null,
  p_cashier_user_id uuid default null,
  p_invoice_date date default current_date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.business_settings%rowtype;
  v_sale_id uuid := gen_random_uuid();
  v_invoice_id uuid := gen_random_uuid();
  v_payment_id uuid := gen_random_uuid();
  v_sale_number text;
  v_invoice_number text;
  v_item jsonb;
  v_line_number integer := 0;
  v_product public.products%rowtype;
  v_stock public.inventory_stocks%rowtype;
  v_sale_item_id uuid;
  v_quantity numeric(14,4);
  v_line_total numeric(14,4);
  v_subtotal numeric(14,4) := 0;
  v_discount numeric(14,4);
  v_tax numeric(14,4);
  v_total numeric(14,4);
  v_new_quantity numeric(14,4);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'A POS sale must include at least one product.';
  end if;

  if exists (
    select 1
    from (
      select value->>'productId' as product_id, count(*) as item_count
      from jsonb_array_elements(p_items)
      group by 1
      having count(*) > 1
    ) duplicate_items
  ) then
    raise exception 'Duplicate products are not allowed in a POS sale.';
  end if;

  if p_discount < 0 then
    raise exception 'Discount cannot be negative.';
  end if;

  if p_payment_amount <= 0 then
    raise exception 'Payment amount must be greater than zero.';
  end if;

  select *
  into v_settings
  from public.business_settings
  where branch_id = p_branch_id;

  if not found then
    raise exception 'Business settings are not configured for this branch.';
  end if;

  if p_customer_id is not null then
    perform 1
    from public.customers
    where id = p_customer_id
      and branch_id = p_branch_id;

    if not found then
      raise exception 'Customer does not exist in this branch.';
    end if;
  end if;

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::numeric;

    if v_quantity <= 0 then
      raise exception 'Sale item quantities must be greater than zero.';
    end if;

    select *
    into v_product
    from public.products
    where id = (v_item->>'productId')::uuid
    for share;

    if not found then
      raise exception 'A selected product does not exist.';
    end if;

    if v_product.status <> 'active' then
      raise exception 'Inactive products cannot be sold through POS.';
    end if;

    if not public.can_branch_use_product(p_branch_id, v_product.branch_id, v_product.is_global) then
      raise exception 'A selected product is not available in this branch.';
    end if;

    select *
    into v_stock
    from public.inventory_stocks
    where branch_id = p_branch_id
      and product_id = v_product.id
    for update;

    if not found then
      raise exception 'Inventory stock is not configured for product % in this branch.', v_product.name;
    end if;

    if v_stock.available_quantity < v_quantity then
      raise exception 'Insufficient available stock for product %.', v_product.name;
    end if;

    v_line_total := round(v_quantity * v_product.selling_price, 4);
    v_subtotal := round(v_subtotal + v_line_total, 4);
  end loop;

  if p_discount > v_subtotal then
    raise exception 'Discount cannot exceed the sale subtotal.';
  end if;

  v_discount := round(p_discount, 4);
  v_tax := round(greatest(v_subtotal - v_discount, 0) * (coalesce(v_settings.default_tax_rate, 0) / 100), 4);
  v_total := round(v_subtotal - v_discount + v_tax, 4);

  if v_total <= 0 then
    raise exception 'The sale total must be greater than zero.';
  end if;

  if p_payment_amount > v_total then
    raise exception 'Payment amount cannot exceed the sale total.';
  end if;

  if not v_settings.allow_partial_payments and p_payment_amount <> v_total then
    raise exception 'This branch requires the POS payment to cover the full sale total.';
  end if;

  v_sale_number := public.next_document_number('sale', p_branch_id);
  v_invoice_number := public.next_document_number('invoice', p_branch_id);

  insert into public.sales (
    id,
    sale_number,
    branch_id,
    customer_id,
    cashier_user_id,
    subtotal,
    discount,
    tax,
    total_amount,
    status
  )
  values (
    v_sale_id,
    v_sale_number,
    p_branch_id,
    p_customer_id,
    p_cashier_user_id,
    v_subtotal,
    v_discount,
    v_tax,
    v_total,
    'completed'
  );

  insert into public.invoices (
    id,
    invoice_number,
    branch_id,
    sale_id,
    customer_id,
    invoice_date,
    subtotal,
    discount,
    tax,
    total_amount,
    paid_amount,
    balance,
    status,
    created_by
  )
  values (
    v_invoice_id,
    v_invoice_number,
    p_branch_id,
    v_sale_id,
    p_customer_id,
    p_invoice_date,
    v_subtotal,
    v_discount,
    v_tax,
    v_total,
    0,
    v_total,
    'unpaid',
    p_cashier_user_id
  );

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    v_line_number := v_line_number + 1;
    v_quantity := (v_item->>'quantity')::numeric;

    select *
    into v_product
    from public.products
    where id = (v_item->>'productId')::uuid;

    select *
    into v_stock
    from public.inventory_stocks
    where branch_id = p_branch_id
      and product_id = v_product.id
    for update;

    v_line_total := round(v_quantity * v_product.selling_price, 4);
    v_sale_item_id := gen_random_uuid();
    v_new_quantity := v_stock.quantity_on_hand - v_quantity;

    insert into public.sale_items (
      id,
      sale_id,
      line_number,
      product_id,
      description,
      quantity,
      unit_price,
      total
    )
    values (
      v_sale_item_id,
      v_sale_id,
      v_line_number,
      v_product.id,
      v_product.name,
      v_quantity,
      v_product.selling_price,
      v_line_total
    );

    insert into public.invoice_items (
      invoice_id,
      line_number,
      item_type,
      product_id,
      description,
      quantity,
      unit_label_snapshot,
      unit_price,
      total
    )
    select
      v_invoice_id,
      v_line_number,
      'product',
      v_product.id,
      v_product.name,
      v_quantity,
      case
        when u.id is not null then concat(u.name, ' (', u.abbreviation, ')')
        else null
      end,
      v_product.selling_price,
      v_line_total
    from public.products as p
    left join public.units as u on u.id = p.unit_id
    where p.id = v_product.id;

    update public.inventory_stocks
    set quantity_on_hand = v_new_quantity
    where branch_id = p_branch_id
      and product_id = v_product.id;

    insert into public.stock_movements (
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
      p_branch_id,
      v_product.id,
      'pos_sale',
      v_quantity,
      v_stock.quantity_on_hand,
      v_new_quantity,
      'sale',
      v_sale_id,
      nullif(trim(p_notes), ''),
      p_cashier_user_id
    );
  end loop;

  insert into public.payments (
    id,
    invoice_id,
    branch_id,
    payment_method,
    reference_number,
    amount,
    notes,
    received_by,
    paid_at
  )
  values (
    v_payment_id,
    v_invoice_id,
    p_branch_id,
    p_payment_method,
    nullif(trim(p_reference_number), ''),
    p_payment_amount,
    nullif(trim(p_notes), ''),
    p_cashier_user_id,
    timezone('utc', now())
  );

  update public.invoices
  set
    paid_amount = p_payment_amount,
    balance = round(v_total - p_payment_amount, 4),
    status = case
      when p_payment_amount >= v_total then 'paid'::public.invoice_status
      else 'partially_paid'::public.invoice_status
    end
  where id = v_invoice_id;

  return v_invoice_id;
end;
$$;

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

  if not public.can_branch_use_product(p_branch_id, v_product.branch_id, v_product.is_global) then
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

  if not public.can_branch_use_product(p_branch_id, v_product.branch_id, v_product.is_global) then
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

  if not public.can_branch_use_product(p_branch_id, v_product.branch_id, v_product.is_global) then
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
