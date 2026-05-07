export type InvoiceStatus = "unpaid" | "partially_paid" | "paid" | "cancelled";
export type PaymentMethod = "cash" | "gcash" | "card" | "bank_transfer" | "check";

export type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  jobOrderId: string | null;
  jobOrderNumber: string | null;
  customerName: string;
  vehicleLabel: string;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: InvoiceStatus;
  createdAt: string;
};

export type InvoiceItemDetail = {
  id: string;
  lineNumber: number;
  itemType: "product" | "service" | "labor";
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type InvoicePaymentEntry = {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  notes: string | null;
  paidAt: string;
};

export type InvoiceDetail = InvoiceListItem & {
  customerId: string | null;
  vehicleId: string | null;
  saleId: string | null;
  saleNumber: string | null;
  items: InvoiceItemDetail[];
  payments: InvoicePaymentEntry[];
  allowPartialPayments: boolean;
  allowReleaseWithBalance: boolean;
  requireFullPaymentBeforeRelease: boolean;
  jobOrderStatus: string | null;
  releasedAt: string | null;
  canRecordPayment: boolean;
  canReleaseVehicle: boolean;
};

export type PaymentListItem = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  jobOrderNumber: string | null;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  paidAt: string;
};
