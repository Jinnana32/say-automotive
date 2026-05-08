import type { PaymentMethod, InvoiceStatus } from "@/features/invoices/types";
import type { JobOrderItemType, JobOrderStatus } from "@/features/job-orders/types";

export type ServiceHistoryPhase = "active" | "history";
export type ServiceHistoryUsageSource = "actual" | "fallback";

export type ServiceHistoryLineItem = {
  id: string;
  itemType: JobOrderItemType;
  label: string;
  quantity: number;
  amount: number;
  isAdditional: boolean;
  usageSource: ServiceHistoryUsageSource;
};

export type ServiceHistoryMechanic = {
  id: string;
  fullName: string;
  taskDescription: string | null;
};

export type ServiceHistoryInvoiceSummary = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  totalAmount: number;
  paidAmount: number;
  balance: number;
};

export type ServiceHistoryQuotationSummary = {
  id: string;
  quotationNumber: string;
};

export type ServiceHistoryEntry = {
  id: string;
  vehicleId: string;
  vehicleLabel: string;
  customerId: string;
  jobOrderId: string;
  jobOrderNumber: string;
  status: JobOrderStatus;
  phase: ServiceHistoryPhase;
  serviceDate: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  releasedAt: string | null;
  customerConcern: string | null;
  inspectionNotes: string | null;
  diagnosis: string | null;
  workPerformed: string | null;
  mileageIn: number | null;
  mileageOut: number | null;
  services: ServiceHistoryLineItem[];
  partsUsed: ServiceHistoryLineItem[];
  rejectedExtras: ServiceHistoryLineItem[];
  mechanics: ServiceHistoryMechanic[];
  invoice: ServiceHistoryInvoiceSummary | null;
  quotation: ServiceHistoryQuotationSummary | null;
  totalAmount: number;
  paymentMethod: PaymentMethod | null;
};
