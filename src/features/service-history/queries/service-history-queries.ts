import { cache } from "react";

import type { AppCapability } from "@/lib/auth/permissions";
import { applyBranchFilter, getBranchScope } from "@/lib/branches";
import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TableRow } from "@/types/database";
import {
  mapJobOrderItemRowToDetail,
  mapJobOrderMechanicRowToAssignment,
} from "@/features/job-orders/mappers";
import type {
  JobOrderItemDetail,
  JobOrderMechanicAssignment,
  JobOrderStatus,
} from "@/features/job-orders/types";
import type {
  ServiceHistoryEntry,
  ServiceHistoryInvoiceSummary,
  ServiceHistoryQuotationSummary,
} from "@/features/service-history/types";
import {
  buildServiceHistoryItems,
  buildUsageQuantityMap,
  mapMechanicNames,
  resolveServiceHistoryDate,
  resolveServiceHistoryPhase,
  sortServiceHistoryEntries,
} from "@/features/service-history/utils";

type VehicleRow = Pick<TableRow<"vehicles">, "id" | "make" | "model" | "year" | "plate_number">;
type JobOrderRow = Pick<
  TableRow<"job_orders">,
  | "id"
  | "job_order_number"
  | "customer_id"
  | "vehicle_id"
  | "quotation_id"
  | "status"
  | "created_at"
  | "started_at"
  | "completed_at"
  | "released_at"
  | "mileage_in"
  | "mileage_out"
  | "customer_concern"
  | "inspection_notes"
  | "diagnosis"
  | "work_performed"
>;
type JobOrderItemRow = TableRow<"job_order_items">;
type JobOrderMechanicRow = TableRow<"job_order_mechanics">;
type JobOrderUsageRow = Pick<
  TableRow<"job_order_part_usages">,
  "id" | "job_order_id" | "job_order_item_id" | "usage_type" | "quantity"
>;
type InvoiceRow = Pick<
  TableRow<"invoices">,
  "id" | "job_order_id" | "invoice_number" | "status" | "total_amount" | "paid_amount" | "balance"
>;
type QuotationRow = Pick<TableRow<"quotations">, "id" | "quotation_number">;
type StaffRow = Pick<TableRow<"staff">, "id" | "first_name" | "last_name">;

export const listServiceHistoryByVehicleIds = cache(async (vehicleIds: string[]) => {
  const context = await requireAuthenticatedStaff();
  const supabase = await getSupabaseServerClient();
  const branchScope = await getBranchScope();

  return listServiceHistoryByVehicleIdsForContext({
    supabase,
    capabilities: context.capabilities,
    vehicleIds,
    branchId: branchScope.selectedBranchId,
  });
});

