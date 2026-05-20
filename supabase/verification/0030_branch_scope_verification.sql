-- Branch support post-migration verification for 0030_branch_scope_support.sql
-- Run after applying the migration. Counts marked "expect 0" should return 0.

-- Main branch must exist exactly once.
select count(*) as main_branch_count
from public.branches
where code = 'MAIN'
  and is_main = true
  and is_active = true;

-- Branch-specific settings and document sequences must exist for Main Branch.
select count(*) as main_branch_business_settings_count
from public.business_settings bs
join public.branches b on b.id = bs.branch_id
where b.code = 'MAIN';

select count(*) as main_branch_document_sequence_count
from public.document_sequences ds
join public.branches b on b.id = ds.branch_id
where b.code = 'MAIN'
  and ds.key in ('quotation', 'job_order', 'invoice', 'sale');

-- Branch-owned rows must not have null branch_id values. All rows below should report 0.
select 'staff' as table_name, count(*) as null_branch_count from public.staff where branch_id is null
union all
select 'customers', count(*) from public.customers where branch_id is null
union all
select 'vehicles', count(*) from public.vehicles where branch_id is null
union all
select 'quotations', count(*) from public.quotations where branch_id is null
union all
select 'job_orders', count(*) from public.job_orders where branch_id is null
union all
select 'sales', count(*) from public.sales where branch_id is null
union all
select 'inventory_stocks', count(*) from public.inventory_stocks where branch_id is null
union all
select 'stock_movements', count(*) from public.stock_movements where branch_id is null
union all
select 'attendance', count(*) from public.attendance where branch_id is null
union all
select 'attendance_adjustments', count(*) from public.attendance_adjustments where branch_id is null
union all
select 'attendance_time_logs', count(*) from public.attendance_time_logs where branch_id is null
union all
select 'dtr_amendment_requests', count(*) from public.dtr_amendment_requests where branch_id is null
union all
select 'invoices', count(*) from public.invoices where branch_id is null
union all
select 'payments', count(*) from public.payments where branch_id is null
union all
select 'payroll_periods', count(*) from public.payroll_periods where branch_id is null
union all
select 'business_settings', count(*) from public.business_settings where branch_id is null
union all
select 'branch_holidays', count(*) from public.branch_holidays where branch_id is null
union all
select 'staff_leave_entries', count(*) from public.staff_leave_entries where branch_id is null
union all
select 'attendance_allowed_ips', count(*) from public.attendance_allowed_ips where branch_id is null;

-- Shared catalogs should remain global in this rollout. Both counts should report 0.
select count(*) as products_with_branch_id
from public.products
where branch_id is not null;

select count(*) as services_with_branch_id
from public.services
where branch_id is not null;

-- Staff must be assigned to branches. Expect 0.
select count(*) as staff_without_branch
from public.staff
where branch_id is null;

-- Branch consistency checks. Every query below should report 0.
select count(*) as vehicles_with_customer_branch_mismatch
from public.vehicles v
join public.customers c on c.id = v.customer_id
where v.branch_id <> c.branch_id;

select count(*) as quotations_with_customer_branch_mismatch
from public.quotations q
join public.customers c on c.id = q.customer_id
where q.branch_id <> c.branch_id;

select count(*) as quotations_with_vehicle_branch_mismatch
from public.quotations q
join public.vehicles v on v.id = q.vehicle_id
where q.branch_id <> v.branch_id;

select count(*) as job_orders_with_quotation_branch_mismatch
from public.job_orders jo
join public.quotations q on q.id = jo.quotation_id
where jo.branch_id <> q.branch_id;

select count(*) as job_orders_with_customer_branch_mismatch
from public.job_orders jo
join public.customers c on c.id = jo.customer_id
where jo.branch_id <> c.branch_id;

select count(*) as job_orders_with_vehicle_branch_mismatch
from public.job_orders jo
join public.vehicles v on v.id = jo.vehicle_id
where jo.branch_id <> v.branch_id;

select count(*) as job_order_mechanics_branch_mismatch
from public.job_order_mechanics jm
join public.job_orders jo on jo.id = jm.job_order_id
join public.staff s on s.id = jm.staff_id
where jo.branch_id <> s.branch_id;

select count(*) as sales_with_customer_branch_mismatch
from public.sales s
join public.customers c on c.id = s.customer_id
where s.customer_id is not null
  and s.branch_id <> c.branch_id;

select count(*) as invoices_with_job_order_branch_mismatch
from public.invoices i
join public.job_orders jo on jo.id = i.job_order_id
where i.job_order_id is not null
  and i.branch_id <> jo.branch_id;

select count(*) as invoices_with_sale_branch_mismatch
from public.invoices i
join public.sales s on s.id = i.sale_id
where i.sale_id is not null
  and i.branch_id <> s.branch_id;

select count(*) as payments_with_invoice_branch_mismatch
from public.payments p
join public.invoices i on i.id = p.invoice_id
where p.branch_id <> i.branch_id;

select count(*) as attendance_with_staff_branch_mismatch
from public.attendance a
join public.staff s on s.id = a.staff_id
where a.branch_id <> s.branch_id;

select count(*) as attendance_adjustments_with_staff_branch_mismatch
from public.attendance_adjustments aa
join public.staff s on s.id = aa.staff_id
where aa.branch_id <> s.branch_id;

select count(*) as attendance_adjustments_with_attendance_branch_mismatch
from public.attendance_adjustments aa
join public.attendance a on a.id = aa.attendance_id
where aa.attendance_id is not null
  and aa.branch_id <> a.branch_id;

select count(*) as attendance_time_logs_with_staff_branch_mismatch
from public.attendance_time_logs atl
join public.staff s on s.id = atl.staff_id
where atl.branch_id <> s.branch_id;

select count(*) as attendance_time_logs_with_attendance_branch_mismatch
from public.attendance_time_logs atl
join public.attendance a on a.id = atl.attendance_id
where atl.attendance_id is not null
  and atl.branch_id <> a.branch_id;

select count(*) as dtr_amendments_with_staff_branch_mismatch
from public.dtr_amendment_requests dar
join public.staff s on s.id = dar.staff_id
where dar.branch_id <> s.branch_id;

select count(*) as dtr_amendments_with_attendance_branch_mismatch
from public.dtr_amendment_requests dar
join public.attendance a on a.id = dar.attendance_id
where dar.attendance_id is not null
  and dar.branch_id <> a.branch_id;

-- Branch-specific document sequence safety. Every query below should report 0.
select count(*) as document_sequences_with_null_branch
from public.document_sequences
where branch_id is null;

select count(*) as duplicate_document_sequences
from (
  select key, branch_id, count(*) as row_count
  from public.document_sequences
  group by key, branch_id
  having count(*) > 1
) duplicates;

-- Inventory stock should remain branch-specific. Expect 0.
select count(*) as duplicate_inventory_stock_rows
from (
  select branch_id, product_id, count(*) as row_count
  from public.inventory_stocks
  group by branch_id, product_id
  having count(*) > 1
) duplicates;

-- Optional inspection queries for rollout review.
select b.code as branch_code, ds.key, ds.prefix, ds.padding, ds.last_value
from public.document_sequences ds
join public.branches b on b.id = ds.branch_id
order by b.code, ds.key;

select b.code as branch_code, bs.business_name, bs.default_tax_rate, bs.allow_partial_payments
from public.business_settings bs
join public.branches b on b.id = bs.branch_id
order by b.code;
