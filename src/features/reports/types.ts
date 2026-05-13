export type ReportPreset =
  | "today"
  | "this-week"
  | "this-month"
  | "last-30-days"
  | "custom";

export type ReportGroupBy = "daily" | "weekly" | "monthly";

export type ReportMetric = {
  label: string;
  value: number;
  kind: "count" | "currency" | "quantity";
  helper?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
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

export type ReportsFilterState = {
  preset: ReportPreset;
  from: string;
  to: string;
  groupBy: ReportGroupBy;
  periodLabel: string;
};

export type RevenueTrendPoint = {
  key: string;
  label: string;
  paymentsCollected: number;
  vehiclesReleased: number;
};

export type WorkflowFunnelStep = {
  label: string;
  count: number;
  helper?: string;
};

export type TopPerformerItem = {
  label: string;
  quantity: number;
  amount: number;
};

export type ReportsPageData = {
  filters: ReportsFilterState;
  periodPerformanceMetrics: ReportMetric[];
  operationalAlerts: ReportMetric[];
  revenueTrend: RevenueTrendPoint[];
  workflowFunnel: WorkflowFunnelStep[];
  topServices: TopPerformerItem[];
  topProducts: TopPerformerItem[];
  quotationStatusBreakdown: StatusBreakdownItem[];
  periodJobOrderStatusBreakdown: StatusBreakdownItem[];
  liveJobOrderStatusBreakdown: StatusBreakdownItem[];
  paymentMethodBreakdown: PaymentMethodBreakdownItem[];
  unpaidInvoices: UnpaidInvoiceReportItem[];
  recentStockMovements: StockMovementReportItem[];
};

export type ReportsPrintBusinessProfile = {
  businessName: string;
  businessLogoUrl: string | null;
  businessContact: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
};

export type ReportsPrintDocument = {
  reports: ReportsPageData;
  businessProfile: ReportsPrintBusinessProfile;
  generatedAt: string;
};
