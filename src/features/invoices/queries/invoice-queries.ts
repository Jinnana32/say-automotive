import { cache } from "react";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import { roundCurrency } from "@/lib/currency";
import type { TableRow } from "@/types/database";

import {
  mapInvoiceDetail,
  mapInvoiceItemRowToDetail,
  mapInvoiceRowToListItem,
  mapPaymentListItem,
  mapPaymentRowToEntry,
} from "@/features/invoices/mappers";
import type {
  InvoiceDetail,
  InvoiceListItem,
  PaymentDetail,
  PaymentListItem,
} from "@/features/invoices/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type InvoiceRow = TableRow<"invoices">;
type InvoiceItemRow = TableRow<"invoice_items">;
type PaymentRow = TableRow<"payments">;
type CustomerRow = Pick<TableRow<"customers">, "id" | "display_name">;
type VehicleRow = TableRow<"vehicles">;
type JobOrderRow = Pick<TableRow<"job_orders">, "id" | "job_order_number" | "status" | "released_at" | "branch_id">;
type SaleRow = Pick<TableRow<"sales">, "id" | "branch_id" | "sale_number">;
type BusinessSettingsRow = Pick<
  TableRow<"business_settings">,
  "allow_partial_payments" | "allow_release_with_balance" | "require_full_payment_before_release"
>;

