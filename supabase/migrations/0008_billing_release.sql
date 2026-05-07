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
  v_job_order public.job_orders%rowtype;
  v_invoice_id uuid;
  v_subtotal numeric(12,2);
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

create or replace function public.record_invoice_payment(
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
  v_new_paid_amount numeric(12,2);
  v_new_balance numeric(12,2);
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
    v_invoice.id,
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
  where id = v_invoice.id;

  if v_invoice.job_order_id is not null and v_new_balance = 0 then
    update public.job_orders
    set
      status = 'paid',
      updated_at = timezone('utc', now())
    where id = v_invoice.job_order_id
      and status in ('ready_for_billing', 'completed');
  end if;

  return v_payment_id;
end;
$$;

create or replace function public.release_job_order_vehicle(
  p_job_order_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_order public.job_orders%rowtype;
  v_invoice public.invoices%rowtype;
  v_settings public.business_settings%rowtype;
begin
  select *
  into v_job_order
  from public.job_orders
  where id = p_job_order_id
  for update;

  if not found then
    raise exception 'Job order does not exist.';
  end if;

  if v_job_order.status = 'released' then
    return p_job_order_id;
  end if;

  if v_job_order.status = 'cancelled' then
    raise exception 'Cancelled job orders cannot be released.';
  end if;

  select *
  into v_invoice
  from public.invoices
  where job_order_id = p_job_order_id
  for update;

  if not found then
    raise exception 'An invoice must exist before the vehicle can be released.';
  end if;

  if v_invoice.status = 'cancelled' then
    raise exception 'Cancelled invoices cannot be used for vehicle release.';
  end if;

  select *
  into v_settings
  from public.business_settings
  where branch_id = v_job_order.branch_id;

  if not found then
    raise exception 'Business settings are not configured for this branch.';
  end if;

  if v_invoice.balance > 0 and (
    v_settings.require_full_payment_before_release
    or not v_settings.allow_release_with_balance
  ) then
    raise exception 'The vehicle cannot be released with an unpaid balance.';
  end if;

  update public.job_orders
  set
    status = 'released',
    released_at = coalesce(released_at, timezone('utc', now())),
    updated_at = timezone('utc', now())
  where id = p_job_order_id;

  return p_job_order_id;
end;
$$;
