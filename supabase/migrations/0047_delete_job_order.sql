create or replace function public.delete_job_order(
  p_job_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_order public.job_orders%rowtype;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[],
    'Only service-administration roles can delete job orders.'
  );

  select *
  into v_job_order
  from public.job_orders
  where id = p_job_order_id
  for update;

  if not found then
    raise exception 'Job order does not exist.';
  end if;

  perform public.assert_branch_access(
    v_job_order.branch_id,
    'You do not have access to delete job orders for this branch.'
  );

  if v_job_order.status in ('completed', 'ready_for_billing', 'paid', 'released') then
    raise exception 'Completed, billed, paid, or released job orders cannot be deleted.';
  end if;

  if exists (
    select 1
    from public.invoices
    where job_order_id = p_job_order_id
      and status <> 'cancelled'
  ) then
    raise exception 'Job orders with an active invoice cannot be deleted.';
  end if;

  if exists (
    select 1
    from public.job_order_part_usages
    where job_order_id = p_job_order_id
      and usage_type = 'use'
  ) then
    raise exception 'Job orders with recorded part usage cannot be deleted.';
  end if;

  if exists (
    select 1
    from public.job_order_items
    where job_order_id = p_job_order_id
      and usage_status = 'used'
  ) then
    raise exception 'Job orders with parts marked as used cannot be deleted.';
  end if;

  if v_job_order.quotation_id is not null then
    update public.quotations
    set
      status = 'pending_approval',
      approved_at = null,
      rejected_at = null,
      updated_at = timezone('utc', now())
    where id = v_job_order.quotation_id
      and status = 'approved';
  end if;

  delete from public.job_orders
  where id = p_job_order_id;
end;
$$;

grant execute on function public.delete_job_order(uuid) to authenticated;
