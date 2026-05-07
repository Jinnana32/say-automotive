create or replace function public.current_staff_record_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select s.id
  from public.staff s
  where s.linked_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_staff_role()
returns public.staff_role
language sql
security definer
stable
set search_path = public
as $$
  select s.role
  from public.staff s
  where s.linked_user_id = auth.uid()
    and s.status = 'active'
  limit 1;
$$;

create or replace function public.is_active_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.staff s
    where s.linked_user_id = auth.uid()
      and s.status = 'active'
  );
$$;

create or replace function public.has_any_staff_role(p_roles public.staff_role[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.staff s
    where s.linked_user_id = auth.uid()
      and s.status = 'active'
      and s.role = any (p_roles)
  );
$$;

revoke all on function public.current_staff_record_id() from public, anon;
revoke all on function public.current_staff_role() from public, anon;
revoke all on function public.is_active_staff() from public, anon;
revoke all on function public.has_any_staff_role(public.staff_role[]) from public, anon;

grant execute on function public.current_staff_record_id() to authenticated;
grant execute on function public.current_staff_role() to authenticated;
grant execute on function public.is_active_staff() to authenticated;
grant execute on function public.has_any_staff_role(public.staff_role[]) to authenticated;

create or replace function public.assert_has_any_staff_role(
  p_roles public.staff_role[],
  p_message text default 'Permission denied.'
)
returns void
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.has_any_staff_role(p_roles) then
    raise exception '%', p_message;
  end if;
end;
$$;

revoke all on function public.assert_has_any_staff_role(public.staff_role[], text) from public, anon, authenticated;

alter function public.save_quotation_with_items(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  public.quotation_status,
  numeric,
  numeric,
  numeric,
  numeric,
  jsonb,
  uuid
) rename to save_quotation_with_items_impl;

alter function public.approve_quotation_to_job_order(uuid, uuid) rename to approve_quotation_to_job_order_impl;
alter function public.save_job_order_details(uuid, numeric, numeric, text, text, text, text) rename to save_job_order_details_impl;
alter function public.assign_job_order_mechanic(uuid, uuid, text) rename to assign_job_order_mechanic_impl;
alter function public.remove_job_order_mechanic(uuid) rename to remove_job_order_mechanic_impl;
alter function public.update_job_order_status(uuid, public.job_order_status) rename to update_job_order_status_impl;
alter function public.add_job_order_item(
  uuid,
  public.line_item_type,
  uuid,
  uuid,
  text,
  numeric,
  numeric
) rename to add_job_order_item_impl;
alter function public.set_job_order_item_approval(uuid, public.approval_status) rename to set_job_order_item_approval_impl;
alter function public.record_job_order_part_usage(uuid, numeric, text, uuid) rename to record_job_order_part_usage_impl;
alter function public.record_job_order_part_return(uuid, numeric, text, uuid) rename to record_job_order_part_return_impl;
alter function public.create_invoice_from_job_order(uuid, date, uuid) rename to create_invoice_from_job_order_impl;
alter function public.record_invoice_payment(
  uuid,
  numeric,
  public.payment_method,
  text,
  text,
  uuid
) rename to record_invoice_payment_impl;
alter function public.release_job_order_vehicle(uuid) rename to release_job_order_vehicle_impl;
alter function public.complete_pos_sale(
  uuid,
  jsonb,
  uuid,
  numeric,
  numeric,
  public.payment_method,
  text,
  text,
  uuid,
  date
) rename to complete_pos_sale_impl;
alter function public.receive_inventory_stock(uuid, uuid, numeric, text, uuid) rename to receive_inventory_stock_impl;
alter function public.reconcile_inventory_stock(uuid, uuid, numeric, text, uuid) rename to reconcile_inventory_stock_impl;
alter function public.mark_inventory_stock_damaged(uuid, uuid, numeric, text, uuid) rename to mark_inventory_stock_damaged_impl;
alter function public.update_inventory_stock_settings(uuid, uuid, numeric, text) rename to update_inventory_stock_settings_impl;

create or replace function public.save_quotation_with_items(
  p_quotation_id uuid,
  p_branch_id uuid,
  p_customer_id uuid,
  p_vehicle_id uuid,
  p_inspection_notes text,
  p_status public.quotation_status,
  p_subtotal numeric,
  p_discount numeric,
  p_tax numeric,
  p_total_amount numeric,
  p_items jsonb,
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[],
    'Only service-administration roles can save quotations.'
  );

  return public.save_quotation_with_items_impl(
    p_quotation_id,
    p_branch_id,
    p_customer_id,
    p_vehicle_id,
    p_inspection_notes,
    p_status,
    p_subtotal,
    p_discount,
    p_tax,
    p_total_amount,
    p_items,
    p_created_by
  );
end;
$$;

create or replace function public.approve_quotation_to_job_order(
  p_quotation_id uuid,
  p_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[],
    'Only service-administration roles can approve quotations.'
  );

  return public.approve_quotation_to_job_order_impl(p_quotation_id, p_user_id);
end;
$$;

create or replace function public.save_job_order_details(
  p_job_order_id uuid,
  p_mileage_in numeric default null,
  p_mileage_out numeric default null,
  p_customer_concern text default null,
  p_inspection_notes text default null,
  p_diagnosis text default null,
  p_work_performed text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[],
    'Only operational roles can update job order details.'
  );

  return public.save_job_order_details_impl(
    p_job_order_id,
    p_mileage_in,
    p_mileage_out,
    p_customer_concern,
    p_inspection_notes,
    p_diagnosis,
    p_work_performed
  );
end;
$$;

create or replace function public.assign_job_order_mechanic(
  p_job_order_id uuid,
  p_staff_id uuid,
  p_task_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[],
    'Only operational roles can manage mechanic assignments.'
  );

  return public.assign_job_order_mechanic_impl(p_job_order_id, p_staff_id, p_task_description);
end;
$$;

create or replace function public.remove_job_order_mechanic(
  p_assignment_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[],
    'Only operational roles can manage mechanic assignments.'
  );

  return public.remove_job_order_mechanic_impl(p_assignment_id);
end;
$$;

create or replace function public.update_job_order_status(
  p_job_order_id uuid,
  p_next_status public.job_order_status
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[],
    'Only operational roles can change job order status.'
  );

  return public.update_job_order_status_impl(p_job_order_id, p_next_status);
end;
$$;

create or replace function public.add_job_order_item(
  p_job_order_id uuid,
  p_item_type public.line_item_type,
  p_product_id uuid default null,
  p_service_id uuid default null,
  p_description text default null,
  p_quantity numeric default 0,
  p_unit_price numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[],
    'Only operational roles can add job order items.'
  );

  return public.add_job_order_item_impl(
    p_job_order_id,
    p_item_type,
    p_product_id,
    p_service_id,
    p_description,
    p_quantity,
    p_unit_price
  );
end;
$$;

create or replace function public.set_job_order_item_approval(
  p_job_order_item_id uuid,
  p_approval_status public.approval_status
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[],
    'Only operational roles can update job order approvals.'
  );

  return public.set_job_order_item_approval_impl(p_job_order_item_id, p_approval_status);
end;
$$;

create or replace function public.record_job_order_part_usage(
  p_job_order_item_id uuid,
  p_quantity numeric,
  p_notes text default null,
  p_performed_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[],
    'Only operational roles can record job order part usage.'
  );

  return public.record_job_order_part_usage_impl(
    p_job_order_item_id,
    p_quantity,
    p_notes,
    p_performed_by
  );
end;
$$;

create or replace function public.record_job_order_part_return(
  p_job_order_item_id uuid,
  p_quantity numeric,
  p_notes text default null,
  p_performed_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[],
    'Only operational roles can record job order part returns.'
  );

  return public.record_job_order_part_return_impl(
    p_job_order_item_id,
    p_quantity,
    p_notes,
    p_performed_by
  );
end;
$$;

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
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[],
    'Only service-administration roles can create invoices from job orders.'
  );

  return public.create_invoice_from_job_order_impl(p_job_order_id, p_invoice_date, p_created_by);
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
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'cashier']::public.staff_role[],
    'Only billing roles can record payments.'
  );

  return public.record_invoice_payment_impl(
    p_invoice_id,
    p_amount,
    p_payment_method,
    p_reference_number,
    p_notes,
    p_received_by
  );
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
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[],
    'Only service-administration roles can release vehicles.'
  );

  return public.release_job_order_vehicle_impl(p_job_order_id);
