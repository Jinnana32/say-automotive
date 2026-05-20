import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InvoicePrintLayout } from "@/components/reports/invoice-print-layout";
import type { InvoicePrintDocument } from "@/features/invoices/types";

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

const documentFixture: InvoicePrintDocument = {
  invoice: {
    id: "invoice-1",
    invoiceNumber: "INV-MAIN-0001",
    invoiceDate: "2026-05-20T08:00:00.000Z",
    jobOrderId: "job-order-1",
    jobOrderNumber: "JO-MAIN-0001",
    customerName: "Louise Suresca",
    vehicleLabel: "Toyota Vios",
    subtotal: 5200,
    discount: 0,
    tax: 0,
    totalAmount: 5200,
    paidAmount: 0,
    balance: 5200,
    status: "unpaid",
    createdAt: "2026-05-20T08:00:00.000Z",
    customerId: "customer-1",
    vehicleId: "vehicle-1",
    saleId: null,
    saleNumber: null,
    cancelledAt: null,
    cancelledByUserId: null,
    cancellationReason: null,
    items: Array.from({ length: 14 }, (_, index) => ({
      id: `item-${index + 1}`,
      lineNumber: index + 1,
      itemType: index % 3 === 0 ? "product" : index % 2 === 0 ? "labor" : "service",
      description: `Invoice line ${index + 1} with extended text to simulate a multi-page invoice row in print mode`,
      quantity: 1,
      unitPrice: 500 + index * 50,
      total: 500 + index * 50,
    })),
    payments: Array.from({ length: 6 }, (_, index) => ({
      id: `payment-${index + 1}`,
      amount: 300 + index * 50,
      paymentMethod: index % 2 === 0 ? "cash" : "gcash",
      referenceNumber: index % 2 === 0 ? null : `REF-${index + 1}`,
      notes: null,
      paidAt: "2026-05-20T09:00:00.000Z",
    })),
    allowPartialPayments: true,
    allowReleaseWithBalance: false,
    requireFullPaymentBeforeRelease: true,
    jobOrderStatus: "ready_for_billing",
    releasedAt: null,
    canRecordPayment: true,
    canReleaseVehicle: false,
    canCancel: true,
    customerContactNumber: "09171234567",
    customerAddress: "Quezon City",
    vehicleMake: "Toyota",
    vehicleModel: "Vios",
    vehicleYear: 2020,
    vehiclePlateNumber: "ABC1234",
    vehicleVin: "VIN123",
    preparedByName: "Nia Grace Ariete",
    preparedByTitle: "Service Advisor",
  },
  businessProfile: {
    businessName: "SAY Auto Care Center",
    businessLogoUrl: null,
    businessVatRegistrationNo: "123-456-789-000",
    businessContact: "09171234567",
    businessEmail: "hello@sayautocare.com",
    businessAddress: "Quezon City",
  },
};

describe("InvoicePrintLayout", () => {
  it("renders explicit print pages with repeated footer placement for longer invoices", () => {
    const { container } = render(<InvoicePrintLayout document={documentFixture} />);
    const pageCount = container.querySelectorAll(".print-page").length;

    expect(pageCount).toBeGreaterThan(1);
    expect(container.querySelectorAll(".print-document-footer").length).toBe(pageCount);
    expect(screen.getAllByRole("heading", { name: "Invoice" }).length).toBeGreaterThan(1);
    expect(screen.getByText("INVOICE SUMMARY")).toBeInTheDocument();
  });
});
