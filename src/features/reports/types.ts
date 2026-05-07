export type ReportWindow = "7d" | "30d" | "90d" | "all";

export type ReportMetric = {
  label: string;
  value: number;
  kind: "count" | "currency" | "quantity";
  helper?: string;
};

export type StatusBreakdownItem = {
  label: string;
  count: number;
};

export type PaymentMethodBreakdownItem = {
  label: string;
  amount: number;
  count: number;
};

export type UnpaidInvoiceReportItem = {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  balance: number;
  status: "unpaid" | "partially_paid";
  createdAt: string;
};

export type StockMovementReportItem = {
  id: string;
  productName: string;
  movementType:
    | "stock_in"
    | "stock_out"
    | "service_usage"
    | "pos_sale"
    | "adjustment"
    | "return"
    | "damaged";
  quantity: number;
  createdAt: string;
};

export type ReportsPageData = {
  window: ReportWindow;
  performanceMetrics: ReportMetric[];
  operationalMetrics: ReportMetric[];
  quotationStatusBreakdown: StatusBreakdownItem[];
  jobOrderStatusBreakdown: StatusBreakdownItem[];
  paymentMethodBreakdown: PaymentMethodBreakdownItem[];
  unpaidInvoices: UnpaidInvoiceReportItem[];
  recentStockMovements: StockMovementReportItem[];
};