end;
$$;

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
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'cashier']::public.staff_role[],
    'Only POS roles can complete direct sales.'
  );

  return public.complete_pos_sale_impl(
    p_branch_id,
    p_items,
    p_customer_id,
    p_discount,
    p_payment_amount,
    p_payment_method,
    p_reference_number,
    p_notes,
    p_cashier_user_id,
    p_invoice_date
  );
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
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'inventory_staff']::public.staff_role[],
    'Only inventory roles can receive stock.'
  );

  return public.receive_inventory_stock_impl(
    p_branch_id,
    p_product_id,
    p_quantity,
    p_notes,
    p_created_by
  );
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
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'inventory_staff']::public.staff_role[],
    'Only inventory roles can reconcile stock.'
  );

  return public.reconcile_inventory_stock_impl(
    p_branch_id,
    p_product_id,
    p_counted_quantity,
    p_notes,
    p_created_by
  );
end;
$$;

create or replace function public.mark_inventory_stock_damaged(
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
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'inventory_staff']::public.staff_role[],
    'Only inventory roles can record damaged stock.'
  );

  return public.mark_inventory_stock_damaged_impl(
    p_branch_id,
    p_product_id,
    p_quantity,
    p_notes,
    p_created_by
  );
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
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'inventory_staff']::public.staff_role[],
    'Only inventory roles can change inventory settings.'
  );

  return public.update_inventory_stock_settings_impl(
    p_branch_id,
    p_product_id,
    p_reorder_level,
    p_shelf_location
  );
