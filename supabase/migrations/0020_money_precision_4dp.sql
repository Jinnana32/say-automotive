alter table public.products
  alter column cost_price type numeric(14,4) using cost_price::numeric(14,4),
  alter column selling_price type numeric(14,4) using selling_price::numeric(14,4);

alter table public.services
  alter column labor_price type numeric(14,4) using labor_price::numeric(14,4);

alter table public.quotations
  alter column subtotal type numeric(14,4) using subtotal::numeric(14,4),
  alter column discount type numeric(14,4) using discount::numeric(14,4),
  alter column tax type numeric(14,4) using tax::numeric(14,4),
  alter column total_amount type numeric(14,4) using total_amount::numeric(14,4);

alter table public.quotation_items
  alter column unit_price type numeric(14,4) using unit_price::numeric(14,4),
  alter column total type numeric(14,4) using total::numeric(14,4);

alter table public.job_order_items
  alter column unit_price type numeric(14,4) using unit_price::numeric(14,4),
  alter column total type numeric(14,4) using total::numeric(14,4);

alter table public.sales
  alter column subtotal type numeric(14,4) using subtotal::numeric(14,4),
  alter column discount type numeric(14,4) using discount::numeric(14,4),
  alter column tax type numeric(14,4) using tax::numeric(14,4),
  alter column total_amount type numeric(14,4) using total_amount::numeric(14,4);

alter table public.sale_items
  alter column unit_price type numeric(14,4) using unit_price::numeric(14,4),
  alter column total type numeric(14,4) using total::numeric(14,4);

alter table public.invoices
  alter column subtotal type numeric(14,4) using subtotal::numeric(14,4),
  alter column discount type numeric(14,4) using discount::numeric(14,4),
  alter column tax type numeric(14,4) using tax::numeric(14,4),
  alter column total_amount type numeric(14,4) using total_amount::numeric(14,4),
  alter column paid_amount type numeric(14,4) using paid_amount::numeric(14,4),
  alter column balance type numeric(14,4) using balance::numeric(14,4);

alter table public.invoice_items
  alter column unit_price type numeric(14,4) using unit_price::numeric(14,4),
  alter column total type numeric(14,4) using total::numeric(14,4);

alter table public.payments
  alter column amount type numeric(14,4) using amount::numeric(14,4);

alter table public.staff_compensation_profiles
  alter column base_rate type numeric(14,4) using base_rate::numeric(14,4),
  alter column overtime_rate type numeric(14,4) using overtime_rate::numeric(14,4),
  alter column allowance_per_period type numeric(14,4) using allowance_per_period::numeric(14,4);