export async function listServiceHistoryByVehicleIdsForContext(params: {
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
  capabilities: readonly AppCapability[];
  vehicleIds: string[];
  branchId?: string | null;
}): Promise<ServiceHistoryEntry[]> {
  if (params.vehicleIds.length === 0 || !params.capabilities.includes("job_orders:read")) {
    return [];
  }

  const canViewQuotations = params.capabilities.includes("quotations:read");
  const canViewInvoices = params.capabilities.includes("invoices:read");

  const [{ data: vehicles, error: vehiclesError }, { data: jobOrders, error: jobOrdersError }] =
    await Promise.all([
      applyBranchFilter(
        params.supabase
          .from("vehicles")
          .select("id, make, model, year, plate_number")
          .in("id", params.vehicleIds),
        params.branchId ?? null,
      ),
      applyBranchFilter(
        params.supabase
          .from("job_orders")
          .select(
            "id, job_order_number, customer_id, vehicle_id, quotation_id, status, created_at, started_at, completed_at, released_at, mileage_in, mileage_out, customer_concern, inspection_notes, diagnosis, work_performed",
          )
          .in("vehicle_id", params.vehicleIds),
        params.branchId ?? null,
      ),
    ]);

  if (vehiclesError) {
    throw new Error(vehiclesError.message);
  }

  if (jobOrdersError) {
    throw new Error(jobOrdersError.message);
  }

  const vehicleRows = (vehicles ?? []) as VehicleRow[];
  const jobOrderRows = (jobOrders ?? []) as JobOrderRow[];

  if (jobOrderRows.length === 0) {
    return [];
  }

  const jobOrderIds = jobOrderRows.map((jobOrder) => jobOrder.id);
  const quotationIds = [
    ...new Set(jobOrderRows.flatMap((jobOrder) => (jobOrder.quotation_id ? [jobOrder.quotation_id] : []))),
  ];

  const [
    { data: items, error: itemsError },
    { data: mechanics, error: mechanicsError },
    { data: usages, error: usagesError },
    { data: invoices, error: invoicesError },
    { data: quotations, error: quotationsError },
  ] = await Promise.all([
    params.supabase
      .from("job_order_items")
      .select("*")
      .in("job_order_id", jobOrderIds)
      .order("line_number", { ascending: true }),
    params.supabase
      .from("job_order_mechanics")
      .select("*")
      .in("job_order_id", jobOrderIds)
      .order("created_at", { ascending: true }),
    params.supabase
      .from("job_order_part_usages")
      .select("id, job_order_id, job_order_item_id, usage_type, quantity")
      .in("job_order_id", jobOrderIds),
    canViewInvoices
      ? params.supabase
          .from("invoices")
          .select("id, job_order_id, invoice_number, status, total_amount, paid_amount, balance")
          .in("job_order_id", jobOrderIds)
      : Promise.resolve({ data: [], error: null }),
    canViewQuotations && quotationIds.length > 0
      ? params.supabase
          .from("quotations")
          .select("id, quotation_number")
          .in("id", quotationIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  if (mechanicsError) {
    throw new Error(mechanicsError.message);
  }

  if (usagesError) {
    throw new Error(usagesError.message);
  }

  if (invoicesError) {
    throw new Error(invoicesError.message);
  }

  if (quotationsError) {
    throw new Error(quotationsError.message);
  }

  const mechanicRows = (mechanics ?? []) as JobOrderMechanicRow[];
  const staffIds = [...new Set(mechanicRows.map((mechanic) => mechanic.staff_id))];
  const { data: staff, error: staffError } = staffIds.length
    ? await params.supabase
        .from("staff")
        .select("id, first_name, last_name")
        .in("id", staffIds)
    : { data: [], error: null };

  if (staffError) {
    throw new Error(staffError.message);
  }

  const vehicleLabelMap = new Map(
    vehicleRows.map((vehicle) => [vehicle.id, formatVehicleLabel(vehicle)]),
  );
  const staffNameMap = new Map(
    ((staff ?? []) as StaffRow[]).map((member) => [
      member.id,
      `${member.first_name} ${member.last_name}`.trim(),
    ]),
  );
  const quotationMap = new Map(
    ((quotations ?? []) as QuotationRow[]).map((quotation) => [
      quotation.id,
      {
        id: quotation.id,
        quotationNumber: quotation.quotation_number,
      } satisfies ServiceHistoryQuotationSummary,
    ]),
  );
  const invoiceMap = new Map(
    ((invoices ?? []) as InvoiceRow[]).map((invoice) => [
      invoice.job_order_id,
      {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        status: invoice.status,
        totalAmount: invoice.total_amount,
        paidAmount: invoice.paid_amount,
        balance: invoice.balance,
      } satisfies ServiceHistoryInvoiceSummary,
    ]),
  );

  const itemsByJobOrderId = groupByJobOrderId(
    ((items ?? []) as JobOrderItemRow[]).map((item) => ({
      jobOrderId: item.job_order_id,
      value: mapJobOrderItemRowToDetail({ row: item }),
    })),
  );
  const mechanicsByJobOrderId = groupByJobOrderId(
    mechanicRows.map((mechanic) => ({
      jobOrderId: mechanic.job_order_id,
      value: mapJobOrderMechanicRowToAssignment(
        mechanic,
        staffNameMap.get(mechanic.staff_id) ?? "Unknown mechanic",
      ),
    })),
  );
  const usageRowsByJobOrderId = groupByJobOrderId(
    ((usages ?? []) as JobOrderUsageRow[]).map((usageRow) => ({
      jobOrderId: usageRow.job_order_id,
      value: usageRow,
    })),
  );

  const entries = jobOrderRows.flatMap((jobOrder) =>
    mapJobOrderToServiceHistoryEntry({
      row: jobOrder,
      vehicleLabel: vehicleLabelMap.get(jobOrder.vehicle_id) ?? "Unknown vehicle",
      items: itemsByJobOrderId.get(jobOrder.id) ?? [],
      mechanics: mechanicsByJobOrderId.get(jobOrder.id) ?? [],
      usageRows: usageRowsByJobOrderId.get(jobOrder.id) ?? [],
      invoice: invoiceMap.get(jobOrder.id) ?? null,
      quotation: jobOrder.quotation_id ? quotationMap.get(jobOrder.quotation_id) ?? null : null,
    }),
  );

  return sortServiceHistoryEntries(entries);
}

function mapJobOrderToServiceHistoryEntry(params: {
  row: JobOrderRow;
  vehicleLabel: string;
  items: JobOrderItemDetail[];
  mechanics: JobOrderMechanicAssignment[];
  usageRows: JobOrderUsageRow[];
  invoice: ServiceHistoryInvoiceSummary | null;
  quotation: ServiceHistoryQuotationSummary | null;
}): ServiceHistoryEntry[] {
  const phase = resolveServiceHistoryPhase(params.row.status as JobOrderStatus);

  if (!phase) {
    return [];
  }

  const usageQuantityByItemId = buildUsageQuantityMap(
    params.usageRows.map((usageRow) => ({
      jobOrderItemId: usageRow.job_order_item_id,
      usageType: usageRow.usage_type,
      quantity: usageRow.quantity,
    })),
  );
  const historyItems = buildServiceHistoryItems({
    items: params.items,
    usageQuantityByItemId,
  });

  return [
    {
      id: params.row.id,
      vehicleId: params.row.vehicle_id,
      vehicleLabel: params.vehicleLabel,
      customerId: params.row.customer_id,
      jobOrderId: params.row.id,
      jobOrderNumber: params.row.job_order_number,
      status: params.row.status,
      phase,
      serviceDate: resolveServiceHistoryDate({
        releasedAt: params.row.released_at,
        completedAt: params.row.completed_at,
        createdAt: params.row.created_at,
      }),
      createdAt: params.row.created_at,
      startedAt: params.row.started_at,
      completedAt: params.row.completed_at,
      releasedAt: params.row.released_at,
      customerConcern: params.row.customer_concern,
      inspectionNotes: params.row.inspection_notes,
      diagnosis: params.row.diagnosis,
      workPerformed: params.row.work_performed,
      mileageIn: params.row.mileage_in,
      mileageOut: params.row.mileage_out,
      services: historyItems.services,
      partsUsed: historyItems.partsUsed,
      rejectedExtras: historyItems.rejectedExtras,
      mechanics: mapMechanicNames(params.mechanics),
      invoice: params.invoice,
      quotation: params.quotation,
      totalAmount: params.invoice?.totalAmount ?? historyItems.billableTotal,
      paymentMethod: null,
    },
  ];
}

function formatVehicleLabel(vehicle: VehicleRow) {
  const yearPart = vehicle.year ? ` (${vehicle.year})` : "";
  const platePart = vehicle.plate_number ? ` · ${vehicle.plate_number}` : "";
  return `${vehicle.make} ${vehicle.model}${yearPart}${platePart}`;
}

function groupByJobOrderId<T>(rows: Array<{ jobOrderId: string; value: T }>) {
  return rows.reduce<Map<string, T[]>>((groups, row) => {
    const currentRows = groups.get(row.jobOrderId) ?? [];
    groups.set(row.jobOrderId, [...currentRows, row.value]);
    return groups;
  }, new Map());
}
