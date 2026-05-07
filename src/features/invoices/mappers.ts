import type { TableRow } from "@/types/database";

import type {
  InvoiceDetail,
  InvoiceItemDetail,
  InvoiceListItem,
  InvoicePaymentEntry,
  PaymentListItem,
} from "@/features/invoices/types";
import { canRecordInvoicePayment, canReleaseInvoiceVehicle } from "@/features/invoices/utils";

type InvoiceRow = TableRow<"invoices">;
type InvoiceItemRow = TableRow<"invoice_items">;
type PaymentRow = TableRow<"payments">;

export function mapInvoiceRowToListItem(params: {
  row: InvoiceRow;
  jobOrderNumber: string | null;
  customerName: string;
  vehicleLabel: string;
}): InvoiceListItem {
  return {
    id: params.row.id,
    invoiceNumber: params.row.invoice_number,
    invoiceDate: params.row.invoice_date,
    jobOrderId: params.row.job_order_id,
    jobOrderNumber: params.jobOrderNumber,
    customerName: params.customerName,
    vehicleLabel: params.vehicleLabel,
    subtotal: params.row.subtotal,
    discount: params.row.discount,
    tax: params.row.tax,
    totalAmount: params.row.total_amount,
    paidAmount: params.row.paid_amount,
    balance: params.row.balance,
    status: params.row.status,
    createdAt: params.row.created_at,
  };
}

export function mapInvoiceItemRowToDetail(row: InvoiceItemRow): InvoiceItemDetail {
  return {
    id: row.id,
    lineNumber: row.line_number,
    itemType: row.item_type,
    description: row.description,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    total: row.total,
  };
}

export function mapPaymentRowToEntry(row: PaymentRow): InvoicePaymentEntry {
  return {
    id: row.id,
    amount: row.amount,
    paymentMethod: row.payment_method,
    referenceNumber: row.reference_number,
    notes: row.notes,
    paidAt: row.paid_at,
  };
}

export function mapInvoiceDetail(params: {
  row: InvoiceRow;
  jobOrderNumber: string | null;
  saleNumber: string | null;
  customerName: string;
  vehicleLabel: string;
  items: InvoiceItemDetail[];
  payments: InvoicePaymentEntry[];
  allowPartialPayments: boolean;
  allowReleaseWithBalance: boolean;
  requireFullPaymentBeforeRelease: boolean;
  jobOrderStatus: string | null;
  releasedAt: string | null;
}): InvoiceDetail {
  const listItem = mapInvoiceRowToListItem({
    row: params.row,
    jobOrderNumber: params.jobOrderNumber,
    customerName: params.customerName,
    vehicleLabel: params.vehicleLabel,
  });

  const detail: InvoiceDetail = {
    ...listItem,
    customerId: params.row.customer_id,
    vehicleId: params.row.vehicle_id,
    saleId: params.row.sale_id,
    saleNumber: params.saleNumber,
    items: params.items,
    payments: params.payments,
    allowPartialPayments: params.allowPartialPayments,
    allowReleaseWithBalance: params.allowReleaseWithBalance,
    requireFullPaymentBeforeRelease: params.requireFullPaymentBeforeRelease,
    jobOrderStatus: params.jobOrderStatus,
    releasedAt: params.releasedAt,
    canRecordPayment: false,
    canReleaseVehicle: false,
  };

  return {
    ...detail,
    canRecordPayment: canRecordInvoicePayment(detail),
    canReleaseVehicle: canReleaseInvoiceVehicle(detail),
  };
}

export function mapPaymentListItem(params: {
  row: PaymentRow;
  invoiceNumber: string;
  jobOrderNumber: string | null;
  customerName: string;
}): PaymentListItem {
  return {
    id: params.row.id,
    invoiceId: params.row.invoice_id,
    invoiceNumber: params.invoiceNumber,
    jobOrderNumber: params.jobOrderNumber,
    customerName: params.customerName,
    amount: params.row.amount,
    paymentMethod: params.row.payment_method,
    referenceNumber: params.row.reference_number,
    paidAt: params.row.paid_at,
  };
}
