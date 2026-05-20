alter table public.business_settings
  add column if not exists require_invoice_before_job_completion boolean not null default false,
  add column if not exists require_invoice_before_vehicle_release boolean not null default false;

update public.business_settings
set
  require_invoice_before_job_completion = coalesce(require_invoice_before_job_completion, false),
  require_invoice_before_vehicle_release = coalesce(require_invoice_before_vehicle_release, false)
where require_invoice_before_job_completion is distinct from coalesce(require_invoice_before_job_completion, false)
   or require_invoice_before_vehicle_release is distinct from coalesce(require_invoice_before_vehicle_release, false);

create or replace function public.update_job_order_status_impl(
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
  v_settings public.business_settings%rowtype;
  v_has_pending_additional boolean;
  v_has_active_invoice boolean;
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

  if v_job_order.status in ('paid', 'released', 'cancelled') then
    raise exception 'This job order status can no longer be changed from operational controls.';
  end if;

  if (v_job_order.status, p_next_status) not in (
    ('pending', 'in_progress'),
    ('pending', 'cancelled'),
    ('in_progress', 'waiting_for_parts'),
    ('in_progress', 'waiting_for_customer_approval'),
    ('in_progress', 'ready_for_billing'),
    ('in_progress', 'completed'),
    ('in_progress', 'cancelled'),
    ('waiting_for_parts', 'in_progress'),
    ('waiting_for_parts', 'waiting_for_customer_approval'),
    ('waiting_for_parts', 'ready_for_billing'),
    ('waiting_for_parts', 'completed'),
    ('waiting_for_parts', 'cancelled'),
    ('waiting_for_customer_approval', 'in_progress'),
    ('waiting_for_customer_approval', 'waiting_for_parts'),
    ('waiting_for_customer_approval', 'ready_for_billing'),
    ('waiting_for_customer_approval', 'completed'),
    ('waiting_for_customer_approval', 'cancelled'),
    ('completed', 'ready_for_billing'),
    ('ready_for_billing', 'completed')
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

  if p_next_status = 'completed' then
    select *
    into v_settings
    from public.business_settings
    where branch_id = v_job_order.branch_id;

    if not found then
      raise exception 'Business settings are not configured for this branch.';
    end if;

    select exists (
      select 1
      from public.invoices
      where job_order_id = p_job_order_id
        and status <> 'cancelled'
    )
    into v_has_active_invoice;

    if v_settings.require_invoice_before_job_completion and not v_has_active_invoice then
      raise exception 'An invoice must exist before the job order can be completed.';
    end if;
  end if;

  update public.job_orders
  set
    status = p_next_status,
    started_at = case
      when p_next_status in ('in_progress', 'ready_for_billing', 'completed')
        then coalesce(started_at, timezone('utc', now()))
      else started_at
    end,
    completed_at = case
      when p_next_status = 'completed'
        then coalesce(completed_at, timezone('utc', now()))
      else completed_at
    end,
    updated_at = timezone('utc', now())
  where id = p_job_order_id;

  return p_job_order_id;
end;
$$;

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
  v_settings public.business_settings%rowtype;
  v_invoice_id uuid;
  v_subtotal numeric(14,4);
  v_discount numeric(14,4) := 0;
  v_tax numeric(14,4);
  v_total numeric(14,4);
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

  if v_job_order.status not in ('completed', 'ready_for_billing', 'released') then
    raise exception 'Only completed, ready-for-billing, or released job orders can generate an invoice.';
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

  select *
  into v_settings
  from public.business_settings
  where branch_id = v_job_order.branch_id;

  if not found then
    raise exception 'Business settings are not configured for this branch.';
  end if;

  select coalesce(sum(total), 0)
  into v_subtotal
  from public.job_order_items
  where job_order_id = p_job_order_id
    and approval_status in ('not_required', 'approved');

  if v_subtotal <= 0 then
    raise exception 'No billable job order items are available for invoicing.';
  end if;

  v_tax := round(greatest(v_subtotal - v_discount, 0) * (coalesce(v_settings.default_tax_rate, 0) / 100), 4);
  v_total := round(v_subtotal - v_discount + v_tax, 4);

  v_invoice_id := gen_random_uuid();

  insert into public.invoices (
    id,
    invoice_number,
    branch_id,
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
    public.next_document_number('invoice', v_job_order.branch_id),
    v_job_order.branch_id,
    v_job_order.id,
    v_job_order.customer_id,
    v_job_order.vehicle_id,
    p_invoice_date,
    v_subtotal,
    v_discount,
    v_tax,
    v_total,
    0,
    v_total,
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

create or replace function public.release_job_order_vehicle_impl(
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

  if v_job_order.status not in ('completed', 'ready_for_billing', 'paid') then
    raise exception 'Only completed, billing-ready, or paid job orders can be released.';
  end if;

  select *
  into v_settings
  from public.business_settings
  where branch_id = v_job_order.branch_id;

  if not found then
    raise exception 'Business settings are not configured for this branch.';
  end if;

  select *
  into v_invoice
  from public.invoices
  where job_order_id = p_job_order_id
  for update;

  if not found then
    if v_settings.require_invoice_before_vehicle_release then
      raise exception 'An invoice must exist before the vehicle can be released.';
    end if;
  else
    if v_invoice.status = 'cancelled' then
      if v_settings.require_invoice_before_vehicle_release then
        raise exception 'Cancelled invoices cannot be used for vehicle release.';
      end if;
    elsif v_invoice.balance > 0 and (
      v_settings.require_full_payment_before_release
      or not v_settings.allow_release_with_balance
    ) then
      raise exception 'The vehicle cannot be released with an unpaid balance.';
    end if;
  end if;

  update public.job_orders
  set
    status = 'released',
    completed_at = coalesce(completed_at, timezone('utc', now())),
    released_at = coalesce(released_at, timezone('utc', now())),
    updated_at = timezone('utc', now())
  where id = p_job_order_id;

  return p_job_order_id;
end;
$$;
