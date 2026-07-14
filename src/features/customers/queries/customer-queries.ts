import { cache } from "react";

import { applyBranchFilter, getBranchScopedServerClient } from "@/lib/branches";
import type { TableRow } from "@/types/database";
import {
  mapCustomerDetail,
  mapCustomerRowToListItem,
  mapCustomerRowToOption,
} from "@/features/customers/mappers";
import type {
  CustomerDetail,
  CustomerDocumentHistoryItem,
  CustomerListItem,
  CustomerOption,
} from "@/features/customers/types";

type CustomerRow = TableRow<"customers">;
type VehicleRow = TableRow<"vehicles">;
type QuotationHistoryRow = Pick<
  TableRow<"quotations">,
  "id" | "quotation_number" | "vehicle_id" | "status" | "total_amount" | "created_at"
>;
type JobOrderHistoryRow = Pick<
  TableRow<"job_orders">,
  "id" | "quotation_id" | "job_order_number" | "vehicle_id" | "status" | "created_at"
>;
type InvoiceHistoryRow = Pick<
  TableRow<"invoices">,
  "id" | "job_order_id" | "invoice_number" | "vehicle_id" | "status" | "total_amount" | "invoice_date"
>;
type PaymentHistoryRow = Pick<
  TableRow<"payments">,
  "id" | "invoice_id" | "amount" | "payment_method" | "reference_number" | "paid_at"
>;
type CustomerListRow = Pick<
  CustomerRow,
  | "id"
  | "customer_code"
  | "customer_type"
  | "display_name"
  | "contact_number"
  | "contact_number_secondary"
  | "email"
  | "status"
  | "created_at"
  | "updated_at"
>;
type CustomerOptionRow = Pick<CustomerRow, "id" | "display_name">;

