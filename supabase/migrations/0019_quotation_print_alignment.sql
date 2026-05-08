alter table public.business_settings
  add column if not exists business_email text;

alter table public.quotations
  add column if not exists nature_of_repair text,
  add column if not exists customer_name_snapshot text,
  add column if not exists customer_contact_snapshot text,
  add column if not exists customer_address_snapshot text,
  add column if not exists vehicle_make_snapshot text,
  add column if not exists vehicle_model_snapshot text,
  add column if not exists vehicle_year_snapshot integer,
  add column if not exists vehicle_plate_number_snapshot text,
  add column if not exists vehicle_vin_snapshot text,
  add column if not exists prepared_by_name_snapshot text,
  add column if not exists prepared_by_title_snapshot text;

alter table public.quotation_items
  add column if not exists unit_label_snapshot text;

update public.business_settings
set business_email = null
where business_email is not null
  and btrim(business_email) = '';

update public.quotations as q
set
  nature_of_repair = coalesce(q.nature_of_repair, q.inspection_notes),
  customer_name_snapshot = coalesce(
    q.customer_name_snapshot,
    (select c.display_name from public.customers as c where c.id = q.customer_id)
  ),
  customer_contact_snapshot = coalesce(
    q.customer_contact_snapshot,
    (select c.contact_number from public.customers as c where c.id = q.customer_id)
  ),
  customer_address_snapshot = coalesce(
    q.customer_address_snapshot,
    (select c.address from public.customers as c where c.id = q.customer_id)
  ),
  vehicle_make_snapshot = coalesce(
    q.vehicle_make_snapshot,
    (select v.make from public.vehicles as v where v.id = q.vehicle_id)
  ),
  vehicle_model_snapshot = coalesce(
    q.vehicle_model_snapshot,
    (select v.model from public.vehicles as v where v.id = q.vehicle_id)
  ),
  vehicle_year_snapshot = coalesce(
    q.vehicle_year_snapshot,
    (select v.year from public.vehicles as v where v.id = q.vehicle_id)
  ),
  vehicle_plate_number_snapshot = coalesce(
    q.vehicle_plate_number_snapshot,
    (select v.plate_number from public.vehicles as v where v.id = q.vehicle_id)
  ),
  vehicle_vin_snapshot = coalesce(
    q.vehicle_vin_snapshot,
    (select v.vin from public.vehicles as v where v.id = q.vehicle_id)
  ),
  prepared_by_name_snapshot = coalesce(
    q.prepared_by_name_snapshot,
    (
      select nullif(trim(concat_ws(' ', s.first_name, s.last_name)), '')
      from public.staff as s
      where s.linked_user_id = q.created_by
      limit 1
    )
  ),
  prepared_by_title_snapshot = coalesce(
    q.prepared_by_title_snapshot,
    (
      select initcap(replace(s.role::text, '_', ' '))
      from public.staff as s
      where s.linked_user_id = q.created_by
      limit 1
    )
  )
where true;

update public.quotation_items as qi
set unit_label_snapshot = concat(u.name, ' (', u.abbreviation, ')')
from public.products as p
join public.units as u on u.id = p.unit_id
where qi.product_id = p.id
  and qi.item_type = 'product'
  and (qi.unit_label_snapshot is null or btrim(qi.unit_label_snapshot) = '');

drop function if exists public.save_quotation_with_items(
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
);

drop function if exists public.save_quotation_with_items_impl(
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
);

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
  v_existing_status public.quotation_status;
  v_item record;
  v_customer public.customers%rowtype;
  v_vehicle public.vehicles%rowtype;
  v_prepared_by_name text;
  v_prepared_by_title text;
begin
  if p_status not in ('draft', 'pending_approval') then
    raise exception 'Quotations can only be saved as draft or pending approval.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one quotation item is required.';
  end if;

  select *
  into v_customer
  from public.customers
  where id = p_customer_id;

  if not found then
    raise exception 'Selected customer does not exist.';
  end if;

  select *
  into v_vehicle
  from public.vehicles
  where id = p_vehicle_id
    and customer_id = p_customer_id;

  if not found then
    raise exception 'Selected vehicle does not belong to the selected customer.';
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

    if coalesce((v_item.value ->> 'quantity')::numeric, 0) <= 0 then
      raise exception 'Quotation item % must have quantity greater than zero.', v_item.ordinality;
    end if;

    if coalesce((v_item.value ->> 'unit_price')::numeric, -1) < 0 then
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
  end loop;

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
      public.next_document_number('quotation'),
      p_branch_id,
      p_customer_id,
      p_vehicle_id,
      nullif(trim(p_nature_of_repair), ''),
      nullif(trim(p_inspection_notes), ''),
      p_status,
      p_subtotal,
      p_discount,
      p_tax,
      p_total_amount,
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
    select status
    into v_existing_status
    from public.quotations
    where id = p_quotation_id
    for update;

    if not found then
      raise exception 'Quotation does not exist.';
    end if;

    if v_existing_status = 'approved' then
      raise exception 'Approved quotations cannot be edited.';
    end if;

    update public.quotations
    set
      branch_id = p_branch_id,
      customer_id = p_customer_id,
      vehicle_id = p_vehicle_id,
      nature_of_repair = nullif(trim(p_nature_of_repair), ''),
      inspection_notes = nullif(trim(p_inspection_notes), ''),
      status = p_status,
      subtotal = p_subtotal,
      discount = p_discount,
      tax = p_tax,
      total_amount = p_total_amount,
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
    (item.value ->> 'quantity')::numeric,
    case
      when (item.value ->> 'item_type') = 'product' and u.id is not null
        then concat(u.name, ' (', u.abbreviation, ')')
      else null
    end,
    (item.value ->> 'unit_price')::numeric,
    coalesce(
      (item.value ->> 'total')::numeric,
      (item.value ->> 'quantity')::numeric * (item.value ->> 'unit_price')::numeric
    )
  from jsonb_array_elements(p_items) with ordinality as item(value, ordinality)
  left join public.products as p on nullif(item.value ->> 'product_id', '')::uuid = p.id
  left join public.units as u on p.unit_id = u.id;

  return v_quotation_id;
end;
$$;

create or replace function public.save_quotation_with_items(
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
    p_nature_of_repair,
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

revoke all on function public.save_quotation_with_items_impl(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  public.quotation_status,
  numeric,
  numeric,
  numeric,
  numeric,
  jsonb,
  uuid
) from public, anon, authenticated;

revoke all on function public.save_quotation_with_items(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  public.quotation_status,
  numeric,
  numeric,
  numeric,
  numeric,
  jsonb,
  uuid
) from public, anon;

grant execute on function public.save_quotation_with_items(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  public.quotation_status,
  numeric,
  numeric,
  numeric,
  numeric,
  jsonb,
  uuid
) to authenticated;