end;
$$;

revoke all on function public.next_document_number(text) from public, anon, authenticated;

revoke all on function public.save_quotation_with_items_impl(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  public.quotation_status,
  numeric,
  numeric,
  numeric,
  numeric,
  jsonb,
  uuid
) from public, anon, authenticated;

revoke all on function public.approve_quotation_to_job_order_impl(uuid, uuid) from public, anon, authenticated;
revoke all on function public.save_job_order_details_impl(uuid, numeric, numeric, text, text, text, text) from public, anon, authenticated;
revoke all on function public.assign_job_order_mechanic_impl(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.remove_job_order_mechanic_impl(uuid) from public, anon, authenticated;
revoke all on function public.update_job_order_status_impl(uuid, public.job_order_status) from public, anon, authenticated;
revoke all on function public.add_job_order_item_impl(
  uuid,
  public.line_item_type,
  uuid,
  uuid,
  text,
  numeric,
  numeric
) from public, anon, authenticated;
revoke all on function public.set_job_order_item_approval_impl(uuid, public.approval_status) from public, anon, authenticated;
revoke all on function public.record_job_order_part_usage_impl(uuid, numeric, text, uuid) from public, anon, authenticated;
revoke all on function public.record_job_order_part_return_impl(uuid, numeric, text, uuid) from public, anon, authenticated;
revoke all on function public.create_invoice_from_job_order_impl(uuid, date, uuid) from public, anon, authenticated;
revoke all on function public.record_invoice_payment_impl(
  uuid,
  numeric,
  public.payment_method,
  text,
  text,
  uuid
) from public, anon, authenticated;
revoke all on function public.release_job_order_vehicle_impl(uuid) from public, anon, authenticated;
revoke all on function public.complete_pos_sale_impl(
  uuid,
  jsonb,
  uuid,
  numeric,
  numeric,
  public.payment_method,
  text,
  text,
  uuid,
  date
) from public, anon, authenticated;
revoke all on function public.receive_inventory_stock_impl(uuid, uuid, numeric, text, uuid) from public, anon, authenticated;
revoke all on function public.reconcile_inventory_stock_impl(uuid, uuid, numeric, text, uuid) from public, anon, authenticated;
revoke all on function public.mark_inventory_stock_damaged_impl(uuid, uuid, numeric, text, uuid) from public, anon, authenticated;
revoke all on function public.update_inventory_stock_settings_impl(uuid, uuid, numeric, text) from public, anon, authenticated;

revoke all on function public.save_quotation_with_items(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  public.quotation_status,
  numeric,
  numeric,
  numeric,
  numeric,
  jsonb,
  uuid
) from public, anon;

revoke all on function public.approve_quotation_to_job_order(uuid, uuid) from public, anon;
revoke all on function public.save_job_order_details(uuid, numeric, numeric, text, text, text, text) from public, anon;
revoke all on function public.assign_job_order_mechanic(uuid, uuid, text) from public, anon;
revoke all on function public.remove_job_order_mechanic(uuid) from public, anon;
revoke all on function public.update_job_order_status(uuid, public.job_order_status) from public, anon;
revoke all on function public.add_job_order_item(
  uuid,
  public.line_item_type,
  uuid,
  uuid,
  text,
  numeric,
  numeric
) from public, anon;
revoke all on function public.set_job_order_item_approval(uuid, public.approval_status) from public, anon;
revoke all on function public.record_job_order_part_usage(uuid, numeric, text, uuid) from public, anon;
revoke all on function public.record_job_order_part_return(uuid, numeric, text, uuid) from public, anon;
revoke all on function public.create_invoice_from_job_order(uuid, date, uuid) from public, anon;
revoke all on function public.record_invoice_payment(
  uuid,
  numeric,
  public.payment_method,
  text,
  text,
  uuid
) from public, anon;
revoke all on function public.release_job_order_vehicle(uuid) from public, anon;
revoke all on function public.complete_pos_sale(
  uuid,
  jsonb,
  uuid,
  numeric,
  numeric,
  public.payment_method,
  text,
  text,
  uuid,
  date
) from public, anon;
revoke all on function public.receive_inventory_stock(uuid, uuid, numeric, text, uuid) from public, anon;
revoke all on function public.reconcile_inventory_stock(uuid, uuid, numeric, text, uuid) from public, anon;
revoke all on function public.mark_inventory_stock_damaged(uuid, uuid, numeric, text, uuid) from public, anon;
revoke all on function public.update_inventory_stock_settings(uuid, uuid, numeric, text) from public, anon;

grant execute on function public.save_quotation_with_items(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  public.quotation_status,
  numeric,
  numeric,
  numeric,
  numeric,
  jsonb,
  uuid
) to authenticated;

grant execute on function public.approve_quotation_to_job_order(uuid, uuid) to authenticated;
grant execute on function public.save_job_order_details(uuid, numeric, numeric, text, text, text, text) to authenticated;
grant execute on function public.assign_job_order_mechanic(uuid, uuid, text) to authenticated;
grant execute on function public.remove_job_order_mechanic(uuid) to authenticated;
grant execute on function public.update_job_order_status(uuid, public.job_order_status) to authenticated;
grant execute on function public.add_job_order_item(
  uuid,
  public.line_item_type,
  uuid,
  uuid,
  text,
  numeric,
  numeric
) to authenticated;
grant execute on function public.set_job_order_item_approval(uuid, public.approval_status) to authenticated;
grant execute on function public.record_job_order_part_usage(uuid, numeric, text, uuid) to authenticated;
grant execute on function public.record_job_order_part_return(uuid, numeric, text, uuid) to authenticated;
grant execute on function public.create_invoice_from_job_order(uuid, date, uuid) to authenticated;
grant execute on function public.record_invoice_payment(
  uuid,
  numeric,
  public.payment_method,
  text,
  text,
  uuid
) to authenticated;
grant execute on function public.release_job_order_vehicle(uuid) to authenticated;
grant execute on function public.complete_pos_sale(
  uuid,
  jsonb,
  uuid,
  numeric,
  numeric,
  public.payment_method,
  text,
  text,
  uuid,
  date
) to authenticated;
grant execute on function public.receive_inventory_stock(uuid, uuid, numeric, text, uuid) to authenticated;
grant execute on function public.reconcile_inventory_stock(uuid, uuid, numeric, text, uuid) to authenticated;
grant execute on function public.mark_inventory_stock_damaged(uuid, uuid, numeric, text, uuid) to authenticated;
grant execute on function public.update_inventory_stock_settings(uuid, uuid, numeric, text) to authenticated;

alter table public.branches enable row level security;
alter table public.business_settings enable row level security;
alter table public.document_sequences enable row level security;
alter table public.audit_logs enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.staff enable row level security;
alter table public.attendance enable row level security;
alter table public.units enable row level security;
alter table public.product_categories enable row level security;
alter table public.brands enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.services enable row level security;
alter table public.inventory_stocks enable row level security;
alter table public.stock_movements enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.job_orders enable row level security;
alter table public.job_order_mechanics enable row level security;
alter table public.job_order_items enable row level security;
alter table public.job_order_part_usages enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;

drop policy if exists branches_select_active_staff on public.branches;
create policy branches_select_active_staff
on public.branches
for select
to authenticated
using (public.is_active_staff());

drop policy if exists business_settings_select_active_staff on public.business_settings;
create policy business_settings_select_active_staff
on public.business_settings
for select
to authenticated
using (public.is_active_staff());

drop policy if exists business_settings_update_admin on public.business_settings;
create policy business_settings_update_admin
on public.business_settings
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists document_sequences_select_admin on public.document_sequences;
create policy document_sequences_select_admin
on public.document_sequences
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists document_sequences_update_admin on public.document_sequences;
create policy document_sequences_update_admin
on public.document_sequences
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin
on public.audit_logs
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists audit_logs_insert_active_staff on public.audit_logs;
create policy audit_logs_insert_active_staff
on public.audit_logs
for insert
to authenticated
with check (
  public.is_active_staff()
  and (user_id is null or user_id = auth.uid())
);

drop policy if exists customers_select_active_staff on public.customers;
create policy customers_select_active_staff
on public.customers
for select
to authenticated
using (public.is_active_staff());

drop policy if exists customers_insert_service_team on public.customers;
create policy customers_insert_service_team
on public.customers
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[]));

