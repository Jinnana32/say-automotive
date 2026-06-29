create or replace function public.delete_quotation(
  p_quotation_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quotation public.quotations%rowtype;
begin
  perform public.assert_has_any_staff_role(
    array['owner', 'admin', 'service_advisor']::public.staff_role[],
    'Only service-administration roles can delete quotations.'
  );

  select *
  into v_quotation
  from public.quotations
  where id = p_quotation_id
  for update;

  if not found then
    raise exception 'Quotation does not exist.';
  end if;

  perform public.assert_branch_access(
    v_quotation.branch_id,
    'You do not have access to delete quotations for this branch.'
  );

  if v_quotation.status = 'approved' then
    raise exception 'Approved quotations cannot be deleted. Manage work through the linked job order instead.';
  end if;

  if exists (
    select 1
    from public.job_orders
    where quotation_id = p_quotation_id
  ) then
    raise exception 'This quotation is linked to a job order and cannot be deleted.';
  end if;

  delete from public.quotations
  where id = p_quotation_id;
end;
$$;

grant execute on function public.delete_quotation(uuid) to authenticated;
