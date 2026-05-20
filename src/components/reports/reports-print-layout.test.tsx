import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReportsPrintLayout } from "@/components/reports/reports-print-layout";
import type { ReportsPrintDocument } from "@/features/reports/types";

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

const documentFixture: ReportsPrintDocument = {
  reports: {
    filters: {
      preset: "this-month",
      from: "2026-05-01",
      to: "2026-05-20",
      groupBy: "daily",
      periodLabel: "May 1, 2026 to May 20, 2026",
    },
    periodPerformanceMetrics: [
      { label: "Revenue", value: 25000, kind: "currency", helper: "Collected in period" },
      { label: "Released Vehicles", value: 12, kind: "count", helper: "Paid and released" },
    ],
    operationalAlerts: [
      { label: "Low Stock Items", value: 3, kind: "count", helper: "Needs replenishment" },
    ],
    revenueTrend: [
      { key: "2026-05-01", label: "May 1", paymentsCollected: 5000, vehiclesReleased: 2 },
      { key: "2026-05-02", label: "May 2", paymentsCollected: 0, vehiclesReleased: 0 },
    ],
    workflowFunnel: [
      { label: "Quoted", count: 10, helper: "Current period" },
      { label: "Approved", count: 7, helper: "Converted to work" },
    ],
    topServices: [
      { label: "Oil Change", quantity: 10, amount: 12000 },
    ],
    topProducts: [
      { label: "Engine Oil", quantity: 12, amount: 9000 },
    ],
    quotationStatusBreakdown: [
      { label: "Draft", count: 2 },
      { label: "Approved", count: 7 },
    ],
    periodJobOrderStatusBreakdown: [
      { label: "In Progress", count: 4 },
    ],
    liveJobOrderStatusBreakdown: [
      { label: "Waiting for Parts", count: 1 },
    ],
    paymentMethodBreakdown: [
      { label: "Cash", count: 4, amount: 10000 },
      { label: "GCash", count: 2, amount: 5000 },
    ],
    unpaidInvoices: [
      {
        invoiceId: "invoice-2",
        invoiceNumber: "INV-MAIN-0002",
        customerName: "Louise Suresca",
        totalAmount: 5000,
        balance: 1000,
        status: "partially_paid",
        createdAt: "2026-05-20T08:00:00.000Z",
      },
    ],
    recentStockMovements: [
      {
        id: "movement-1",
        productName: "Engine Oil",
        movementType: "stock_in",
        quantity: 10,
        createdAt: "2026-05-20T08:00:00.000Z",
      },
    ],
  },
  businessProfile: {
    businessName: "SAY Auto Care Center",
    businessLogoUrl: null,
    businessVatRegistrationNo: "123-456-789-000",
    businessContact: "09171234567",
    businessEmail: "hello@sayautocare.com",
    businessAddress: "Quezon City",
  },
  generatedAt: "2026-05-20T10:00:00.000Z",
};

describe("ReportsPrintLayout", () => {
  it("uses the shared branded page shell with a footer on every report page", () => {
    const { container } = render(<ReportsPrintLayout document={documentFixture} />);
    const pageCount = container.querySelectorAll(".print-page").length;

    expect(pageCount).toBe(3);
    expect(container.querySelectorAll(".print-document-footer").length).toBe(pageCount);
    expect(screen.getAllByRole("heading", { name: "Business Reports" }).length).toBe(pageCount);
    expect(screen.getByText("Recent Stock Movements")).toBeInTheDocument();
  });
});