drop policy if exists customers_update_service_team on public.customers;
create policy customers_update_service_team
on public.customers
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[]));

drop policy if exists vehicles_select_active_staff on public.vehicles;
create policy vehicles_select_active_staff
on public.vehicles
for select
to authenticated
using (public.is_active_staff());

drop policy if exists vehicles_insert_service_team on public.vehicles;
create policy vehicles_insert_service_team
on public.vehicles
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[]));

drop policy if exists vehicles_update_service_team on public.vehicles;
create policy vehicles_update_service_team
on public.vehicles
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[]));

drop policy if exists staff_select_self_or_admin on public.staff;
create policy staff_select_self_or_admin
on public.staff
for select
to authenticated
using (
  linked_user_id = auth.uid()
  or public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
);

drop policy if exists staff_insert_admin on public.staff;
create policy staff_insert_admin
on public.staff
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists staff_update_admin on public.staff;
create policy staff_update_admin
on public.staff
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists attendance_select_self_or_admin on public.attendance;
create policy attendance_select_self_or_admin
on public.attendance
for select
to authenticated
using (
  staff_id = public.current_staff_record_id()
  or public.has_any_staff_role(array['owner', 'admin']::public.staff_role[])
);

drop policy if exists attendance_insert_admin on public.attendance;
create policy attendance_insert_admin
on public.attendance
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists attendance_update_admin on public.attendance;
create policy attendance_update_admin
on public.attendance
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin']::public.staff_role[]));

