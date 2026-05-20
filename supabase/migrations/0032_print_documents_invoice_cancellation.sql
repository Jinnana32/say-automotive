alter table public.invoices
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references auth.users(id),
  add column if not exists cancellation_reason text;

create or replace function public.cancel_invoice_impl(
  p_invoice_id uuid,
  p_cancellation_reason text,
  p_cancelled_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.invoices%rowtype;
  v_job_order public.job_orders%rowtype;
  v_reason text := nullif(trim(p_cancellation_reason), '');
begin
  if v_reason is null then
    raise exception 'Cancellation reason is required.';
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
    raise exception 'Invoice is already cancelled.';
  end if;

  if v_invoice.sale_id is not null then
    raise exception 'POS-linked invoices cannot be cancelled in this workflow.';
  end if;

  if v_invoice.paid_amount > 0
    or exists (
      select 1
      from public.payments
      where invoice_id = v_invoice.id
    ) then
    raise exception 'Invoices with recorded payments cannot be cancelled.';
  end if;

  if v_invoice.job_order_id is not null then
    select *
    into v_job_order
    from public.job_orders
    where id = v_invoice.job_order_id;

    if v_job_order.released_at is not null then
      raise exception 'Invoices for released vehicles cannot be cancelled.';
    end if;
  end if;

  update public.invoices
  set
    status = 'cancelled',
    balance = 0,
    cancelled_at = timezone('utc', now()),
    cancelled_by = p_cancelled_by,
    cancellation_reason = v_reason,
    updated_at = timezone('utc', now())
  where id = v_invoice.id;

  return v_invoice.id;
end;
$$;

create or replace function public.cancel_invoice(
  p_invoice_id uuid,
  p_cancellation_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_branch_id uuid;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin']::public.staff_role[],
    'Only owner or admin roles can cancel invoices.'
  );

  select branch_id
  into v_branch_id
  from public.invoices
  where id = p_invoice_id;

  if v_branch_id is null then
    raise exception 'Invoice does not exist.';
  end if;

  perform public.assert_branch_access(
    v_branch_id,
    'You do not have access to cancel invoices for this branch.'
  );

  return public.cancel_invoice_impl(
    p_invoice_id,
    p_cancellation_reason,
    v_actor_user_id
  );
end;
$$;

revoke all on function public.cancel_invoice_impl(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.cancel_invoice(uuid, text) from public, anon, authenticated;
grant execute on function public.cancel_invoice(uuid, text) to authenticated;