create or replace function public.create_invoice_from_job_order_impl(
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
  v_job_order public.job_orders%rowtype;
  v_invoice_id uuid;
  v_subtotal numeric(14,4);
begin
  select *
  into v_job_order
  from public.job_orders
  where id = p_job_order_id
  for update;

  if not found then
    raise exception 'Job order does not exist.';
  end if;

  select id
  into v_invoice_id
  from public.invoices
  where job_order_id = p_job_order_id
  limit 1;

  if v_invoice_id is not null then
    return v_invoice_id;
  end if;

  if v_job_order.status <> 'ready_for_billing' then
    raise exception 'Only job orders marked ready for billing can generate an invoice.';
  end if;

  if exists (
    select 1
    from public.job_order_items
    where job_order_id = p_job_order_id
      and is_additional = true
      and approval_status = 'pending'
  ) then
    raise exception 'Pending additional items must be resolved before invoicing.';
  end if;

  select coalesce(sum(total), 0)
  into v_subtotal
  from public.job_order_items
  where job_order_id = p_job_order_id
    and approval_status in ('not_required', 'approved');

  if v_subtotal <= 0 then
    raise exception 'No billable job order items are available for invoicing.';
  end if;

  v_invoice_id := gen_random_uuid();

  insert into public.invoices (
    id,
    invoice_number,
    job_order_id,
    customer_id,
    vehicle_id,
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
    public.next_document_number('invoice'),
    v_job_order.id,
    v_job_order.customer_id,
    v_job_order.vehicle_id,
    p_invoice_date,
    v_subtotal,
    0,
    0,
    v_subtotal,
    0,
    v_subtotal,
    'unpaid',
    p_created_by
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
  select
    v_invoice_id,
    'job_order_item',
    joi.id,
    row_number() over (order by joi.line_number),
    joi.item_type,
    joi.description,
    joi.quantity,
    joi.unit_price,
    joi.total
  from public.job_order_items joi
  where joi.job_order_id = p_job_order_id
    and joi.approval_status in ('not_required', 'approved')
  order by joi.line_number;

  return v_invoice_id;
end;
$$;

create or replace function public.record_invoice_payment_impl(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_method public.payment_method,
  p_reference_number text default null,
  p_notes text default null,
  p_received_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.invoices%rowtype;
  v_job_order public.job_orders%rowtype;
  v_sale public.sales%rowtype;
  v_branch_id uuid;
  v_settings public.business_settings%rowtype;
  v_payment_id uuid;
  v_new_paid_amount numeric(14,4);
  v_new_balance numeric(14,4);
  v_new_status public.invoice_status;
begin
  if p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero.';
  end if;

  select *
  into v_invoice
  from public.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice does not exist.';
  end if;

  if v_invoice.status = 'cancelled' then
    raise exception 'Cancelled invoices cannot receive payments.';
  end if;

  if v_invoice.balance <= 0 then
    raise exception 'This invoice is already fully paid.';
  end if;

  if p_amount > v_invoice.balance then
    raise exception 'Payment amount cannot exceed the remaining balance.';
  end if;

  if v_invoice.job_order_id is not null then
    select *
    into v_job_order
    from public.job_orders
    where id = v_invoice.job_order_id;

    v_branch_id := v_job_order.branch_id;
  elsif v_invoice.sale_id is not null then
    select *
    into v_sale
    from public.sales
    where id = v_invoice.sale_id;

    v_branch_id := v_sale.branch_id;
  else
    raise exception 'Invoice is not connected to a billable source.';
  end if;

  select *
  into v_settings
  from public.business_settings
  where branch_id = v_branch_id;

  if not found then
    raise exception 'Business settings are not configured for this branch.';
  end if;

  if not v_settings.allow_partial_payments and p_amount <> v_invoice.balance then
    raise exception 'Partial payments are disabled for this branch.';
  end if;

  v_payment_id := gen_random_uuid();
  v_new_paid_amount := v_invoice.paid_amount + p_amount;
  v_new_balance := v_invoice.total_amount - v_new_paid_amount;
  v_new_status := case
    when v_new_balance = 0 then 'paid'
    when v_new_paid_amount > 0 then 'partially_paid'
    else 'unpaid'
  end;

  insert into public.payments (
    id,
    invoice_id,
    amount,
    payment_method,
    reference_number,
    received_by,
    notes
  )
  values (
    v_payment_id,
    p_invoice_id,
    p_amount,
    p_payment_method,
    nullif(trim(p_reference_number), ''),
    p_received_by,
    nullif(trim(p_notes), '')
  );

  update public.invoices
  set
    paid_amount = v_new_paid_amount,
    balance = v_new_balance,
    status = v_new_status,
    updated_at = timezone('utc', now())
  where id = p_invoice_id;

  return v_payment_id;
end;
$$;

create or replace function public.complete_pos_sale_impl(
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
      gen_random_uuid(),
      p_branch_id,
      v_product.id,
      'sale',
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
    p_reference_number,
    p_notes,
    p_cashier_user_id
  );

  update public.invoices
  set
    invoice_date = p_invoice_date,
    updated_at = timezone('utc', now())
  where id = v_invoice_id;

  return v_sale_id;
end;
$$;
