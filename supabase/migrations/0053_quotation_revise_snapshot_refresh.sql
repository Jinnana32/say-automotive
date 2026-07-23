-- Keep quotation customer/vehicle print snapshots fresh when revising against a job order.
create or replace function public.sync_quotation_with_job_order_impl(
  p_quotation_id uuid,
  p_nature_of_repair text,
  p_inspection_notes text,
  p_subtotal numeric,
  p_discount numeric,
  p_tax numeric,
  p_total_amount numeric,
  p_items jsonb,
  p_revised_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quotation public.quotations%rowtype;
  v_job_order public.job_orders%rowtype;
  v_customer public.customers%rowtype;
  v_vehicle public.vehicles%rowtype;
  v_item record;
  v_job_order_item public.job_order_items%rowtype;
  v_quotation_item_id uuid;
  v_new_quotation_item_id uuid;
  v_new_job_order_item_id uuid;
  v_item_quantity numeric(14,4);
  v_item_unit_price numeric(14,4);
  v_item_total numeric(14,4);
  v_computed_subtotal numeric(14,4) := 0;
  v_normalized_discount numeric(14,4) := round(coalesce(p_discount, 0), 4);
  v_normalized_tax numeric(14,4) := round(coalesce(p_tax, 0), 4);
  v_computed_total_amount numeric(14,4);
  v_previous_total numeric(14,4);
  v_payload_job_order_item_ids uuid[] := array[]::uuid[];
  v_next_approval_status public.approval_status;
  v_is_additional boolean;
  v_line_number integer;
  v_unit_label_snapshot text;
  v_should_wait_for_customer boolean := false;
  v_lines_added integer := 0;
  v_lines_updated integer := 0;
  v_lines_removed integer := 0;
  v_total_used numeric(14,4);
  v_total_returned numeric(14,4);
  v_net_used numeric(14,4);
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one quotation item is required.';
  end if;

  select *
  into v_quotation
  from public.quotations
  where id = p_quotation_id
  for update;

  if not found then
    raise exception 'Quotation does not exist.';
  end if;

  if v_quotation.status <> 'approved' then
    raise exception 'Only approved quotations can be revised against a job order.';
  end if;

  select *
  into v_job_order
  from public.job_orders
  where quotation_id = p_quotation_id
  for update;

  if not found then
    raise exception 'This quotation is not linked to a job order.';
  end if;

  if v_job_order.status in ('completed', 'ready_for_billing', 'paid', 'released', 'cancelled') then
    raise exception 'Quotations cannot be revised while the linked job order is completed, billed, or released.';
  end if;

  if exists (
    select 1
    from public.invoices
    where job_order_id = v_job_order.id
      and status <> 'cancelled'
  ) then
    raise exception 'Quotations cannot be revised after an active invoice has been created.';
  end if;

  if v_normalized_discount < 0 then
    raise exception 'Discount cannot be negative.';
  end if;

  if v_normalized_tax < 0 then
    raise exception 'Tax cannot be negative.';
  end if;

  for v_item in
    select value, ordinality
    from jsonb_array_elements(p_items) with ordinality
  loop
    if trim(coalesce(v_item.value ->> 'description', '')) = '' then
      raise exception 'Quotation item % is missing a description.', v_item.ordinality;
    end if;

    v_item_quantity := round(coalesce((v_item.value ->> 'quantity')::numeric, 0), 4);
    v_item_unit_price := round(coalesce((v_item.value ->> 'unit_price')::numeric, 0), 4);

    if v_item_quantity <= 0 then
      raise exception 'Quotation item % must have quantity greater than zero.', v_item.ordinality;
    end if;

    if v_item_unit_price < 0 then
      raise exception 'Quotation item % must have unit price zero or greater.', v_item.ordinality;
    end if;

    if (v_item.value ->> 'item_type') = 'product'
      and nullif(v_item.value ->> 'product_id', '') is null then
      raise exception 'Quotation item % requires a product reference.', v_item.ordinality;
    end if;

    if (v_item.value ->> 'item_type') = 'service'
      and nullif(v_item.value ->> 'service_id', '') is null then
      raise exception 'Quotation item % requires a service reference.', v_item.ordinality;
    end if;

    v_item_total := round(v_item_quantity * v_item_unit_price, 4);
    v_computed_subtotal := round(v_computed_subtotal + v_item_total, 4);

    if nullif(v_item.value ->> 'job_order_item_id', '') is not null then
      v_payload_job_order_item_ids := array_append(
        v_payload_job_order_item_ids,
        (v_item.value ->> 'job_order_item_id')::uuid
      );
    end if;
  end loop;

  if v_normalized_discount > v_computed_subtotal then
    raise exception 'Discount cannot exceed the quotation subtotal.';
  end if;

  v_computed_total_amount := round(v_computed_subtotal - v_normalized_discount + v_normalized_tax, 4);

  if round(coalesce(p_subtotal, 0), 4) <> v_computed_subtotal then
    raise exception 'Quotation subtotal does not match the current item totals.';
  end if;

  if round(coalesce(p_total_amount, 0), 4) <> v_computed_total_amount then
    raise exception 'Quotation total does not match the subtotal, discount, and tax.';
  end if;

  v_previous_total := v_quotation.total_amount;

  for v_job_order_item in
    select *
    from public.job_order_items
    where job_order_id = v_job_order.id
      and approval_status <> 'rejected'
      and not (id = any(v_payload_job_order_item_ids))
  loop
    perform public.delete_job_order_item_impl(v_job_order_item.id);
    v_lines_removed := v_lines_removed + 1;
  end loop;

  update public.job_order_items
  set line_number = line_number + 100000
  where job_order_id = v_job_order.id;

  update public.quotation_items
  set line_number = line_number + 100000
  where quotation_id = p_quotation_id;

  for v_item in
    select value, ordinality
    from jsonb_array_elements(p_items) with ordinality
    order by ordinality
  loop
    v_item_quantity := round((v_item.value ->> 'quantity')::numeric, 4);
    v_item_unit_price := round((v_item.value ->> 'unit_price')::numeric, 4);
    v_item_total := round(v_item_quantity * v_item_unit_price, 4);
    v_line_number := coalesce((v_item.value ->> 'line_number')::integer, v_item.ordinality::integer);

    select case
      when (v_item.value ->> 'item_type') = 'product' and u.id is not null
        then concat(p.name, ' (', u.abbreviation, ')')
      else null
    end
    into v_unit_label_snapshot
    from public.products as p
    left join public.units as u on p.unit_id = u.id
    where p.id = nullif(v_item.value ->> 'product_id', '')::uuid;

    if nullif(v_item.value ->> 'job_order_item_id', '') is not null then
      select *
      into v_job_order_item
      from public.job_order_items
      where id = (v_item.value ->> 'job_order_item_id')::uuid
        and job_order_id = v_job_order.id
      for update;

      if not found then
        raise exception 'Job order item % does not belong to this quotation.', v_item.ordinality;
      end if;

      if v_job_order_item.item_type = 'product' and v_job_order_item.product_id is not null then
        select
          coalesce(sum(case when usage_type = 'use' then quantity else 0 end), 0),
          coalesce(sum(case when usage_type = 'return' then quantity else 0 end), 0)
        into v_total_used, v_total_returned
        from public.job_order_part_usages
        where job_order_item_id = v_job_order_item.id;

        v_net_used := v_total_used - v_total_returned;

        if v_item_quantity < v_net_used then
          raise exception 'Quotation item % quantity cannot be less than the quantity already used.', v_item.ordinality;
        end if;
      end if;

      v_next_approval_status := case
        when v_job_order_item.is_additional and v_job_order_item.approval_status <> 'not_required'
          then 'pending'::public.approval_status
        else 'not_required'::public.approval_status
      end;

      if v_job_order_item.is_additional
        and v_next_approval_status = 'pending'
        and v_job_order.status in ('in_progress', 'waiting_for_parts') then
        v_should_wait_for_customer := true;
      end if;

      update public.job_order_items
      set
        line_number = v_line_number,
        item_type = (v_item.value ->> 'item_type')::public.line_item_type,
        product_id = nullif(v_item.value ->> 'product_id', '')::uuid,
        service_id = nullif(v_item.value ->> 'service_id', '')::uuid,
        description = trim(v_item.value ->> 'description'),
        quantity = v_item_quantity,
        unit_price = v_item_unit_price,
        total = v_item_total,
        approval_status = v_next_approval_status,
        approved_at = case when v_next_approval_status = 'approved' then approved_at else null end,
        rejected_at = null,
        updated_at = timezone('utc', now())
      where id = v_job_order_item.id;

      v_quotation_item_id := coalesce(
        nullif(v_item.value ->> 'quotation_item_id', '')::uuid,
        v_job_order_item.source_quotation_item_id
      );

      if v_quotation_item_id is not null then
        update public.quotation_items
        set
          line_number = v_line_number,
          item_type = (v_item.value ->> 'item_type')::public.line_item_type,
          product_id = nullif(v_item.value ->> 'product_id', '')::uuid,
          service_id = nullif(v_item.value ->> 'service_id', '')::uuid,
          description = trim(v_item.value ->> 'description'),
          quantity = v_item_quantity,
          unit_label_snapshot = v_unit_label_snapshot,
          unit_price = v_item_unit_price,
          total = v_item_total,
          updated_at = timezone('utc', now())
        where id = v_quotation_item_id
          and quotation_id = p_quotation_id;
      else
        v_new_quotation_item_id := gen_random_uuid();

        insert into public.quotation_items (
          id,
          quotation_id,
          line_number,
          item_type,
          product_id,
          service_id,
          description,
          quantity,
          unit_label_snapshot,
          unit_price,
          total
        )
        values (
          v_new_quotation_item_id,
          p_quotation_id,
          v_line_number,
          (v_item.value ->> 'item_type')::public.line_item_type,
          nullif(v_item.value ->> 'product_id', '')::uuid,
          nullif(v_item.value ->> 'service_id', '')::uuid,
          trim(v_item.value ->> 'description'),
          v_item_quantity,
          v_unit_label_snapshot,
          v_item_unit_price,
          v_item_total
        );

        update public.job_order_items
        set source_quotation_item_id = v_new_quotation_item_id
        where id = v_job_order_item.id;
      end if;

      v_lines_updated := v_lines_updated + 1;
    else
      v_is_additional := v_job_order.status <> 'pending';
      v_next_approval_status := case
        when v_is_additional then 'pending'::public.approval_status
        else 'not_required'::public.approval_status
      end;

      if v_is_additional and v_job_order.status in ('in_progress', 'waiting_for_parts') then
        v_should_wait_for_customer := true;
      end if;

      v_new_quotation_item_id := gen_random_uuid();
      v_new_job_order_item_id := gen_random_uuid();

      insert into public.quotation_items (
        id,
        quotation_id,
        line_number,
        item_type,
        product_id,
        service_id,
        description,
        quantity,
        unit_label_snapshot,
        unit_price,
        total
      )
      values (
        v_new_quotation_item_id,
        p_quotation_id,
        v_line_number,
        (v_item.value ->> 'item_type')::public.line_item_type,
        nullif(v_item.value ->> 'product_id', '')::uuid,
        nullif(v_item.value ->> 'service_id', '')::uuid,
        trim(v_item.value ->> 'description'),
        v_item_quantity,
        v_unit_label_snapshot,
        v_item_unit_price,
        v_item_total
      );

      insert into public.job_order_items (
        id,
        job_order_id,
        source_quotation_item_id,
        line_number,
        item_type,
        product_id,
        service_id,
        description,
        quantity,
        unit_price,
        total,
        is_additional,
        approval_status,
        usage_status
      )
      values (
        v_new_job_order_item_id,
        v_job_order.id,
        v_new_quotation_item_id,
        v_line_number,
        (v_item.value ->> 'item_type')::public.line_item_type,
        nullif(v_item.value ->> 'product_id', '')::uuid,
        nullif(v_item.value ->> 'service_id', '')::uuid,
        trim(v_item.value ->> 'description'),
        v_item_quantity,
        v_item_unit_price,
        v_item_total,
        v_is_additional,
        v_next_approval_status,
        'planned'
      );

      v_lines_added := v_lines_added + 1;
    end if;
  end loop;

  select *
  into v_customer
  from public.customers
  where id = v_quotation.customer_id;

  if not found then
    raise exception 'Quotation customer does not exist.';
  end if;

  select *
  into v_vehicle
  from public.vehicles
  where id = v_quotation.vehicle_id;

  if not found then
    raise exception 'Quotation vehicle does not exist.';
  end if;

  update public.quotations
  set
    nature_of_repair = nullif(trim(p_nature_of_repair), ''),
    inspection_notes = nullif(trim(p_inspection_notes), ''),
    subtotal = v_computed_subtotal,
    discount = v_normalized_discount,
    tax = v_normalized_tax,
    total_amount = v_computed_total_amount,
    customer_name_snapshot = v_customer.display_name,
    customer_contact_snapshot = v_customer.contact_number,
    customer_address_snapshot = v_customer.address,
    vehicle_make_snapshot = v_vehicle.make,
    vehicle_model_snapshot = v_vehicle.model,
    vehicle_year_snapshot = v_vehicle.year,
    vehicle_plate_number_snapshot = v_vehicle.plate_number,
    vehicle_vin_snapshot = v_vehicle.vin,
    updated_at = timezone('utc', now())
  where id = p_quotation_id;

  update public.job_orders
  set
    inspection_notes = nullif(trim(p_inspection_notes), ''),
    status = case
      when v_should_wait_for_customer then 'waiting_for_customer_approval'
      else status
    end,
    updated_at = timezone('utc', now())
  where id = v_job_order.id;

  insert into public.quotation_revisions (
    quotation_id,
    job_order_id,
    revised_by,
    previous_total_amount,
    new_total_amount,
    change_summary
  )
  values (
    p_quotation_id,
    v_job_order.id,
    p_revised_by,
    v_previous_total,
    v_computed_total_amount,
    jsonb_build_object(
      'lines_added', v_lines_added,
      'lines_updated', v_lines_updated,
      'lines_removed', v_lines_removed
    )
  );

  return p_quotation_id;
end;
$$;
