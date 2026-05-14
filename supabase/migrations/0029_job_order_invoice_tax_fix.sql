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

with tax_fixes as (
  select
    i.id,
    round(greatest(i.subtotal - i.discount, 0) * (coalesce(bs.default_tax_rate, 0) / 100), 4) as corrected_tax,
    round(
      i.subtotal - i.discount +
      round(greatest(i.subtotal - i.discount, 0) * (coalesce(bs.default_tax_rate, 0) / 100), 4),
      4
    ) as corrected_total
  from public.invoices i
  join public.job_orders jo on jo.id = i.job_order_id
  join public.business_settings bs on bs.branch_id = jo.branch_id
  where i.job_order_id is not null
    and i.status = 'unpaid'
    and coalesce(i.paid_amount, 0) = 0
    and coalesce(i.tax, 0) = 0
    and coalesce(bs.default_tax_rate, 0) > 0
)
update public.invoices i
set
  tax = tax_fixes.corrected_tax,
  total_amount = tax_fixes.corrected_total,
  balance = tax_fixes.corrected_total,
  updated_at = timezone('utc', now())
from tax_fixes
where i.id = tax_fixes.id;
