create or replace function public.update_job_order_item(
  p_job_order_item_id uuid,
  p_description text,
  p_quantity numeric,
  p_unit_price numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.job_order_items%rowtype;
  v_job_order public.job_orders%rowtype;
  v_total_used numeric(14,4);
  v_total_returned numeric(14,4);
  v_net_used numeric(14,4);
  v_next_approval_status public.approval_status;
begin
  select *
  into v_item
  from public.job_order_items
  where id = p_job_order_item_id
  for update;

  if not found then
    raise exception 'Job order item does not exist.';
  end if;

  select *
  into v_job_order
  from public.job_orders
  where id = v_item.job_order_id
  for update;

  if not found then
    raise exception 'Job order does not exist.';
  end if;

  if v_job_order.status in ('completed', 'ready_for_billing', 'paid', 'released', 'cancelled') then
    raise exception 'Work items cannot be edited at this job order status.';
  end if;

  if nullif(trim(p_description), '') is null then
    raise exception 'Work item description is required.';
  end if;

  if p_quantity <= 0 then
    raise exception 'Work item quantity must be greater than zero.';
  end if;

  if p_unit_price < 0 then
    raise exception 'Work item unit price must be zero or greater.';
  end if;

  if v_item.item_type = 'product' and v_item.product_id is not null then
    select
      coalesce(sum(case when usage_type = 'use' then quantity else 0 end), 0),
      coalesce(sum(case when usage_type = 'return' then quantity else 0 end), 0)
    into v_total_used, v_total_returned
    from public.job_order_part_usages
    where job_order_item_id = p_job_order_item_id;

    v_net_used := v_total_used - v_total_returned;

    if p_quantity < v_net_used then
      raise exception 'Work item quantity cannot be less than the quantity already used.';
    end if;
  end if;

  v_next_approval_status := case
    when v_item.is_additional and v_item.approval_status <> 'not_required'
      then 'pending'::public.approval_status
    else 'not_required'::public.approval_status
  end;

  update public.job_order_items
  set
    description = nullif(trim(p_description), ''),
    quantity = p_quantity,
    unit_price = p_unit_price,
    total = round(p_quantity * p_unit_price, 4),
    approval_status = v_next_approval_status,
    approved_at = null,
    rejected_at = null,
    updated_at = timezone('utc', now())
  where id = p_job_order_item_id;

  if v_item.is_additional
    and v_next_approval_status = 'pending'
    and v_job_order.status in ('in_progress', 'waiting_for_parts') then
    update public.job_orders
    set
      status = 'waiting_for_customer_approval',
      updated_at = timezone('utc', now())
    where id = v_job_order.id;
  end if;

  return p_job_order_item_id;
end;
$$;

revoke all on function public.update_job_order_item(
  uuid,
  text,
  numeric,
  numeric
) from public, anon, authenticated;

grant execute on function public.update_job_order_item(
  uuid,
  text,
  numeric,
  numeric
) to authenticated;