export async function listCustomers(
  search?: string,
  options?: {
    /**
     * Defaults to active-only so merged/deactivated duplicate customers stay out of the directory.
     * Pass "" to include every status, or "inactive" to browse deactivated records.
     */
    status?: CustomerListItem["status"] | "";
  },
): Promise<CustomerListItem[]> {
  const { branchScope, supabase } = await getBranchScopedServerClient("customers:read");
  const statusFilter = options?.status === undefined ? "active" : options.status;
  let query = applyBranchFilter(
    supabase
    .from("customers")
    .select(
      "id, customer_code, customer_type, display_name, contact_number, contact_number_secondary, email, status, created_at, updated_at",
    )
    .order("display_name", { ascending: true }),
    branchScope.selectedBranchId,
  );

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  if (search) {
    const escapedSearch = escapeSearchTerm(search);
    query = query.or(
      `display_name.ilike.%${escapedSearch}%,contact_number.ilike.%${escapedSearch}%,contact_number_secondary.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CustomerListRow[]).map(mapCustomerRowToListItem);
}

export const getCustomerById = cache(async (customerId: string): Promise<CustomerDetail | null> => {
  const { branchScope, context, supabase } = await getBranchScopedServerClient("customers:read");
  const canViewQuotations = context.capabilities.includes("quotations:read");
  const canViewJobOrders = context.capabilities.includes("job_orders:read");
  const canViewInvoices = context.capabilities.includes("invoices:read");
  const canViewPayments = context.capabilities.includes("payments:read");

  const [
    { data: customer, error: customerError },
    { data: vehicles, error: vehiclesError },
    { data: quotations, error: quotationsError },
    { data: jobOrders, error: jobOrdersError },
    { data: invoices, error: invoicesError },
  ] = await Promise.all([
    applyBranchFilter(
      supabase
      .from("customers")
      .select("*")
      .eq("id", customerId),
      branchScope.selectedBranchId,
    ).maybeSingle(),
    applyBranchFilter(
      supabase
      .from("vehicles")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
      branchScope.selectedBranchId,
    ),
    canViewQuotations
      ? applyBranchFilter(
          supabase
          .from("quotations")
          .select("id, quotation_number, vehicle_id, status, total_amount, created_at")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false }),
          branchScope.selectedBranchId,
        )
      : Promise.resolve({ data: [], error: null }),
    canViewJobOrders
      ? applyBranchFilter(
          supabase
          .from("job_orders")
          .select("id, quotation_id, job_order_number, vehicle_id, status, created_at")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false }),
          branchScope.selectedBranchId,
        )
      : Promise.resolve({ data: [], error: null }),
    canViewInvoices || canViewPayments
      ? applyBranchFilter(
          supabase
          .from("invoices")
          .select("id, job_order_id, invoice_number, vehicle_id, status, total_amount, invoice_date")
          .eq("customer_id", customerId)
          .order("invoice_date", { ascending: false }),
          branchScope.selectedBranchId,
        )
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (customerError) {
    throw new Error(customerError.message);
  }

  if (vehiclesError) {
    throw new Error(vehiclesError.message);
  }

  if (quotationsError) {
    throw new Error(quotationsError.message);
  }

  if (jobOrdersError) {
    throw new Error(jobOrdersError.message);
  }

  if (invoicesError) {
    throw new Error(invoicesError.message);
  }

  if (!customer) {
    return null;
  }

  const vehicleRows = (vehicles ?? []) satisfies VehicleRow[];
  const quotationRows = (quotations ?? []) as QuotationHistoryRow[];
  const jobOrderRows = (jobOrders ?? []) as JobOrderHistoryRow[];
  const invoiceRows = (invoices ?? []) as InvoiceHistoryRow[];

  const { data: payments, error: paymentsError } =
    canViewPayments && invoiceRows.length > 0
      ? await applyBranchFilter(
          supabase
          .from("payments")
          .select("id, invoice_id, amount, payment_method, reference_number, paid_at")
          .in(
            "invoice_id",
            invoiceRows.map((invoice) => invoice.id),
          )
          .order("paid_at", { ascending: false }),
          branchScope.selectedBranchId,
        )
      : { data: [], error: null };

  if (paymentsError) {
    throw new Error(paymentsError.message);
  }

  return mapCustomerDetail(
    customer satisfies CustomerRow,
    vehicleRows,
    buildCustomerDocumentHistory({
      vehicles: vehicleRows,
      quotations: quotationRows,
      jobOrders: jobOrderRows,
      invoices: canViewInvoices ? invoiceRows : [],
      payments: (payments ?? []) as PaymentHistoryRow[],
      canViewQuotations,
      canViewJobOrders,
      canViewInvoices,
    }),
  );
});

export async function listCustomerOptions(): Promise<CustomerOption[]> {
  const { branchScope, supabase } = await getBranchScopedServerClient("customers:read");
  const { data, error } = await applyBranchFilter(
    supabase
    .from("customers")
    .select("id, display_name")
    .eq("status", "active")
    .order("display_name", { ascending: true }),
    branchScope.selectedBranchId,
  );

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CustomerOptionRow[]).map(mapCustomerRowToOption);
}

function escapeSearchTerm(value: string) {
  return value.replaceAll(",", "\\,");
}

function buildCustomerDocumentHistory(params: {
  vehicles: VehicleRow[];
  quotations: QuotationHistoryRow[];
  jobOrders: JobOrderHistoryRow[];
  invoices: InvoiceHistoryRow[];
  payments: PaymentHistoryRow[];
  canViewQuotations: boolean;
  canViewJobOrders: boolean;
  canViewInvoices: boolean;
}): CustomerDocumentHistoryItem[] {
  const vehicleLabelMap = new Map(
    params.vehicles.map((vehicle) => [vehicle.id, formatVehicleLabel(vehicle)]),
  );
  const jobOrderByQuotationId = new Map(
    params.jobOrders
      .filter((jobOrder) => jobOrder.quotation_id)
      .map((jobOrder) => [jobOrder.quotation_id as string, jobOrder]),
  );
  const invoiceByJobOrderId = new Map(
    params.invoices
      .filter((invoice) => invoice.job_order_id)
      .map((invoice) => [invoice.job_order_id as string, invoice]),
  );
  const invoiceById = new Map(params.invoices.map((invoice) => [invoice.id, invoice]));

  const history: CustomerDocumentHistoryItem[] = [
    ...params.quotations.map((quotation) => ({
      id: quotation.id,
      documentType: "quotation" as const,
      documentLabel: quotation.quotation_number,
      documentHref: `/quotations/${quotation.id}`,
      vehicleLabel: quotation.vehicle_id ? vehicleLabelMap.get(quotation.vehicle_id) ?? null : null,
      occurredAt: quotation.created_at,
      amount: quotation.total_amount,
      status: quotation.status,
      linkedRecords:
        params.canViewJobOrders && jobOrderByQuotationId.has(quotation.id)
          ? [
              {
                label: jobOrderByQuotationId.get(quotation.id)?.job_order_number ?? "Job order",
                href: `/job-orders/${jobOrderByQuotationId.get(quotation.id)?.id}`,
              },
            ]
          : [],
    })),
    ...params.jobOrders.map((jobOrder) => {
      const linkedRecords = [];

      if (params.canViewQuotations && jobOrder.quotation_id) {
        const linkedQuotation = params.quotations.find((quotation) => quotation.id === jobOrder.quotation_id);

        if (linkedQuotation) {
          linkedRecords.push({
            label: linkedQuotation.quotation_number,
            href: `/quotations/${linkedQuotation.id}`,
          });
        }
      }

      if (params.canViewInvoices) {
        const linkedInvoice = invoiceByJobOrderId.get(jobOrder.id);

        if (linkedInvoice) {
          linkedRecords.push({
            label: linkedInvoice.invoice_number,
            href: `/invoices/${linkedInvoice.id}`,
          });
        }
      }

      return {
        id: jobOrder.id,
        documentType: "job_order" as const,
        documentLabel: jobOrder.job_order_number,
        documentHref: `/job-orders/${jobOrder.id}`,
        vehicleLabel: jobOrder.vehicle_id ? vehicleLabelMap.get(jobOrder.vehicle_id) ?? null : null,
        occurredAt: jobOrder.created_at,
        amount: null,
        status: jobOrder.status,
        linkedRecords,
      };
    }),
    ...params.invoices.map((invoice) => {
      const linkedRecords = [];

      if (params.canViewJobOrders && invoice.job_order_id) {
        const linkedJobOrder = params.jobOrders.find((jobOrder) => jobOrder.id === invoice.job_order_id);

        if (linkedJobOrder) {
          linkedRecords.push({
            label: linkedJobOrder.job_order_number,
            href: `/job-orders/${linkedJobOrder.id}`,
          });
        }
      }

      return {
        id: invoice.id,
        documentType: "invoice" as const,
        documentLabel: invoice.invoice_number,
        documentHref: `/invoices/${invoice.id}`,
        vehicleLabel: invoice.vehicle_id ? vehicleLabelMap.get(invoice.vehicle_id) ?? null : null,
        occurredAt: invoice.invoice_date,
        amount: invoice.total_amount,
        status: invoice.status,
        linkedRecords,
      };
    }),
    ...params.payments.map((payment) => {
      const linkedRecords = [];
      const linkedInvoice = invoiceById.get(payment.invoice_id);

      if (params.canViewInvoices && linkedInvoice) {
        linkedRecords.push({
          label: linkedInvoice.invoice_number,
          href: `/invoices/${linkedInvoice.id}`,
        });
      }

      if (params.canViewJobOrders && linkedInvoice?.job_order_id) {
        const linkedJobOrder = params.jobOrders.find((jobOrder) => jobOrder.id === linkedInvoice.job_order_id);

        if (linkedJobOrder) {
          linkedRecords.push({
            label: linkedJobOrder.job_order_number,
            href: `/job-orders/${linkedJobOrder.id}`,
          });
        }
      }

      return {
        id: payment.id,
        documentType: "payment" as const,
        documentLabel: payment.reference_number?.trim() || "Payment record",
        documentHref: `/payments/${payment.id}`,
        vehicleLabel:
          linkedInvoice?.vehicle_id ? vehicleLabelMap.get(linkedInvoice.vehicle_id) ?? null : null,
        occurredAt: payment.paid_at,
        amount: payment.amount,
        paymentMethod: payment.payment_method,
        linkedRecords,
      };
    }),
  ];

  return history.sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt));
}

function formatVehicleLabel(vehicle: Pick<VehicleRow, "make" | "model" | "year" | "plate_number">) {
  const platePart = vehicle.plate_number ? ` · ${vehicle.plate_number}` : "";
  const yearPart = vehicle.year ? ` (${vehicle.year})` : "";
  return `${vehicle.make} ${vehicle.model}${yearPart}${platePart}`;
}
