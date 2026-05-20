alter table public.job_order_items
  add column if not exists checklist_completed boolean not null default false,
  add column if not exists checklist_checked_at timestamptz,
  add column if not exists checklist_checked_by_staff_id uuid references public.staff(id) on delete set null;

create index if not exists job_order_items_checklist_checked_by_staff_id_idx
  on public.job_order_items (checklist_checked_by_staff_id);

create or replace function public.set_job_order_item_checklist_state(
  p_job_order_item_id uuid,
  p_checklist_completed boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.job_order_items%rowtype;
  v_job_order public.job_orders%rowtype;
  v_staff_id uuid;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor', 'mechanic']::public.staff_role[],
    'Only operational roles can update job order checklists.'
  );

  select *
  into v_item
  from public.job_order_items
  where id = p_job_order_item_id
  for update;

  if not found then
    raise exception 'Job order item does not exist.';
  end if;

  if not public.can_access_job_order(v_item.job_order_id) then
    raise exception 'You do not have access to update this checklist item.';
  end if;

  select *
  into v_job_order
  from public.job_orders
  where id = v_item.job_order_id
  for update;

  if not found then
    raise exception 'Job order does not exist.';
  end if;

  if v_job_order.status in ('released', 'cancelled') then
    raise exception 'Checklist items cannot be updated at this job order status.';
  end if;

  if v_item.approval_status not in ('approved', 'not_required') then
    raise exception 'Only approved or standard work items can be checked off.';
  end if;

  v_staff_id := public.current_staff_record_id();

  if v_staff_id is null then
    raise exception 'Checklist updates require an active staff record.';
  end if;

  update public.job_order_items
  set
    checklist_completed = p_checklist_completed,
    checklist_checked_at = case
      when p_checklist_completed then timezone('utc', now())
      else null
    end,
    checklist_checked_by_staff_id = case
      when p_checklist_completed then v_staff_id
      else null
    end,
    updated_at = timezone('utc', now())
  where id = p_job_order_item_id;

  return p_job_order_item_id;
end;
$$;

revoke all on function public.set_job_order_item_checklist_state(uuid, boolean)
  from public, anon, authenticated;

grant execute on function public.set_job_order_item_checklist_state(uuid, boolean)
  to authenticated;
