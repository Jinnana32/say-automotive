# Branch Support Production Checklist

This checklist is for validating branch support after applying `0030_branch_scope_support.sql`.

Current all-branch role note:
- The current schema has `owner` as the only global cross-branch role.
- There is no `super_admin` enum in the current database schema.

## 1. Branch isolation

1. Create a customer in Branch A.
2. Create a different customer in Branch B.
3. Sign in as a Branch A non-owner user.
4. Open `/customers` and confirm only Branch A records are visible.
5. Attempt direct navigation to the Branch B customer detail URL.
6. Attempt a direct API/RPC call for the Branch B customer if you have a test harness.

Expected:
- Branch B customer is not visible to the Branch A user.
- Direct access is blocked by RLS or branch-aware RPC checks.

## 2. Quotation branch takeover prevention

1. Create a quotation in Branch A.
2. Sign in as a Branch B non-owner user.
3. Attempt to call `save_quotation_with_items` with:
   - `p_quotation_id` = Branch A quotation ID
   - `p_branch_id` = Branch B ID
4. Repeat as an owner with the same mismatched branch payload.

Expected:
- Both calls are rejected.
- The quotation keeps its original Branch A `branch_id`.
- Branch transfer is impossible through the standard save flow.

## 3. Document numbering

1. Generate a quotation in Main Branch.
2. Generate a quotation in Branch 2.
3. Generate a second quotation in Main Branch.
4. Review `quotation_number` values and `document_sequences`.

Expected:
- Numbers include the branch code.
- Main Branch numbering increments independently from Branch 2.
- Example expected pattern for branch-specific sequencing:
  - `QT-MAIN-0001`
  - `QT-BR2-0001`
  - `QT-MAIN-0002`

## 4. Invoice and payment branch consistency

1. Create a job order in Branch A.
2. Generate an invoice from that job order.
3. Record a payment for that invoice.
4. Inspect `job_orders.branch_id`, `invoices.branch_id`, and `payments.branch_id`.

Expected:
- All three records stay on Branch A.
- Payment recording fails if a mismatched branch is forced through direct SQL or RPC payload tampering.

## 5. POS branch inventory isolation

1. Create or reuse one shared product.
2. Set Branch A inventory stock for that product to `10`.
3. Set Branch B inventory stock for that product to `0`.
4. Attempt a POS sale in Branch B for quantity `1`.
5. Complete a POS sale in Branch A for quantity `1`.

Expected:
- Branch B sale is blocked for insufficient stock.
- Branch A sale succeeds.
- Only Branch A `inventory_stocks` and `stock_movements` rows are changed.

## 6. Attendance and mechanic isolation

1. Sign in as a mechanic assigned to Branch A.
2. Confirm the mechanic can only see their own attendance/time-log data.
3. Confirm the mechanic only sees job orders assigned to them.
4. Sign in as a Branch A admin and confirm Branch B attendance is not visible.
5. Sign in as an owner and confirm cross-branch attendance/report access works.

Expected:
- Mechanics are limited to their own attendance and assigned jobs.
- Branch admins are limited to their own branch.
- Owners can view all branches.

## 7. Reports and dashboard

1. Sign in as a Branch A non-owner user.
2. Check dashboard totals, reports, quick access, service history, invoices, and payments.
3. Sign in as an owner.
4. Switch branch scope between:
   - Main Branch
   - Branch A
   - Branch B
   - All branches

Expected:
- Branch-scoped users only see their own branch totals and records.
- Owner filters change results by branch.
- All-branch owner view aggregates data without leaking cross-branch writes.

## 8. Branch settings and defaults

1. Confirm Main Branch has business settings and document sequence rows.
2. Create a new branch.
3. Inspect `business_settings` and `document_sequences` for the new branch.

Expected:
- Main Branch settings exist.
- New branches receive default `business_settings` and per-branch `document_sequences`.
- Invoice, payment, and POS flows do not fail with missing settings for a newly created branch.