export async function listInvoices(filters?: {
  search?: string;
  status?: InvoiceRow["status"] | "";
}): Promise<InvoiceListItem[]> {
  const { branchScope, supabase } = await getBranchScopedServerClient("invoices:read");
  let query = applyBranchFilter(
    supabase.from("invoices").select("*").order("invoice_date", { ascending: false }),
    branchScope.selectedBranchId,
  );

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    const escapedSearch = escapeSearchTerm(filters.search);
    query = query.ilike("invoice_number", `%${escapedSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const invoices = (data ?? []) as InvoiceRow[];
  const customerIds = [
    ...new Set(invoices.flatMap((row) => (row.customer_id ? [row.customer_id] : []))),
  ];
  const vehicleIds = [
    ...new Set(invoices.flatMap((row) => (row.vehicle_id ? [row.vehicle_id] : []))),
  ];
  const jobOrderIds = [
    ...new Set(invoices.flatMap((row) => (row.job_order_id ? [row.job_order_id] : []))),
  ];

  const [customerMap, vehicleMap, jobOrderMap] = await Promise.all([
    getCustomerNameMap(customerIds),
    getVehicleLabelMap(vehicleIds),
    getJobOrderMap(jobOrderIds),
  ]);

  return invoices.map((row) =>
    mapInvoiceRowToListItem({
      row,
      jobOrderNumber: row.job_order_id
        ? jobOrderMap.get(row.job_order_id)?.job_order_number ?? null
        : null,
      customerName: row.customer_id
        ? customerMap.get(row.customer_id) ?? "Unknown customer"
        : "Walk-in customer",
      vehicleLabel: row.vehicle_id
        ? vehicleMap.get(row.vehicle_id) ?? "Unknown vehicle"
        : "No vehicle",
    }),
  );
}

export const getInvoiceById = cache(async (invoiceId: string): Promise<InvoiceDetail | null> => {
  const { branchScope, supabase } = await getBranchScopedServerClient("invoices:read");
  const [
    { data: invoice, error: invoiceError },
    { data: items, error: itemsError },
    { data: payments, error: paymentsError },
  ] = await Promise.all([
    applyBranchFilter(
      supabase.from("invoices").select("*"),
      branchScope.selectedBranchId,
    )
      .eq("id", invoiceId)
      .maybeSingle(),
    supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("line_number", { ascending: true }),
    applyBranchFilter(
      supabase
        .from("payments")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("paid_at", { ascending: false }),
      branchScope.selectedBranchId,
    ),
  ]);

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  if (paymentsError) {
    throw new Error(paymentsError.message);
  }

  if (!invoice) {
    return null;
  }

  const invoiceRow = invoice as InvoiceRow;
  const invoiceItems = ((items ?? []) as InvoiceItemRow[]).map(mapInvoiceItemRowToDetail);
  const invoicePayments = ((payments ?? []) as PaymentRow[]).map(mapPaymentRowToEntry);

  const [{ customerMap, vehicleMap }, sourceContext] = await Promise.all([
    Promise.resolve({
      customerMap: await getCustomerNameMap(
        invoiceRow.customer_id ? [invoiceRow.customer_id] : [],
      ),
      vehicleMap: await getVehicleLabelMap(invoiceRow.vehicle_id ? [invoiceRow.vehicle_id] : []),
    }),
    getInvoiceSourceContext(invoiceRow),
  ]);

  return mapInvoiceDetail({
    row: invoiceRow,
    jobOrderNumber: sourceContext.jobOrder?.job_order_number ?? null,
    saleNumber: sourceContext.sale?.sale_number ?? null,
    customerName: invoiceRow.customer_id
      ? customerMap.get(invoiceRow.customer_id) ?? "Unknown customer"
      : "Walk-in customer",
    vehicleLabel: invoiceRow.vehicle_id
      ? vehicleMap.get(invoiceRow.vehicle_id) ?? "Unknown vehicle"
      : "No vehicle",
    items: invoiceItems,
    payments: invoicePayments,
    allowPartialPayments: sourceContext.settings?.allow_partial_payments ?? false,
    allowReleaseWithBalance: sourceContext.settings?.allow_release_with_balance ?? false,
    requireFullPaymentBeforeRelease:
      sourceContext.settings?.require_full_payment_before_release ?? true,
    jobOrderStatus: sourceContext.jobOrder?.status ?? null,
    releasedAt: sourceContext.jobOrder?.released_at ?? null,
  });
});

export async function listPayments(filters?: {
  search?: string;
  paymentMethod?: PaymentRow["payment_method"] | "";
}): Promise<PaymentListItem[]> {
  const { branchScope, supabase } = await getBranchScopedServerClient("payments:read");
  let query = applyBranchFilter(
    supabase.from("payments").select("*").order("paid_at", { ascending: false }),
    branchScope.selectedBranchId,
  );

  if (filters?.paymentMethod) {
    query = query.eq("payment_method", filters.paymentMethod);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const payments = (data ?? []) as PaymentRow[];
  const invoiceIds = [...new Set(payments.map((row) => row.invoice_id))];
  const invoiceMap = await getInvoiceMap(invoiceIds);
  const jobOrderIds = [
    ...new Set(
      [...invoiceMap.values()]
        .flatMap((invoiceRow) => (invoiceRow.job_order_id ? [invoiceRow.job_order_id] : [])),
    ),
  ];
  const customerIds = [
    ...new Set(
      [...invoiceMap.values()]
        .flatMap((invoiceRow) => (invoiceRow.customer_id ? [invoiceRow.customer_id] : [])),
    ),
  ];
  const [jobOrderMap, customerMap] = await Promise.all([
    getJobOrderMap(jobOrderIds),
    getCustomerNameMap(customerIds),
  ]);

  const mapped = payments
    .map((row) => {
      const invoiceRow = invoiceMap.get(row.invoice_id);

      if (!invoiceRow) {
        return null;
      }

      return mapPaymentListItem({
        row,
        invoiceNumber: invoiceRow.invoice_number,
        jobOrderNumber: invoiceRow.job_order_id
          ? jobOrderMap.get(invoiceRow.job_order_id)?.job_order_number ?? null
          : null,
        customerName: invoiceRow.customer_id
          ? customerMap.get(invoiceRow.customer_id) ?? "Unknown customer"
          : "Walk-in customer",
      });
    })
    .filter((entry): entry is PaymentListItem => entry !== null);

  if (!filters?.search) {
    return mapped;
  }

  const loweredSearch = filters.search.toLowerCase();
  return mapped.filter((row) => {
    return (
      row.invoiceNumber.toLowerCase().includes(loweredSearch) ||
      row.customerName.toLowerCase().includes(loweredSearch) ||
      (row.referenceNumber?.toLowerCase().includes(loweredSearch) ?? false)
    );
  });
}

export const getPaymentById = cache(async (paymentId: string): Promise<PaymentDetail | null> => {
  const { branchScope, supabase } = await getBranchScopedServerClient("payments:read");
  const { data: payment, error: paymentError } = await applyBranchFilter(
    supabase.from("payments").select("*"),
    branchScope.selectedBranchId,
  )
    .eq("id", paymentId)
    .maybeSingle();

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  if (!payment) {
    return null;
  }

  const paymentRow = payment as PaymentRow;
  const { data: invoice, error: invoiceError } = await applyBranchFilter(
    supabase.from("invoices").select("*"),
    branchScope.selectedBranchId,
  )
    .eq("id", paymentRow.invoice_id)
    .maybeSingle();

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  if (!invoice) {
    return null;
  }

  const invoiceRow = invoice as InvoiceRow;
  const [sourceContext, customerResult, vehicleResult, receivedByResult] = await Promise.all([
    getInvoiceSourceContext(invoiceRow),
    invoiceRow.customer_id
      ? supabase
          .from("customers")
          .select("display_name, contact_number, address")
          .eq("id", invoiceRow.customer_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    invoiceRow.vehicle_id
      ? supabase
          .from("vehicles")
          .select("*")
          .eq("id", invoiceRow.vehicle_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    paymentRow.received_by
      ? supabase
          .from("staff")
          .select("first_name, last_name, role")
          .eq("linked_user_id", paymentRow.received_by)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (customerResult.error) {
    throw new Error(customerResult.error.message);
  }

  if (vehicleResult.error) {
    throw new Error(vehicleResult.error.message);
  }

  if (receivedByResult.error) {
    throw new Error(receivedByResult.error.message);
  }

  const customer = customerResult.data;
  const vehicle = vehicleResult.data as VehicleRow | null;
  const receivedBy = receivedByResult.data;
  const branchId = sourceContext.jobOrder?.branch_id ?? sourceContext.sale?.branch_id ?? null;

  return {
    id: paymentRow.id,
    invoiceId: invoiceRow.id,
    invoiceNumber: invoiceRow.invoice_number,
    jobOrderId: invoiceRow.job_order_id,
    jobOrderNumber: sourceContext.jobOrder?.job_order_number ?? null,
    customerName: customer?.display_name ?? "Walk-in customer",
    amount: paymentRow.amount,
    paymentMethod: paymentRow.payment_method,
    referenceNumber: paymentRow.reference_number,
    paidAt: paymentRow.paid_at,
    branchId,
    invoiceDate: invoiceRow.invoice_date,
    invoiceStatus: invoiceRow.status,
    invoiceTotalAmount: invoiceRow.total_amount,
    invoicePaidAmount: invoiceRow.paid_amount,
    invoiceBalanceAfterPayment: invoiceRow.balance,
    invoiceBalanceBeforePayment: roundCurrency(invoiceRow.balance + paymentRow.amount),
    customerContactNumber: customer?.contact_number ?? null,
    customerAddress: customer?.address ?? null,
    vehicleId: invoiceRow.vehicle_id,
    vehicleLabel: vehicle ? formatVehicleLabel(vehicle) : "No vehicle",
    vehicleMake: vehicle?.make ?? null,
    vehicleModel: vehicle?.model ?? null,
    vehicleYear: vehicle?.year ?? null,
    vehiclePlateNumber: vehicle?.plate_number ?? null,
    vehicleVin: vehicle?.vin ?? null,
    saleId: invoiceRow.sale_id,
    saleNumber: sourceContext.sale?.sale_number ?? null,
    notes: paymentRow.notes,
    createdAt: paymentRow.created_at,
    receivedByName: receivedBy ? `${receivedBy.first_name} ${receivedBy.last_name}`.trim() : null,
    receivedByTitle: receivedBy ? receivedBy.role.replaceAll("_", " ") : null,
  };
});

async function getInvoiceSourceContext(invoice: InvoiceRow) {
  const supabase = await getSupabaseServerClient();

  if (invoice.job_order_id) {
    const { data: jobOrder, error: jobOrderError } = await supabase
      .from("job_orders")
      .select("id, job_order_number, status, released_at, branch_id")
      .eq("id", invoice.job_order_id)
      .maybeSingle();

    if (jobOrderError) {
      throw new Error(jobOrderError.message);
    }

    const settings = jobOrder
      ? await getBusinessSettingsByBranchId((jobOrder as JobOrderRow).branch_id)
      : null;

    return {
      jobOrder: (jobOrder as JobOrderRow | null) ?? null,
      sale: null,
      settings,
    };
  }

  if (invoice.sale_id) {
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select("id, branch_id, sale_number")
      .eq("id", invoice.sale_id)
      .maybeSingle();

    if (saleError) {
      throw new Error(saleError.message);
    }

    const saleRow = (sale as SaleRow | null) ?? null;
    return {
      jobOrder: null,
      sale: saleRow,
      settings: saleRow ? await getBusinessSettingsByBranchId(saleRow.branch_id) : null,
    };
  }

  return {
    jobOrder: null,
    sale: null,
    settings: null,
  };
}

async function getInvoiceMap(invoiceIds: string[]) {
  if (invoiceIds.length === 0) {
    return new Map<string, InvoiceRow>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("invoices").select("*").in("id", invoiceIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(((data ?? []) as InvoiceRow[]).map((row) => [row.id, row]));
}

async function getJobOrderMap(jobOrderIds: string[]) {
  if (jobOrderIds.length === 0) {
    return new Map<string, JobOrderRow>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("job_orders")
    .select("id, job_order_number, status, released_at, branch_id")
    .in("id", jobOrderIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(((data ?? []) as JobOrderRow[]).map((row) => [row.id, row]));
}

async function getCustomerNameMap(customerIds: string[]) {
  if (customerIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, display_name")
    .in("id", customerIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(((data ?? []) as CustomerRow[]).map((row) => [row.id, row.display_name]));
}

async function getVehicleLabelMap(vehicleIds: string[]) {
  if (vehicleIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("vehicles").select("*").in("id", vehicleIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as VehicleRow[]).map((vehicle) => [vehicle.id, formatVehicleLabel(vehicle)]),
  );
}

async function getBusinessSettingsByBranchId(branchId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("business_settings")
    .select(
      "allow_partial_payments, allow_release_with_balance, require_full_payment_before_release",
    )
    .eq("branch_id", branchId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as BusinessSettingsRow | null) ?? null;
}

function formatVehicleLabel(vehicle: VehicleRow) {
  const platePart = vehicle.plate_number ? ` · ${vehicle.plate_number}` : "";
  const yearPart = vehicle.year ? ` (${vehicle.year})` : "";
  return `${vehicle.make} ${vehicle.model}${yearPart}${platePart}`;
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}
