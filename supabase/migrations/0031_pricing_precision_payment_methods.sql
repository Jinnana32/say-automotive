do $$
begin
  alter type public.payment_method add value if not exists 'other';
exception
  when duplicate_object then
    null;
end;
$$;

alter table public.quotations
  drop constraint if exists quotations_discount_non_negative,
  drop constraint if exists quotations_discount_lte_subtotal,
  drop constraint if exists quotations_tax_non_negative,
  drop constraint if exists quotations_total_amount_consistent;

alter table public.quotations
  add constraint quotations_discount_non_negative
    check (discount >= 0) not valid,
  add constraint quotations_discount_lte_subtotal
    check (discount <= subtotal) not valid,
  add constraint quotations_tax_non_negative
    check (tax >= 0) not valid,
  add constraint quotations_total_amount_consistent
    check (total_amount = round(subtotal - discount + tax, 4)) not valid;

create or replace function public.save_quotation_with_items_impl(
  p_quotation_id uuid,
  p_branch_id uuid,
  p_customer_id uuid,
  p_vehicle_id uuid,
  p_nature_of_repair text,
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
declare
  v_quotation_id uuid;
  v_existing_branch_id uuid;
  v_existing_status public.quotation_status;
  v_item record;
  v_customer public.customers%rowtype;
  v_vehicle public.vehicles%rowtype;
  v_prepared_by_name text;
  v_prepared_by_title text;
  v_item_quantity numeric(14,4);
  v_item_unit_price numeric(14,4);
  v_item_total numeric(14,4);
  v_computed_subtotal numeric(14,4) := 0;
  v_normalized_discount numeric(14,4) := round(coalesce(p_discount, 0), 4);
  v_normalized_tax numeric(14,4) := round(coalesce(p_tax, 0), 4);
  v_computed_total_amount numeric(14,4);
begin
  if p_status not in ('draft', 'pending_approval') then
    raise exception 'Quotations can only be saved as draft or pending approval.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one quotation item is required.';
  end if;

  if p_quotation_id is not null then
    select branch_id, status
    into v_existing_branch_id, v_existing_status
    from public.quotations
    where id = p_quotation_id
    for update;

    if not found then
      raise exception 'Quotation does not exist.';
    end if;

    perform public.assert_branch_access(
      v_existing_branch_id,
      'You do not have access to edit quotations for this branch.'
    );

    if p_branch_id <> v_existing_branch_id then
      raise exception 'Quotation branch cannot be changed after creation.';
    end if;

    if v_existing_status = 'approved' then
      raise exception 'Approved quotations cannot be edited.';
    end if;
  end if;

  if v_normalized_discount < 0 then
    raise exception 'Discount cannot be negative.';
  end if;

  if v_normalized_tax < 0 then
    raise exception 'Tax cannot be negative.';
  end if;

  select *
  into v_customer
  from public.customers
  where id = p_customer_id
    and branch_id = p_branch_id;

  if not found then
    raise exception 'Selected customer does not exist in the selected branch.';
  end if;

  select *
  into v_vehicle
  from public.vehicles
  where id = p_vehicle_id
    and customer_id = p_customer_id
    and branch_id = p_branch_id;

  if not found then
    raise exception 'Selected vehicle does not belong to the selected customer branch.';
  end if;

  if p_created_by is not null then
    select
      nullif(trim(concat_ws(' ', s.first_name, s.last_name)), ''),
      initcap(replace(s.role::text, '_', ' '))
    into
      v_prepared_by_name,
      v_prepared_by_title
    from public.staff as s
    where s.linked_user_id = p_created_by
    limit 1;
  end if;

  for v_item in
    select value, ordinality
    from jsonb_array_elements(p_items) with ordinality
  loop
    if trim(coalesce(v_item.value ->> 'description', '')) = '' then
      raise exception 'Quotation item % is missing a description.', v_item.ordinality;
    end if;

    v_item_quantity := round(coalesce((v_item.value ->> 'quantity')::numeric, 0), 4);
    v_item_unit_price := round(coalesce((v_item.value ->> 'unit_price')::numeric, -1), 4);

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

  if p_quotation_id is null then
    v_quotation_id := gen_random_uuid();

    insert into public.quotations (
      id,
      quotation_number,
      branch_id,
      customer_id,
      vehicle_id,
      nature_of_repair,
      inspection_notes,
      status,
      subtotal,
      discount,
      tax,
      total_amount,
      customer_name_snapshot,
      customer_contact_snapshot,
      customer_address_snapshot,
      vehicle_make_snapshot,
      vehicle_model_snapshot,
      vehicle_year_snapshot,
      vehicle_plate_number_snapshot,
      vehicle_vin_snapshot,
      prepared_by_name_snapshot,
      prepared_by_title_snapshot,
      created_by
    )
    values (
      v_quotation_id,
      public.next_document_number('quotation', p_branch_id),
      p_branch_id,
      p_customer_id,
      p_vehicle_id,
      nullif(trim(p_nature_of_repair), ''),
      nullif(trim(p_inspection_notes), ''),
      p_status,
      v_computed_subtotal,
      v_normalized_discount,
      v_normalized_tax,
      v_computed_total_amount,
      v_customer.display_name,
      v_customer.contact_number,
      v_customer.address,
      v_vehicle.make,
      v_vehicle.model,
      v_vehicle.year,
      v_vehicle.plate_number,
      v_vehicle.vin,
      v_prepared_by_name,
      v_prepared_by_title,
      p_created_by
    );
  else
    update public.quotations
    set
      customer_id = p_customer_id,
      vehicle_id = p_vehicle_id,
      nature_of_repair = nullif(trim(p_nature_of_repair), ''),
      inspection_notes = nullif(trim(p_inspection_notes), ''),
      status = p_status,
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
      prepared_by_name_snapshot = coalesce(prepared_by_name_snapshot, v_prepared_by_name),
      prepared_by_title_snapshot = coalesce(prepared_by_title_snapshot, v_prepared_by_title),
      approved_at = null,
      rejected_at = case when p_status = 'rejected' then timezone('utc', now()) else null end,
      updated_at = timezone('utc', now())
    where id = p_quotation_id;

    delete from public.quotation_items where quotation_id = p_quotation_id;

    v_quotation_id := p_quotation_id;
  end if;

  insert into public.quotation_items (
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
  select
    v_quotation_id,
    item.ordinality::integer,
    (item.value ->> 'item_type')::public.line_item_type,
    nullif(item.value ->> 'product_id', '')::uuid,
    nullif(item.value ->> 'service_id', '')::uuid,
    item.value ->> 'description',
    round((item.value ->> 'quantity')::numeric, 4),
    case
      when (item.value ->> 'item_type') = 'product' and u.id is not null
        then concat(u.name, ' (', u.abbreviation, ')')
      else null
    end,
    round((item.value ->> 'unit_price')::numeric, 4),
    round((item.value ->> 'quantity')::numeric * (item.value ->> 'unit_price')::numeric, 4)
  from jsonb_array_elements(p_items) with ordinality as item(value, ordinality)
  left join public.products as p on nullif(item.value ->> 'product_id', '')::uuid = p.id
  left join public.units as u on p.unit_id = u.id;

  return v_quotation_id;
end;
$$;
