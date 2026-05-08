import type { PaymentMethod, InvoiceStatus } from "@/features/invoices/types";
import type { JobOrderStatus } from "@/features/job-orders/types";
import type { QuotationStatus } from "@/features/quotations/types";

export type CustomerStatus = "active" | "inactive";
export type CustomerType = "individual" | "company" | "fleet";

export type CustomerListItem = {
  id: string;
  customerCode: string | null;
  customerType: CustomerType;
  displayName: string;
  contactNumber: string | null;
  email: string | null;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
};

export type CustomerVehicleSummary = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  plateNumber: string | null;
  vin: string | null;
  status: CustomerStatus;
};

export type CustomerDocumentLink = {
  label: string;
  href: string;
};

export type CustomerDocumentHistoryItem =
  | {
      id: string;
      documentType: "quotation";
      documentLabel: string;
      documentHref: string;
      vehicleLabel: string | null;
      occurredAt: string;
      amount: number;
      status: QuotationStatus;
      linkedRecords: CustomerDocumentLink[];
    }
  | {
      id: string;
      documentType: "job_order";
      documentLabel: string;
      documentHref: string;
      vehicleLabel: string | null;
      occurredAt: string;
      amount: null;
      status: JobOrderStatus;
      linkedRecords: CustomerDocumentLink[];
    }
  | {
      id: string;
      documentType: "invoice";
      documentLabel: string;
      documentHref: string;
      vehicleLabel: string | null;
      occurredAt: string;
      amount: number;
      status: InvoiceStatus;
      linkedRecords: CustomerDocumentLink[];
    }
  | {
      id: string;
      documentType: "payment";
      documentLabel: string;
      documentHref: string;
      vehicleLabel: string | null;
      occurredAt: string;
      amount: number;
      paymentMethod: PaymentMethod;
      linkedRecords: CustomerDocumentLink[];
    };

export type CustomerDetail = CustomerListItem & {
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  address: string | null;
  notes: string | null;
  vehicles: CustomerVehicleSummary[];
  documentHistory: CustomerDocumentHistoryItem[];
};

export type CustomerOption = {
  id: string;
  label: string;
};

export type CustomerFormValues = {
  customerId?: string;
  customerType: CustomerType;
  firstName: string;
  lastName: string;
  companyName: string;
  contactNumber: string;
  email: string;
  address: string;
  notes: string;
  status: CustomerStatus;
};