drop policy if exists units_select_active_staff on public.units;
create policy units_select_active_staff
on public.units
for select
to authenticated
using (public.is_active_staff());

drop policy if exists product_categories_select_active_staff on public.product_categories;
create policy product_categories_select_active_staff
on public.product_categories
for select
to authenticated
using (public.is_active_staff());

drop policy if exists brands_select_active_staff on public.brands;
create policy brands_select_active_staff
on public.brands
for select
to authenticated
using (public.is_active_staff());

drop policy if exists suppliers_select_procurement_team on public.suppliers;
create policy suppliers_select_procurement_team
on public.suppliers
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'inventory_staff']::public.staff_role[]));

drop policy if exists suppliers_insert_procurement_team on public.suppliers;
create policy suppliers_insert_procurement_team
on public.suppliers
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[]));

drop policy if exists suppliers_update_procurement_team on public.suppliers;
create policy suppliers_update_procurement_team
on public.suppliers
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[]));

drop policy if exists products_select_active_staff on public.products;
create policy products_select_active_staff
on public.products
for select
to authenticated
using (public.is_active_staff());

drop policy if exists products_insert_inventory_team on public.products;
create policy products_insert_inventory_team
on public.products
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[]));

drop policy if exists products_update_inventory_team on public.products;
create policy products_update_inventory_team
on public.products
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin', 'inventory_staff']::public.staff_role[]));

