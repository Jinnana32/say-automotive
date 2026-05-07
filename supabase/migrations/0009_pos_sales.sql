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
  v_sale_number text;
  v_invoice_number text;
  v_item jsonb;
  v_line_number integer := 0;
  v_product public.products%rowtype;
  v_stock public.inventory_stocks%rowtype;
  v_sale_item_id uuid;
  v_quantity numeric(14,4);
  v_line_total numeric(12,2);
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2);
  v_tax numeric(12,2);
  v_total numeric(12,2);
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
    where id = p_customer_id;

    if not found then
      raise exception 'Customer does not exist.';
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

    if v_product.branch_id is not null and v_product.branch_id <> p_branch_id then
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

    v_line_total := round(v_quantity * v_product.selling_price, 2);
    v_subtotal := round(v_subtotal + v_line_total, 2);
  end loop;

  if p_discount > v_subtotal then
    raise exception 'Discount cannot exceed the sale subtotal.';
  end if;

  v_discount := round(p_discount, 2);
  v_tax := round(greatest(v_subtotal - v_discount, 0) * (coalesce(v_settings.default_tax_rate, 0) / 100), 2);
  v_total := round(v_subtotal - v_discount + v_tax, 2);

  if v_total <= 0 then
    raise exception 'The sale total must be greater than zero.';
  end if;

  if p_payment_amount > v_total then
    raise exception 'Payment amount cannot exceed the sale total.';
  end if;

  if not v_settings.allow_partial_payments and p_payment_amount <> v_total then
    raise exception 'This branch requires the POS payment to cover the full sale total.';
  end if;

  v_sale_number := public.next_document_number('sale');
  v_invoice_number := public.next_document_number('invoice');

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

    v_line_total := round(v_quantity * v_product.selling_price, 2);
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
      source_type,
      source_id,
      line_number,
      item_type,
      description,
      quantity,
      unit_price,
      total
    )
    values (
      v_invoice_id,
      'sale_item',
      v_sale_item_id,
      v_line_number,
      'product',
      v_product.name,
      v_quantity,
      v_product.selling_price,
      v_line_total
    );

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
      'sale_item',
      v_sale_item_id,
      nullif(trim(p_notes), ''),
      p_cashier_user_id
    );

    update public.inventory_stocks
    set quantity_on_hand = v_new_quantity
    where id = v_stock.id;
  end loop;

  perform public.record_invoice_payment(
    v_invoice_id,
    p_payment_amount,
    p_payment_method,
    nullif(trim(p_reference_number), ''),
    nullif(trim(p_notes), ''),
    p_cashier_user_id
  );

  return v_invoice_id;
end;
$$;
