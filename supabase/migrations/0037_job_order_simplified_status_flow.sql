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

  if v_job_order.status in ('ready_for_billing', 'paid', 'released', 'cancelled') then
    raise exception 'This job order status can no longer be changed from operational controls.';
  end if;

  if (v_job_order.status, p_next_status) not in (
    ('pending', 'in_progress'),
    ('pending', 'cancelled'),
    ('in_progress', 'completed'),
    ('in_progress', 'cancelled'),
    ('waiting_for_parts', 'completed'),
    ('waiting_for_parts', 'cancelled'),
    ('waiting_for_customer_approval', 'completed'),
    ('waiting_for_customer_approval', 'cancelled')
  ) then
    raise exception 'Invalid job order transition from "%" to "%".', v_job_order.status, p_next_status;
  end if;

  if p_next_status = 'completed' then
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
      when p_next_status in ('in_progress', 'completed')
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
    raise exception 'Only completed-stage job orders can be released.';
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