drop policy if exists services_select_active_staff on public.services;
create policy services_select_active_staff
on public.services
for select
to authenticated
using (public.is_active_staff());

drop policy if exists services_insert_service_team on public.services;
create policy services_insert_service_team
on public.services
for insert
to authenticated
with check (public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[]));

drop policy if exists services_update_service_team on public.services;
create policy services_update_service_team
on public.services
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[]));

drop policy if exists inventory_stocks_select_operational_team on public.inventory_stocks;
create policy inventory_stocks_select_operational_team
on public.inventory_stocks
for select
to authenticated
using (
  public.has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic', 'cashier', 'inventory_staff']::public.staff_role[]
  )
);

drop policy if exists stock_movements_select_operational_team on public.stock_movements;
create policy stock_movements_select_operational_team
on public.stock_movements
for select
to authenticated
using (
  public.has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic', 'inventory_staff']::public.staff_role[]
  )
);

drop policy if exists quotations_select_service_team on public.quotations;
create policy quotations_select_service_team
on public.quotations
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[]));

drop policy if exists quotations_update_service_team on public.quotations;
create policy quotations_update_service_team
on public.quotations
for update
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[]))
with check (public.has_any_staff_role(array['owner', 'admin', 'service_advisor']::public.staff_role[]));

drop policy if exists quotation_items_select_service_team on public.quotation_items;
create policy quotation_items_select_service_team
on public.quotation_items
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[]));

drop policy if exists job_orders_select_operational_team on public.job_orders;
create policy job_orders_select_operational_team
on public.job_orders
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'mechanic', 'cashier']::public.staff_role[]));

drop policy if exists job_order_mechanics_select_operational_team on public.job_order_mechanics;
create policy job_order_mechanics_select_operational_team
on public.job_order_mechanics
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'mechanic', 'cashier']::public.staff_role[]));

drop policy if exists job_order_items_select_operational_team on public.job_order_items;
create policy job_order_items_select_operational_team
on public.job_order_items
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'mechanic', 'cashier']::public.staff_role[]));

drop policy if exists job_order_part_usages_select_operational_team on public.job_order_part_usages;
create policy job_order_part_usages_select_operational_team
on public.job_order_part_usages
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'mechanic', 'cashier']::public.staff_role[]));

drop policy if exists sales_select_billing_team on public.sales;
create policy sales_select_billing_team
on public.sales
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'cashier']::public.staff_role[]));

drop policy if exists sale_items_select_billing_team on public.sale_items;
create policy sale_items_select_billing_team
on public.sale_items
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'cashier']::public.staff_role[]));

drop policy if exists invoices_select_billing_team on public.invoices;
create policy invoices_select_billing_team
on public.invoices
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'cashier']::public.staff_role[]));

drop policy if exists invoice_items_select_billing_team on public.invoice_items;
create policy invoice_items_select_billing_team
on public.invoice_items
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'cashier']::public.staff_role[]));

drop policy if exists payments_select_billing_team on public.payments;
create policy payments_select_billing_team
on public.payments
for select
to authenticated
using (public.has_any_staff_role(array['owner', 'admin', 'service_advisor', 'cashier']::public.staff_role[]));
