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

export type InvoicePrintDetail = InvoiceDetail & {
  customerContactNumber: string | null;
  customerAddress: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  vehiclePlateNumber: string | null;
  vehicleVin: string | null;
  preparedByName: string | null;
  preparedByTitle: string | null;
};

export type InvoicePrintBusinessProfile = {
  businessName: string;
  businessLogoUrl: string | null;
  businessVatRegistrationNo: string | null;
  businessContact: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
};

export type InvoicePrintDocument = {
  invoice: InvoicePrintDetail;
  businessProfile: InvoicePrintBusinessProfile;
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

export type PaymentDetail = PaymentListItem & {
  branchId: string | null;
  invoiceDate: string;
  invoiceStatus: InvoiceStatus;
  invoiceTotalAmount: number;
  invoicePaidAmount: number;
  invoiceBalanceAfterPayment: number;
  invoiceBalanceBeforePayment: number;
  customerContactNumber: string | null;
  customerAddress: string | null;
  vehicleId: string | null;
  vehicleLabel: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  vehiclePlateNumber: string | null;
  vehicleVin: string | null;
  saleId: string | null;
  saleNumber: string | null;
  jobOrderId: string | null;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
  receivedByName: string | null;
  receivedByTitle: string | null;
};

export type PaymentPrintBusinessProfile = {
  businessName: string;
  businessLogoUrl: string | null;
  businessVatRegistrationNo: string | null;
  businessContact: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
};

export type PaymentPrintDocument = {
  payment: PaymentDetail;
  businessProfile: PaymentPrintBusinessProfile;
};
